export type Uuid = string;
export type JsonObject = Readonly<Record<string, unknown>>;
export type SqlParameter = string | number | boolean | Date | Uint8Array | null;

/**
 * Narrow driver seam implemented by a MySQL 8.4 connection or a test double.
 * The concrete mysql2 adapter can satisfy this interface without leaking its
 * package-specific row types into DAOs.
 */
export interface SqlExecutor {
  execute(sql: string, parameters?: readonly SqlParameter[]): Promise<readonly [unknown, unknown]>;
}

export interface SqlConnection extends SqlExecutor {
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(): void;
}

export interface SqlPool {
  getConnection(): Promise<SqlConnection>;
}

export interface UserAccountRecord {
  readonly id: Uuid;
  readonly emailNormalized: string;
  readonly passwordHash: string;
  readonly status: "active" | "disabled";
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface NewUserAccount {
  readonly id: Uuid;
  readonly emailNormalized: string;
  readonly passwordHash: string;
}

export interface PlayerProfileRecord {
  readonly userId: Uuid;
  readonly displayName: string;
  readonly locale: "it" | "en";
  readonly preferences: JsonObject;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AuthSessionRecord {
  readonly id: Uuid;
  readonly userId: Uuid;
  readonly tokenHash: Uint8Array;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AgencyRecord {
  readonly id: Uuid;
  readonly ownerUserId: Uuid;
  readonly name: string;
  readonly credits: string;
  readonly xp: number;
  readonly scienceTotal: number;
  readonly staffCount: number;
  readonly difficulty: string;
  readonly sandbox: boolean;
  readonly tutorialState: JsonObject;
  readonly stateSchemaVersion: number;
  readonly state: JsonObject;
  readonly currentMissionId: Uuid | null;
  readonly revision: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface MissionRecord {
  readonly id: Uuid;
  readonly agencyId: Uuid;
  readonly legacyOrder: number | null;
  readonly name: string;
  readonly phaseCode: string;
  readonly stageCode: string;
  readonly status: string;
  readonly stateSchemaVersion: number;
  readonly state: JsonObject;
  readonly revision: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly closedAt: Date | null;
}

export interface MissionEventRecord {
  readonly id: Uuid;
  readonly missionId: Uuid;
  readonly sequence: number;
  readonly actorUserId: Uuid;
  readonly eventType: string;
  readonly eventSchemaVersion: number;
  readonly payload: JsonObject;
  readonly idempotencyKey: Uuid | null;
  readonly createdAt: Date;
}

export interface MissionTestRunRecord {
  readonly id: Uuid;
  readonly missionId: Uuid;
  readonly testType: string;
  readonly attemptNumber: number;
  readonly designRevision: number;
  readonly outcome: string;
  readonly result: JsonObject;
  readonly completedAt: Date;
}

export interface MissionReportRecord {
  readonly id: Uuid;
  readonly missionId: Uuid;
  readonly outcome: string;
  readonly reportSchemaVersion: number;
  readonly report: JsonObject;
  readonly createdAt: Date;
}

export interface LegacyImportRecord {
  readonly userId: Uuid;
  readonly idempotencyKey: Uuid;
  readonly sourceVersion: number;
  readonly sourceSha256: Uint8Array;
  readonly consentCopyVersion: string;
  readonly consentedAt: Date;
  readonly importedAt: Date;
  readonly agencyId: Uuid;
  readonly missionCount: number;
}

export interface NewAgency {
  readonly id: Uuid;
  readonly ownerUserId: Uuid;
  readonly name: string;
  readonly difficulty: string;
  readonly sandbox: boolean;
  readonly tutorialState: JsonObject;
  readonly stateSchemaVersion: number;
  readonly state: JsonObject;
}

export interface NewMission {
  readonly id: Uuid;
  readonly agencyId: Uuid;
  readonly legacyOrder?: number | null;
  readonly name: string;
  readonly phaseCode: string;
  readonly stageCode: string;
  readonly status: string;
  readonly stateSchemaVersion: number;
  readonly state: JsonObject;
}

export interface MissionStateUpdate {
  readonly agencyId: Uuid;
  readonly missionId: Uuid;
  readonly expectedRevision: number;
  readonly name?: string;
  readonly phaseCode: string;
  readonly stageCode: string;
  readonly status: string;
  readonly stateSchemaVersion: number;
  readonly state: JsonObject;
  readonly closedAt?: Date | null;
}

export interface NewMissionEvent {
  readonly id: Uuid;
  readonly missionId: Uuid;
  readonly sequence: number;
  readonly actorUserId: Uuid;
  readonly eventType: string;
  readonly eventSchemaVersion: number;
  readonly payload: JsonObject;
  readonly idempotencyKey?: Uuid | null;
}

export interface NewMissionTestRun {
  readonly id: Uuid;
  readonly missionId: Uuid;
  readonly testType: string;
  readonly attemptNumber: number;
  readonly designRevision: number;
  readonly outcome: string;
  readonly result: JsonObject;
  readonly completedAt: Date;
}

export interface NewMissionReport {
  readonly id: Uuid;
  readonly missionId: Uuid;
  readonly outcome: string;
  readonly reportSchemaVersion: number;
  readonly report: JsonObject;
}

export interface NewLegacyImport {
  readonly userId: Uuid;
  readonly idempotencyKey: Uuid;
  readonly sourceVersion: number;
  readonly sourceSha256: Uint8Array;
  readonly consentCopyVersion: string;
  readonly consentedAt: Date;
  readonly importedAt: Date;
  readonly agencyId: Uuid;
  readonly missionCount: number;
}
