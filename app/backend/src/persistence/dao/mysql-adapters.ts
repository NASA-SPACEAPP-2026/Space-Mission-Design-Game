import type {
  AgencyDao,
  AuthSessionDao,
  LegacyImportDao,
  MissionDao,
  MissionEventDao,
  MissionReportDao,
  MissionTestRunDao,
  PlayerProfileDao,
  UserAccountDao
} from "./contracts.js";
import type {
  AgencyRecord,
  AuthSessionRecord,
  JsonObject,
  LegacyImportRecord,
  MissionEventRecord,
  MissionRecord,
  MissionReportRecord,
  MissionStateUpdate,
  MissionTestRunRecord,
  NewAgency,
  NewLegacyImport,
  NewMission,
  NewMissionEvent,
  NewMissionReport,
  NewMissionTestRun,
  NewUserAccount,
  PlayerProfileRecord,
  SqlExecutor,
  SqlParameter,
  Uuid,
  UserAccountRecord
} from "./types.js";

type Row = Record<string, unknown>;

function safeInteger(value: unknown, column: string): number {
  const result = Number(value);
  if (!Number.isSafeInteger(result)) {
    throw new RangeError(`MySQL ${column} is outside the safe integer range.`);
  }
  return result;
}

function accountStatus(value: unknown): UserAccountRecord["status"] {
  if (value !== "active" && value !== "disabled") {
    throw new TypeError("MySQL account status is invalid.");
  }
  return value;
}

async function rows<T extends Row>(db: SqlExecutor, sql: string, parameters: readonly SqlParameter[] = []): Promise<T[]> {
  const [result] = await db.execute(sql, parameters);
  if (!Array.isArray(result)) {
    throw new Error("MySQL query did not return rows.");
  }
  return result as T[];
}

async function insert(db: SqlExecutor, sql: string, parameters: readonly SqlParameter[]): Promise<void> {
  await db.execute(sql, parameters);
}

function uuidToBytes(uuid: Uuid): Buffer {
  const hex = uuid.replaceAll("-", "");
  if (!/^[0-9a-f]{32}$/i.test(hex)) {
    throw new TypeError("DAO identifiers must be UUIDs.");
  }
  return Buffer.from(hex, "hex");
}

function bytesToUuid(value: unknown): Uuid {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value as Uint8Array);
  if (bytes.length !== 16) {
    throw new TypeError("MySQL UUID columns must contain 16 bytes.");
  }
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function jsonObject(value: unknown): JsonObject {
  if (typeof value === "string") {
    value = JSON.parse(value) as unknown;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError("MySQL JSON column must contain an object.");
  }
  return value as JsonObject;
}

function dateValue(value: unknown): Date {
  const result = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(result.getTime())) {
    throw new TypeError("MySQL timestamp column is invalid.");
  }
  return result;
}

function nullableDateValue(value: unknown): Date | null {
  return value === null || value === undefined ? null : dateValue(value);
}

function accountFromRow(row: Row): UserAccountRecord {
  return {
    id: bytesToUuid(row.id),
    emailNormalized: String(row.email_normalized),
    passwordHash: String(row.password_hash),
    status: accountStatus(row.status),
    createdAt: dateValue(row.created_at),
    updatedAt: dateValue(row.updated_at)
  };
}

function profileFromRow(row: Row): PlayerProfileRecord {
  return {
    userId: bytesToUuid(row.user_id),
    displayName: String(row.display_name),
    locale: row.locale === "it" || row.locale === "en"
      ? row.locale
      : (() => { throw new TypeError("MySQL profile locale is invalid."); })(),
    preferences: jsonObject(row.preferences_json),
    createdAt: dateValue(row.created_at),
    updatedAt: dateValue(row.updated_at)
  };
}

function sessionFromRow(row: Row): AuthSessionRecord {
  return {
    id: bytesToUuid(row.id),
    userId: bytesToUuid(row.user_id),
    tokenHash: Buffer.from(row.token_hash as Uint8Array),
    expiresAt: dateValue(row.expires_at),
    revokedAt: nullableDateValue(row.revoked_at),
    createdAt: dateValue(row.created_at),
    updatedAt: dateValue(row.updated_at)
  };
}

