import { runResearchRepositoryFoundationDiagnostics } from "../../researchRepository/diagnostics/runResearchRepositoryFoundationDiagnostics.js";
import { runResearchMigrationFrameworkDiagnostics } from "./runResearchMigrationFrameworkDiagnostics.js";
import { runResearchSourceIntakeDiagnostics } from "./runResearchSourceIntakeDiagnostics.js";
import { runEvidenceCaptureWorkflowDiagnostics } from "./runEvidenceCaptureWorkflowDiagnostics.js";
import { runEvidencePopulationLinkWorkflowDiagnostics } from "./runEvidencePopulationLinkWorkflowDiagnostics.js";
import reviewApi from "./evidenceReview/index.js";
import { createEvidenceReviewFixture } from "./evidenceReview/fixtures/evidenceReviewFixtures.js";

const SUITE = "EvidenceReviewWorkflowDiagnostics";
const assert = (condition, message, details = null) => { if (!condition) { const error = new Error(message); error.details = details; throw error; } };
const check = (id, fn) => { try { fn(); return { id, passed: true, message: `${id} passed.`, details: null }; } catch (error) { return { id, passed: false, message: error?.message ?? `${id} failed.`, details: error?.details ?? null }; } };
const run = (suffix, overrides = {}) => { const fixture = createEvidenceReviewFixture({ reviewId: `review:${suffix}`, ...overrides }); return { ...reviewApi.runEvidenceReviewWorkflow(fixture), fixture }; };
const has = (entry, type) => entry.result.blockers.some((blocker) => blocker.blockerType === type);

