import { deepFreeze } from "./contractSupport.js";

export const REF_V1_6_WITNESS_VERSION = "1.0.0";
export const RUNTIME_WITNESS_STATUSES = Object.freeze(["READY", "ACCEPTED", "OBSERVING", "COMPLETED", "REJECTED", "BLOCKED", "FAILED", "INTERRUPTED", "TIMED_OUT", "DISCONNECTED", "PARTIAL", "UNRESOLVED", "UNOBSERVABLE", "CONTRADICTORY"]);
export const WITNESS_REFERENCE_STATES = Object.freeze(["PRESENT", "ABSENT", "UNOBSERVABLE", "INSUFFICIENT", "CONTRADICTORY"]);
export const WITNESS_STAGE_STATES = Object.freeze(["PLANNED", "STARTED", "COMPLETED", "FAILED", "SKIPPED", "BLOCKED", "UNOBSERVABLE", "UNRESOLVED", "CONTRADICTORY"]);
export const TRANSACTION_OUTCOMES = Object.freeze(["NOT_STARTED", "STARTED", "ACTIVE", "ROLLBACK_REQUESTED", "ROLLBACK_OBSERVED", "COMMIT_REQUESTED", "COMMIT_OBSERVED", "FAILED", "ABORTED", "UNKNOWN", "DISCONNECTED", "CONTRADICTORY"]);
const prohibited = /(password|passwd|credential|secret|token|api_?key|private_?key|connection_?string|authorization_?header|cookie|raw_?environment|environment_?dump|sql)/i;
const required = ["witnessRequestRef", "manifestRef", "executionPlanRef", "observationPlanRef", "authorizationRef", "operationRef", "executionRef", "attemptRef"];

function inspect(value, path = "$", seen = new Set()) {
  const errors = [];
  if (typeof value === "function") return [{ code: "EXECUTABLE_WITNESS_INPUT_PROHIBITED", path }];
  if (!value || typeof value !== "object" || seen.has(value)) return errors;
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    if (prohibited.test(key)) errors.push({ code: "SENSITIVE_WITNESS_INPUT_PROHIBITED", path: `${path}.${key}` });
    errors.push(...inspect(child, `${path}.${key}`, seen));
  }
  return errors;
}

export function createRuntimeWitnessRequest(input = {}) {
  const errors = inspect(input);
  for (const key of required) if (typeof input[key] !== "string" || !input[key]) errors.push({ code: "REQUIRED_REFERENCE_MISSING", path: `$.${key}` });
  if (!Array.isArray(input.requiredObservations) || input.requiredObservations.length === 0) errors.push({ code: "OBSERVATION_REQUIREMENTS_MISSING", path: "$.requiredObservations" });
  if (!["NONE", "EXPLICIT_ROLLBACK", "EXPLICIT_COMMIT"].includes(input.transactionPolicy)) errors.push({ code: "UNSUPPORTED_TRANSACTION_POLICY", path: "$.transactionPolicy" });
  const result = { model: "RuntimeWitnessRequest", modelVersion: REF_V1_6_WITNESS_VERSION, ...input, expectedStages: [...(input.expectedStages ?? [])], requiredObservations: [...(input.requiredObservations ?? [])], permittedWitnessScope: [...(input.permittedWitnessScope ?? [])], prohibitedWitnessBehavior: [...(input.prohibitedWitnessBehavior ?? [])], extensions: { ...(input.extensions ?? {}) }, validation: { valid: errors.length === 0, errors } };
  return deepFreeze(result);
}

