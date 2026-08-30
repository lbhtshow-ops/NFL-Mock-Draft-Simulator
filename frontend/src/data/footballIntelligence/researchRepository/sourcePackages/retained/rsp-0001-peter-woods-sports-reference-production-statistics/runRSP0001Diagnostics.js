import { sourceIntakeDeclaration, sourceIntakeReview, researchSource } from "./sourceIntake.js";
import { researchSession as pendingResearchSession } from "./researchSession.js";
import { recordedObservations as pendingRecordedObservations } from "./recordedObservations.js";
import { analyticalObservations } from "./analyticalObservations.js";
import { evidenceArtifact as pendingEvidenceArtifact } from "./evidenceArtifact.js";
import { reviewerDeclaration, sessionReview, observationReviews, artifactReview, researchSession, recordedObservations, evidenceArtifact, evidenceReviewDecisions } from "./evidenceReview.js";
import { packageReviewDecision, packageManifest, packageAssessment } from "./packageManifest.js";
import { populationWorkflow, populationResult } from "./populationLinkDeclaration.js";
import { populationAuthorizationDecision, populationLink, populationLinkageAssessment } from "./populationLinkage.js";
import { runArtifactScopedResearchSourcePackageDiagnostics } from "../../../runArtifactScopedResearchSourcePackageDiagnostics.js";

const assert = (condition, message, details = null) => { if (!condition) throw Object.assign(new Error(message), { details }); };
const check = (id, fn) => { try { fn(); return { id, passed: true }; } catch (error) { return { id, passed: false, message: error.message, details: error.details ?? null }; } };
const originalValues = pendingRecordedObservations.map((entry) => entry.record.valueText);
const reviewedValues = recordedObservations.map((entry) => entry.record.valueText);

