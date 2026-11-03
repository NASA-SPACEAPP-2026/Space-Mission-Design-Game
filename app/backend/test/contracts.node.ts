import assert from "node:assert/strict";
import test from "node:test";
import {
  ContractValidationError,
  parseLegacyV32ImportRequest,
  parseLoginRequest,
  parseRegisterPlayerRequest,
  parseRequirementDecisionRequest,
  parseUpdateProfileRequest
} from "../../contracts/src/v1/index.js";

test("register request rejects client-controlled sensitive fields", () => {
  const request = parseRegisterPlayerRequest({
    email: "pilot@example.test",
    password: "example password",
    displayName: "Pilot"
  });
  assert.equal(request.displayName, "Pilot");
  assert.throws(
    () => parseRegisterPlayerRequest({
      email: "pilot@example.test",
      password: "example password",
      displayName: "Pilot",
      passwordHash: "must-not-be-client-controlled"
    }),
    ContractValidationError
  );
});

test("login and profile patch validate the public contract", () => {
  assert.equal(parseLoginRequest({ email: "pilot@example.test", password: "secret" }).email, "pilot@example.test");
  assert.deepEqual(parseUpdateProfileRequest({ locale: "it" }), { locale: "it" });
  assert.throws(() => parseUpdateProfileRequest({}), ContractValidationError);
});

test("requirement decisions reject unknown decision values", () => {
  assert.equal(
    parseRequirementDecisionRequest({ requirementId: "REQ-1", decision: "qualify" }).decision,
    "qualify"
  );
  assert.throws(
    () => parseRequirementDecisionRequest({ requirementId: "REQ-1", decision: "approve" }),
    ContractValidationError
  );
});

test("legacy import contract requires explicit consent and a version-32 JSON envelope", () => {
  const request = parseLegacyV32ImportRequest({
    consent: true,
    consentCopyVersion: "gng32-import-v1",
    sourceVersion: 32,
    save: { v: 32, co: "Agency", missions: [] }
  });
  assert.equal(request.save.v, 32);
  assert.throws(
    () => parseLegacyV32ImportRequest({
      consent: false,
      consentCopyVersion: "gng32-import-v1",
      sourceVersion: 32,
      save: { v: 32 }
    }),
    ContractValidationError
  );
  assert.throws(
    () => parseLegacyV32ImportRequest({
      consent: true,
      consentCopyVersion: "gng32-import-v1",
      sourceVersion: 32,
      save: JSON.parse('{"v":32,"__proto__":{"polluted":true}}') as unknown
    }),
    ContractValidationError
  );
});
