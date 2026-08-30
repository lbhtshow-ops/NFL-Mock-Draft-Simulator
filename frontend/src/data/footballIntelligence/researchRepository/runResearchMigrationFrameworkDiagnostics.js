import researchRepository from "../../researchRepository/index.js";
import { runResearchRepositoryFoundationDiagnostics } from "../../researchRepository/diagnostics/runResearchRepositoryFoundationDiagnostics.js";
import { runPopulationWorkflowDiagnostics } from "../fid/population/runPopulationWorkflowDiagnostics.js";
import migrationApi from "./migrations/index.js";
import { runPeterWoodsResearchMigrationDiagnostics } from "./runPeterWoodsResearchMigrationDiagnostics.js";

const SUITE = "ResearchMigrationFrameworkDiagnostics";
const base = (suffix = "valid", overrides = {}) => ({ migrationId: `migration:${suffix}`, migrationRevision: 1, legacyRecordRef: `legacy-record:${suffix}`, subjectRef: `legacy-subject:${suffix}`, subjectIdentityState: "UNRESOLVED", sourceLabels: ["Legacy Source Label"], legacyMetadata: { status: "UNKNOWN" }, legacyCycleRef: "draft-cycle:2027", targetCycleRef: "draft-cycle:2027", populationLinkageRefs: [`population-workflow:${suffix}`, `population-result:${suffix}`, `fiis-request:${suffix}`], humanReviewRequired: true, humanReviewCompleted: false, requestedSourceStatus: "CANDIDATE", recordedObservationDeclaration: { title: "Legacy metadata declaration", description: "The supplied legacy record contains administrative metadata.", field: "legacyResearchMetadata", valueText: "{\"status\":\"UNKNOWN\"}", recordedBy: "Legacy metadata", occurredAt: "2026-07-18" }, analyticalObservationDeclaration: { text: "The supplied record contains administrative metadata; no football conclusion is asserted.", evaluatorLabel: "Migration diagnostic" }, evidenceArtifactDeclaration: { summary: "The supplied legacy record supports its own existence only." }, ...overrides });
const effectKeys = ["persistencePerformed", "promotionPerformed", "canonicalRecordCreated", "runtimeIntegrationPerformed"];
function check(id, fn) { try { fn(); return { id, passed: true, message: `${id} passed.`, details: null }; } catch (error) { return { id, passed: false, message: error?.message ?? `${id} failed.`, details: error?.details ?? null }; } }
function assert(condition, message, details = null) { if (!condition) { const error = new Error(message); error.details = details; throw error; } }

