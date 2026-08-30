import { RESEARCH_MIGRATION_INPUT_CONTRACT_NAME, RESEARCH_MIGRATION_INPUT_CONTRACT_VERSION, RESEARCH_MIGRATION_INPUT_SCHEMA_VERSION, RESEARCH_MIGRATION_VALUE_STATES } from "./researchMigrationConstants.js";

const allowed = new Set(["contract", "contractVersion", "schemaVersion", "migrationId", "migrationRevision", "legacyRecordRef", "subjectRef", "subjectIdentityState", "sourceLabels", "legacyMetadata", "legacyCycleRef", "targetCycleRef", "populationLinkageRefs", "humanReviewRequired", "humanReviewCompleted", "requestedSourceStatus", "recordedObservationDeclaration", "analyticalObservationDeclaration", "evidenceArtifactDeclaration", "notes", "validation"]);
const text = (value) => typeof value === "string" && value.trim() ? value.trim() : null;
const validation = () => ({ valid: true, errors: [], warnings: [], checkedAt: null, contractVersion: RESEARCH_MIGRATION_INPUT_CONTRACT_VERSION, schemaVersion: RESEARCH_MIGRATION_INPUT_SCHEMA_VERSION });
function add(v, code, path, message, warning = false) { v[warning ? "warnings" : "errors"].push({ code, path, message }); v.valid = v.errors.length === 0; }
function normalize(input = {}) {
  const v = validation(); const x = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  if (x !== input) add(v, "INVALID_INPUT", "", "Migration input must be an object.");
  Object.keys(x).filter((key) => !allowed.has(key)).forEach((key) => add(v, "UNSUPPORTED_FIELD", key, `${key} is outside migration-input ownership.`));
  if (x.contract && x.contract !== RESEARCH_MIGRATION_INPUT_CONTRACT_NAME) add(v, "CONTRACT_MISMATCH", "contract", "Contract identity does not match.");
  const labels = Array.isArray(x.sourceLabels) ? x.sourceLabels.map(text).filter(Boolean) : [];
  if (x.sourceLabels != null && !Array.isArray(x.sourceLabels)) add(v, "INVALID_SOURCE_LABELS", "sourceLabels", "sourceLabels must be an array.");
  if (new Set(labels.map((entry) => entry.toLowerCase())).size !== labels.length) add(v, "DUPLICATE_SOURCE_LABEL", "sourceLabels", "Source labels must be unique.");
  const subjectRef = text(x.subjectRef); if (!subjectRef || !/^[a-z0-9][a-z0-9:_-]+$/i.test(subjectRef)) add(v, "MALFORMED_SUBJECT_REFERENCE", "subjectRef", "A stable unresolved subject reference is required.");
  const legacyRecordRef = text(x.legacyRecordRef); if (!legacyRecordRef) add(v, "MISSING_LEGACY_RECORD_REFERENCE", "legacyRecordRef", "A declarative legacy record reference is required.");
  const migrationId = text(x.migrationId); if (!migrationId) add(v, "MISSING_MIGRATION_ID", "migrationId", "migrationId is required.");
  const migrationRevision = Number.isInteger(x.migrationRevision) && x.migrationRevision > 0 ? x.migrationRevision : null; if (!migrationRevision) add(v, "INVALID_REVISION", "migrationRevision", "A positive migrationRevision is required.");
  const state = Object.values(RESEARCH_MIGRATION_VALUE_STATES).includes(x.subjectIdentityState) ? x.subjectIdentityState : "UNRESOLVED";
  if (x.requestedSourceStatus === "APPROVED") add(v, "AUTOMATIC_SOURCE_APPROVAL_PROHIBITED", "requestedSourceStatus", "Migration cannot approve a ResearchSource.");
  if (x.humanReviewCompleted === true && x.humanReviewRequired !== true) add(v, "INVALID_REVIEW_STATE", "humanReviewCompleted", "Completed review requires humanReviewRequired.");
  const result = { contract: RESEARCH_MIGRATION_INPUT_CONTRACT_NAME, contractVersion: RESEARCH_MIGRATION_INPUT_CONTRACT_VERSION, schemaVersion: RESEARCH_MIGRATION_INPUT_SCHEMA_VERSION, migrationId, migrationRevision, legacyRecordRef, subjectRef, subjectIdentityState: state, sourceLabels: labels, legacyMetadata: x.legacyMetadata && typeof x.legacyMetadata === "object" ? structuredClone(x.legacyMetadata) : null, legacyCycleRef: text(x.legacyCycleRef), targetCycleRef: text(x.targetCycleRef), populationLinkageRefs: Array.isArray(x.populationLinkageRefs) ? [...new Set(x.populationLinkageRefs.map(text).filter(Boolean))] : [], humanReviewRequired: x.humanReviewRequired === true, humanReviewCompleted: x.humanReviewCompleted === true, requestedSourceStatus: text(x.requestedSourceStatus) ?? "CANDIDATE", recordedObservationDeclaration: x.recordedObservationDeclaration && typeof x.recordedObservationDeclaration === "object" ? structuredClone(x.recordedObservationDeclaration) : null, analyticalObservationDeclaration: x.analyticalObservationDeclaration && typeof x.analyticalObservationDeclaration === "object" ? structuredClone(x.analyticalObservationDeclaration) : null, evidenceArtifactDeclaration: x.evidenceArtifactDeclaration && typeof x.evidenceArtifactDeclaration === "object" ? structuredClone(x.evidenceArtifactDeclaration) : null, notes: text(x.notes), validation: v }; v.valid = v.errors.length === 0; return result;
}
export function createResearchMigrationInput(input) { return normalize(input); }
export function validateResearchMigrationInput(value) { return normalize(value).validation; }
export function isResearchMigrationInput(value) { return Boolean(value?.contract === RESEARCH_MIGRATION_INPUT_CONTRACT_NAME && validateResearchMigrationInput(value).valid); }
export default Object.freeze({ createResearchMigrationInput, validateResearchMigrationInput, isResearchMigrationInput });
