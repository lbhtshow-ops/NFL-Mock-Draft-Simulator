import { deepFreeze } from "./contractSupport.js";
import { verifyArtifactByteIdentity } from "./canonicalIdentity.js";
import { assessCustodyContinuity, buildRuntimeEvidenceClaimAssessment, buildRuntimeEvidenceCustodyRecord, buildRuntimeEvidencePackage, createRuntimeEvidenceObservation, finalizeRuntimeEvidencePackage, prepareRuntimeEvidenceReviewInput } from "./evidenceModel.js";
import { createRuntimeWitnessResult } from "./runtimeWitness.js";

export const REF_V1_5_CONTROLLER_VERSION = "1.0.0";
export const REF_V1_5_AUTHORIZATION_STATES = Object.freeze(["ACTIVE_UNCONSUMED", "CONSUMED", "REJECTED", "EXPIRED", "REVOKED", "INVALID", "UNRESOLVED"]);
export const REF_V1_5_PROHIBITED_NEXT_ACTIONS = Object.freeze(["AUTO_RETRY", "REMEDIATION", "RECONCILIATION", "AUTHORIZATION_CREATION", "FINAL_OPERATIONAL_CONCLUSION", "PERSIST_EVIDENCE"]);

export class RuntimeEvidenceControllerError extends TypeError {
  constructor(code, path, message = code) { super(message); this.name = "RuntimeEvidenceControllerError"; this.code = code; this.path = path; }
}

const issue = (code, path, sourceClassification = "DECLARED") => deepFreeze({ code, path, sourceClassification });
const validContract = (value, contract) => value?.contract === contract && value?.validation?.valid === true;
const forbiddenKey = /(password|passwd|credential|secret|token|api_?key|private_?key|connection_?string|authorization_?header|cookie|raw_?environment|environment_?dump|role_?graph|sql)/i;
const prohibitedBehaviorKey = /(retry|remediat|reconcil|networkClient|databaseClient|filesystemWriter|processSpawner)/i;

function inspectInput(value, path = "$", seen = new Set()) {
  const errors = [];
  if (typeof value === "function") return [issue("EXECUTABLE_INPUT_PROHIBITED", path)];
  if (!value || typeof value !== "object" || value instanceof Uint8Array || seen.has(value)) return errors;
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (forbiddenKey.test(key)) errors.push(issue("SENSITIVE_INPUT_PROHIBITED", childPath));
    if (prohibitedBehaviorKey.test(key) && child != null && child !== false) errors.push(issue("PROHIBITED_ACTION_REQUESTED", childPath));
    errors.push(...inspectInput(child, childPath, seen));
  }
  return errors;
}

