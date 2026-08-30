import { createProspectIdentifierPersistenceTransactionRequest } from "../../../../src/data/footballIntelligence/fid/prospectIntake/ProspectIdentifierPersistenceTransactionContracts.js";
import { PROSPECT_IDENTIFIER_RUNTIME_GOVERNANCE_FIELD_SOURCE_MAP } from "../../../../src/data/footballIntelligence/fid/prospectIntake/CanonicalProspectIdentifierRuntimeGovernanceBindingActivationAmendment.js";

export const CANONICAL_PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_PORT_V1_1 = Object.freeze({ portId: "CANONICAL_PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_PORT", portVersion: "1.1.0", status: "IMPLEMENTED_NON_PRODUCTION_NOT_DATABASE_BOUND", requestContract: "PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_REQUEST@1.0.0", sourceMapFieldCount: 20, handoffShape: "DIRECT_VALIDATED_TRANSACTION_REQUEST", legacyThreeFieldAccepted: false, databaseBound: false, automaticRetry: false, productionApproved: false });
export const CANONICAL_PROSPECT_IDENTIFIER_TRUSTED_RUNTIME_HANDLER_V1_2 = Object.freeze({ handlerId: "CANONICAL_PROSPECT_IDENTIFIER_TRUSTED_RUNTIME_HANDLER", handlerVersion: "1.2.0", transactionPortVersion: "1.1.0", governanceBindingVersion: "1.1.0", generationResultVersion: "1.2.0", productionApproved: false });

const candidatePattern = /^(person|player|prospect|prospect-profile):[A-Za-z0-9_-]{22}$/;
const prohibited = /rawEntropy|encodedEntropy|randomBytes|seed|jwt|token|credential|secret|databaseClient|supabaseClient|databaseHandle|callback|retryInstruction/i;
const clientGovernance = /candidate|identifierLayer|namespace|strategy|convention|generatorPort|adapterRef|providerRef|attempt|policyRef|actorRef|generationInvocationRef|generationResultRef|outputSize|encodingPolicy/i;
const hasProhibited = (value) => value && typeof value === "object" && Object.entries(value).some(([key, child]) => prohibited.test(key) || typeof child === "function" || (child && typeof child === "object" && hasProhibited(child)));
const hasClientGovernance = (value) => value && typeof value === "object" && Object.keys(value).some((key) => clientGovernance.test(key));
const snapshot = (value) => JSON.stringify(value);

export function validateProspectIdentifierPersistenceTransactionHandoffV1_1(request) {
  const errors = [];
  if (!request || request.contractId !== "PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_REQUEST" || request.contractVersion !== "1.0.0") errors.push({ code: "TRANSACTION_REQUEST_CONTRACT_MISMATCH" });
  if (!request?.validation?.valid) errors.push({ code: "TRANSACTION_REQUEST_INVALID" });
  if (hasProhibited(request)) errors.push({ code: "PROHIBITED_TRANSACTION_FIELD" });
  if (request?.environment === "PRODUCTION" || !["TEST", "DEVELOPMENT"].includes(request?.environment)) errors.push({ code: "UNSUPPORTED_ENVIRONMENT" });
  if (!candidatePattern.test(request?.candidateIdentifier ?? "") || !request.candidateIdentifier.startsWith(`${request.namespace}:`)) errors.push({ code: "CANDIDATE_BINDING_INVALID" });
  if (!Number.isInteger(request?.attemptNumber) || request.attemptNumber < 1) errors.push({ code: "ATTEMPT_INVALID" });
  if (!Array.isArray(request?.expectedPolicyRefs) || request.expectedPolicyRefs.length < 2) errors.push({ code: "POLICY_BINDING_INCOMPLETE" });
  if (!Array.isArray(request?.auditRefs) || request.auditRefs.length === 0) errors.push({ code: "AUDIT_BINDING_INCOMPLETE" });
  return Object.freeze({ valid: !errors.length, errors: Object.freeze(errors), portId: CANONICAL_PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_PORT_V1_1.portId, portVersion: "1.1.0", candidatePresent: Boolean(request?.candidateIdentifier), candidateValueRedacted: true });
}

