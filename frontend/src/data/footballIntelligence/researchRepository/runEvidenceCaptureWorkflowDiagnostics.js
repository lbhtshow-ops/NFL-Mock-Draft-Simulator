import researchRepository from "../../researchRepository/index.js";
import { runResearchRepositoryFoundationDiagnostics } from "../../researchRepository/diagnostics/runResearchRepositoryFoundationDiagnostics.js";
import { runResearchMigrationFrameworkDiagnostics } from "./runResearchMigrationFrameworkDiagnostics.js";
import { runResearchSourceIntakeDiagnostics } from "./runResearchSourceIntakeDiagnostics.js";
import { reviewResearchSourceCandidate } from "./sourceIntake/ResearchSourceIntakeReview.js";
import { createCompleteSourceCandidate } from "./sourceIntake/fixtures/researchSourceIntakeFixtures.js";
import evidenceCapture from "./evidenceCapture/index.js";
import { createApprovedSyntheticResearchSource, createEvidenceCaptureFixture } from "./evidenceCapture/fixtures/evidenceCaptureFixtures.js";

const SUITE = "EvidenceCaptureWorkflowDiagnostics";
const assert = (condition, message, details = null) => { if (!condition) { const error = new Error(message); error.details = details; throw error; } };
const has = (capture, type) => capture.result.blockers.some((entry) => entry.blockerType === type);
const check = (id, fn) => { try { fn(); return { id, passed: true, message: `${id} passed.`, details: null }; } catch (error) { return { id, passed: false, message: error?.message ?? `${id} failed.`, details: error?.details ?? null }; } };
const run = (suffix, overrides = {}) => evidenceCapture.runEvidenceCaptureWorkflow(createEvidenceCaptureFixture({ captureId: `capture:${suffix}`, sessionRef: `session:${suffix}`, observationId: `observation:${suffix}`, artifactId: `artifact:${suffix}`, ...overrides }));