export function createRuntimeWitnessResult(input = {}) {
  const errors = [];
  if (!RUNTIME_WITNESS_STATUSES.includes(input.witnessStatus)) errors.push({ code: "INVALID_WITNESS_STATUS", path: "$.witnessStatus" });
  for (const [name, value] of [["session", input.session], ["transaction", input.transaction]]) if (!value || !WITNESS_REFERENCE_STATES.includes(value.state) || (value.state === "PRESENT" && typeof value.reference !== "string")) errors.push({ code: "INVALID_REFERENCE_DECLARATION", path: `$.${name}` });
  if (!TRANSACTION_OUTCOMES.includes(input.transactionOutcome?.state)) errors.push({ code: "INVALID_TRANSACTION_OUTCOME", path: "$.transactionOutcome" });
  const result = { model: "RuntimeWitnessResult", modelVersion: REF_V1_6_WITNESS_VERSION, witnessRequestRef: input.witnessRequestRef ?? null, witnessIdentity: input.witnessIdentity ?? null, witnessType: input.witnessType ?? null, witnessStatus: input.witnessStatus, acceptanceState: input.acceptanceState ?? "UNRESOLVED", readinessState: input.readinessState ?? "UNRESOLVED", executionRef: input.executionRef ?? null, attemptRef: input.attemptRef ?? null, session: input.session, transaction: input.transaction, stageObservations: [...(input.stageObservations ?? [])], stateObservations: [...(input.stateObservations ?? [])], resultObservations: [...(input.resultObservations ?? [])], errorObservations: [...(input.errorObservations ?? [])], uncertaintyObservations: [...(input.uncertaintyObservations ?? [])], chronology: [...(input.chronology ?? [])], relationships: [...(input.relationships ?? [])], transactionOutcome: input.transactionOutcome, witnessCompleteness: input.witnessCompleteness ?? "UNRESOLVED", witnessFidelity: input.witnessFidelity ?? "SYNTHETIC_FIXTURE", residualGaps: [...(input.residualGaps ?? [])], contradictions: [...(input.contradictions ?? [])], limitations: [...(input.limitations ?? [])], mandatoryStop: input.mandatoryStop !== false, governedOperationCompleted: input.governedOperationCompleted ?? null, returnedResultCaptured: input.returnedResultCaptured ?? false, evidenceSufficient: input.evidenceSufficient ?? false, operationalSuccessEstablished: false, extensions: { ...(input.extensions ?? {}) }, validation: { valid: errors.length === 0, errors } };
  return deepFreeze(result);
}

export function createDeterministicFakeRuntimeWitness(configuration = {}) {
  let calls = 0; const requests = [];
  return Object.freeze({
    get callCount() { return calls; },
    get requests() { return Object.freeze([...requests]); },
    async observeGovernedExecution(request) {
      calls += 1; requests.push(request);
      if (!request?.validation?.valid) throw new TypeError("INVALID_WITNESS_REQUEST");
      if (configuration.throwFailure) throw new TypeError("DETERMINISTIC_FAKE_WITNESS_FAILURE");
      return createRuntimeWitnessResult({ witnessRequestRef: request.witnessRequestRef, witnessIdentity: configuration.witnessIdentity ?? "ref:witness:deterministic-fake", witnessType: "DETERMINISTIC_IN_MEMORY_FAKE", witnessStatus: configuration.witnessStatus ?? "COMPLETED", acceptanceState: "ACCEPTED", readinessState: "READY", executionRef: request.executionRef, attemptRef: request.attemptRef, session: configuration.session ?? { state: "UNOBSERVABLE", reference: null }, transaction: configuration.transaction ?? { state: "UNOBSERVABLE", reference: null }, stageObservations: configuration.stageObservations, stateObservations: configuration.stateObservations, resultObservations: configuration.resultObservations, errorObservations: configuration.errorObservations, uncertaintyObservations: configuration.uncertaintyObservations, chronology: configuration.chronology, relationships: configuration.relationships, transactionOutcome: configuration.transactionOutcome ?? { state: "UNKNOWN", requested: null, observed: null }, witnessCompleteness: configuration.witnessCompleteness ?? "PARTIAL", residualGaps: configuration.residualGaps ?? ["ACTUAL_DATABASE_OBSERVATION_UNAVAILABLE"], contradictions: configuration.contradictions, limitations: ["SYNTHETIC_FIXTURE_ONLY", "NOT_POSTGRESQL_EVIDENCE", ...(configuration.limitations ?? [])], returnedResultCaptured: configuration.returnedResultCaptured, extensions: { fixtureOnly: true, actualRuntimeEvidence: false, actualDatabaseEvidence: false, retryCount: 0 } });
    },
  });
}
