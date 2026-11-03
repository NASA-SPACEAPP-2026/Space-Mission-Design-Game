/**
 * Public HTTP contracts for the first version of the Space Mission API.
 *
 * These types describe JSON at the API boundary only. They are deliberately
 * independent of Express and of the backend's persistence/domain models.
 */

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

export type Locale = "it" | "en";
export type RequirementDecision = "accept" | "qualify" | "decline" | "waive";
export type MissionStatus = "active" | "completed" | "failed" | "archived";
export type MissionPhase =
  | "definition"
  | "design"
  | "assembly"
  | "qualification"
  | "launch"
  | "operations"
  | "closeout";
export type TestOutcome = "pending" | "passed" | "failed" | "invalidated";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "REVISION_CONFLICT"
  | "IDEMPOTENCY_KEY_REUSED"
  | "PRECONDITION_REQUIRED"
  | "UNPROCESSABLE_ENTITY"
  | "RATE_LIMITED"
  | "DEPENDENCY_UNAVAILABLE"
  | "INTERNAL_ERROR";

export interface FieldError {
  readonly path: string;
  readonly code: string;
  readonly messageKey: string;
}

export interface ApiError {
  readonly error: {
    readonly code: ApiErrorCode;
    readonly messageKey: string;
    readonly fieldErrors: readonly FieldError[];
    readonly requestId: string;
  };
}

export interface LiveHealthView {
  readonly status: "ok";
  readonly service: "space-mission-design-game";
}

export interface ReadyHealthView extends LiveHealthView {
  readonly database: "ready";
  readonly migrations: "compatible";
}

export interface RegisterPlayerRequest {
  readonly email: string;
  readonly password: string;
  readonly displayName: string;
}

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

export interface PlayerSummaryView {
  readonly id: string;
  readonly displayName: string;
  readonly locale: Locale;
}

export interface PlayerSessionView {
  readonly player: PlayerSummaryView;
  readonly csrfToken: string;
}

export interface SessionView {
  readonly authenticated: boolean;
  readonly player?: PlayerSummaryView;
  readonly csrfToken?: string;
}

export interface UpdateProfileRequest {
  readonly displayName?: string;
  readonly locale?: Locale;
}

export interface ProfileView extends PlayerSummaryView {
  readonly createdAt: string;
}

export interface TutorialProgressRequest {
  readonly status: "started" | "skipped" | "completed";
}

export interface TutorialProgressView {
  readonly status: "not-started" | "started" | "skipped" | "completed";
  readonly updatedAt: string;
}

export interface CreateAgencyRequest {
  readonly name: string;
}

export interface AgencySummaryView {
  readonly id: string;
  readonly name: string;
  readonly revision: number;
  readonly activeMissionCount: number;
}

export interface AgencyListView {
  readonly agencies: readonly AgencySummaryView[];
  readonly nextCursor?: string;
}

export interface AgencyView extends AgencySummaryView {
  readonly credits: string;
  readonly xp: number;
  readonly scienceTotal: number;
  readonly staffCount: number;
  readonly currentMissionId: string | null;
  readonly state: JsonValue;
}

export interface AgencyStaffActionRequest {
  readonly action: string;
  readonly targetId?: string;
}

export interface FacilityUpgradeRequest {
  readonly facilityId: string;
}

export interface ResetAgencyRequest {
  readonly confirmation: true;
}

export interface AgencyResetView {
  readonly agency: AgencyView;
  readonly archivedAgencyId?: string;
}

export interface RoadmapView {
  readonly agencyId: string;
  readonly entries: readonly {
    readonly key: string;
    readonly status: "available" | "locked" | "completed";
  }[];
}

export interface RankingView {
  readonly scope: string;
  readonly entries: readonly {
    readonly rank: number;
    readonly displayName: string;
    readonly score: number;
  }[];
}

export interface CreateMissionRequest {
  readonly agencyId: string;
  readonly name: string;
}

export interface UpdateMissionRequest {
  readonly name?: string;
}

