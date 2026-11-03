import type {
  AssemblyCommandRequest,
  CreateAgencyRequest,
  CreateMissionRequest,
  FlightPlanRequest,
  LegacySaveV32,
  LegacyV32ImportRequest,
  LoginRequest,
  OperationDecisionRequest,
  RepairRequest,
  RegisterPlayerRequest,
  ReviewDecisionRequest,
  RequirementDecisionRequest,
  RunQualificationRequest,
  SetParticipantsRequest,
  SpacecraftDesignRequest,
  TutorialProgressRequest,
  UpdateMissionRequest,
  UpdateProfileRequest
} from "./types.js";

export interface ContractIssue {
  readonly path: string;
  readonly code: "invalid_type" | "invalid_value" | "unknown_field" | "missing_field";
  readonly messageKey: string;
}

export class ContractValidationError extends Error {
  readonly issues: readonly ContractIssue[];

  constructor(issues: readonly ContractIssue[]) {
    super("The request does not match the API contract.");
    this.name = "ContractValidationError";
    this.issues = issues;
  }
}

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const issue = (
  path: string,
  code: ContractIssue["code"],
  messageKey: string
): ContractIssue => ({ path, code, messageKey });

function objectWithFields(
  input: unknown,
  allowedFields: readonly string[]
): JsonRecord {
  if (!isRecord(input)) {
    throw new ContractValidationError([
      issue("$", "invalid_type", "errors.validation.objectRequired")
    ]);
  }

  const allowed = new Set(allowedFields);
  const unknownFields = Object.keys(input)
    .filter((field) => !allowed.has(field))
    .map((field) => issue(field, "unknown_field", "errors.validation.unknownField"));
  if (unknownFields.length > 0) {
    throw new ContractValidationError(unknownFields);
  }
  return input;
}

