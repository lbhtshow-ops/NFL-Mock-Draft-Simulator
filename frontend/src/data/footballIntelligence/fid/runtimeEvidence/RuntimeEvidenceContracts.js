import { declaration, validateDeclaration } from "./contractSupport.js";
import { REF_V1_ASSESSMENT_OUTCOMES, REF_V1_CUSTODY_STAGES, REF_V1_LIFECYCLES, REF_V1_OBSERVATION_STATES, REF_V1_REVIEW_OUTCOMES } from "./runtimeEvidenceConstants.js";

const copy = (input, fields) => Object.fromEntries(fields.map((field) => [field, Array.isArray(input[field]) ? [...input[field]] : input[field] ?? null]));
const lifecycle = { lifecycle: REF_V1_LIFECYCLES };

export function createGovernedOperationEvidenceManifest(input = {}) {
  const required = ["manifestRef", "governedOperationRef", "executionArtifactRef", "authorizationRef", "targetRef", "environmentRef", "operationOwnerRef"];
  const arrays = ["permittedObservationScope", "requiredClaimRefs", "stopConditionRefs", "evidenceCaptureRequirementRefs", "prohibitedActionRefs"];
  const errors = validateDeclaration(input, { required, arrays, uniqueArrays: arrays, enumFields: lifecycle, forbidden: ["finalConclusion", "credentials"] });
  return declaration("GovernedOperationEvidenceManifest", copy(input, [...required, "manifestVersion", "operatorDeclarationRef", "expectedExecutionMechanismRef", "transactionExpectationRef", "mutationClassificationRef", "terminationExpectationRef", "predecessorRef", "investigationRef", "lifecycle", ...arrays, "extensions"]), errors);
}

export function createRuntimeEvidenceExecutionPlan(input = {}) {
  const required = ["executionPlanRef", "manifestRef", "governedOperationRef", "executionBoundaryRef"];
  const arrays = ["plannedStageRefs", "requiredPreconditionRefs", "stopConditionRefs", "expectedResultRefs", "expectedErrorOrUncertaintyRefs", "prohibitedStageRefs", "completionCriterionRefs"];
  const errors = validateDeclaration(input, { required, arrays, uniqueArrays: ["plannedStageRefs", "prohibitedStageRefs"], enumFields: lifecycle });
  return declaration("RuntimeEvidenceExecutionPlan", copy(input, [...required, "requiredOrderingDeclaration", "stageOwnershipDeclarationRef", "transactionBoundaryExpectationRef", "permittedOperationRangeRef", "lifecycle", ...arrays, "extensions"]), errors);
}

export function createRuntimeEvidenceObservationPlan(input = {}) {
  const required = ["observationPlanRef", "manifestRef", "executionPlanRef"];
  const arrays = ["observationSubjectRefs", "observationPointRefs", "observationLayerRefs", "correlationRequirementRefs", "identityRequirementRefs", "fidelityRequirementRefs", "completenessDimensionRefs", "acceptableResidualGapRefs", "leastDisclosureLimitRefs", "prohibitedCaptureRefs", "claimSufficiencyRequirementRefs"];
  const errors = validateDeclaration(input, { required, arrays, uniqueArrays: ["observationPointRefs", "claimSufficiencyRequirementRefs"], enumFields: lifecycle });
  return declaration("RuntimeEvidenceObservationPlan", copy(input, [...required, "expectedObservationSequenceRef", "contradictionHandlingRef", "uncertaintyHandlingRef", "lifecycle", ...arrays, "extensions"]), errors);
}