export interface MissionSummary {
  readonly id: string;
  readonly agencyId: string;
  readonly name: string;
  readonly phase: MissionPhase;
  readonly status: MissionStatus;
  readonly revision: number;
  readonly updatedAt: string;
}

export interface MissionListView {
  readonly missions: readonly MissionSummary[];
  readonly nextCursor?: string;
}

export interface MissionSnapshot extends MissionSummary {
  readonly activityAvailability: Readonly<Record<string, boolean>>;
  readonly blockers: readonly string[];
  readonly state: JsonValue;
}

export interface ParticipantListView {
  readonly missionId: string;
  readonly participants: readonly {
    readonly key: string;
    readonly required: boolean;
    readonly selected: boolean;
  }[];
}

export interface SetParticipantsRequest {
  readonly participantKeys: readonly string[];
}

export interface RequirementDecisionRequest {
  readonly requirementId: string;
  readonly decision: RequirementDecision;
  readonly rationale?: string;
}

export interface ReviewPreviewRequest {
  readonly reviewType: string;
  readonly targetPhase?: MissionPhase;
}

export interface ReviewPreviewView {
  readonly blockers: readonly string[];
  readonly effects: readonly string[];
}

export interface ReviewDecisionRequest {
  readonly decision: "go" | "no-go" | "rework";
  readonly rationale?: string;
}

export interface SpacecraftDesignRequest {
  readonly classKey: string;
  readonly components: readonly {
    readonly catalogKey: string;
    readonly slot: string;
    readonly rotation: number;
  }[];
}

export interface DesignCheckView {
  readonly valid: boolean;
  readonly issues: readonly string[];
  readonly designRevision: number;
}

export interface FlightPlanRequest {
  readonly destinationKey: string;
  readonly orbitKey: string;
  readonly launchProviderKey: string;
  readonly launchVehicleKey: string;
  readonly maneuvers: readonly {
    readonly key: string;
    readonly deltaV: number;
  }[];
}

export interface FlightPlanCheckView {
  readonly valid: boolean;
  readonly issues: readonly string[];
  readonly totalDeltaV: number;
}

export interface AssemblyCommandRequest {
  readonly command: "start" | "advance" | "complete";
}

export interface AssemblyView {
  readonly status: "not-started" | "in-progress" | "complete";
  readonly completedSteps: readonly string[];
}

export interface RunQualificationRequest {
  readonly testType: string;
}

export interface TestRunView {
  readonly id: string;
  readonly testType: string;
  readonly outcome: TestOutcome;
  readonly designRevision: number;
  readonly explanation?: string;
}

export interface QualificationView {
  readonly tests: readonly TestRunView[];
}

export interface RepairRequest {
  readonly repairKey: string;
}

export interface LaunchRequest {
  readonly confirmation: true;
}

export interface OperationDecisionRequest {
  readonly eventId: string;
  readonly decisionKey: string;
}

export interface OperationsView {
  readonly missionId: string;
  readonly status: string;
  readonly resources: Readonly<Record<string, number>>;
  readonly events: readonly JsonValue[];
}

export interface MissionReportView {
  readonly missionId: string;
  readonly outcome: "success" | "failure" | "partial";
  readonly summary: JsonValue;
  readonly createdAt: string;
}

export interface MissionAnalysisRequest {
  readonly analysisKey: string;
  readonly assumptions: Readonly<Record<string, JsonValue>>;
}

export interface MissionAnalysisView {
  readonly simulated: true;
  readonly results: JsonValue;
}

/**
 * The import request contract is an envelope; full legacy-v32 shape validation
 * and faithful mapping belong to the separately scoped importer.
 */
export interface LegacySaveV32 extends Readonly<Record<string, JsonValue>> {
  readonly v: 32;
}

export interface LegacyV32ImportRequest {
  readonly consent: true;
  readonly consentCopyVersion: string;
  readonly sourceVersion: 32;
  readonly save: LegacySaveV32;
}

export interface LegacyImportResultView {
  readonly agencyId: string;
  readonly missionIds: readonly string[];
  readonly importedMissionCount: number;
  readonly replayed: boolean;
}
