import { runPopulationWorkflowDiagnostics } from "../fid/population/runPopulationWorkflowDiagnostics.js";
import { runResearchMigrationFrameworkDiagnostics } from "./runResearchMigrationFrameworkDiagnostics.js";
import { runResearchSourceIntakeDiagnostics } from "./runResearchSourceIntakeDiagnostics.js";
import { runEvidenceCaptureWorkflowDiagnostics } from "./runEvidenceCaptureWorkflowDiagnostics.js";
import linkageApi from "./evidenceLinkage/index.js";
import { createEvidencePopulationLinkFixture, createSyntheticRepositoryEvidence } from "./evidenceLinkage/fixtures/evidencePopulationLinkFixtures.js";

const SUITE = "EvidencePopulationLinkWorkflowDiagnostics";
const assert = (condition, message, details = null) => { if (!condition) { const error = new Error(message); error.details = details; throw error; } };
const check = (id, fn) => { try { fn(); return { id, passed: true, message: `${id} passed.`, details: null }; } catch (error) { return { id, passed: false, message: error?.message ?? `${id} failed.`, details: error?.details ?? null }; } };
const run = (suffix, overrides = {}, options = {}) => { const fixture = createEvidencePopulationLinkFixture({ linkId: `link:${suffix}`, ...overrides }, options); return { ...linkageApi.runEvidencePopulationLinkWorkflow(fixture), fixture }; };
const has = (value, type) => value.result.blockers.some((entry) => entry.blockerType === type);

