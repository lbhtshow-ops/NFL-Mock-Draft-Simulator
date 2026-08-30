import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import process from "node:process";
import { runRuntimeEvidenceController } from "./runtimeEvidenceController.js";
import { createRuntimeWitnessControllerFixture, REF_V1_6_SPRINT_17C_SCENARIOS } from "./runtimeEvidenceV1_6Fixtures.js";
import { createDeterministicFakeRuntimeWitness, createRuntimeWitnessRequest } from "./runtimeWitness.js";

const cryptoProvider = globalThis.crypto ?? webcrypto;
const minimal = { witnessRequestRef: "ref:request", manifestRef: "ref:manifest", executionPlanRef: "ref:execution-plan", observationPlanRef: "ref:observation-plan", authorizationRef: "ref:inactive-authority", operationRef: "ref:operation", executionRef: "ref:execution", attemptRef: "ref:attempt", transactionPolicy: "NONE", requiredObservations: ["STAGE_STATE"] };
async function run() {
  let checks = 0; const check = (condition, message) => { checks += 1; assert(condition, message); };
  const request = createRuntimeWitnessRequest(minimal);
  check(request.validation.valid && Object.isFrozen(request), "minimal request invalid or mutable");
  for (const key of ["manifestRef", "executionRef", "authorizationRef", "requiredObservations"]) check(!createRuntimeWitnessRequest({ ...minimal, [key]: key === "requiredObservations" ? [] : undefined }).validation.valid, `${key} accepted missing`);
  check(!createRuntimeWitnessRequest({ ...minimal, transactionPolicy: "ARBITRARY" }).validation.valid, "unsupported policy accepted");
  check(!createRuntimeWitnessRequest({ ...minimal, apiKey: "prohibited" }).validation.valid, "sensitive field accepted");
  const fake = createDeterministicFakeRuntimeWitness({ session: { state: "UNOBSERVABLE", reference: null }, transaction: { state: "UNOBSERVABLE", reference: null }, witnessStatus: "DISCONNECTED", transactionOutcome: { state: "DISCONNECTED" }, stageObservations: [{ stageRef: "ref:stage:first", observationState: "PRESENT" }], uncertaintyObservations: [{ observationState: "UNRESOLVED", uncertaintyRefs: ["ref:gap:disconnect"] }] });
  const first = await fake.observeGovernedExecution(request);
  check(fake.callCount === 1 && first.witnessStatus === "DISCONNECTED", "deterministic invocation failed");
  check(Object.isFrozen(first) && first.transactionOutcome.state === "DISCONNECTED", "immutable disconnect uncertainty absent");
  const fixture = await createRuntimeWitnessControllerFixture({ name: "integration" }, cryptoProvider);
  const result = await runRuntimeEvidenceController(fixture.invocation, fixture.dependencies);
  check(result.witnessCallCount === 1 && result.transportCallCount === 1, "ports not invoked exactly once");
  check(result.mandatoryStop && !result.retryPerformed, "mandatory stop/no retry absent");
  check(result.witnessResult !== result.transportResult, "transport and witness conflated");
  check(result.observations.some((item) => item.bindings.sessionRef) && result.observations.some((item) => item.bindings.transactionRef), "bindings not mapped");
  check(result.observations.every((item) => !["DATABASE_OBSERVED", "RUNTIME_OBSERVED", "PLATFORM_ATTESTED"].includes(item.sourceClassification)), "fixture promoted to actual evidence");
  check(result.operationalSuccess === null && result.finalConclusion === null, "success or root cause manufactured");
  check(result.witnessResult.transactionOutcome.state === "ROLLBACK_REQUESTED" && result.witnessResult.transactionOutcome.observed === null, "rollback request promoted to observation");
  const missing = await runRuntimeEvidenceController(fixture.invocation, { ...fixture.dependencies, witness: null });
  check(missing.controllerStatus === "BLOCKED" && fixture.dependencies.transport.callCount === 1, "missing required witness did not block before another transport call");
  check(REF_V1_6_SPRINT_17C_SCENARIOS.length === 12, "fixture scenario matrix incomplete");
  console.log(JSON.stringify({ status: "RUNTIME_EVIDENCE_FRAMEWORK_V1_RUNTIME_WITNESS_DIAGNOSTICS_PASSED", checks, scenarios: REF_V1_6_SPRINT_17C_SCENARIOS.length, sqlExecuted: false, databaseConnected: false, networkAccessed: false, filesystemEvidencePersisted: false, processSpawnedByWitness: false, authorizationCreated: false, authorizationConsumed: false, retryPerformed: false }));
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