export function runResearchMigrationFrameworkDiagnostics({ throwOnFailure = false } = {}) {
  const foundation = runResearchRepositoryFoundationDiagnostics(); const population = runPopulationWorkflowDiagnostics(); const peterWoods = runPeterWoodsResearchMigrationDiagnostics();
  const valid = migrationApi.buildResearchMigration(base());
  const noObservations = migrationApi.buildResearchMigration(base("labels-no-observation", { recordedObservationDeclaration: null, analyticalObservationDeclaration: null, evidenceArtifactDeclaration: null }));
  const noLabels = migrationApi.buildResearchMigration(base("no-labels", { sourceLabels: [] }));
  const malformed = migrationApi.buildResearchMigration(base("malformed", { subjectRef: "***" }));
  const duplicate = migrationApi.buildResearchMigration(base("duplicate", { sourceLabels: ["Film", "film"] }));
  const unknownCycle = migrationApi.buildResearchMigration(base("unknown-cycle", { legacyCycleRef: null, targetCycleRef: null }));
  const conflictingCycles = migrationApi.buildResearchMigration(base("cycle-conflict", { legacyCycleRef: "draft-cycle:2026", targetCycleRef: "draft-cycle:2027" }));
  const missingReview = migrationApi.buildResearchMigration(base("missing-review", { humanReviewRequired: false, humanReviewCompleted: false }));
  const automaticApproval = migrationApi.buildResearchMigration(base("automatic-approval", { requestedSourceStatus: "APPROVED" }));
  const cases = [
    check("research-repository-baseline", () => assert(foundation.failed === 0, "Research Repository baseline failed.", foundation)),
    check("population-baseline", () => assert(population.total === 60 && population.failed === 0, "Population baseline changed.", population)),
    check("valid-structural-migration", () => assert(valid.input.validation.valid && valid.result.validation.valid && Object.values(valid.records).every((record) => record.validation.valid), "Structural migration is invalid.", valid)),
    check("source-labels-with-no-observations", () => assert(noObservations.result.legacySourceLabels.length === 1 && !noObservations.records.recordedObservation && noObservations.result.blockers.some((entry) => entry.blockerType === "MISSING_OBSERVATION"), "Label-only input invented observations.", noObservations)),
    check("no-source-labels", () => assert(noLabels.result.blockers.some((entry) => entry.blockerType === "MISSING_SOURCE_LABEL"), "Missing labels were not reported.", noLabels.result)),
    check("malformed-subject-reference", () => assert(!malformed.input.validation.valid && malformed.result.readiness === "BLOCKED", "Malformed subject was accepted.", malformed)),
    check("duplicate-labels", () => assert(!duplicate.input.validation.valid && duplicate.result.blockers.some((entry) => entry.blockerType === "DUPLICATE_SOURCE_LABEL"), "Duplicate labels were accepted.", duplicate)),
    check("unknown-cycle", () => assert(unknownCycle.result.blockers.some((entry) => entry.blockerType === "UNKNOWN_CYCLE") && unknownCycle.result.unresolvedValues.includes("UNKNOWN_CYCLE"), "Unknown cycle was inferred.", unknownCycle.result)),
    check("conflicting-cycles", () => assert(conflictingCycles.result.blockers.some((entry) => entry.blockerType === "CYCLE_CONFLICT") && conflictingCycles.result.unresolvedValues.includes("CYCLE_CONFLICT"), "Cycle conflict was resolved.", conflictingCycles.result)),
    check("missing-human-review", () => assert(missingReview.result.blockers.some((entry) => entry.blockerType === "HUMAN_REVIEW_REQUIRED"), "Missing review was accepted.", missingReview.result)),
    check("automatic-source-approval-rejected", () => assert(!automaticApproval.input.validation.valid && automaticApproval.result.blockers.some((entry) => entry.blockerType === "AUTOMATIC_APPROVAL_PROHIBITED") && !Object.values(automaticApproval.records).some((entry) => entry.status === researchRepository.RESEARCH_SOURCE_STATUSES.APPROVED), "Automatic approval entered governed records.", automaticApproval)),
    check("strict-concept-separation", () => assert(valid.result.legacySourceLabels.every((entry) => entry.verificationState === "UNVERIFIED" && entry.governedSourceRef === null) && valid.records.source.status === "CANDIDATE" && valid.records.evidenceArtifact.contract === "EvidenceArtifact" && valid.records.recordedObservation.contract === "RecordedObservation" && valid.records.analyticalObservation.contract === "AnalyticalObservation", "Research concepts were collapsed.", valid)),
    check("zero-external-effects", () => assert([valid, noObservations, noLabels, malformed, duplicate, unknownCycle, conflictingCycles, missingReview, automaticApproval].every((entry) => effectKeys.every((key) => entry.result[key] === false)), "External effect was reported.", valid.result)),
    check("peter-woods-regression", () => assert(peterWoods.total === 10 && peterWoods.failed === 0 && peterWoods.migrationReport.readiness === "BLOCKED" && Object.values(peterWoods.migrationReport.externalSideEffects).every((value) => value === false), "Sprint 36 Peter Woods outcome changed.", peterWoods)),
  ];
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const result = { suite: SUITE, total: cases.length, passed, failed, cases, baselines: { researchRepository: { total: foundation.total, passed: foundation.passed, failed: foundation.failed }, population: { total: population.total, passed: population.passed, failed: population.failed }, peterWoods: { total: peterWoods.total, passed: peterWoods.passed, failed: peterWoods.failed } }, sampleResult: valid.result };
  if (throwOnFailure && failed) throw new Error(`${SUITE} failed ${failed} of ${cases.length} checks.`); return result;
}
export default Object.freeze({ runResearchMigrationFrameworkDiagnostics });