export function runEvidencePopulationLinkWorkflowDiagnostics({ throwOnFailure = false } = {}) {
  const populationBaseline = runPopulationWorkflowDiagnostics(); const sprint39 = runEvidenceCaptureWorkflowDiagnostics(); const sprint38 = runResearchSourceIntakeDiagnostics(); const sprint37 = runResearchMigrationFrameworkDiagnostics();
  const trace = run("trace"); const approved = run("approved", {}, { approved: true });
  const draftCoverage = run("draft-coverage", { populationUseDecision: "APPROVE" });
  const pendingRecords = createSyntheticRepositoryEvidence({ approved: false });
  const pendingObservation = run("pending-observation", { recordedObservations: [pendingRecords.recordedObservation] }, { approved: true });
  const analysisOnly = run("analysis-only", { recordedObservationRefs: [], recordedObservations: [] }, { analysis: true });
  const missingWorkflow = run("missing-workflow", { populationWorkflowRef: null }); const missingArtifact = run("missing-artifact", { evidenceArtifactRefs: [] }); const missingSource = run("missing-source", { researchSourceRef: null });
  const subjectMismatch = run("subject-mismatch", { subjectRef: "subject:other" }); const cycleMismatch = run("cycle-mismatch", { cycleRef: "draft-cycle:2026" }); const unsupportedCategory = run("unsupported-category", { populationEvidenceCategory: "QUARTERBACK_THROWING_GRADE" });
  const duplicate = run("duplicate", { duplicateLinkRefs: ["link:prior"] }); const conflictingSource = run("source-conflict", { conflictingSourceRefs: ["research-source:other"] }); const missingReview = run("missing-review", { reviewer: null }); const unauthorized = run("unauthorized", { populationUseDecision: "APPROVE", reviewer: { reviewerRef: "reviewer:unknown", reviewedAt: "2026-07-18", authorized: false } }, { approved: true });
  const all = [trace, approved, draftCoverage, pendingObservation, analysisOnly, missingWorkflow, missingArtifact, missingSource, subjectMismatch, cycleMismatch, unsupportedCategory, duplicate, conflictingSource, missingReview, unauthorized];
  const traceOriginalWorkflow = JSON.stringify(trace.fixture.populationWorkflow); const traceOriginalResult = JSON.stringify(trace.fixture.populationResult);
  const effects = ["originalWorkflowMutated", "originalPopulationResultMutated", "persistencePerformed", "promotionPerformed", "canonicalRecordCreated", "fiisExecutionPerformed", "runtimeIntegrationPerformed", "uiIntegrationPerformed", "simulatorIntegrationPerformed", "supabaseUsed"];
  const cases = [
    check("draft-artifact-traceability-only", () => assert(trace.result.readiness === "TRACEABILITY_LINKED" && trace.result.evidenceExists && trace.result.structurallyLinked && !trace.result.approvedForPopulationUse && !trace.result.countsTowardPopulationCoverage, "Draft traceability distinction failed.", trace.result)),
    check("explicit-population-use-approval", () => assert(approved.result.readiness === "APPROVED_FOR_POPULATION_USE" && approved.result.approvedForPopulationUse && approved.result.countsTowardPopulationCoverage, "Explicit Population approval failed.", approved.result)),
    check("draft-artifact-coverage-attempt", () => assert(has(draftCoverage, "REPOSITORY_EVIDENCE_NOT_APPROVED") && !draftCoverage.result.countsTowardPopulationCoverage, "Draft artifact counted toward coverage.", draftCoverage.result)),
    check("pending-observation-verified-attempt", () => assert(has(pendingObservation, "PENDING_OBSERVATION") && !pendingObservation.result.countsTowardPopulationCoverage, "Pending observation counted as verified.", pendingObservation.result)),
    check("analysis-only-without-recorded-support", () => assert(has(analysisOnly, "MISSING_RECORDED_OBSERVATION") && has(analysisOnly, "ANALYSIS_WITHOUT_RECORDED_SUPPORT"), "Analysis-only link was accepted.", analysisOnly.result)),
    check("missing-population-workflow-reference", () => assert(has(missingWorkflow, "MISSING_POPULATION_WORKFLOW"), "Missing workflow was accepted.", missingWorkflow.result)),
    check("missing-evidence-artifact-reference", () => assert(has(missingArtifact, "MISSING_EVIDENCE_ARTIFACT"), "Missing artifact was accepted.", missingArtifact.result)),
    check("missing-research-source-reference", () => assert(has(missingSource, "MISSING_RESEARCH_SOURCE"), "Missing source was accepted.", missingSource.result)),
    check("subject-mismatch", () => assert(has(subjectMismatch, "SUBJECT_MISMATCH"), "Subject mismatch was resolved.", subjectMismatch.result)),
    check("draft-cycle-mismatch", () => assert(has(cycleMismatch, "CYCLE_MISMATCH"), "Cycle mismatch was resolved.", cycleMismatch.result)),
    check("unsupported-population-category", () => assert(has(unsupportedCategory, "UNSUPPORTED_EVIDENCE_CATEGORY"), "Unsupported category was accepted.", unsupportedCategory.result)),
    check("duplicate-linkage", () => assert(has(duplicate, "DUPLICATE_LINKAGE"), "Duplicate link was accepted.", duplicate.result)),
    check("conflicting-source-references", () => assert(has(conflictingSource, "CONFLICTING_SOURCE_REFERENCE"), "Conflicting source was resolved.", conflictingSource.result)),
    check("missing-human-review", () => assert(has(missingReview, "HUMAN_REVIEW_MISSING") && !missingReview.result.approvedForPopulationUse, "Missing review implied approval.", missingReview.result)),
    check("unauthorized-population-approval", () => assert(has(unauthorized, "UNAUTHORIZED_POPULATION_USE") && !unauthorized.result.countsTowardPopulationCoverage, "Unauthorized approval succeeded.", unauthorized.result)),
    check("original-population-workflow-unchanged", () => assert(!trace.result.originalWorkflowMutated && JSON.stringify(trace.fixture.populationWorkflow) === traceOriginalWorkflow, "Original workflow changed.", trace.result)),
    check("original-population-result-unchanged", () => assert(!trace.result.originalPopulationResultMutated && JSON.stringify(trace.fixture.populationResult) === traceOriginalResult, "Original result changed.", trace.result)),
    check("zero-external-effects", () => assert(all.every((entry) => effects.every((key) => entry.result[key] === false)), "External effect occurred.", all)),
    check("population-regression", () => assert(populationBaseline.total === 60 && populationBaseline.failed === 0, "Population baseline failed.", populationBaseline)),
    check("sprint-39-evidence-capture-regression", () => assert(sprint39.total === 17 && sprint39.failed === 0, "Sprint 39 regression failed.", sprint39)),
    check("sprint-38-source-intake-regression", () => assert(sprint38.total === 17 && sprint38.failed === 0, "Sprint 38 regression failed.", sprint38)),
    check("sprint-37-migration-regression", () => assert(sprint37.total === 14 && sprint37.failed === 0, "Sprint 37 regression failed.", sprint37)),
  ];
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const result = { suite: SUITE, total: cases.length, passed, failed, cases, examples: { traceabilityOnly: trace.result, populationApproved: approved.result }, coverageImpact: { traceabilityOnly: trace.result.coverageImpact, populationApproved: approved.result.coverageImpact }, regressions: { population: { total: populationBaseline.total, passed: populationBaseline.passed, failed: populationBaseline.failed }, sprint39: { total: sprint39.total, passed: sprint39.passed, failed: sprint39.failed }, sprint38: { total: sprint38.total, passed: sprint38.passed, failed: sprint38.failed }, sprint37: { total: sprint37.total, passed: sprint37.passed, failed: sprint37.failed } } };
  if (throwOnFailure && failed) throw new Error(`${SUITE} failed ${failed} of ${cases.length} checks.`); return result;
}
export default Object.freeze({ runEvidencePopulationLinkWorkflowDiagnostics });
