import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runMigrations, type Migration } from "../src/migrations/runner.js";
import type { SqlConnection, SqlPool } from "../src/persistence/dao/types.js";

class MigrationConnection implements SqlConnection {
  readonly executed: string[] = [];
  readonly applied = new Map<string, Uint8Array>();
  released = false;
  locked = false;

  async execute(sql: string, parameters: readonly unknown[] = []): Promise<readonly [unknown, unknown]> {
    this.executed.push(sql);
    if (sql.includes("GET_LOCK")) return [[{ acquired: 1 }], []];
    if (sql.includes("RELEASE_LOCK")) {
      this.locked = false;
      return [[{ released: 1 }], []];
    }
    if (sql.includes("FROM schema_migrations WHERE version")) {
      const value = this.applied.get(String(parameters[0]));
      return [value ? [{ checksum: value }] : [], []];
    }
    if (sql.includes("INSERT INTO schema_migrations")) {
      this.applied.set(String(parameters[0]), parameters[1] as Uint8Array);
      return [{ affectedRows: 1 }, []];
    }
    if (sql.includes("FROM information_schema.tables")) {
      const names = parameters.map(String);
      return [names.map((table_name) => ({ table_name })), []];
    }
    if (sql.includes("FROM information_schema.columns")) {
      return [[], []];
    }
    return [[], []];
  }

  async beginTransaction(): Promise<void> {}
  async commit(): Promise<void> {}
  async rollback(): Promise<void> {}
  release(): void {
    this.released = true;
  }
}

class SingleConnectionPool implements SqlPool {
  constructor(readonly connection: MigrationConnection) {}
  async getConnection(): Promise<SqlConnection> {
    return this.connection;
  }
}

test("initial schema is forward-only and creates tables idempotently", async () => {
  const sql = await readFile(new URL("../src/migrations/sql/001_initial_schema.sql", import.meta.url), "utf8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS user_accounts/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS legacy_imports/);
  assert.doesNotMatch(sql, /\b(DROP\s+TABLE|DROP\s+COLUMN|TRUNCATE)\b/i);
});

test("migration runner records a successful migration and skips the same checksum on replay", async () => {
  const connection = new MigrationConnection();
  const pool = new SingleConnectionPool(connection);
  const migration: Migration = {
    version: "002_fixture",
    sql: "CREATE TABLE IF NOT EXISTS user_accounts (id BINARY(16) PRIMARY KEY);\n"
  };

  const first = await runMigrations(pool, [migration]);
  const second = await runMigrations(pool, [migration]);
  assert.deepEqual(first.applied, ["002_fixture"]);
  assert.deepEqual(second.skipped, ["002_fixture"]);
  assert.equal(connection.released, true);
});

test("migration runner rejects checksum drift for an applied version", async () => {
  const connection = new MigrationConnection();
  const pool = new SingleConnectionPool(connection);
  const original: Migration = {
    version: "002_fixture",
    sql: "CREATE TABLE IF NOT EXISTS user_accounts (id BINARY(16) PRIMARY KEY);\n"
  };
  await runMigrations(pool, [original]);

  await assert.rejects(
    () => runMigrations(pool, [{ ...original, sql: `${original.sql}-- changed\n` }]),
    /Checksum mismatch/
  );
  assert.equal(connection.released, true);
});