function agencyFromRow(row: Row): AgencyRecord {
  return {
    id: bytesToUuid(row.id),
    ownerUserId: bytesToUuid(row.owner_user_id),
    name: String(row.name),
    credits: String(row.credits),
    xp: safeInteger(row.xp, "xp"),
    scienceTotal: safeInteger(row.science_total, "science_total"),
    staffCount: safeInteger(row.staff_count, "staff_count"),
    difficulty: String(row.difficulty),
    sandbox: Number(row.sandbox) === 1,
    tutorialState: jsonObject(row.tutorial_state),
    stateSchemaVersion: Number(row.state_schema_version),
    state: jsonObject(row.state_json),
    currentMissionId: row.current_mission_id == null ? null : bytesToUuid(row.current_mission_id),
    revision: safeInteger(row.revision, "agency revision"),
    createdAt: dateValue(row.created_at),
    updatedAt: dateValue(row.updated_at)
  };
}

function missionFromRow(row: Row): MissionRecord {
  return {
    id: bytesToUuid(row.id),
    agencyId: bytesToUuid(row.agency_id),
    legacyOrder: row.legacy_order == null ? null : safeInteger(row.legacy_order, "mission legacy_order"),
    name: String(row.name),
    phaseCode: String(row.phase_code),
    stageCode: String(row.stage_code),
    status: String(row.status),
    stateSchemaVersion: safeInteger(row.state_schema_version, "mission state_schema_version"),
    state: jsonObject(row.state_json),
    revision: safeInteger(row.revision, "mission revision"),
    createdAt: dateValue(row.created_at),
    updatedAt: dateValue(row.updated_at),
    closedAt: nullableDateValue(row.closed_at)
  };
}

function eventFromRow(row: Row): MissionEventRecord {
  return {
    id: bytesToUuid(row.id),
    missionId: bytesToUuid(row.mission_id),
    sequence: safeInteger(row.sequence, "mission event sequence"),
    actorUserId: bytesToUuid(row.actor_user_id),
    eventType: String(row.event_type),
    eventSchemaVersion: safeInteger(row.event_schema_version, "event_schema_version"),
    payload: jsonObject(row.payload_json),
    idempotencyKey: row.idempotency_key == null ? null : bytesToUuid(row.idempotency_key),
    createdAt: dateValue(row.created_at)
  };
}

function testRunFromRow(row: Row): MissionTestRunRecord {
  return {
    id: bytesToUuid(row.id),
    missionId: bytesToUuid(row.mission_id),
    testType: String(row.test_type),
    attemptNumber: safeInteger(row.attempt_number, "test attempt_number"),
    designRevision: safeInteger(row.design_revision, "test design_revision"),
    outcome: String(row.outcome),
    result: jsonObject(row.result_json),
    completedAt: dateValue(row.completed_at)
  };
}

function reportFromRow(row: Row): MissionReportRecord {
  return {
    id: bytesToUuid(row.id),
    missionId: bytesToUuid(row.mission_id),
    outcome: String(row.outcome),
    reportSchemaVersion: safeInteger(row.report_schema_version, "report_schema_version"),
    report: jsonObject(row.report_json),
    createdAt: dateValue(row.created_at)
  };
}

function importFromRow(row: Row): LegacyImportRecord {
  return {
    userId: bytesToUuid(row.user_id),
    idempotencyKey: bytesToUuid(row.idempotency_key),
    sourceVersion: safeInteger(row.source_version, "source_version"),
    sourceSha256: Buffer.from(row.source_sha256 as Uint8Array),
    consentCopyVersion: String(row.consent_copy_version),
    consentedAt: dateValue(row.consented_at),
    importedAt: dateValue(row.imported_at),
    agencyId: bytesToUuid(row.agency_id),
    missionCount: safeInteger(row.mission_count, "mission_count")
  };
}

export class MySqlUserAccountDao implements UserAccountDao {
  constructor(private readonly db: SqlExecutor) {}