export function buildProspectIdentifierPersistenceTransactionRequestV1_1(state) {
  if (!state || hasProhibited(state) || state.governanceBinding?.validation?.valid !== true || state.generationResult?.validation?.valid !== true || state.authorizationResult?.validation?.valid !== true || state.generationInvocation?.validation?.valid !== true || state.issuerContext?.attemptContext?.validation?.valid !== true) return Object.freeze({ ok: false, category: "GOVERNANCE_BINDING_INVALID", candidatePresent: false });
  if (PROSPECT_IDENTIFIER_RUNTIME_GOVERNANCE_FIELD_SOURCE_MAP.length !== 20 || new Set(PROSPECT_IDENTIFIER_RUNTIME_GOVERNANCE_FIELD_SOURCE_MAP.map((item) => item.field)).size !== 20) return Object.freeze({ ok: false, category: "FIELD_SOURCE_MAP_INVALID", candidatePresent: false });
  const before = snapshot(state);
  const result = state.generationResult;
  const authorization = state.authorizationResult;
  const invocation = state.generationInvocation;
  const attempt = state.issuerContext.attemptContext;
  const request = createProspectIdentifierPersistenceTransactionRequest({ requestId: authorization.requestRef, operationId: authorization.operationRef, batchId: state.issuerContext.batchRef ?? null, idempotencyRef: state.issuerContext.idempotencyRef, authorizationRef: authorization.authorizationRef, generationInvocationRef: invocation.invocationRef, generationResultRef: result.generationResultRef, candidateIdentifier: result.generatedCandidate, identifierLayer: result.identifierLayer, namespace: result.namespace, strategyRef: result.strategyRef, conventionRef: result.conventionRef, generatorPortRef: result.generatorPortRef, adapterRef: result.adapterRef, providerRef: result.providerRef, attemptNumber: attempt.attemptNumber, attemptPolicyRef: attempt.attemptPolicyRef, environment: result.environment, actorRef: authorization.actorRef, expectedPolicyRefs: [result.outputSizePolicyRef, result.encodingPolicyRef], auditRefs: [...(state.issuerContext.auditRefs ?? []), ...(authorization.auditRefs ?? [])] });
  const handoffValidation = validateProspectIdentifierPersistenceTransactionHandoffV1_1(request);
  if (snapshot(state) !== before) return Object.freeze({ ok: false, category: "CALLER_INPUT_MUTATED", candidatePresent: false });
  return Object.freeze({ ok: handoffValidation.valid, category: handoffValidation.valid ? null : "TRANSACTION_REQUEST_INVALID", transactionRequest: handoffValidation.valid ? request : null, validation: handoffValidation, candidatePresent: Boolean(result.generatedCandidate), candidateValueRedacted: true });
}

export function createProspectIdentifierPersistenceTransactionPortV1_1(implementation) {
  if (!implementation || typeof implementation.handoff !== "function" || implementation.portId !== CANONICAL_PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_PORT_V1_1.portId || implementation.portVersion !== "1.1.0" || implementation.productionApproved === true || implementation.databaseBound === true) return Object.freeze({ valid: false, errors: Object.freeze(["INCOMPATIBLE_TRANSACTION_PORT"]), handoff: null });
  return Object.freeze({ valid: true, portId: implementation.portId, portVersion: implementation.portVersion, databaseBound: false, productionApproved: false, async handoff(request) { const validation = validateProspectIdentifierPersistenceTransactionHandoffV1_1(request); if (!validation.valid) return Object.freeze({ state: "REJECTED", category: "INVALID_REQUEST", validation }); return implementation.handoff(request); } });
}

