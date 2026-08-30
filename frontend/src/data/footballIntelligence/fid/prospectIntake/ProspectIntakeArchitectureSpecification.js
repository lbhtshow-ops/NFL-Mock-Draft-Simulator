import { PROSPECT_INTAKE_STAGES, PROSPECT_INTAKE_STATUSES } from "./prospectIntakeCandidateConstants.js";

export const PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_NAME = "ProspectIntakeArchitectureSpecification";
export const PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_VERSION = "FID-PROSPECT-INTAKE-ARCHITECTURE-1.0.0";
export const PROSPECT_INTAKE_ARCHITECTURE_SCHEMA_VERSION = "FID-PROSPECT-INTAKE-ARCHITECTURE-SCHEMA-1.0.0";

function isObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function validationShape() { return { valid: true, errors: [], warnings: [], checkedAt: null, contractVersion: PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_VERSION, schemaVersion: PROSPECT_INTAKE_ARCHITECTURE_SCHEMA_VERSION }; }
function error(validation, code, path, message) { if (!validation.errors.some((entry) => entry.code === code && entry.path === path)) validation.errors.push({ code, path, message }); validation.valid = false; }
function string(value, path, validation) { if (value == null) return null; if (typeof value !== "string" || !value.trim()) { error(validation, "INVALID_STRING", path, `${path} must be a non-empty string or null.`); return null; } return value.trim(); }
function strings(value, path, validation) { if (value == null) return []; if (!Array.isArray(value)) { error(validation, "INVALID_REFERENCE_COLLECTION", path, `${path} must be an array of strings.`); return []; } const result = []; const seen = new Set(); value.forEach((entry, index) => { const item = string(entry, `${path}[${index}]`, validation); if (item && !seen.has(item)) { seen.add(item); result.push(item); } }); return result; }
function extensions(value, path, validation) { if (value == null) return {}; if (!isObject(value)) { error(validation, "INVALID_EXTENSIONS", path, `${path} must be an object or null.`); return {}; } return { ...value }; }

