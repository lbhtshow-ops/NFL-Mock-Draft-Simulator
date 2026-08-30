import { createProspectIdentifierPersistenceTransactionResult, createProspectIdentifierPersistenceTransactionFailure } from "../../../../src/data/footballIntelligence/fid/prospectIntake/ProspectIdentifierPersistenceTransactionContracts.js";
import { validateProspectIdentifierPersistenceTransactionHandoffV1_1 } from "../runtime/persistence-handoff-v1_2.js";

export function createNonPersistingPersistenceTransactionDoubleV1_1(mode = "SUCCESS") {
  let calls = 0;
  let observation = null;
  const implementation = Object.freeze({ portId: "CANONICAL_PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_PORT", portVersion: "1.1.0", databaseBound: false, productionApproved: false, async handoff(request) {
    const validation = validateProspectIdentifierPersistenceTransactionHandoffV1_1(request);
    if (!validation.valid) return Object.freeze({ state: "REJECTED", category: "INVALID_REQUEST" });
    calls += 1;
    observation = Object.freeze({ transactionRequestComplete: true, candidatePresent: true, candidateValueRedacted: true, requestRefPresent: Boolean(request.requestId), operationRefPresent: Boolean(request.operationId), authorizationRefPresent: Boolean(request.authorizationRef), generationReferencesPresent: Boolean(request.generationInvocationRef && request.generationResultRef), attemptBindingPresent: Boolean(request.attemptNumber && request.attemptPolicyRef), policyBindingPresent: request.expectedPolicyRefs.length >= 2, auditBindingPresent: request.auditRefs.length > 0, persistenceOccurred: false });
    const base = { requestRef: request.requestId, operationRef: request.operationId, authorizationRef: request.authorizationRef, identifierLayer: request.identifierLayer, namespace: request.namespace, attemptRef: `attempt:${request.attemptNumber}`, candidateRef: null, identityCreated: false, recordCreated: false, persisted: false };
    if (mode === "SUCCESS") return createProspectIdentifierPersistenceTransactionResult({ ...base, status: "IDENTIFIER_RESERVED_AND_RECORDED", transactionStatus: "SIMULATED_NOT_EXECUTED", commitClassification: "SIMULATED", idempotencyClassification: "NEW", collisionChecked: true, uniquenessConfirmedAtCommit: false, reserved: false, issued: false, ledgerWritten: false });
    if (mode === "REPLAY") return createProspectIdentifierPersistenceTransactionResult({ ...base, status: "IDENTIFIER_IDEMPOTENT_REPLAY", transactionStatus: "SIMULATED_NOT_EXECUTED", commitClassification: "SIMULATED", idempotencyClassification: "MATCHING_REPLAY" });
    if (mode === "COLLISION") return createProspectIdentifierPersistenceTransactionResult({ ...base, status: "IDENTIFIER_COLLISION_DETECTED", transactionStatus: "SIMULATED_NOT_EXECUTED", commitClassification: "NOT_COMMITTED", idempotencyClassification: "NEW", collisionChecked: true });
    if (mode === "UNKNOWN_COMMIT" || mode === "RECOVERY_REQUIRED") return Object.freeze({ ...createProspectIdentifierPersistenceTransactionResult({ ...base, status: "IDENTIFIER_TRANSACTION_RECOVERY_REQUIRED", transactionStatus: "UNKNOWN", commitClassification: "UNKNOWN", idempotencyClassification: "RECOVERY_REQUIRED" }), state: "RECOVERY_REQUIRED" });
    const category = mode === "IDEMPOTENCY_CONFLICT" ? "IDEMPOTENCY_CONFLICT" : mode === "ROLLBACK" ? "TRANSACTION_ROLLED_BACK" : mode === "RESERVATION_FAILURE" ? "RESERVATION_CONFLICT" : mode === "LEDGER_FAILURE" ? "LEDGER_CONFLICT" : "TRANSACTION_REJECTED";
    return Object.freeze({ state: "FAILED", category, failure: createProspectIdentifierPersistenceTransactionFailure({ failureId: "sanitized-simulated-failure", category, requestRef: request.requestId, recoveryRequired: false, retryable: false }) });
  } });
  return Object.freeze({ ...implementation, getCallCount: () => calls, getSanitizedObservation: () => observation, liveSupabaseCalls: 0, databaseOperations: 0, persistenceOperations: 0, reservations: 0, issuances: 0, ledgerWrites: 0, identityCreations: 0, recordCreations: 0 });
}

export default Object.freeze({ createNonPersistingPersistenceTransactionDoubleV1_1 });