function requiredString(
  value: unknown,
  path: string,
  options: { minLength?: number; maxLength?: number; pattern?: RegExp } = {}
): string {
  if (typeof value !== "string") {
    throw new ContractValidationError([
      issue(path, "invalid_type", "errors.validation.stringRequired")
    ]);
  }
  if (
    (options.minLength !== undefined && value.length < options.minLength) ||
    (options.maxLength !== undefined && value.length > options.maxLength) ||
    (options.pattern !== undefined && !options.pattern.test(value))
  ) {
    throw new ContractValidationError([
      issue(path, "invalid_value", "errors.validation.invalidValue")
    ]);
  }
  return value;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseRegisterPlayerRequest(input: unknown): RegisterPlayerRequest {
  const value = objectWithFields(input, ["email", "password", "displayName"]);
  return {
    email: requiredString(value.email, "email", { minLength: 3, maxLength: 254, pattern: emailPattern }),
    password: requiredString(value.password, "password", { minLength: 1, maxLength: 1024 }),
    displayName: requiredString(value.displayName, "displayName", { minLength: 1, maxLength: 80 })
  };
}

export function parseLoginRequest(input: unknown): LoginRequest {
  const value = objectWithFields(input, ["email", "password"]);
  return {
    email: requiredString(value.email, "email", { minLength: 3, maxLength: 254, pattern: emailPattern }),
    password: requiredString(value.password, "password", { minLength: 1, maxLength: 1024 })
  };
}

export function parseUpdateProfileRequest(input: unknown): UpdateProfileRequest {
  const value = objectWithFields(input, ["displayName", "locale"]);
  const parsed: { displayName?: string; locale?: "it" | "en" } = {};
  if ("displayName" in value) {
    parsed.displayName = requiredString(value.displayName, "displayName", {
      minLength: 1,
      maxLength: 80
    });
  }
  if ("locale" in value) {
    if (value.locale !== "it" && value.locale !== "en") {
      throw new ContractValidationError([
        issue("locale", "invalid_value", "errors.validation.invalidValue")
      ]);
    }
    parsed.locale = value.locale;
  }
  if (Object.keys(parsed).length === 0) {
    throw new ContractValidationError([
      issue("$", "invalid_value", "errors.validation.emptyPatch")
    ]);
  }
  return parsed;
}

export function parseTutorialProgressRequest(input: unknown): TutorialProgressRequest {
  const value = objectWithFields(input, ["status"]);
  if (value.status !== "started" && value.status !== "skipped" && value.status !== "completed") {
    throw new ContractValidationError([
      issue("status", "invalid_value", "errors.validation.invalidValue")
    ]);
  }
  return { status: value.status };
}

export function parseRequirementDecisionRequest(input: unknown): RequirementDecisionRequest {
  const value = objectWithFields(input, ["requirementId", "decision", "rationale"]);
  const decision = value.decision;
  if (
    decision !== "accept" &&
    decision !== "qualify" &&
    decision !== "decline" &&
    decision !== "waive"
  ) {
    throw new ContractValidationError([
      issue("decision", "invalid_value", "errors.validation.invalidValue")
    ]);
  }

  const parsed: { requirementId: string; decision: RequirementDecisionRequest["decision"]; rationale?: string } = {
    requirementId: requiredString(value.requirementId, "requirementId", {
      minLength: 1,
      maxLength: 128
    }),
    decision
  };
  if ("rationale" in value) {
    parsed.rationale = requiredString(value.rationale, "rationale", { maxLength: 2000 });
  }
  return parsed;
}

export function parseUuid(value: unknown, path = "$"): string {
  return requiredString(value, path, { pattern: uuidPattern });
}

export function parseIdempotencyKey(value: unknown): string {
  return parseUuid(value, "Idempotency-Key");
}

export function parseCreateAgencyRequest(input: unknown): CreateAgencyRequest {
  const value = objectWithFields(input, ["name"]);
  return { name: requiredString(value.name, "name", { minLength: 1, maxLength: 120 }) };
}

export function parseCreateMissionRequest(input: unknown): CreateMissionRequest {
  const value = objectWithFields(input, ["agencyId", "name"]);
  return {
    agencyId: parseUuid(value.agencyId, "agencyId"),
    name: requiredString(value.name, "name", { minLength: 1, maxLength: 120 })
  };
}

export function parseUpdateMissionRequest(input: unknown): UpdateMissionRequest {
  const value = objectWithFields(input, ["name"]);
  if (!("name" in value)) {
    throw new ContractValidationError([
      issue("$", "invalid_value", "errors.validation.emptyPatch")
    ]);
  }
  return { name: requiredString(value.name, "name", { minLength: 1, maxLength: 120 }) };
}

export function parseSetParticipantsRequest(input: unknown): SetParticipantsRequest {
  const value = objectWithFields(input, ["participantKeys"]);
  if (
    !Array.isArray(value.participantKeys) ||
    value.participantKeys.some((key) => typeof key !== "string" || key.length < 1 || key.length > 128)
  ) {
    throw new ContractValidationError([
      issue("participantKeys", "invalid_type", "errors.validation.stringArrayRequired")
    ]);
  }
  if (new Set(value.participantKeys).size !== value.participantKeys.length) {
    throw new ContractValidationError([
      issue("participantKeys", "invalid_value", "errors.validation.duplicateValue")
    ]);
  }
  return { participantKeys: value.participantKeys as string[] };
}

export function parseSpacecraftDesignRequest(input: unknown): SpacecraftDesignRequest {
  const value = objectWithFields(input, ["classKey", "components"]);
  if (!Array.isArray(value.components)) {
    throw new ContractValidationError([
      issue("components", "invalid_type", "errors.validation.arrayRequired")
    ]);
  }
  const components = value.components.map((component, index) => {
    const item = objectWithFields(component, ["catalogKey", "slot", "rotation"]);
    if (typeof item.rotation !== "number" || !Number.isFinite(item.rotation)) {
      throw new ContractValidationError([
        issue(`components[${index}].rotation`, "invalid_type", "errors.validation.finiteNumberRequired")
      ]);
    }
    return {
      catalogKey: requiredString(item.catalogKey, `components[${index}].catalogKey`, {
        minLength: 1,
        maxLength: 128
      }),
      slot: requiredString(item.slot, `components[${index}].slot`, { minLength: 1, maxLength: 128 }),
      rotation: item.rotation
    };
  });
  return {
    classKey: requiredString(value.classKey, "classKey", { minLength: 1, maxLength: 128 }),
    components
  };
}

export function parseFlightPlanRequest(input: unknown): FlightPlanRequest {
  const value = objectWithFields(input, [
    "destinationKey",
    "orbitKey",
    "launchProviderKey",
    "launchVehicleKey",
    "maneuvers"
  ]);
  if (!Array.isArray(value.maneuvers)) {
    throw new ContractValidationError([
      issue("maneuvers", "invalid_type", "errors.validation.arrayRequired")
    ]);
  }
  const maneuvers = value.maneuvers.map((maneuver, index) => {
    const item = objectWithFields(maneuver, ["key", "deltaV"]);
    if (typeof item.deltaV !== "number" || !Number.isFinite(item.deltaV)) {
      throw new ContractValidationError([
        issue(`maneuvers[${index}].deltaV`, "invalid_type", "errors.validation.finiteNumberRequired")
      ]);
    }
    return {
      key: requiredString(item.key, `maneuvers[${index}].key`, { minLength: 1, maxLength: 128 }),
      deltaV: item.deltaV
    };
  });
  return {
    destinationKey: requiredString(value.destinationKey, "destinationKey", { minLength: 1, maxLength: 128 }),
    orbitKey: requiredString(value.orbitKey, "orbitKey", { minLength: 1, maxLength: 128 }),
    launchProviderKey: requiredString(value.launchProviderKey, "launchProviderKey", {
      minLength: 1,
      maxLength: 128
    }),
    launchVehicleKey: requiredString(value.launchVehicleKey, "launchVehicleKey", {
      minLength: 1,
      maxLength: 128
    }),
    maneuvers
  };
}

export function parseAssemblyCommandRequest(input: unknown): AssemblyCommandRequest {
  const value = objectWithFields(input, ["command"]);
  if (value.command !== "start" && value.command !== "advance" && value.command !== "complete") {
    throw new ContractValidationError([
      issue("command", "invalid_value", "errors.validation.invalidValue")
    ]);
  }
  return { command: value.command };
}

export function parseRunQualificationRequest(input: unknown): RunQualificationRequest {
  const value = objectWithFields(input, ["testType"]);
  return { testType: requiredString(value.testType, "testType", { minLength: 1, maxLength: 64 }) };
}

export function parseRepairRequest(input: unknown): RepairRequest {
  const value = objectWithFields(input, ["repairKey"]);
  return { repairKey: requiredString(value.repairKey, "repairKey", { minLength: 1, maxLength: 128 }) };
}

export function parseReviewDecisionRequest(input: unknown): ReviewDecisionRequest {
  const value = objectWithFields(input, ["decision", "rationale"]);
  if (value.decision !== "go" && value.decision !== "no-go" && value.decision !== "rework") {
    throw new ContractValidationError([
      issue("decision", "invalid_value", "errors.validation.invalidValue")
    ]);
  }
  const parsed: { decision: ReviewDecisionRequest["decision"]; rationale?: string } = {
    decision: value.decision
  };
  if ("rationale" in value) {
    parsed.rationale = requiredString(value.rationale, "rationale", { maxLength: 2000 });
  }
  return parsed;
}

export function parseLaunchRequest(input: unknown): { readonly confirmation: true } {
  const value = objectWithFields(input, ["confirmation"]);
  if (value.confirmation !== true) {
    throw new ContractValidationError([
      issue("confirmation", "invalid_value", "errors.validation.confirmationRequired")
    ]);
  }
  return { confirmation: true };
}

export function parseOperationDecisionRequest(input: unknown): OperationDecisionRequest {
  const value = objectWithFields(input, ["eventId", "decisionKey"]);
  return {
    eventId: parseUuid(value.eventId, "eventId"),
    decisionKey: requiredString(value.decisionKey, "decisionKey", { minLength: 1, maxLength: 128 })
  };
}

function assertSafeJson(value: unknown, path: string, seen: WeakSet<object>): void {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return;
  }
  if (typeof value !== "object") {
    throw new ContractValidationError([
      issue(path, "invalid_type", "errors.validation.jsonValueRequired")
    ]);
  }
  if (seen.has(value)) {
    throw new ContractValidationError([
      issue(path, "invalid_value", "errors.validation.circularReference")
    ]);
  }
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertSafeJson(entry, `${path}[${index}]`, seen));
  } else {
    for (const [key, entry] of Object.entries(value)) {
      if (key === "__proto__" || key === "prototype" || key === "constructor") {
        throw new ContractValidationError([
          issue(`${path}.${key}`, "invalid_value", "errors.validation.unsafeKey")
        ]);
      }
      assertSafeJson(entry, `${path}.${key}`, seen);
    }
  }
  seen.delete(value);
}

