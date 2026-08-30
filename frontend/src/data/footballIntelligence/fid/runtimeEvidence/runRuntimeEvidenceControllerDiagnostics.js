import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import process from "node:process";
import { createRuntimeEvidenceControllerFixture, REF_V1_5_SPRINT_17C_FIXTURE_SCENARIOS } from "./runtimeEvidenceV1_5Fixtures.js";
import { runRuntimeEvidenceController, RuntimeEvidenceControllerError } from "./runtimeEvidenceController.js";

const cryptoProvider = globalThis.crypto ?? webcrypto;
const runFixture = async (options) => { const fixture = await createRuntimeEvidenceControllerFixture(options, cryptoProvider); return { fixture, result: await runRuntimeEvidenceController(fixture.invocation, fixture.dependencies) }; };

async function run() {
  let checks = 0; const check = (condition, message) => { checks += 1; assert(condition, message); };
  const success = await runFixture({ name: "success" });
  check(success.result.controllerStatus === "COMPLETED_WITH_RESULT", "valid invocation failed");
  check(success.fixture.dependencies.transport.callCount === 1, "transport not called exactly once");
  check(success.result.mandatoryStop && !success.result.retryPerformed, "mandatory stop/no retry absent");
  check(success.result.modeledAuthorizationState === "CONSUMED", "local single-use consumption not modeled");
  check(success.fixture.invocation.authorization.state === "ACTIVE_UNCONSUMED", "source authorization mutated");
  check(success.result.operationalSuccess === null && success.result.finalConclusion === null, "result overstated");
  check(success.result.evidencePackage.validation.valid && Object.isFrozen(success.result), "package/output invalid or mutable");
  check(success.result.custodyAssessment.continuityState === "GAPPED", "in-memory custody falsely continuous");
  check(success.result.unresolvedGaps.includes("EXTERNAL_RECEIPT_UNOBSERVABLE"), "external gap discarded");
  check(success.result.unresolvedGaps.includes("TRANSACTION_ATTRIBUTION_INSUFFICIENT"), "transaction gap discarded");
  check(success.result.observations.every((item) => item.sourceClassification !== "DATABASE_OBSERVED" && item.sourceClassification !== "RUNTIME_OBSERVED"), "fake evidence mislabeled actual");
  check(success.result.events.at(-1).type === "MANDATORY_STOP", "stop event absent");
  check(new Set(success.result.events.map((item) => item.eventRef)).size === success.result.events.length, "duplicate event identity");
  check(new Set(success.result.events.map((item) => item.sequencePosition)).size === success.result.events.length, "duplicate sequence");
  const repeat = await runFixture({ name: "success" });
  check(repeat.result.evidencePackage.contentIdentity === success.result.evidencePackage.contentIdentity, "package identity nondeterministic");

  const mismatch = await runFixture({ name: "mismatch", digestMismatch: true });
  check(mismatch.result.controllerStatus === "BLOCKED" && mismatch.fixture.dependencies.transport.callCount === 0, "digest mismatch did not block");
  const consumed = await runFixture({ name: "consumed", authorizationState: "CONSUMED" });
  check(consumed.result.controllerStatus === "BLOCKED" && consumed.fixture.dependencies.transport.callCount === 0, "consumed authority did not block");
  for (const state of ["EXPIRED", "REVOKED", "UNRESOLVED"]) { const blocked = await runFixture({ name: state.toLowerCase(), authorizationState: state }); check(blocked.result.controllerStatus === "BLOCKED", `${state} authority accepted`); }
  const before = await runFixture({ name: "cancel-before", cancellationAt: "BEFORE_TRANSPORT" });
  check(before.result.controllerStatus === "CANCELLED_BEFORE_TRANSPORT" && before.fixture.dependencies.transport.callCount === 0, "pre-transport cancellation failed");
  for (const outcome of ["TIMEOUT", "INTERRUPTION", "DISCONNECT", "MISSING"]) { const uncertain = await runFixture({ name: outcome.toLowerCase(), outcome }); check(uncertain.result.controllerStatus === "COMPLETED_WITH_UNCERTAINTY" && uncertain.result.operationalSuccess === null, `${outcome} uncertainty lost`); check(uncertain.fixture.dependencies.transport.callCount === 1, `${outcome} retried`); }
  const failure = await runFixture({ name: "failure", outcome: "FAILURE" });
  check(failure.result.controllerStatus === "COMPLETED_WITH_TRANSPORT_FAILURE" && failure.result.modeledAuthorizationState === "CONSUMED", "failure/consumption conflated");
  const contradictionObservation = { observationRef: "ref:observation:contradictory-stage", subjectRef: "ref:subject:synthetic-stage", layerRef: "ref:layer:synthetic-fixture", pointRef: "ref:point:stage", sourceRef: "ref:source:configured-fixture", sourceClassification: "DECLARED", observationState: "CONTRADICTORY", orderState: "OBSERVED", provenanceRef: "ref:provenance:fixture", fidelity: { level: "DECLARED" }, completeness: { claimScope: true }, bindings: { stageRef: "ref:stage:synthetic" }, correlationRefs: [], uncertaintyRefs: [], contradictionRefs: ["ref:contradiction:synthetic"], boundedDetail: "SYNTHETIC_FIXTURE_DECLARATION", extensions: {} };
  const contradictory = await runFixture({ name: "contradiction", transport: { observations: [contradictionObservation] } });
  check(contradictory.result.observations.some((item) => item.observationState === "CONTRADICTORY"), "contradiction discarded");
  const sourceSnapshot = JSON.stringify(contradictory.fixture.invocation); await runRuntimeEvidenceController(contradictory.fixture.invocation, (await createRuntimeEvidenceControllerFixture({ name: "contradiction" }, cryptoProvider)).dependencies); check(JSON.stringify(contradictory.fixture.invocation) === sourceSnapshot, "input mutated");
  const missingTransportFixture = await createRuntimeEvidenceControllerFixture({ name: "missing-transport" }, cryptoProvider); const missingTransport = await runRuntimeEvidenceController(missingTransportFixture.invocation, { ...missingTransportFixture.dependencies, transport: null }); check(missingTransport.controllerStatus === "BLOCKED", "missing transport accepted");
  const invalidManifestFixture = await createRuntimeEvidenceControllerFixture({ name: "invalid-manifest" }, cryptoProvider); const invalidManifest = await runRuntimeEvidenceController({ ...invalidManifestFixture.invocation, manifest: { ...invalidManifestFixture.invocation.manifest, validation: { valid: false } } }, invalidManifestFixture.dependencies); check(invalidManifest.controllerStatus === "BLOCKED", "invalid manifest accepted");
  const secretFixture = await createRuntimeEvidenceControllerFixture({ name: "secret" }, cryptoProvider); await assert.rejects(() => runRuntimeEvidenceController({ ...secretFixture.invocation, apiKey: "synthetic-but-prohibited" }, secretFixture.dependencies), (error) => error instanceof RuntimeEvidenceControllerError && error.code === "SENSITIVE_INPUT_PROHIBITED"); checks += 1;
  check(REF_V1_5_SPRINT_17C_FIXTURE_SCENARIOS.length === 9, "Sprint 17C fixture matrix incomplete");
  check(!JSON.stringify(success.result).match(/operationalSuccess":true|finalConclusion":"|DATABASE_OBSERVED|RUNTIME_OBSERVED/), "false runtime conclusion found");
  console.log(JSON.stringify({ status: "RUNTIME_EVIDENCE_FRAMEWORK_V1_LOCAL_CONTROLLER_DIAGNOSTICS_PASSED", checks, fixtureScenarios: REF_V1_5_SPRINT_17C_FIXTURE_SCENARIOS.length, transportCalls: success.fixture.dependencies.transport.callCount, retryPerformed: false, sqlExecuted: false, databaseConnected: false, networkAccessed: false, filesystemEvidencePersisted: false, processSpawned: false, authorizationCreated: false, governedAuthorizationConsumed: false, externalRuntimeOperationOccurred: false }));
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
