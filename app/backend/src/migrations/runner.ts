import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { SqlConnection, SqlPool } from "../persistence/dao/types.js";

export interface Migration {
  readonly version: string;
  readonly sql: string;
}

export interface MigrationRunResult {
  readonly applied: readonly string[];
  readonly skipped: readonly string[];
}

const migrationTableSql = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(64) NOT NULL,
    checksum BINARY(32) NOT NULL,
    applied_at DATETIME(3) NOT NULL,
    PRIMARY KEY (version)
  ) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
`;

const requiredTables = [
  "user_accounts",
  "player_profiles",
  "auth_sessions",
  "agencies",
  "missions",
  "mission_events",
  "mission_test_runs",
  "mission_reports",
  "legacy_imports"
] as const;

const requiredColumns: Readonly<Record<(typeof requiredTables)[number], readonly string[]>> = {
  user_accounts: ["id", "email_normalized", "password_hash", "status", "created_at", "updated_at"],
  player_profiles: ["user_id", "display_name", "locale", "preferences_json", "created_at", "updated_at"],
  auth_sessions: ["id", "user_id", "token_hash", "expires_at", "revoked_at", "created_at", "updated_at"],
  agencies: [
    "id", "owner_user_id", "name", "credits", "xp", "science_total", "staff_count", "difficulty",
    "sandbox", "tutorial_state", "state_schema_version", "state_json", "current_mission_id",
    "revision", "created_at", "updated_at"
  ],
  missions: [
    "id", "agency_id", "legacy_order", "name", "phase_code", "stage_code", "status",
    "state_schema_version", "state_json", "revision", "created_at", "updated_at", "closed_at"
  ],
  mission_events: [
    "id", "mission_id", "sequence", "actor_user_id", "event_type", "event_schema_version",
    "payload_json", "idempotency_key", "created_at"
  ],
  mission_test_runs: [
    "id", "mission_id", "test_type", "attempt_number", "design_revision", "outcome",
    "result_json", "completed_at"
  ],
  mission_reports: [
    "id", "mission_id", "outcome", "report_schema_version", "report_json", "created_at"
  ],
  legacy_imports: [
    "user_id", "idempotency_key", "source_version", "source_sha256", "consent_copy_version",
    "consented_at", "imported_at", "agency_id", "mission_count"
  ]
};

function splitSql(sql: string): string[] {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0 && !statement.startsWith("--"));
}

function checksum(sql: string): Buffer {
  return createHash("sha256").update(sql, "utf8").digest();
}

async function readRows<T extends Record<string, unknown>>(
  connection: SqlConnection,
  sql: string,
  parameters: readonly (string | number | Buffer)[] = []
): Promise<T[]> {
  const [result] = await connection.execute(sql, parameters);
  if (!Array.isArray(result)) throw new Error("Migration query did not return rows.");
  return result as T[];
}

async function verifyInitialSchema(connection: SqlConnection): Promise<void> {
  const placeholders = requiredTables.map(() => "?").join(", ");
  const tableRows = await readRows<{ table_name: unknown }>(
    connection,
    `SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN (${placeholders})`,
    [...requiredTables]
  );
  const found = new Set(tableRows.map((row) => String(row.table_name)));
  const missing = requiredTables.filter((table) => !found.has(table));
  if (missing.length > 0) {
    throw new Error(`Initial schema verification failed; missing tables: ${missing.join(", ")}.`);
  }

  const columnRows = await readRows<{ table_name: unknown; column_name: unknown }>(
    connection,
    `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name IN (${placeholders})`,
    [...requiredTables]
  );
  const columns = new Map<string, Set<string>>();
  for (const row of columnRows) {
    const table = String(row.table_name);
    const names = columns.get(table) ?? new Set<string>();
    names.add(String(row.column_name));
    columns.set(table, names);
  }
  const missingColumns = requiredTables.flatMap((table) =>
    requiredColumns[table]
      .filter((column) => !columns.get(table)?.has(column))
      .map((column) => `${table}.${column}`)
  );
  if (missingColumns.length > 0) {
    throw new Error(`Initial schema verification failed; missing columns: ${missingColumns.join(", ")}.`);
  }
}

async function apply(connection: SqlConnection, migration: Migration): Promise<void> {
  if (!/^\d{3}_[a-z0-9_-]+$/.test(migration.version)) {
    throw new Error(`Invalid migration version: ${migration.version}`);
  }
  if (/\b(DROP\s+TABLE|DROP\s+COLUMN|TRUNCATE)\b/i.test(migration.sql)) {
    throw new Error(`Forward-only migration ${migration.version} contains a destructive statement.`);
  }
  for (const statement of splitSql(migration.sql)) {
    await connection.execute(statement);
  }
}

async function releaseNamedLock(connection: SqlConnection, lockName: string): Promise<void> {
  await connection.execute("SELECT RELEASE_LOCK(?)", [lockName]);
}

/**
 * Applies ordered, forward-only SQL migrations. DDL is intentionally not
 * wrapped in a transaction because MySQL implicitly commits schema changes.
 */
export async function runMigrations(
  pool: SqlPool,
  migrations: readonly Migration[],
  lockName = "space-mission-design-game:migrations",
  lockTimeoutSeconds = 30
): Promise<MigrationRunResult> {
  if (lockName.length > 64) throw new RangeError("MySQL lock names must not exceed 64 characters.");
  const connection = await pool.getConnection();
  let lockAcquired = false;
  const applied: string[] = [];
  const skipped: string[] = [];

  try {
    await connection.execute(migrationTableSql);
    const lockRows = await readRows<{ acquired: unknown }>(
      connection,
      "SELECT GET_LOCK(?, ?) AS acquired",
      [lockName, lockTimeoutSeconds]
    );
    if (Number(lockRows[0]?.acquired) !== 1) {
      throw new Error("Could not acquire the MySQL migration lock.");
    }
    lockAcquired = true;

    const ordered = [...migrations].sort((a, b) => a.version.localeCompare(b.version));
    for (const migration of ordered) {
      const digest = checksum(migration.sql);
      const existing = await readRows<{ checksum: unknown }>(
        connection,
        "SELECT checksum FROM schema_migrations WHERE version = ?",
        [migration.version]
      );
      if (existing[0]) {
        const stored = Buffer.from(existing[0].checksum as Uint8Array);
        if (!stored.equals(digest)) {
          throw new Error(`Checksum mismatch for applied migration ${migration.version}.`);
        }
        skipped.push(migration.version);
        continue;
      }

      await apply(connection, migration);
      if (migration.version === "001_initial_schema") {
        await verifyInitialSchema(connection);
      }
      await connection.execute(
        "INSERT INTO schema_migrations (version, checksum, applied_at) VALUES (?, ?, UTC_TIMESTAMP(3))",
        [migration.version, digest]
      );
      applied.push(migration.version);
    }
    return { applied, skipped };
  } finally {
    try {
      if (lockAcquired) await releaseNamedLock(connection, lockName);
    } finally {
      connection.release();
    }
  }
}

export async function loadMigrations(directory: string): Promise<readonly Migration[]> {
  const files = (await readdir(directory))
    .filter((file) => /^\d{3}_[a-z0-9_-]+\.sql$/.test(file))
    .sort();
  return Promise.all(
    files.map(async (file) => ({
      version: file.slice(0, -4),
      sql: await readFile(join(directory, file), "utf8")
    }))
  );
}