export function createRuntimeEvidencePackage(input = {}) {
  const required = ["evidencePackageRef", "manifestRef", "authorizationRef", "executionOrAttemptRef", "artifactIdentityEvidenceRef", "targetEvidenceRef", "environmentEvidenceRef", "integrityDeclarationRef", "provenanceDeclarationRef", "custodyRecordRef"];
  const arrays = ["operatorEvidenceRefs", "clientObservationRefs", "runtimeObservationRefs", "stageObservationRefs", "resultObservationRefs", "errorOrUncertaintyObservationRefs", "transactionObservationRefs", "chronologyRefs", "evidenceRelationshipRefs", "reviewRefs", "conclusionRefs"];
  const errors = validateDeclaration(input, { required, arrays, uniqueArrays: arrays, enumFields: { lifecycle: REF_V1_LIFECYCLES, observationState: REF_V1_OBSERVATION_STATES }, forbidden: ["finalConclusion", "operationalSuccess"] });
  return declaration("RuntimeEvidencePackage", copy(input, [...required, "packageVersion", "completenessDeclarationRef", "fidelityDeclarationRef", "contradictionDeclarationRef", "redactionDeclarationRef", "observationState", "lifecycle", ...arrays, "extensions"]), errors);
}

export function createRuntimeEvidenceClaimAssessment(input = {}) {
  const required = ["claimAssessmentRef", "claimRef", "evidencePackageRef", "classificationRef", "assessorRef"];
  const arrays = ["supportingObservationRefs", "contradictingObservationRefs", "uncertaintyRefs", "residualGapRefs"];
  const errors = validateDeclaration(input, { required, arrays, uniqueArrays: arrays, enumFields: { lifecycle: REF_V1_LIFECYCLES, assessmentOutcome: REF_V1_ASSESSMENT_OUTCOMES }, forbidden: ["operationalSuccess", "finalConclusion"] });
  return declaration("RuntimeEvidenceClaimAssessment", copy(input, [...required, "governedClaimStatementRef", "authenticityAssessmentRef", "integrityAssessmentRef", "provenanceAssessmentRef", "fidelityAssessmentRef", "completenessAssessmentRef", "correlationAssessmentRef", "independenceAssessmentRef", "assessmentOutcome", "lifecycle", ...arrays, "extensions"]), errors);
}

export function createRuntimeEvidenceCustodyRecord(input = {}) {
  const required = ["custodyRecordRef", "evidencePackageRef", "custodianRef", "temporalReference"];
  const arrays = ["transferDeclarationRefs", "integrityVerificationRefs", "preservationDeclarationRefs", "custodyGapRefs"];
  const errors = validateDeclaration(input, { required, arrays, uniqueArrays: arrays, enumFields: { lifecycle: REF_V1_LIFECYCLES, custodyStage: REF_V1_CUSTODY_STAGES }, forbidden: ["inventedProvenance", "operatorIdentity"] });
  return declaration("RuntimeEvidenceCustodyRecord", copy(input, [...required, "custodyStage", "sourceBoundaryRef", "destinationBoundaryRef", "receiptDeclarationRef", "derivativeRelationshipRef", "transformationDeclarationRef", "continuityAssessmentRef", "lifecycle", ...arrays, "extensions"]), errors);
}

export function createRuntimeEvidenceReviewRecord(input = {}) {
  const required = ["reviewRef", "evidencePackageRef", "reviewerRef", "reviewRoleRef", "reviewedScopeRef"];
  const arrays = ["claimAssessmentRefs", "unresolvedIssueRefs", "contradictionRefs", "permissibleNextActionRefs", "prohibitedNextActionRefs"];
  const errors = validateDeclaration(input, { required, arrays, uniqueArrays: ["claimAssessmentRefs"], enumFields: { lifecycle: REF_V1_LIFECYCLES, reviewOutcome: REF_V1_REVIEW_OUTCOMES }, forbidden: ["authorizationReopened", "executionAuthorized", "finalConclusion"] });
  return declaration("RuntimeEvidenceReviewRecord", copy(input, [...required, "independenceDeclarationRef", "reviewOutcome", "decisionRef", "conclusionRef", "predecessorReviewRef", "successorReviewRef", "lifecycle", ...arrays, "extensions"]), errors);
}