function parseLegacySave(input: unknown): LegacySaveV32 {
  if (!isRecord(input)) {
    throw new ContractValidationError([
      issue("save", "invalid_type", "errors.validation.objectRequired")
    ]);
  }
  if (input.v !== 32) {
    throw new ContractValidationError([
      issue("save.v", "invalid_value", "errors.validation.unsupportedSaveVersion")
    ]);
  }
  assertSafeJson(input, "save", new WeakSet<object>());
  return input as LegacySaveV32;
}

export function parseLegacyV32ImportRequest(input: unknown): LegacyV32ImportRequest {
  const value = objectWithFields(input, ["consent", "consentCopyVersion", "sourceVersion", "save"]);
  if (value.consent !== true) {
    throw new ContractValidationError([
      issue("consent", "invalid_value", "errors.validation.consentRequired")
    ]);
  }
  if (value.sourceVersion !== 32) {
    throw new ContractValidationError([
      issue("sourceVersion", "invalid_value", "errors.validation.unsupportedSaveVersion")
    ]);
  }
  return {
    consent: true,
    consentCopyVersion: requiredString(value.consentCopyVersion, "consentCopyVersion", {
      minLength: 1,
      maxLength: 80
    }),
    sourceVersion: 32,
    save: parseLegacySave(value.save)
  };
}