function assessInvocation(invocation, dependencies) {
  const checks = [];
  const add = (code, passed, sourceClassification, mandatory = true) => checks.push(deepFreeze({ code, passed, mandatory, sourceClassification }));
  add("INVOCATION_PRESENT", !!invocation && typeof invocation === "object", "DECLARED");
  add("MANIFEST_VALID", validContract(invocation?.manifest, "GovernedOperationEvidenceManifest"), "REPOSITORY_VERIFIABLE");
  add("EXECUTION_PLAN_VALID", validContract(invocation?.executionPlan, "RuntimeEvidenceExecutionPlan"), "REPOSITORY_VERIFIABLE");
  add("OBSERVATION_PLAN_VALID", validContract(invocation?.observationPlan, "RuntimeEvidenceObservationPlan"), "REPOSITORY_VERIFIABLE");
  add("ARTIFACT_BYTES_PRESENT", invocation?.artifactBytes instanceof Uint8Array, "LOCALLY_CALCULATED");
  add("EXPECTED_ARTIFACT_IDENTITY_PRESENT", typeof invocation?.expectedArtifact?.digest === "string" && invocation?.expectedArtifact?.algorithm === "SHA-256", "DECLARED");
  add("TARGET_DECLARATION_PRESENT", typeof invocation?.targetDeclarationRef === "string", "DECLARED");
  add("ENVIRONMENT_DECLARATION_PRESENT", typeof invocation?.environmentDeclarationRef === "string", "DECLARED");
  add("OPERATOR_DECLARATION_PRESENT", typeof invocation?.operatorDeclarationRef === "string", "OPERATOR_ATTESTED");
  add("AUTHORIZATION_REFERENCE_PRESENT", typeof invocation?.authorization?.authorizationRef === "string", "DECLARED");
  add("AUTHORIZATION_STRUCTURALLY_ELIGIBLE", invocation?.authorization?.state === "ACTIVE_UNCONSUMED" && REF_V1_5_AUTHORIZATION_STATES.includes(invocation?.authorization?.state), "DECLARED");
  add("SINGLE_ATTEMPT_POLICY", invocation?.authorization?.maximumAttempts === 1 && invocation?.authorization?.reusable === false && invocation?.authorization?.retryAuthorized === false, "DECLARED");
  add("TRANSPORT_PRESENT", typeof dependencies?.transport?.submit === "function", "REPOSITORY_VERIFIABLE");
  add("CLOCK_PRESENT", typeof dependencies?.clock?.next === "function", "REPOSITORY_VERIFIABLE");
  add("IDENTITY_PROVIDER_PRESENT", typeof dependencies?.identities?.next === "function", "REPOSITORY_VERIFIABLE");
  add("WITNESS_PRESENT_WHEN_REQUIRED", invocation?.witnessRequest == null || typeof dependencies?.witness?.observeGovernedExecution === "function", "REPOSITORY_VERIFIABLE");
  add("WITNESS_REQUEST_VALID_WHEN_REQUIRED", invocation?.witnessRequest == null || invocation.witnessRequest?.validation?.valid === true, "REPOSITORY_VERIFIABLE");
  add("NOT_CANCELLED_BEFORE_INVOCATION", dependencies?.cancellation?.isCancelled?.("INVOCATION_RECEIVED") !== true, "LOCALLY_CALCULATED");
  for (const error of inspectInput(invocation)) checks.push(deepFreeze({ code: error.code, passed: false, mandatory: true, sourceClassification: error.sourceClassification, path: error.path }));
  return deepFreeze(checks);
}

const statusFromTransport = (outcome) => ({ RESULT: "COMPLETED_WITH_RESULT", FAILURE: "COMPLETED_WITH_TRANSPORT_FAILURE", REJECTED: "TRANSPORT_REJECTED", TIMEOUT: "COMPLETED_WITH_UNCERTAINTY", INTERRUPTION: "COMPLETED_WITH_UNCERTAINTY", DISCONNECT: "COMPLETED_WITH_UNCERTAINTY", CANCELLED: "COMPLETED_WITH_UNCERTAINTY", MISSING: "COMPLETED_WITH_UNCERTAINTY" }[outcome] ?? "COMPLETED_WITH_UNCERTAINTY");