  async findById(id: Uuid): Promise<UserAccountRecord | null> {
    const result = await rows(this.db, "SELECT * FROM user_accounts WHERE id = ?", [uuidToBytes(id)]);
    return result[0] ? accountFromRow(result[0]) : null;
  }

  async findByNormalizedEmail(email: string): Promise<UserAccountRecord | null> {
    const result = await rows(this.db, "SELECT * FROM user_accounts WHERE email_normalized = ?", [email]);
    return result[0] ? accountFromRow(result[0]) : null;
  }

  insert(account: NewUserAccount, now = new Date()): Promise<void> {
    return insert(
      this.db,
      "INSERT INTO user_accounts (id, email_normalized, password_hash, status, created_at, updated_at) VALUES (?, ?, ?, 'active', ?, ?)",
      [uuidToBytes(account.id), account.emailNormalized, account.passwordHash, now, now]
    );
  }
}

export class MySqlPlayerProfileDao implements PlayerProfileDao {
  constructor(private readonly db: SqlExecutor) {}

  async findByUserId(userId: Uuid): Promise<PlayerProfileRecord | null> {
    const result = await rows(this.db, "SELECT * FROM player_profiles WHERE user_id = ?", [uuidToBytes(userId)]);
    return result[0] ? profileFromRow(result[0]) : null;
  }

  save(profile: PlayerProfileRecord): Promise<void> {
    return insert(
      this.db,
      "INSERT INTO player_profiles (user_id, display_name, locale, preferences_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), locale = VALUES(locale), preferences_json = VALUES(preferences_json), updated_at = VALUES(updated_at)",
      [
        uuidToBytes(profile.userId),
        profile.displayName,
        profile.locale,
        JSON.stringify(profile.preferences),
        profile.createdAt,
        profile.updatedAt
      ]
    );
  }
}

export class MySqlAuthSessionDao implements AuthSessionDao {
  constructor(private readonly db: SqlExecutor) {}

  async findByTokenHash(tokenHash: Uint8Array): Promise<AuthSessionRecord | null> {
    const result = await rows(this.db, "SELECT * FROM auth_sessions WHERE token_hash = ?", [tokenHash]);
    return result[0] ? sessionFromRow(result[0]) : null;
  }

  insert(session: AuthSessionRecord): Promise<void> {
    return insert(
      this.db,
      "INSERT INTO auth_sessions (id, user_id, token_hash, expires_at, revoked_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        uuidToBytes(session.id),
        uuidToBytes(session.userId),
        session.tokenHash,
        session.expiresAt,
        session.revokedAt,
        session.createdAt,
        session.updatedAt
      ]
    );
  }

  async revoke(id: Uuid, at: Date): Promise<boolean> {
    const [result] = await this.db.execute(
      "UPDATE auth_sessions SET revoked_at = ?, updated_at = ? WHERE id = ? AND revoked_at IS NULL",
      [at, at, uuidToBytes(id)]
    );
    return typeof result === "object" && result !== null && "affectedRows" in result
      ? Number((result as { affectedRows: unknown }).affectedRows) > 0
      : false;
  }
}

export class MySqlAgencyDao implements AgencyDao {
  constructor(private readonly db: SqlExecutor) {}

  async findByIdForOwner(id: Uuid, ownerUserId: Uuid): Promise<AgencyRecord | null> {
    const result = await rows(
      this.db,
      "SELECT * FROM agencies WHERE id = ? AND owner_user_id = ?",
      [uuidToBytes(id), uuidToBytes(ownerUserId)]
    );
    return result[0] ? agencyFromRow(result[0]) : null;
  }

  insert(agency: NewAgency, now = new Date()): Promise<void> {
    return insert(
      this.db,
      "INSERT INTO agencies (id, owner_user_id, name, credits, xp, science_total, staff_count, difficulty, sandbox, tutorial_state, state_schema_version, state_json, current_mission_id, revision, created_at, updated_at) VALUES (?, ?, ?, 0, 0, 0, 0, ?, ?, ?, ?, ?, NULL, 1, ?, ?)",
      [
        uuidToBytes(agency.id),
        uuidToBytes(agency.ownerUserId),
        agency.name,
        agency.difficulty,
        agency.sandbox,
        JSON.stringify(agency.tutorialState),
        agency.stateSchemaVersion,
        JSON.stringify(agency.state),
        now,
        now
      ]
    );
  }