export function runEvidenceCaptureWorkflowDiagnostics({ throwOnFailure = false } = {}) {
  const foundation = runResearchRepositoryFoundationDiagnostics(); const sprint38 = runResearchSourceIntakeDiagnostics(); const sprint37 = runResearchMigrationFrameworkDiagnostics();
  const ready = run("ready");
  const candidateSource = createApprovedSyntheticResearchSource({ sourceId: "source:candidate", status: researchRepository.RESEARCH_SOURCE_STATUSES.CANDIDATE });
  const candidate = run("candidate", { approvedSource: candidateSource, sourceRef: candidateSource.sourceId, observationSourceRefs: [candidateSource.sourceId] });
  const rejectedIntake = reviewResearchSourceCandidate(createCompleteSourceCandidate({ intakeId: "source-intake:rejected-capture", candidateId: "source:rejected-intake", reviewerId: "reviewer:authorized", reviewerAuthorized: true, reviewDate: "2026-07-18", reviewDecision: "REJECT", rejectionReason: "Synthetic rejection declaration." }));
  const rejected = run("rejected", { approvedSource: rejectedIntake.source, sourceRef: rejectedIntake.source.sourceId, observationSourceRefs: [rejectedIntake.source.sourceId] });
  const missingArtifact = run("missing-artifact", { artifactId: null, artifactLocation: null }); const missingSource = run("missing-source", { sourceRef: null, observationSourceRefs: [] }); const missingSession = run("missing-session", { sessionRef: null });
  const unsupportedObservation = run("unsupported-observation", { observationSourceRefs: [] });
  const analysis = { analysisId: "analysis:valid", text: "The explicitly recorded synthetic identifier is internally consistent with the retained-content reference.", recordedObservationRefs: ["observation:analysis-valid"] };
  const validAnalysis = run("analysis-valid", { observationId: "observation:analysis-valid", analysis });
  const invalidAnalysis = run("analysis-invalid", { analysis: { analysisId: "analysis:invalid", text: "Synthetic analysis declaration.", recordedObservationRefs: [] } });
  const duplicate = run("duplicate", { duplicateArtifactRefs: ["artifact:existing"] }); const conflictingSubject = run("subject-conflict", { subjectRef: "subject:capture", sessionSubjectRef: "subject:session" }); const missingReview = run("missing-review", { humanReview: null });
  const restrictedRole = run("restricted-role", { requestedResearchRole: researchRepository.RESEARCH_ROLES.DIRECT_EVIDENCE });
  const all = [ready, candidate, rejected, missingArtifact, missingSource, missingSession, unsupportedObservation, validAnalysis, invalidAnalysis, duplicate, conflictingSubject, missingReview, restrictedRole];
  const effects = ["analyticalApprovalImplied", "populationReadinessChanged", "fiisIntakePerformed", "promotionPerformed", "canonicalRecordCreated", "persistencePerformed", "runtimeIntegrationPerformed"];
  const cases = [
    check("approved-source-recorded-observation-artifact", () => assert(ready.result.readiness === "READY_FOR_REPOSITORY_REVIEW" && ready.records.recordedObservation.validation.valid && ready.records.evidenceArtifact.validation.valid && ready.records.evidenceArtifact.sourceRefs.includes(ready.input.sourceRef) && ready.records.evidenceArtifact.sessionRef === ready.input.sessionRef, "Approved-source capture failed.", ready)),
    check("candidate-source-attempt", () => assert(has(candidate, "SOURCE_NOT_APPROVED") && candidate.result.readiness === "BLOCKED" && candidate.records.evidenceArtifact.state === "DRAFT", "Candidate source created ready evidence.", candidate)),
    check("rejected-intake-attempt", () => assert(rejectedIntake.outcome === "REJECTED" && has(rejected, "SOURCE_NOT_APPROVED") && rejected.result.readiness === "BLOCKED", "Rejected intake supported ready evidence.", rejected)),
    check("missing-artifact-identity", () => assert(has(missingArtifact, "MISSING_ARTIFACT_IDENTITY"), "Missing artifact was accepted.", missingArtifact)),
    check("missing-source-reference", () => assert(has(missingSource, "MISSING_SOURCE_REFERENCE"), "Missing source was accepted.", missingSource)),
    check("missing-session-reference", () => assert(has(missingSession, "MISSING_SESSION_REFERENCE"), "Missing session was accepted.", missingSession)),
    check("observation-without-source-support", () => assert(has(unsupportedObservation, "OBSERVATION_SOURCE_SUPPORT_MISSING"), "Unsupported observation was accepted.", unsupportedObservation)),
    check("analysis-with-valid-observation-support", () => assert(validAnalysis.records.analyticalObservation?.validation.valid && validAnalysis.records.analyticalObservation.recordedObservationRefs.includes(validAnalysis.input.observationId) && validAnalysis.records.analyticalObservation.verification.state === "UNVERIFIED", "Supported analysis failed or implied approval.", validAnalysis)),
    check("analysis-without-support", () => assert(has(invalidAnalysis, "ANALYSIS_SUPPORT_MISSING") && !invalidAnalysis.records.analyticalObservation, "Unsupported analysis was created.", invalidAnalysis)),
    check("duplicate-evidence-artifact", () => assert(has(duplicate, "DUPLICATE_EVIDENCE_ARTIFACT"), "Duplicate artifact was not detected.", duplicate)),
    check("conflicting-subject-references", () => assert(has(conflictingSubject, "CONFLICTING_SUBJECT_REFERENCE"), "Subject conflict was resolved.", conflictingSubject)),
    check("missing-human-review", () => assert(has(missingReview, "HUMAN_REVIEW_MISSING"), "Missing review was accepted.", missingReview)),
    check("restricted-source-role", () => assert(has(restrictedRole, "RESEARCH_ROLE_NOT_PERMITTED"), "Unpermitted source role was accepted.", restrictedRole)),
    check("zero-external-effects", () => assert(all.every((capture) => effects.every((key) => capture.result[key] === false)), "External effect occurred.", all)),
    check("research-repository-regression", () => assert(foundation.total === 60 && foundation.failed === 0, "Research Repository baseline failed.", foundation)),
    check("sprint-38-source-intake-regression", () => assert(sprint38.total === 17 && sprint38.failed === 0, "Sprint 38 regression failed.", sprint38)),
    check("sprint-37-migration-regression", () => assert(sprint37.total === 14 && sprint37.failed === 0, "Sprint 37 regression failed.", sprint37)),
  ];
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const result = { suite: SUITE, total: cases.length, passed, failed, cases, examples: { ready: ready.result, blocked: missingArtifact.result }, regressions: { researchRepository: { total: foundation.total, passed: foundation.passed, failed: foundation.failed }, sprint38: { total: sprint38.total, passed: sprint38.passed, failed: sprint38.failed }, sprint37: { total: sprint37.total, passed: sprint37.passed, failed: sprint37.failed } } };
  if (throwOnFailure && failed) throw new Error(`${SUITE} failed ${failed} of ${cases.length} checks.`); return result;
}
export default Object.freeze({ runEvidenceCaptureWorkflowDiagnostics });