export function runEvidenceReviewWorkflowDiagnostics({ throwOnFailure = false } = {}) {
  const foundation = runResearchRepositoryFoundationDiagnostics(); const sprint40 = runEvidencePopulationLinkWorkflowDiagnostics(); const sprint39 = runEvidenceCaptureWorkflowDiagnostics(); const sprint38 = runResearchSourceIntakeDiagnostics(); const sprint37 = runResearchMigrationFrameworkDiagnostics();
  const verifiedObservation = run("observation-verified"); const verifiedRecord = verifiedObservation.result.derivedRecords.recordedObservation;
  const rejectedObservation = run("observation-rejected", { decision: "REJECT", rejectionReasons: ["Explicit synthetic rejection reason."] }); const changesObservation = run("observation-changes", { decision: "REQUEST_CHANGES", requestedChanges: ["Clarify the retained-content locator."] });
  const missingAuthorization = run("missing-authorization", { reviewerAuthorized: false }); const missingSource = run("missing-source", { researchSource: null }); const missingSession = run("missing-session", { researchSession: null }); const subjectMismatch = run("subject-mismatch", { subjectRef: "subject:other" }); const sourceMismatch = run("source-mismatch", { sourceRef: "source:other" }); const sessionMismatch = run("session-mismatch", { sessionRef: "session:other" });
  const base = createEvidenceReviewFixture(); const analysisRef = base.analyticalObservations[0].analysisId;
  const verifiedAnalysis = run("analysis-verified", { reviewScope: "ANALYTICAL_OBSERVATION", targetRef: analysisRef, recordedObservations: [verifiedRecord], supportingObservationRefs: [verifiedRecord.observationId] }); const reviewedAnalysis = verifiedAnalysis.result.derivedRecords.analyticalObservation;
  const analysisMissingSupport = run("analysis-missing-support", { reviewScope: "ANALYTICAL_OBSERVATION", targetRef: analysisRef, supportingObservationRefs: [] });
  const analysisUnverifiedSupport = run("analysis-unverified-support", { reviewScope: "ANALYTICAL_OBSERVATION", targetRef: analysisRef });
  const rejectedAnalysis = run("analysis-rejected", { reviewScope: "ANALYTICAL_OBSERVATION", targetRef: analysisRef, decision: "REJECT", rejectionReasons: ["Analysis scope is unsupported."], supportingObservationRefs: [base.recordedObservations[0].observationId] });
  const artifactRef = base.evidenceArtifacts[0].evidenceId;
  const approvedArtifact = run("artifact-approved", { reviewScope: "EVIDENCE_ARTIFACT", targetRef: artifactRef, recordedObservations: [verifiedRecord], analyticalObservations: [reviewedAnalysis], supportingObservationRefs: [verifiedRecord.observationId], supportingAnalysisRefs: [reviewedAnalysis.analysisId] });
  const artifactPendingObservation = run("artifact-pending-observation", { reviewScope: "EVIDENCE_ARTIFACT", targetRef: artifactRef, supportingAnalysisRefs: [] });
  const artifactUnverifiedAnalysis = run("artifact-unverified-analysis", { reviewScope: "EVIDENCE_ARTIFACT", targetRef: artifactRef, recordedObservations: [verifiedRecord], supportingObservationRefs: [verifiedRecord.observationId] });
  const rejectedArtifact = run("artifact-rejected", { reviewScope: "EVIDENCE_ARTIFACT", targetRef: artifactRef, decision: "REJECT", rejectionReasons: ["Artifact provenance requires correction."], supportingAnalysisRefs: [] });
  const artifactConflict = run("artifact-conflict", { reviewScope: "EVIDENCE_ARTIFACT", targetRef: artifactRef, conflicts: ["retained-content:one conflicts with retained-content:two"] });
  const duplicate = run("duplicate-review", { duplicateReviewRefs: ["review:prior"] }); const massApproval = run("mass-approval", { reviewScope: "ALL_RECORDS", targetRef: "all-records" });
  const all = [verifiedObservation, rejectedObservation, changesObservation, missingAuthorization, missingSource, missingSession, subjectMismatch, sourceMismatch, sessionMismatch, verifiedAnalysis, analysisMissingSupport, analysisUnverifiedSupport, rejectedAnalysis, approvedArtifact, artifactPendingObservation, artifactUnverifiedAnalysis, rejectedArtifact, artifactConflict, duplicate, massApproval];
  const originalSnapshot = JSON.stringify(verifiedObservation.fixture); const effects = ["populationUseAuthorized", "originalRecordsMutated", "persistencePerformed", "canonicalRecordCreated", "promotionPerformed", "fiisExecutionPerformed", "supabaseUsed", "runtimeIntegrationPerformed", "resolverInvoked", "uiIntegrationPerformed", "simulatorIntegrationPerformed"];
  const cases = [
    check("recorded-observation-verified", () => assert(verifiedObservation.result.recordedObservationVerified && verifiedRecord.verification.state === "VERIFIED" && verifiedRecord.sourceRefs[0] === verifiedObservation.decision.sourceRef && verifiedRecord.sessionRef === verifiedObservation.decision.sessionRef, "Observation verification failed.", verifiedObservation.result)),
    check("recorded-observation-rejected", () => assert(rejectedObservation.result.outcome === "REJECTED" && rejectedObservation.result.derivedRecords.recordedObservation.verification.state === "REJECTED" && rejectedObservation.result.retainedReasons.length, "Observation rejection failed.", rejectedObservation.result)),
    check("recorded-observation-request-changes", () => assert(changesObservation.result.outcome === "CHANGES_REQUESTED" && changesObservation.result.retainedReasons.includes("Clarify the retained-content locator."), "Requested changes were lost.", changesObservation.result)),
    check("missing-reviewer-authorization", () => assert(has(missingAuthorization, "UNAUTHORIZED_REVIEWER"), "Missing authorization was accepted.", missingAuthorization.result)),
    check("missing-research-source", () => assert(has(missingSource, "MISSING_SOURCE"), "Missing source was accepted.", missingSource.result)),
    check("missing-research-session", () => assert(has(missingSession, "MISSING_SESSION"), "Missing session was accepted.", missingSession.result)),
    check("subject-mismatch", () => assert(has(subjectMismatch, "SUBJECT_MISMATCH"), "Subject mismatch was resolved.", subjectMismatch.result)),
    check("source-reference-mismatch", () => assert(has(sourceMismatch, "MISSING_SOURCE") || has(sourceMismatch, "SOURCE_MISMATCH"), "Source mismatch was accepted.", sourceMismatch.result)),
    check("session-reference-mismatch", () => assert(has(sessionMismatch, "MISSING_SESSION") || has(sessionMismatch, "SESSION_MISMATCH"), "Session mismatch was accepted.", sessionMismatch.result)),
    check("analytical-observation-verified", () => assert(verifiedAnalysis.result.analyticalObservationVerified && reviewedAnalysis.verification.state === "REVIEWED" && reviewedAnalysis.recordedObservationRefs.includes(verifiedRecord.observationId), "Analysis verification failed.", verifiedAnalysis.result)),
    check("analysis-missing-support", () => assert(has(analysisMissingSupport, "MISSING_ANALYSIS_SUPPORT"), "Missing analysis support was accepted.", analysisMissingSupport.result)),
    check("analysis-unverified-observation", () => assert(has(analysisUnverifiedSupport, "UNVERIFIED_OBSERVATION"), "Unverified support was accepted.", analysisUnverifiedSupport.result)),
    check("analysis-explicitly-rejected", () => assert(rejectedAnalysis.result.outcome === "REJECTED" && rejectedAnalysis.result.derivedRecords.analyticalObservation.verification.state === "REJECTED" && rejectedAnalysis.result.retainedReasons.length, "Analysis rejection failed.", rejectedAnalysis.result)),
    check("artifact-approved", () => assert(approvedArtifact.result.evidenceArtifactApproved && approvedArtifact.result.derivedRecords.evidenceArtifact.state === "ACTIVE" && approvedArtifact.result.derivedRecords.evidenceArtifact.verification.state === "VERIFIED", "Artifact approval failed.", approvedArtifact.result)),
    check("artifact-blocked-pending-observation", () => assert(has(artifactPendingObservation, "UNVERIFIED_OBSERVATION"), "Pending observation supported artifact approval.", artifactPendingObservation.result)),
    check("artifact-blocked-unverified-analysis", () => assert(has(artifactUnverifiedAnalysis, "UNVERIFIED_ANALYSIS"), "Unverified analysis supported artifact approval.", artifactUnverifiedAnalysis.result)),
    check("artifact-rejected-reason-retained", () => assert(rejectedArtifact.result.outcome === "REJECTED" && rejectedArtifact.result.derivedRecords.evidenceArtifact.state === "REJECTED" && rejectedArtifact.result.retainedReasons.length, "Artifact rejection failed.", rejectedArtifact.result)),
    check("artifact-retained-content-conflict", () => assert(has(artifactConflict, "ARTIFACT_REFERENCE_CONFLICT"), "Artifact conflict was resolved.", artifactConflict.result)),
    check("duplicate-review-submission", () => assert(has(duplicate, "DUPLICATE_REVIEW"), "Duplicate review was accepted.", duplicate.result)),
    check("mass-approval-prohibited", () => assert(has(massApproval, "MASS_APPROVAL_PROHIBITED"), "Mass approval succeeded.", massApproval.result)),
    check("original-records-unchanged", () => assert(!verifiedObservation.result.originalRecordsMutated && JSON.stringify(verifiedObservation.fixture) === originalSnapshot, "Original records changed.", verifiedObservation.result)),
    check("no-population-use-authorization", () => assert(all.every((entry) => entry.result.populationUseAuthorized === false), "Population use was authorized.", all)),
    check("zero-external-effects", () => assert(all.every((entry) => effects.every((key) => entry.result[key] === false)), "External effect occurred.", all)),
    check("research-repository-regression", () => assert(foundation.total === 60 && foundation.failed === 0, "Research Repository baseline failed.", foundation)),
    check("sprint-40-linkage-regression", () => assert(sprint40.total === 22 && sprint40.failed === 0, "Sprint 40 regression failed.", sprint40)),
    check("sprint-39-capture-regression", () => assert(sprint39.total === 17 && sprint39.failed === 0, "Sprint 39 regression failed.", sprint39)),
    check("sprint-38-intake-regression", () => assert(sprint38.total === 17 && sprint38.failed === 0, "Sprint 38 regression failed.", sprint38)),
    check("sprint-37-migration-regression", () => assert(sprint37.total === 14 && sprint37.failed === 0, "Sprint 37 regression failed.", sprint37)),
  ];
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const result = { suite: SUITE, total: cases.length, passed, failed, cases, examples: { verifiedRecordedObservation: verifiedObservation.result, verifiedAnalyticalObservation: verifiedAnalysis.result, approvedEvidenceArtifact: approvedArtifact.result, rejected: rejectedArtifact.result, blocked: artifactPendingObservation.result }, regressions: { researchRepository: { total: foundation.total, passed: foundation.passed, failed: foundation.failed }, sprint40: { total: sprint40.total, passed: sprint40.passed, failed: sprint40.failed }, sprint39: { total: sprint39.total, passed: sprint39.passed, failed: sprint39.failed }, sprint38: { total: sprint38.total, passed: sprint38.passed, failed: sprint38.failed }, sprint37: { total: sprint37.total, passed: sprint37.passed, failed: sprint37.failed } } };
  if (throwOnFailure && failed) throw new Error(`${SUITE} failed ${failed} of ${cases.length} checks.`); return result;
}
export default Object.freeze({ runEvidenceReviewWorkflowDiagnostics });