  async updateNameIfRevisionMatches(
    id: Uuid,
    ownerUserId: Uuid,
    expectedRevision: number,
    name: string,
    now = new Date()
  ): Promise<number | null> {
    const [result] = await this.db.execute(
      "UPDATE agencies SET name = ?, revision = revision + 1, updated_at = ? WHERE id = ? AND owner_user_id = ? AND revision = ?",
      [name, now, uuidToBytes(id), uuidToBytes(ownerUserId), expectedRevision]
    );
    if (typeof result !== "object" || result === null || !("affectedRows" in result)) return null;
    return Number((result as { affectedRows: unknown }).affectedRows) === 1 ? expectedRevision + 1 : null;
  }
}

export class MySqlMissionDao implements MissionDao {
  constructor(private readonly db: SqlExecutor) {}

  async findByIdForOwner(id: Uuid, ownerUserId: Uuid): Promise<MissionRecord | null> {
    const result = await rows(
      this.db,
      "SELECT m.* FROM missions AS m INNER JOIN agencies AS a ON a.id = m.agency_id WHERE m.id = ? AND a.owner_user_id = ?",
      [uuidToBytes(id), uuidToBytes(ownerUserId)]
    );
    return result[0] ? missionFromRow(result[0]) : null;
  }

  async listForOwner(
    ownerUserId: Uuid,
    limit: number,
    afterUpdatedAt?: Date
  ): Promise<readonly MissionRecord[]> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new RangeError("Mission list limit must be between 1 and 100.");
    }
    const result = afterUpdatedAt
      ? await rows(
          this.db,
          "SELECT m.* FROM missions AS m INNER JOIN agencies AS a ON a.id = m.agency_id WHERE a.owner_user_id = ? AND m.updated_at < ? ORDER BY m.updated_at DESC, m.id LIMIT ?",
          [uuidToBytes(ownerUserId), afterUpdatedAt, limit]
        )
      : await rows(
          this.db,
          "SELECT m.* FROM missions AS m INNER JOIN agencies AS a ON a.id = m.agency_id WHERE a.owner_user_id = ? ORDER BY m.updated_at DESC, m.id LIMIT ?",
          [uuidToBytes(ownerUserId), limit]
        );
    return result.map(missionFromRow);
  }

  insert(mission: NewMission, now = new Date()): Promise<void> {
    return insert(
      this.db,
      "INSERT INTO missions (id, agency_id, legacy_order, name, phase_code, stage_code, status, state_schema_version, state_json, revision, created_at, updated_at, closed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)",
      [
        uuidToBytes(mission.id),
        uuidToBytes(mission.agencyId),
        mission.legacyOrder ?? null,
        mission.name,
        mission.phaseCode,
        mission.stageCode,
        mission.status,
        mission.stateSchemaVersion,
        JSON.stringify(mission.state),
        now,
        now
      ]
    );
  }

  async updateStateIfRevisionMatches(update: MissionStateUpdate, now = new Date()): Promise<number | null> {
    const [result] = await this.db.execute(
      "UPDATE missions SET name = COALESCE(?, name), phase_code = ?, stage_code = ?, status = ?, state_schema_version = ?, state_json = ?, revision = revision + 1, updated_at = ?, closed_at = ? WHERE id = ? AND agency_id = ? AND revision = ?",
      [
        update.name ?? null,
        update.phaseCode,
        update.stageCode,
        update.status,
        update.stateSchemaVersion,
        JSON.stringify(update.state),
        now,
        update.closedAt ?? null,
        uuidToBytes(update.missionId),
        uuidToBytes(update.agencyId),
        update.expectedRevision
      ]
    );
    if (typeof result !== "object" || result === null || !("affectedRows" in result)) return null;
    return Number((result as { affectedRows: unknown }).affectedRows) === 1
      ? update.expectedRevision + 1
      : null;
  }
}

export class MySqlMissionEventDao implements MissionEventDao {
  constructor(private readonly db: SqlExecutor) {}

