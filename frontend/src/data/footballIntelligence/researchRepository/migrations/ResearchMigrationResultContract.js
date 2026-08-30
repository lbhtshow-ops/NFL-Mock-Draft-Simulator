import { RESEARCH_MIGRATION_READINESS, RESEARCH_MIGRATION_RESULT_CONTRACT_NAME, RESEARCH_MIGRATION_RESULT_CONTRACT_VERSION, RESEARCH_MIGRATION_RESULT_SCHEMA_VERSION } from "./researchMigrationConstants.js";

const shape = () => ({ valid: true, errors: [], warnings: [], checkedAt: null, contractVersion: RESEARCH_MIGRATION_RESULT_CONTRACT_VERSION, schemaVersion: RESEARCH_MIGRATION_RESULT_SCHEMA_VERSION });
export function createResearchMigrationResult(input = {}) {
  const v = shape(); const error = (code, path, message) => { v.errors.push({ code, path, message }); v.valid = false; };
  const x = input && typeof input === "object" && !Array.isArray(input) ? input : {}; if (x !== input) error("INVALID_RESULT", "", "Result must be an object.");
  const string = (key) => typeof x[key] === "string" && x[key].trim() ? x[key].trim() : (error("MISSING_REQUIRED_FIELD", key, `${key} is required.`), null);
  const readiness = Object.values(RESEARCH_MIGRATION_READINESS).includes(x.readiness) ? x.readiness : (error("INVALID_READINESS", "readiness", "readiness is not recognized."), RESEARCH_MIGRATION_READINESS.UNKNOWN);
  const effects = { persistencePerformed: false, promotionPerformed: false, canonicalRecordCreated: false, runtimeIntegrationPerformed: false };
  for (const key of Object.keys(effects)) if (x[key] !== false) error("PROHIBITED_EFFECT", key, `${key} must be false.`);
  const result = { contract: RESEARCH_MIGRATION_RESULT_CONTRACT_NAME, contractVersion: RESEARCH_MIGRATION_RESULT_CONTRACT_VERSION, schemaVersion: RESEARCH_MIGRATION_RESULT_SCHEMA_VERSION, resultId: string("resultId"), migrationRef: string("migrationRef"), subjectRef: string("subjectRef"), legacyRecordRef: string("legacyRecordRef"), readiness, blockers: Array.isArray(x.blockers) ? structuredClone(x.blockers) : [], legacySourceLabels: Array.isArray(x.legacySourceLabels) ? structuredClone(x.legacySourceLabels) : [], governedSourceCandidateRefs: Array.isArray(x.governedSourceCandidateRefs) ? [...x.governedSourceCandidateRefs] : [], createdContractRefs: Array.isArray(x.createdContractRefs) ? structuredClone(x.createdContractRefs) : [], populationLinkageRefs: Array.isArray(x.populationLinkageRefs) ? [...x.populationLinkageRefs] : [], unresolvedValues: Array.isArray(x.unresolvedValues) ? [...x.unresolvedValues] : [], ...effects, validation: v };
  if (result.governedSourceCandidateRefs.some((ref) => result.createdContractRefs.some((entry) => entry.ref === ref && entry.status === "APPROVED"))) error("AUTOMATIC_SOURCE_APPROVAL_PROHIBITED", "createdContractRefs", "Migration result cannot approve source candidates.");
  return result;
}
export function validateResearchMigrationResult(value) { return createResearchMigrationResult(value).validation; }
export function isResearchMigrationResult(value) { return Boolean(value?.contract === RESEARCH_MIGRATION_RESULT_CONTRACT_NAME && validateResearchMigrationResult(value).valid); }
export default Object.freeze({ createResearchMigrationResult, validateResearchMigrationResult, isResearchMigrationResult });