export function runRSP0001Diagnostics({ throwOnFailure = false } = {}) {
  const sprint45 = runArtifactScopedResearchSourcePackageDiagnostics(); const originalWorkflow = JSON.stringify(populationWorkflow); const originalResult = JSON.stringify(populationResult); const population = populationLinkageAssessment.result;
  const cases = [
    check("source-review-decision-present", () => assert(sourceIntakeReview.declaration.reviewDecision === "APPROVE", "Source approval is absent.")),
    check("reviewer-explicit-and-valid", () => assert(reviewerDeclaration.reviewerRef === "reviewer:repository-owner" && reviewerDeclaration.reviewerAuthorized && evidenceReviewDecisions.every((entry) => entry.validation.valid), "Reviewer declaration is invalid.")),
    check("source-state-matches-review", () => assert(sourceIntakeReview.approved && sourceIntakeReview.outcome === "APPROVED" && researchSource.status === "APPROVED", "Source state conflicts with review.", sourceIntakeReview)),
    check("unknown-metadata-preserved", () => assert(sourceIntakeDeclaration.author === "UNAVAILABLE" && sourceIntakeDeclaration.publicationDate === "UNKNOWN" && sourceIntakeDeclaration.methodology.notes === "UNKNOWN", "Unknown metadata was replaced.")),
    check("session-review-present", () => assert(sessionReview.decision.reviewScope === "RESEARCH_SESSION" && sessionReview.decision.decision === "APPROVE" && sessionReview.result.outcome === "VERIFIED", "Session review is absent or blocked.", sessionReview.result)),
    check("session-state-matches-review", () => assert(pendingResearchSession.verification.state === "PENDING_REVIEW" && researchSession.verification.state === "VERIFIED" && researchSession.verification.verifiedBy === reviewerDeclaration.reviewerRef, "Session transition failed.")),
    check("five-independent-observation-reviews", () => assert(observationReviews.length === 5 && new Set(observationReviews.map((entry) => entry.decision.targetRef)).size === 5 && observationReviews.every((entry) => entry.result.outcome === "VERIFIED"), "Observation reviews are incomplete.")),
    check("all-observations-verified", () => assert(recordedObservations.every((entry) => entry.verification.state === "VERIFIED" && entry.verification.verifiedBy === reviewerDeclaration.reviewerRef), "An observation is not verified.")),
    check("observation-values-unchanged", () => assert(JSON.stringify(originalValues) === JSON.stringify(reviewedValues), "An observation value changed during review.", { originalValues, reviewedValues })),
    check("observation-locators-unchanged", () => assert(recordedObservations.every((entry, index) => JSON.stringify(entry.spatial.documentLocator) === JSON.stringify(pendingRecordedObservations[index].spatial.documentLocator)), "An observation locator changed.")),
    check("no-analytical-observations", () => assert(analyticalObservations.length === 0 && evidenceArtifact.analyticalObservationRefs.length === 0, "An AnalyticalObservation was introduced.")),
    check("evidence-review-decision-present", () => assert(artifactReview.decision.reviewScope === "EVIDENCE_ARTIFACT" && artifactReview.decision.decision === "APPROVE" && artifactReview.result.outcome === "VERIFIED", "Artifact review is absent or blocked.", artifactReview.result)),
    check("artifact-state-matches-review", () => assert(pendingEvidenceArtifact.state === "DRAFT" && evidenceArtifact.state === "ACTIVE" && evidenceArtifact.verification.state === "VERIFIED" && evidenceArtifact.review.outcome === "ACCEPTED", "Artifact transition failed.")),
    check("evidence-production-only", () => assert(evidenceArtifact.classification.categories.length === 1 && evidenceArtifact.classification.categories[0] === "PRODUCTION", "Evidence category leaked.")),
    check("artifact-lineage-complete", () => assert(evidenceArtifact.sourceRefs.length === 1 && evidenceArtifact.sessionRef === researchSession.sessionId && evidenceArtifact.recordedObservationRefs.length === 5, "Artifact lineage is incomplete.")),
    check("package-review-decision-present", () => assert(packageReviewDecision.decision === "APPROVE" && packageReviewDecision.reviewerAuthorized, "Package review is absent.")),
    check("package-state-matches-prerequisites", () => assert(packageManifest.status === "APPROVED" && packageAssessment.packageApproved && packageAssessment.blockers.length === 0, "Package approval failed.", packageAssessment)),
    check("package-remains-artifact-scoped", () => assert(packageManifest.researchSourceRef === researchSource.sourceId && researchSource.access.location === "https://www.sports-reference.com/cfb/players/peter-woods-1.html", "Package artifact scope changed.")),
    check("population-evaluated-separately", () => assert(populationAuthorizationDecision.decision === "APPROVE" && packageReviewDecision.populationUseAuthorized === false && populationLink.populationUseDecision === "APPROVE", "Population authorization was coupled to package approval.")),
    check("population-production-only", () => assert(populationLink.populationEvidenceCategory === "PRODUCTION" && population.coverageImpact.category === "PRODUCTION", "Population category leaked.")),
    check("population-authorization-valid", () => assert(population.readiness === "APPROVED_FOR_POPULATION_USE" && population.approvedForPopulationUse && population.countsTowardPopulationCoverage && population.blockers.length === 0, "Production authorization failed.", population)),
    check("cycle-conflict-preserved", () => { const classYear = populationWorkflow.evidenceDeclarations.find((entry) => entry.category === "CLASS_YEAR"); assert(classYear.status === "PARTIAL" && classYear.limitations.some((entry) => entry.includes("2026") && entry.includes("2027")) && populationResult.status === "BLOCKED" && population.derivedPopulationResult.status === "BLOCKED", "The cycle conflict was resolved or bypassed."); }),
    check("original-population-unchanged", () => assert(JSON.stringify(populationWorkflow) === originalWorkflow && JSON.stringify(populationResult) === originalResult && !population.originalWorkflowMutated && !population.originalPopulationResultMutated, "Original Population records changed.")),
    check("zero-external-effects", () => assert(["persistencePerformed", "promotionPerformed", "canonicalRecordCreated", "fiisExecutionPerformed", "runtimeIntegrationPerformed", "uiIntegrationPerformed", "simulatorIntegrationPerformed", "supabaseUsed"].every((key) => population[key] === false), "An external effect occurred.")),
    check("sprint45-regression", () => assert(sprint45.failed === 0, "Sprint 45 regression failed.", sprint45)),
    check("sprint44-regression", () => assert(sprint45.regressions.sprint44.failed === 0, "Sprint 44 regression failed.", sprint45.regressions)),
    check("sprint43-regression", () => assert(sprint45.regressions.sprint43.failed === 0, "Sprint 43 regression failed.", sprint45.regressions)),
    check("research-repository-regression", () => assert(sprint45.regressions.researchRepository.failed === 0, "Research Repository baseline failed.", sprint45.regressions)),
    check("sprint41-through37-regressions", () => assert(["sprint41", "sprint40", "sprint39", "sprint38", "sprint37"].every((key) => sprint45.regressions[key].failed === 0), "A Sprint 41–37 regression failed.", sprint45.regressions)),
  ];
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed; const result = { suite: "PeterWoodsRSP0001HumanReviewDiagnostics", total: cases.length, passed, failed, cases, reviewer: reviewerDeclaration, decisions: { source: sourceIntakeReview.declaration.reviewDecision, session: sessionReview.decision.decision, observations: observationReviews.map((entry) => entry.decision.decision), artifact: artifactReview.decision.decision, package: packageReviewDecision.decision, population: populationAuthorizationDecision.decision }, governance: { source: researchSource.status, session: researchSession.verification.state, observations: recordedObservations.map((entry) => entry.verification.state), artifact: `${evidenceArtifact.state}/${evidenceArtifact.verification.state}`, package: packageManifest.status, population: population.readiness, populationCountsTowardCoverage: population.countsTowardPopulationCoverage, originalPopulationStatus: populationResult.status, derivedPopulationStatus: population.derivedPopulationResult.status }, remainingBlockers: populationResult.blockers.map((entry) => entry.code), regressions: sprint45.regressions };
  if (throwOnFailure && failed) throw new Error(`${result.suite} failed ${failed} of ${result.total} checks.`); return result;
}

export default Object.freeze({ runRSP0001Diagnostics });