  append(event: NewMissionEvent, createdAt = new Date()): Promise<void> {
    return insert(
      this.db,
      "INSERT INTO mission_events (id, mission_id, sequence, actor_user_id, event_type, event_schema_version, payload_json, idempotency_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        uuidToBytes(event.id),
        uuidToBytes(event.missionId),
        event.sequence,
        uuidToBytes(event.actorUserId),
        event.eventType,
        event.eventSchemaVersion,
        JSON.stringify(event.payload),
        event.idempotencyKey ? uuidToBytes(event.idempotencyKey) : null,
        createdAt
      ]
    );
  }

  async listByMission(
    missionId: Uuid,
    afterSequence = 0,
    limit = 100
  ): Promise<readonly MissionEventRecord[]> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
      throw new RangeError("Mission event limit must be between 1 and 500.");
    }
    const result = await rows(
      this.db,
      "SELECT * FROM mission_events WHERE mission_id = ? AND sequence > ? ORDER BY sequence LIMIT ?",
      [uuidToBytes(missionId), afterSequence, limit]
    );
    return result.map(eventFromRow);
  }
}

export class MySqlMissionTestRunDao implements MissionTestRunDao {
  constructor(private readonly db: SqlExecutor) {}

  insert(run: NewMissionTestRun): Promise<void> {
    return insert(
      this.db,
      "INSERT INTO mission_test_runs (id, mission_id, test_type, attempt_number, design_revision, outcome, result_json, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        uuidToBytes(run.id),
        uuidToBytes(run.missionId),
        run.testType,
        run.attemptNumber,
        run.designRevision,
        run.outcome,
        JSON.stringify(run.result),
        run.completedAt
      ]
    );
  }

  async listByMission(missionId: Uuid): Promise<readonly MissionTestRunRecord[]> {
    const result = await rows(
      this.db,
      "SELECT * FROM mission_test_runs WHERE mission_id = ? ORDER BY test_type, attempt_number",
      [uuidToBytes(missionId)]
    );
    return result.map(testRunFromRow);
  }
}

export class MySqlMissionReportDao implements MissionReportDao {
  constructor(private readonly db: SqlExecutor) {}

  async findByMission(missionId: Uuid): Promise<MissionReportRecord | null> {
    const result = await rows(this.db, "SELECT * FROM mission_reports WHERE mission_id = ?", [
      uuidToBytes(missionId)
    ]);
    return result[0] ? reportFromRow(result[0]) : null;
  }

  insert(report: NewMissionReport, createdAt = new Date()): Promise<void> {
    return insert(
      this.db,
      "INSERT INTO mission_reports (id, mission_id, outcome, report_schema_version, report_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [
        uuidToBytes(report.id),
        uuidToBytes(report.missionId),
        report.outcome,
        report.reportSchemaVersion,
        JSON.stringify(report.report),
        createdAt
      ]
    );
  }
}

export class MySqlLegacyImportDao implements LegacyImportDao {
  constructor(private readonly db: SqlExecutor) {}

  async findByUserId(userId: Uuid): Promise<LegacyImportRecord | null> {
    const result = await rows(this.db, "SELECT * FROM legacy_imports WHERE user_id = ?", [
      uuidToBytes(userId)
    ]);
    return result[0] ? importFromRow(result[0]) : null;
  }

  async findByIdempotencyKey(key: Uuid): Promise<LegacyImportRecord | null> {
    const result = await rows(this.db, "SELECT * FROM legacy_imports WHERE idempotency_key = ?", [
      uuidToBytes(key)
    ]);
    return result[0] ? importFromRow(result[0]) : null;
  }

  insert(record: NewLegacyImport): Promise<void> {
    return insert(
      this.db,
      "INSERT INTO legacy_imports (user_id, idempotency_key, source_version, source_sha256, consent_copy_version, consented_at, imported_at, agency_id, mission_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        uuidToBytes(record.userId),
        uuidToBytes(record.idempotencyKey),
        record.sourceVersion,
        record.sourceSha256,
        record.consentCopyVersion,
        record.consentedAt,
        record.importedAt,
        uuidToBytes(record.agencyId),
        record.missionCount
      ]
    );
  }
}