const runtimeResponse = (status, outcome, details = {}) => Object.freeze({ status, body: Object.freeze({ outcome, requestRef: details.requestRef ?? null, operationRef: details.operationRef ?? null, candidatePresent: details.candidatePresent === true, candidateValueRedacted: details.candidatePresent === true, transactionPortInvoked: details.transactionPortInvoked === true, collisionChecked: details.collisionChecked === true, reserved: details.reserved === true, issued: details.issued === true, ledgerWritten: details.ledgerWritten === true, persisted: details.persisted === true, recoveryRequired: details.recoveryRequired === true, failureCategory: details.failureCategory ?? null }) });

export function createTrustedRuntimeHandlerV1_2(dependencies, configuration = {}) {
  return async function handle(request) {
    if (configuration.runtimeTarget !== "SERVER") return runtimeResponse(400, "RUNTIME_REQUEST_REJECTED", { failureCategory: "BROWSER_RUNTIME_PROHIBITED" });
    if (request?.method !== "POST" || request?.contentType !== "application/json" || !request.body || request.body.environment === "PRODUCTION" || !["TEST", "DEVELOPMENT"].includes(request.body.environment) || hasProhibited(request.body) || hasClientGovernance(request.body)) return runtimeResponse(400, "RUNTIME_REQUEST_REJECTED", { failureCategory: "INVALID_REQUEST" });
    const auth = await dependencies.authenticationVerifier(request.authenticationState);
    if (!auth?.ok) return runtimeResponse(401, "RUNTIME_REQUEST_REJECTED", { failureCategory: "AUTHENTICATION_FAILURE" });
    const authorization = await dependencies.authorizationVerifier(request.body.authorizationRef, { actorRef: auth.actorRef, requestRef: request.body.requestId, operationRef: request.body.operationId, environment: request.body.environment });
    if (!authorization?.validation?.valid) return runtimeResponse(403, "RUNTIME_REQUEST_REJECTED", { failureCategory: "AUTHORIZATION_FAILURE" });
    const replay = dependencies.idempotency.check(request.body.idempotencyKeyRef, request.body.operationId);
    if (replay.state === "MATCHING_COMPLETED") return runtimeResponse(200, "RUNTIME_OPERATION_COMPLETED", { requestRef: request.body.requestId, operationRef: request.body.operationId, ...replay.redactedProperties });
    if (replay.state !== "NEW") return runtimeResponse(409, "RUNTIME_REQUEST_REJECTED", { failureCategory: "IDEMPOTENCY_CONFLICT" });
    const issuerContext = dependencies.issuerContextProvider(request.body.operationId);
    if (!issuerContext) return runtimeResponse(422, "RUNTIME_REQUEST_REJECTED", { failureCategory: "ISSUER_CONTEXT_INVALID" });
    const generated = await dependencies.generator({ issuerContext, authorizationResult: authorization });
    if (!generated?.generationInvocation?.validation?.valid || !generated?.generationResult?.validation?.valid || !generated?.generationResult?.generatedCandidate) return runtimeResponse(422, "RUNTIME_OPERATION_FAILED", { failureCategory: "GENERATION_FAILED" });
    if (!dependencies.structuralValidator(generated.generationResult.generatedCandidate, authorization.namespace)) return runtimeResponse(422, "RUNTIME_OPERATION_FAILED", { failureCategory: "STRUCTURAL_VALIDATION_FAILURE" });
    const binding = dependencies.governanceBinder({ authenticationResult: auth, authorizationResult: authorization, generationInvocation: generated.generationInvocation, generationResult: generated.generationResult });
    const built = buildProspectIdentifierPersistenceTransactionRequestV1_1({ governanceBinding: binding, generationResult: generated.generationResult, authorizationResult: authorization, generationInvocation: generated.generationInvocation, issuerContext });
    if (!built.ok) return runtimeResponse(422, "RUNTIME_OPERATION_FAILED", { failureCategory: built.category });
    const transaction = await dependencies.transactionPort.handoff(built.transactionRequest);
    if (transaction.state === "UNCERTAIN" || transaction.state === "RECOVERY_REQUIRED" || transaction.status === "IDENTIFIER_TRANSACTION_RECOVERY_REQUIRED") return runtimeResponse(503, "RUNTIME_RECOVERY_REQUIRED", { requestRef: request.body.requestId, operationRef: request.body.operationId, candidatePresent: true, transactionPortInvoked: true, recoveryRequired: true, failureCategory: "TRANSACTION_COMMIT_UNKNOWN" });
    if (transaction.state !== "ACCEPTED" && transaction.status !== "IDENTIFIER_RESERVED_AND_RECORDED" && transaction.status !== "IDENTIFIER_IDEMPOTENT_REPLAY") return runtimeResponse(409, "RUNTIME_OPERATION_FAILED", { requestRef: request.body.requestId, operationRef: request.body.operationId, candidatePresent: true, transactionPortInvoked: true, failureCategory: transaction.category ?? transaction.status ?? "TRANSACTION_FAILURE" });
    const properties = { candidatePresent: true, transactionPortInvoked: true, collisionChecked: transaction.collisionChecked === true, reserved: transaction.reserved === true, issued: transaction.issued === true, ledgerWritten: transaction.ledgerWritten === true, persisted: transaction.persisted === true };
    dependencies.idempotency.complete(request.body.idempotencyKeyRef, request.body.operationId, properties);
    return runtimeResponse(200, "RUNTIME_OPERATION_COMPLETED", { requestRef: request.body.requestId, operationRef: request.body.operationId, ...properties });
  };
}