export async function runRuntimeEvidenceController(invocation, dependencies = {}) {
  const inputErrors = inspectInput({ invocation: { ...invocation, artifactBytes: undefined } });
  if (inputErrors.length) throw new RuntimeEvidenceControllerError(inputErrors[0].code, inputErrors[0].path);
  const preconditions = assessInvocation(invocation, dependencies);
  let sequence = 0;
  const events = [];
  const event = (type, detail = null) => events.push(deepFreeze({ eventRef: dependencies.identities?.next?.("event") ?? `ref:event:validation:${events.length + 1}`, type, sequencePosition: ++sequence, temporalReference: dependencies.clock?.next?.() ?? null, attemptRef: invocation?.attemptRef ?? null, detail }));
  event("INVOCATION_RECEIVED"); event("INPUT_VALIDATION_COMPLETED"); event("MANIFEST_VALIDATION_COMPLETED"); event("EXECUTION_PLAN_VALIDATION_COMPLETED"); event("OBSERVATION_PLAN_VALIDATION_COMPLETED");
  if (preconditions.some((item) => item.mandatory && !item.passed)) {
    event("PRECONDITIONS_BLOCKED", preconditions.filter((item) => !item.passed).map((item) => item.code)); event("MANDATORY_STOP");
    return deepFreeze({ model: "RuntimeEvidenceControllerResult", modelVersion: REF_V1_5_CONTROLLER_VERSION, controllerStatus: "BLOCKED", invocationRef: invocation?.invocationRef ?? null, attemptRef: null, transportCallCount: dependencies.transport?.callCount ?? 0, modeledAuthorizationState: invocation?.authorization?.state ?? "INVALID", preconditions, events, observations: [], evidencePackage: null, custodyRecords: [], claimAssessments: [], reviewReady: null, operationalSuccess: null, finalConclusion: null, retryPerformed: false, mandatoryStop: true, prohibitedNextActions: REF_V1_5_PROHIBITED_NEXT_ACTIONS, unresolvedGaps: ["TRANSPORT_NOT_INVOKED"] });
  }
  event("ARTIFACT_BYTE_VERIFICATION_STARTED");
  const artifactVerification = await verifyArtifactByteIdentity({ bytes: invocation.artifactBytes, expectedDigest: invocation.expectedArtifact.digest, artifactRef: invocation.manifest.executionArtifactRef, provenanceRef: invocation.provenanceDeclarationRef }, dependencies.cryptoProvider);
  event("ARTIFACT_BYTE_VERIFICATION_COMPLETED", artifactVerification.comparisonOutcome);
  if (artifactVerification.comparisonOutcome !== "MATCH") {
    event("PRECONDITIONS_BLOCKED", ["ARTIFACT_DIGEST_MISMATCH"]); event("MANDATORY_STOP");
    return deepFreeze({ model: "RuntimeEvidenceControllerResult", modelVersion: REF_V1_5_CONTROLLER_VERSION, controllerStatus: "BLOCKED", invocationRef: invocation.invocationRef, attemptRef: null, transportCallCount: dependencies.transport.callCount ?? 0, modeledAuthorizationState: invocation.authorization.state, preconditions: [...preconditions, { code: "ARTIFACT_DIGEST_MATCH", passed: false, mandatory: true, sourceClassification: "LOCALLY_CALCULATED" }], artifactVerification, events, observations: [], evidencePackage: null, custodyRecords: [], claimAssessments: [], reviewReady: null, operationalSuccess: null, finalConclusion: null, retryPerformed: false, mandatoryStop: true, prohibitedNextActions: REF_V1_5_PROHIBITED_NEXT_ACTIONS, unresolvedGaps: ["SUBMISSION_NOT_ATTEMPTED"] });
  }
  event("TARGET_ENVIRONMENT_DECLARATIONS_REVIEWED"); event("AUTHORIZATION_REFERENCE_STRUCTURALLY_REVIEWED"); event("PRECONDITIONS_PASSED"); event("SYNTHETIC_EXECUTION_CONTEXT_ESTABLISHED"); event("ATTEMPT_BEGAN");
  const modeledAuthorizationState = invocation.authorization.singleUse ? "CONSUMED" : invocation.authorization.state;
  if (invocation.authorization.singleUse) event("AUTHORIZATION_CONSUMPTION_MODELED_LOCALLY");
  event("SUBMISSION_PREPARED");
  if (dependencies.cancellation?.isCancelled?.("BEFORE_TRANSPORT")) {
    event("CANCELLATION_OBSERVED_BEFORE_TRANSPORT"); event("MANDATORY_STOP");
    return deepFreeze({ model: "RuntimeEvidenceControllerResult", modelVersion: REF_V1_5_CONTROLLER_VERSION, controllerStatus: "CANCELLED_BEFORE_TRANSPORT", invocationRef: invocation.invocationRef, attemptRef: invocation.attemptRef, transportCallCount: dependencies.transport.callCount ?? 0, modeledAuthorizationState, preconditions, artifactVerification, events, observations: [], evidencePackage: null, custodyRecords: [], claimAssessments: [], reviewReady: null, operationalSuccess: null, finalConclusion: null, retryPerformed: false, mandatoryStop: true, prohibitedNextActions: REF_V1_5_PROHIBITED_NEXT_ACTIONS, unresolvedGaps: ["SUBMISSION_NOT_ATTEMPTED"] });
  }
  event("FAKE_TRANSPORT_INVOKED");
  const transportResult = await dependencies.transport.submit(deepFreeze({ attemptRef: invocation.attemptRef, executionRef: invocation.executionRef, correlationRef: invocation.correlationRef, artifactRef: invocation.manifest.executionArtifactRef, artifactDigest: artifactVerification.calculatedDigest, payloadRef: invocation.payloadRef }));
  event("SUBMISSION_OBSERVATION_CAPTURED");
  for (const transportEvent of transportResult.events ?? []) event(`TRANSPORT_${transportEvent.type}`, transportEvent.detail ?? null);
  event(`TRANSPORT_${transportResult.outcome}_CAPTURED`);
  let witnessResult = null;
  if (invocation.witnessRequest) {
    event("RUNTIME_WITNESS_INVOKED");
    try {
      witnessResult = await dependencies.witness.observeGovernedExecution(invocation.witnessRequest);
      if (!witnessResult?.validation?.valid) throw new RuntimeEvidenceControllerError("MALFORMED_WITNESS_RESULT", "$.witnessResult");
    } catch (error) {
      witnessResult = createRuntimeWitnessResult({ witnessRequestRef: invocation.witnessRequest.witnessRequestRef, witnessIdentity: "ref:witness:failed", witnessType: "INJECTED_WITNESS", witnessStatus: "FAILED", session: { state: "UNOBSERVABLE", reference: null }, transaction: { state: "UNOBSERVABLE", reference: null }, transactionOutcome: { state: "UNKNOWN" }, errorObservations: [{ code: error?.code ?? error?.message ?? "WITNESS_FAILURE" }], residualGaps: ["WITNESS_FAILURE", "TRANSACTION_OUTCOME_UNRESOLVED"], limitations: ["WITNESS_FAILURE_IS_NOT_OPERATION_FAILURE"] });
    }
    event(`RUNTIME_WITNESS_${witnessResult.witnessStatus}_CAPTURED`);
  }
  const observationInputs = events.map((item) => ({ observationRef: item.eventRef.replace("ref:event", "ref:observation"), subjectRef: invocation.manifest.governedOperationRef, layerRef: "ref:layer:local-controller", pointRef: `ref:point:${item.type.toLowerCase()}`, sourceRef: "ref:source:local-controller", sourceClassification: "CLIENT_OBSERVED", observationState: "PRESENT", orderState: "OBSERVED", sequencePosition: item.sequencePosition, provenanceRef: invocation.provenanceDeclarationRef, fidelity: { level: "EXACT" }, completeness: { claimScope: true }, bindings: { executionRef: invocation.executionRef, attemptRef: invocation.attemptRef, resultRef: item.type.includes("RESULT") ? transportResult.resultRef ?? null : null }, correlationRefs: [invocation.correlationRef], uncertaintyRefs: [], contradictionRefs: [], boundedDetail: item.detail, extensions: { fixtureOnly: true, actualRuntimeEvidence: false } }));
  for (const configured of transportResult.observations ?? []) observationInputs.push({ ...configured, sequencePosition: ++sequence, bindings: { ...(configured.bindings ?? {}), executionRef: invocation.executionRef, attemptRef: invocation.attemptRef }, correlationRefs: [...(configured.correlationRefs ?? []), invocation.correlationRef], extensions: { ...(configured.extensions ?? {}), fixtureOnly: true, actualDatabaseEvidence: false, actualRuntimeEvidence: false } });
  for (const [index, configured] of [...(witnessResult?.stageObservations ?? []), ...(witnessResult?.stateObservations ?? []), ...(witnessResult?.resultObservations ?? []), ...(witnessResult?.errorObservations ?? []), ...(witnessResult?.uncertaintyObservations ?? [])].entries()) observationInputs.push({ observationRef: configured.observationRef ?? dependencies.identities.next("witness-observation"), subjectRef: configured.subjectRef ?? invocation.manifest.governedOperationRef, layerRef: configured.layerRef ?? "ref:layer:synthetic-witness-fixture", pointRef: configured.pointRef ?? `ref:point:witness-${index + 1}`, sourceRef: configured.sourceRef ?? witnessResult.witnessIdentity, sourceClassification: "DECLARED", observationState: configured.observationState ?? "PRESENT", orderState: configured.orderState ?? "OBSERVED", sequencePosition: ++sequence, provenanceRef: configured.provenanceRef ?? invocation.provenanceDeclarationRef, fidelity: configured.fidelity ?? { level: "DECLARED" }, completeness: configured.completeness ?? { claimScope: false }, bindings: { executionRef: invocation.executionRef, attemptRef: invocation.attemptRef, sessionRef: witnessResult.session.state === "PRESENT" ? witnessResult.session.reference : null, transactionRef: witnessResult.transaction.state === "PRESENT" ? witnessResult.transaction.reference : null, stageRef: configured.stageRef ?? null, resultRef: configured.resultRef ?? null }, correlationRefs: [invocation.correlationRef], uncertaintyRefs: [...(configured.uncertaintyRefs ?? [])], contradictionRefs: [...(configured.contradictionRefs ?? [])], boundedDetail: configured.boundedDetail ?? null, extensions: { fixtureOnly: true, actualRuntimeEvidence: false, actualDatabaseEvidence: false, witnessStatus: witnessResult.witnessStatus } });
  observationInputs.push({ observationRef: dependencies.identities.next("observation"), subjectRef: invocation.manifest.governedOperationRef, layerRef: "ref:layer:external-platform", pointRef: "ref:point:external-receipt", sourceRef: "ref:source:unknown-external-platform", sourceClassification: "UNKNOWN", observationState: "UNOBSERVABLE", orderState: "UNKNOWN", sequencePosition: ++sequence, provenanceRef: invocation.provenanceDeclarationRef, fidelity: {}, completeness: {}, bindings: { executionRef: invocation.executionRef, attemptRef: invocation.attemptRef }, correlationRefs: [invocation.correlationRef], uncertaintyRefs: ["ref:gap:external-platform-receipt"], contradictionRefs: [], boundedDetail: null, extensions: { fixtureOnly: true } });
  observationInputs.push({ observationRef: dependencies.identities.next("observation"), subjectRef: invocation.manifest.governedOperationRef, layerRef: "ref:layer:database", pointRef: "ref:point:transaction-correlation", sourceRef: "ref:source:unavailable-database-witness", sourceClassification: "UNKNOWN", observationState: "INSUFFICIENT", orderState: "UNKNOWN", sequencePosition: ++sequence, provenanceRef: invocation.provenanceDeclarationRef, fidelity: {}, completeness: {}, bindings: { executionRef: invocation.executionRef, attemptRef: invocation.attemptRef, transactionRef: transportResult.transactionRef ?? null }, correlationRefs: [invocation.correlationRef], uncertaintyRefs: ["ref:gap:transaction-attribution"], contradictionRefs: [], boundedDetail: null, extensions: { fixtureOnly: true, databaseWitnessImplemented: false } });
  const observations = observationInputs.map(createRuntimeEvidenceObservation);
  event("EVIDENCE_PACKAGE_BUILD_STARTED");
  const packageModel = buildRuntimeEvidencePackage({ evidencePackageRef: invocation.evidencePackageRef, manifestRef: invocation.manifest.manifestRef, executionPlanRef: invocation.executionPlan.executionPlanRef, observationPlanRef: invocation.observationPlan.observationPlanRef, authorizationRef: invocation.authorization.authorizationRef, executionOrAttemptRef: invocation.attemptRef, executionRef: invocation.executionRef, attemptRef: invocation.attemptRef, artifactIdentityEvidenceRef: observations[5]?.observationRef ?? artifactVerification.artifactRef, targetEvidenceRef: invocation.targetDeclarationRef, environmentEvidenceRef: invocation.environmentDeclarationRef, integrityDeclarationRef: invocation.integrityDeclarationRef, provenanceDeclarationRef: invocation.provenanceDeclarationRef, custodyRecordRef: invocation.custodyRecordRefs[0], completenessDeclarationRef: invocation.completenessDeclarationRef, fidelityDeclarationRef: invocation.fidelityDeclarationRef, contradictionDeclarationRef: invocation.contradictionDeclarationRef ?? null, observationState: "UNRESOLVED", lifecycle: "DRAFT", reviewRefs: [], conclusionRefs: [], observations, relationships: [], operatorDeclarationRef: invocation.operatorDeclarationRef, extensions: { refV1_5: { fixtureOnly: true, transportOutcome: transportResult.outcome, operationalSuccessEstablished: false, persistentStateEstablished: false }, refV1_6: { witnessRequestRef: invocation.witnessRequest?.witnessRequestRef ?? null, witnessStatus: witnessResult?.witnessStatus ?? null, witnessAndTransportSeparate: true } } });
  const finalizedPackage = await finalizeRuntimeEvidencePackage(packageModel, null, dependencies.cryptoProvider);
  event("EVIDENCE_PACKAGE_BUILT");
  const custodyRecords = [buildRuntimeEvidenceCustodyRecord({ custodyRecordRef: invocation.custodyRecordRefs[0], evidencePackageRef: invocation.evidencePackageRef, custodianRef: invocation.controllerRef, temporalReference: dependencies.clock.next(), custodyStage: "CREATED", lifecycle: "DRAFT", transferDeclarationRefs: [], integrityVerificationRefs: [invocation.integrityDeclarationRef], preservationDeclarationRefs: [], custodyGapRefs: ["ref:gap:no-persistent-archive"], packageContentIdentity: finalizedPackage.contentIdentity, integrityState: "MATCHED" }), buildRuntimeEvidenceCustodyRecord({ custodyRecordRef: invocation.custodyRecordRefs[1], evidencePackageRef: invocation.evidencePackageRef, custodianRef: invocation.reviewerRef, temporalReference: dependencies.clock.next(), custodyStage: "RECEIVED", lifecycle: "DRAFT", transferDeclarationRefs: ["ref:transfer:in-memory-review"], integrityVerificationRefs: [invocation.integrityDeclarationRef], preservationDeclarationRefs: [], custodyGapRefs: ["ref:gap:persistence-deferred"], predecessorCustodyRecordRef: invocation.custodyRecordRefs[0], packageContentIdentity: finalizedPackage.contentIdentity, transferCompleted: true, receiptConfirmed: true, integrityState: "MATCHED" })];
  const custodyAssessment = assessCustodyContinuity(custodyRecords);
  event("CUSTODY_RECORDS_BUILT");
  const claimAssessments = (invocation.claimRequests ?? []).map((request) => buildRuntimeEvidenceClaimAssessment({ claimAssessmentRef: request.claimAssessmentRef, claimRef: request.claimRef, packageRef: invocation.evidencePackageRef, classificationRef: request.classificationRef, assessorRef: request.assessorRef, observations, relationships: [], policy: request.policy, custodyAssessment, lifecycle: "DRAFT" }));
  event("CLAIM_ASSESSMENTS_BUILT");
  const reviewReady = prepareRuntimeEvidenceReviewInput({ finalizedPackage, claimAssessments, custodyAssessment });
  event("REVIEW_READY_REFERENCES_PREPARED"); event("CONTROLLER_TERMINATED"); event("MANDATORY_STOP");
  return deepFreeze({ model: "RuntimeEvidenceControllerResult", modelVersion: REF_V1_5_CONTROLLER_VERSION, controllerStatus: statusFromTransport(transportResult.outcome), invocationRef: invocation.invocationRef, attemptRef: invocation.attemptRef, transportCallCount: dependencies.transport.callCount, witnessCallCount: dependencies.witness?.callCount ?? 0, modeledAuthorizationState, preconditions, artifactVerification, events, observations, transportResult, witnessResult, evidencePackage: finalizedPackage, custodyRecords, custodyAssessment, claimAssessments, reviewReady, operationalSuccess: null, finalConclusion: null, retryPerformed: false, mandatoryStop: true, prohibitedNextActions: REF_V1_5_PROHIBITED_NEXT_ACTIONS, unresolvedGaps: ["EXTERNAL_RECEIPT_UNOBSERVABLE", "DATABASE_SESSION_UNOBSERVABLE", "TRANSACTION_ATTRIBUTION_INSUFFICIENT", "PERSISTENT_STATE_UNRESOLVED", "PERSISTENCE_DEFERRED", ...(witnessResult?.residualGaps ?? [])] });
}
