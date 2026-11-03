import type {
  AgencyRecord,
  AuthSessionRecord,
  LegacyImportRecord,
  MissionEventRecord,
  MissionRecord,
  MissionReportRecord,
  MissionTestRunRecord,
  NewAgency,
  NewLegacyImport,
  NewMission,
  NewMissionEvent,
  NewMissionReport,
  NewMissionTestRun,
  NewUserAccount,
  PlayerProfileRecord,
  Uuid,
  UserAccountRecord,
  MissionStateUpdate
} from "./types.js";

export interface UserAccountDao {
  findById(id: Uuid): Promise<UserAccountRecord | null>;
  findByNormalizedEmail(email: string): Promise<UserAccountRecord | null>;
  insert(account: NewUserAccount, now?: Date): Promise<void>;
}

export interface PlayerProfileDao {
  findByUserId(userId: Uuid): Promise<PlayerProfileRecord | null>;
  save(profile: PlayerProfileRecord): Promise<void>;
}

export interface AuthSessionDao {
  findByTokenHash(tokenHash: Uint8Array): Promise<AuthSessionRecord | null>;
  insert(session: AuthSessionRecord): Promise<void>;
  revoke(id: Uuid, at: Date): Promise<boolean>;
}

export interface AgencyDao {
  findByIdForOwner(id: Uuid, ownerUserId: Uuid): Promise<AgencyRecord | null>;
  insert(agency: NewAgency, now?: Date): Promise<void>;
  updateNameIfRevisionMatches(
    id: Uuid,
    ownerUserId: Uuid,
    expectedRevision: number,
    name: string,
    now?: Date
  ): Promise<number | null>;
}

export interface MissionDao {
  findByIdForOwner(id: Uuid, ownerUserId: Uuid): Promise<MissionRecord | null>;
  listForOwner(ownerUserId: Uuid, limit: number, afterUpdatedAt?: Date): Promise<readonly MissionRecord[]>;
  insert(mission: NewMission, now?: Date): Promise<void>;
  updateStateIfRevisionMatches(update: MissionStateUpdate, now?: Date): Promise<number | null>;
}

export interface MissionEventDao {
  append(event: NewMissionEvent, createdAt?: Date): Promise<void>;
  listByMission(missionId: Uuid, afterSequence?: number, limit?: number): Promise<readonly MissionEventRecord[]>;
}

export interface MissionTestRunDao {
  insert(run: NewMissionTestRun): Promise<void>;
  listByMission(missionId: Uuid): Promise<readonly MissionTestRunRecord[]>;
}

export interface MissionReportDao {
  findByMission(missionId: Uuid): Promise<MissionReportRecord | null>;
  insert(report: NewMissionReport, createdAt?: Date): Promise<void>;
}

export interface LegacyImportDao {
  findByUserId(userId: Uuid): Promise<LegacyImportRecord | null>;
  findByIdempotencyKey(key: Uuid): Promise<LegacyImportRecord | null>;
  insert(record: NewLegacyImport): Promise<void>;
}

export interface BackendDaos {
  readonly userAccounts: UserAccountDao;
  readonly playerProfiles: PlayerProfileDao;
  readonly authSessions: AuthSessionDao;
  readonly agencies: AgencyDao;
  readonly missions: MissionDao;
  readonly missionEvents: MissionEventDao;
  readonly missionTestRuns: MissionTestRunDao;
  readonly missionReports: MissionReportDao;
  readonly legacyImports: LegacyImportDao;
}