export function createProspectIntakeArchitectureSpecification(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_ARCHITECTURE_SPECIFICATION", "", "Architecture specification must be an object.");
  if (Object.hasOwn(value, "contract") && value.contract !== PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_NAME) error(validation, "CONTRACT_MISMATCH", "contract", "Architecture contract identity does not match.");
  if (Object.hasOwn(value, "contractVersion") && value.contractVersion !== PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_VERSION) error(validation, "CONTRACT_VERSION_MISMATCH", "contractVersion", "Architecture contract version does not match.");
  if (Object.hasOwn(value, "schemaVersion") && value.schemaVersion !== PROSPECT_INTAKE_ARCHITECTURE_SCHEMA_VERSION) error(validation, "SCHEMA_VERSION_MISMATCH", "schemaVersion", "Architecture schema version does not match.");
  const result = {
    contract: PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_NAME, contractVersion: PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_VERSION, schemaVersion: PROSPECT_INTAKE_ARCHITECTURE_SCHEMA_VERSION,
    role: "GOVERNS_MOVEMENT_TOWARD_CANONICAL_DATA", stageVocabulary: Object.values(PROSPECT_INTAKE_STAGES), statusVocabulary: Object.values(PROSPECT_INTAKE_STATUSES),
    stageOwnership: { workflowDeclarations: "PROSPECT_INTAKE", researchRecords: "RESEARCH_REPOSITORY", canonicalFacts: "FID_CONTRACTS", persistence: "FUTURE_EXPLICIT_OPERATION", evaluation: "OUTSIDE_PROSPECT_INTAKE", simulatorUse: "OUTSIDE_PROSPECT_INTAKE" },
    transitionPolicy: { explicitRecordsRequired: true, linearProgressionRequired: false, backwardMovementAllowed: true, stageChangeWithoutStatusChangeAllowed: true, statusChangeWithoutStageChangeAllowed: true, inferredFromDates: false, inferredFromEvidenceCounts: false, inferredFromLatestActivity: false },
    reviewPolicy: { humanReviewSupported: true, reviewAutomaticallyTransitions: false, identityConfirmationCreatesCanonicalIdentity: false, evidenceSufficiencyCalculated: false },
    promotionPolicy: { plansAreNonExecutable: true, partialPromotionSupported: true, approvalCreatesRecords: false, approvalPersistsRecords: false, approvalTriggersEvaluation: false, approvalImpliesSimulatorReadiness: false },
    versionModel: { architectureContractVersionDistinct: true, architectureSchemaVersionDistinct: true, candidateVersionDistinct: true, workflowRevisionDistinct: true, futurePersistenceEnvelopeRevisionDistinct: true, fidTargetRecordRevisionDistinct: true },
    separationModel: { researchRepositoryOwnsResearch: true, fidContractsOwnCanonicalFacts: true, intakeOwnsWorkflowDeclarationsOnly: true, identityResolutionImplemented: false, persistenceImplemented: false, evaluationImplemented: false, rankingImplemented: false, simulatorLoadingImplemented: false },
    firstUseCompatibility: { intendedCycleLabel: "2027 NFL Draft", cycleRefRemainsUnresolved: true, futureCyclesSupported: true, incompleteCandidatesSupported: true, changesPreserveHistory: true, realCandidatesIncluded: false },
    expectedStageOutputs: [
      { stage: "DISCOVERED", output: "DISCOVERY_CONTEXT" }, { stage: "IDENTITY_REVIEW", output: "IDENTITY_REVIEW_DECLARATION" },
      { stage: "RESEARCH_COLLECTION", output: "RESEARCH_PLAN_AND_UNRESOLVED_REFS" }, { stage: "EVIDENCE_REVIEW", output: "EVIDENCE_SUFFICIENCY_DECLARATIONS" },
      { stage: "FACT_REVIEW", output: "REVIEW_RECORDS" }, { stage: "HUMAN_VERIFICATION", output: "HUMAN_REVIEW_DECLARATIONS" },
      { stage: "PROMOTION_READY", output: "SCOPE_SPECIFIC_READINESS" }, { stage: "PROMOTION_APPROVED", output: "NON_EXECUTABLE_PROMOTION_PLAN" },
      { stage: "PROMOTION_DEFERRED", output: "DEFERRAL_TRANSITION" }, { stage: "PROMOTION_REJECTED", output: "REJECTION_TRANSITION" },
      { stage: "PROMOTED", output: "UNRESOLVED_PROMOTION_DECISION_REFS" }, { stage: "ARCHIVED", output: "ARCHIVAL_TRANSITION" },
    ],
    metadata: value.metadata == null ? { tags: [], notes: null } : (() => { if (!isObject(value.metadata)) { error(validation, "INVALID_METADATA", "metadata", "metadata must be an object or null."); return { tags: [], notes: null }; } return { tags: strings(value.metadata.tags, "metadata.tags", validation), notes: string(value.metadata.notes, "metadata.notes", validation) }; })(), extensions: extensions(value.extensions, "extensions", validation), validation,
  };
  validation.valid = validation.errors.length === 0; return result;
}
export function validateProspectIntakeArchitectureSpecification(value) { return createProspectIntakeArchitectureSpecification(value).validation; }
export function isProspectIntakeArchitectureSpecification(value) { return Boolean(isObject(value) && value.contract === PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_NAME && value.contractVersion === PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_VERSION && value.schemaVersion === PROSPECT_INTAKE_ARCHITECTURE_SCHEMA_VERSION && validateProspectIntakeArchitectureSpecification(value).valid); }

export default Object.freeze({
  PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_NAME, PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_VERSION, PROSPECT_INTAKE_ARCHITECTURE_SCHEMA_VERSION,
  createProspectIntakeArchitectureSpecification, validateProspectIntakeArchitectureSpecification, isProspectIntakeArchitectureSpecification,
});