export function createPersistenceHandoffRuntimeCompositionV1_2(input = {}) {
  const errors = [];
  if (!["TEST", "DEVELOPMENT"].includes(input.environment)) errors.push("UNSUPPORTED_ENVIRONMENT");
  if (input.runtimeTarget !== "SERVER") errors.push("BROWSER_RUNTIME_PROHIBITED");
  if (input.handlerVersion !== "1.2.0" || input.transactionPortVersion !== "1.1.0" || input.generationResultVersion !== "1.2.0" || input.governanceBindingVersion !== "1.1.0") errors.push("VERSION_MISMATCH");
  for (const name of ["authenticationVerifier", "authorizationVerifier", "idempotency", "issuerContextProvider", "generator", "governanceBinder", "structuralValidator", "transactionPort"]) if (!input[name]) errors.push(`MISSING_${name.toUpperCase()}`);
  if (input.transactionPort?.portVersion !== "1.1.0" || input.transactionPort?.databaseBound || input.transactionPort?.productionApproved) errors.push("TRANSACTION_PORT_INCOMPATIBLE");
  if (errors.length) return Object.freeze({ valid: false, errors: Object.freeze(errors), handler: null, runtimeBound: false, deployed: false });
  const dependencies = Object.freeze({ authenticationVerifier: input.authenticationVerifier, authorizationVerifier: input.authorizationVerifier, idempotency: input.idempotency, issuerContextProvider: input.issuerContextProvider, generator: input.generator, governanceBinder: input.governanceBinder, structuralValidator: input.structuralValidator, transactionPort: input.transactionPort });
  return Object.freeze({ valid: true, errors: Object.freeze([]), compositionId: "CANONICAL_PROSPECT_IDENTIFIER_PERSISTENCE_HANDOFF_COMPOSITION", compositionVersion: "1.2.0", handler: createTrustedRuntimeHandlerV1_2(dependencies, { runtimeTarget: "SERVER" }), dependencies, nonPersistingDefault: true, databaseClient: null, supabaseClient: null, operationalEndpoint: false, runtimeBound: false, deployed: false, productionApproved: false });
}

export default Object.freeze({ CANONICAL_PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_PORT_V1_1, CANONICAL_PROSPECT_IDENTIFIER_TRUSTED_RUNTIME_HANDLER_V1_2, validateProspectIdentifierPersistenceTransactionHandoffV1_1, buildProspectIdentifierPersistenceTransactionRequestV1_1, createProspectIdentifierPersistenceTransactionPortV1_1, createTrustedRuntimeHandlerV1_2, createPersistenceHandoffRuntimeCompositionV1_2 });
