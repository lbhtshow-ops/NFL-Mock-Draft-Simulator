import { RESEARCH_MIGRATION_BLOCKER_TYPES, RESEARCH_MIGRATION_READINESS } from "./researchMigrationConstants.js";
import { createResearchMigrationInput } from "./ResearchMigrationInputContract.js";

const blocker = (type, message, paths = []) => Object.freeze({ blockerId: `migration-blocker:${type.toLowerCase()}`, blockerType: type, message, paths });
export function validateResearchMigration(input) {
  const normalized = createResearchMigrationInput(input); const blockers = [];
  if (!normalized.validation.valid) blockers.push(blocker(RESEARCH_MIGRATION_BLOCKER_TYPES.INVALID_INPUT, "Migration input is structurally invalid.", normalized.validation.errors.map((entry) => entry.path)));
  if (!normalized.sourceLabels.length) blockers.push(blocker(RESEARCH_MIGRATION_BLOCKER_TYPES.MISSING_SOURCE_LABEL, "No legacy source labels are available."));
  if (normalized.validation.errors.some((entry) => entry.code === "DUPLICATE_SOURCE_LABEL")) blockers.push(blocker(RESEARCH_MIGRATION_BLOCKER_TYPES.DUPLICATE_SOURCE_LABEL, "Duplicate legacy source labels require correction."));
  if (normalized.sourceLabels.length) blockers.push(blocker(RESEARCH_MIGRATION_BLOCKER_TYPES.MISSING_SOURCE_PROVENANCE, "Legacy source labels lack governed source-specific provenance."));
  if (!normalized.recordedObservationDeclaration) blockers.push(blocker(RESEARCH_MIGRATION_BLOCKER_TYPES.MISSING_OBSERVATION, "No governed observation is justified by the supplied input."));
  if (!normalized.analyticalObservationDeclaration) blockers.push(blocker(RESEARCH_MIGRATION_BLOCKER_TYPES.MISSING_ANALYSIS, "No governed analytical conclusion is justified by the supplied input."));
  if (!normalized.evidenceArtifactDeclaration) blockers.push(blocker(RESEARCH_MIGRATION_BLOCKER_TYPES.MISSING_ARTIFACT, "No governed evidence artifact is supplied."));
  if (!normalized.humanReviewRequired || !normalized.humanReviewCompleted) blockers.push(blocker(RESEARCH_MIGRATION_BLOCKER_TYPES.HUMAN_REVIEW_REQUIRED, "Human review is required and remains incomplete."));
  blockers.push(blocker(RESEARCH_MIGRATION_BLOCKER_TYPES.APPROVAL_REQUIRED, "Governed source approval is outside migration authority."));
  if (normalized.requestedSourceStatus === "APPROVED") blockers.push(blocker(RESEARCH_MIGRATION_BLOCKER_TYPES.AUTOMATIC_APPROVAL_PROHIBITED, "Automatic source approval is prohibited."));
  if (!normalized.legacyCycleRef || !normalized.targetCycleRef) blockers.push(blocker(RESEARCH_MIGRATION_BLOCKER_TYPES.UNKNOWN_CYCLE, "One or more cycle references are unknown."));
  else if (normalized.legacyCycleRef !== normalized.targetCycleRef) blockers.push(blocker(RESEARCH_MIGRATION_BLOCKER_TYPES.CYCLE_CONFLICT, "Legacy and target cycles conflict and remain unresolved."));
  if (!normalized.populationLinkageRefs.length) blockers.push(blocker(RESEARCH_MIGRATION_BLOCKER_TYPES.POPULATION_LINKAGE_MISSING, "Population linkage references are unavailable."));
  const readiness = blockers.length ? RESEARCH_MIGRATION_READINESS.BLOCKED : RESEARCH_MIGRATION_READINESS.READY_FOR_REPOSITORY_REVIEW;
  return Object.freeze({ input: normalized, valid: normalized.validation.valid, readiness, blockers, warnings: normalized.validation.warnings });
}
export default Object.freeze({ validateResearchMigration });
