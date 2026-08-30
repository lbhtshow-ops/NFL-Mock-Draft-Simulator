import { sha256Hex, utf8Bytes } from "./canonicalIdentity.js";
import { createRuntimeWitnessRequest } from "./runtimeWitness.js";
import { createPostgresAtomicOperationProfile } from "./postgresAtomicOperationProfile.js";
import { createDeterministicFakePostgresDriver } from "./deterministicFakePostgresDriver.js";
import { createPostgresTransactionWitnessAdapter } from "./postgresTransactionWitnessAdapter.js";

export const REF_V1_7_SPRINT_17C_SYNTHETIC_SCENARIOS = Object.freeze([
  "ONE_CONNECTION_ONE_TRANSACTION_ORDERED_STAGES_ROLLBACK_OBSERVED", "PAYLOAD_DIGEST_MISMATCH_BLOCKS_CONNECTION", "CONNECTION_IDENTITY_CHANGE_REJECTED", "BEGIN_NOT_ACKNOWLEDGED", "FIRST_STAGE_COMPLETES_SECOND_FAILS", "DIRECT_OBSERVATION_UNRESOLVED", "CHANGED_DIRECT_STATE_EFFECTIVE_STATE_UNRESOLVED", "RESULT_TRANSACTION_ATTRIBUTION_INSUFFICIENT", "ROLLBACK_REQUESTED_AND_OBSERVED", "ROLLBACK_ACKNOWLEDGEMENT_ABSENT", "DISCONNECT_AFTER_FIRST_SUBMISSION", "DISCONNECT_BEFORE_OBSERVATION", "DISCONNECT_AFTER_ROLLBACK_REQUEST", "CANCELLATION_BEFORE_CONNECTION", "CANCELLATION_AFTER_SUBMISSION", "CONTRADICTORY_ROLLBACK_AND_COMMIT", "OUTPUT_LIMIT_REJECTED", "SECOND_CONNECTION_REJECTED", "ONE_ADAPTER_INVOCATION_ZERO_STAGE_RETRY", "PACKAGE_WITHOUT_ROOT_CAUSE", "SYNTHETIC_NOT_ACTUAL_DATABASE_EVIDENCE", "HISTORICAL_CONSUMED_AUTHORITY_INACTIVE",
]);

export async function createPostgresAdapterFixture({ name = "success", driverConfiguration = {}, digestMismatch = false, cancellation = null } = {}, cryptoProvider = globalThis.crypto) {
  const artifactText = `synthetic-artifact:${name}`;
  const stageInputs = [
    ["before-gate", "BOUNDED_OBSERVATION"], ["governed-acl-first", "GOVERNED_OPERATION"], ["governed-acl-second", "GOVERNED_OPERATION"], ["direct-state", "BOUNDED_OBSERVATION"], ["effective-state", "BOUNDED_OBSERVATION"],
  ];
  const stages = [];
  for (const [stageRef, stageType] of stageInputs) { const payloadText = `opaque-pre-reviewed-fixture:${stageRef}`; stages.push({ stageRef: `ref:stage:${name}:${stageRef}`, stageType, sequence: stages.length + 1, payloadText, payloadDigest: await sha256Hex(utf8Bytes(payloadText), cryptoProvider) }); }
  if (digestMismatch) stages[0].payloadDigest = "0".repeat(64);
  const refs = { manifestRef: `ref:manifest:${name}`, executionPlanRef: `ref:execution-plan:${name}`, observationPlanRef: `ref:observation-plan:${name}`, authorizationRef: `ref:authorization:historical-consumed:${name}`, executionRef: `ref:execution:${name}`, attemptRef: `ref:attempt:${name}` };
  const profile = createPostgresAtomicOperationProfile({ profileRef: `ref:profile:${name}`, ...refs, artifactRef: `ref:artifact:${name}`, artifactDigest: await sha256Hex(utf8Bytes(artifactText), cryptoProvider), targetRef: `ref:target:${name}`, environmentRef: `ref:environment:${name}`, correlationRef: `ref:correlation:${name}`, transactionPolicy: "ROLLBACK_REQUIRED", stages, outputPolicy: { maximumBytes: 1024, maximumRows: 8 }, retryAllowed: false, interactiveContinuation: false, stopConditions: ["ANY_FAILURE", "ANY_UNCERTAINTY"], prohibitedActions: ["RETRY", "FAILOVER", "AUTHORIZATION_CREATION", "REMEDIATION"], extensions: { fixtureOnly: true, historicalAuthorityInactive: true, newAuthorizationRequired: true } });
  const request = createRuntimeWitnessRequest({ witnessRequestRef: `ref:witness-request:${name}`, ...refs, operationRef: `ref:operation:${name}`, transactionPolicy: "EXPLICIT_ROLLBACK", expectedStages: stages.map((stage) => stage.stageRef), requiredObservations: ["SESSION_BINDING", "TRANSACTION_BINDING", "STAGE_COMPLETION", "ROLLBACK_OUTCOME"], permittedWitnessScope: ["SYNTHETIC_FIXTURE_ONLY"], prohibitedWitnessBehavior: ["RETRY", "CREATE_AUTHORIZATION", "REMEDIATE"], extensions: { fixtureOnly: true, artifactText, atomicOperationProfile: profile } });
  const driver = createDeterministicFakePostgresDriver(driverConfiguration);
  const witness = createPostgresTransactionWitnessAdapter({ driver, cryptoProvider, cancellation });
  return { request, profile, driver, witness, artifactText };
}
