import fidApi from "../../../../fid/index.js";
import { sourceIntakeDeclaration, researchSource } from "./sourceIntake.js";
import { recordedObservations as baselineObservations, observationByField } from "./recordedObservations.js";
import { analyticalObservations } from "./analyticalObservations.js";
import { reviewerDeclaration, sessionReview, observationReviews, artifactReview, researchSession, recordedObservations, evidenceArtifact, evidenceReviewDecisions } from "./evidenceReview.js";
import { populationLinks as pendingPopulationLinks, populationWorkflow, populationResult } from "./populationLinkDeclaration.js";
import { populationAuthorizationDecisions, populationLinks, populationLinkageAssessments, originalPopulationWorkflowSnapshot, originalPopulationResultSnapshot } from "./populationLinkage.js";
import { packageReviewDecision, packageManifest, packageAssessment } from "./packageManifest.js";
import { runRSP0001Diagnostics } from "../rsp-0001-peter-woods-sports-reference-production-statistics/runRSP0001Diagnostics.js";
import { runArtifactScopedResearchSourcePackageDiagnostics } from "../../../runArtifactScopedResearchSourcePackageDiagnostics.js";

const assert = (condition, message, details = null) => { if (!condition) throw Object.assign(new Error(message), { details }); };
const check = (id, fn) => { try { fn(); return { id, passed: true }; } catch (error) { return { id, passed: false, message: error.message, details: error.details ?? null }; } };
const categories = populationLinks.map((entry) => entry.populationEvidenceCategory);
const linkedObservationRefs = new Set(populationLinks.flatMap((entry) => entry.recordedObservationRefs));
const baseline = baselineObservations.map(({ record, spatial }) => ({ field: record.field, valueText: record.valueText, locator: spatial.documentLocator }));
const reviewed = recordedObservations.map(({ record, spatial }) => ({ field: record.field, valueText: record.valueText, locator: spatial.documentLocator }));
const derivedResults = populationLinkageAssessments.map((entry) => entry.result.derivedPopulationResult);
const hasMissing = (result, category) => result.blockers.some((entry) => entry.message.includes(category));

export function runRSP0002Diagnostics({ throwOnFailure = false } = {}) {
  const rsp0001 = runRSP0001Diagnostics();
  const sprint45 = runArtifactScopedResearchSourcePackageDiagnostics();
  const cases = [
    check("source-approved", () => assert(researchSource.status === "APPROVED" && sourceIntakeDeclaration.reviewDecision === "APPROVE", "Source is not approved.")),
    check("unknown-source-metadata-preserved", () => assert(sourceIntakeDeclaration.author === "UNAVAILABLE" && sourceIntakeDeclaration.publicationDate === "UNKNOWN" && sourceIntakeDeclaration.methodology.notes === "UNKNOWN", "Unknown metadata changed.")),
    check("reviewer-declaration-exact", () => assert(JSON.stringify(reviewerDeclaration) === JSON.stringify({ reviewerRef: "reviewer:repository-owner", reviewerAuthorized: true, reviewedAt: "2026-07-18" }), "Reviewer declaration differs.")),
    check("session-verified", () => assert(sessionReview.result.outcome === "VERIFIED" && researchSession.verification.state === "VERIFIED", "Session is not verified.")),
    check("eight-independent-observation-reviews", () => assert(observationReviews.length === 8 && new Set(observationReviews.map((entry) => entry.decision.targetRef)).size === 8, "Observations were not independently reviewed.")),
    check("all-observations-verified", () => assert(recordedObservations.every((entry) => entry.verification.state === "VERIFIED"), "An observation is not verified.")),
    check("observation-values-unchanged", () => assert(reviewed.every((entry, index) => entry.valueText === baseline[index].valueText), "An observation value changed.")),
    check("observation-locators-unchanged", () => assert(reviewed.every((entry, index) => JSON.stringify(entry.locator) === JSON.stringify(baseline[index].locator)), "An observation locator changed.")),
    check("expected-observation-values", () => assert(JSON.stringify(baseline.map((entry) => entry.valueText)) === JSON.stringify(["Peter Woods", "Clemson Football roster profile, Season 2024-25", "DL", "11", "So.", "6-3", "315 lbs", "Alabaster, Ala."]), "Baseline values differ.")),
    check("zero-analytical-observations", () => assert(analyticalObservations.length === 0 && evidenceArtifact.analyticalObservationRefs.length === 0, "Analytical evidence exists.")),
    check("artifact-active-verified", () => assert(artifactReview.result.outcome === "VERIFIED" && evidenceArtifact.state === "ACTIVE" && evidenceArtifact.verification.state === "VERIFIED", "Artifact is not active and verified.")),
    check("artifact-direct-existing-categories", () => assert(evidenceArtifact.classification.role === "DIRECT" && evidenceArtifact.classification.categories.length === 5 && evidenceArtifact.classification.categories.every((entry) => Object.values(fidApi.POPULATION_EVIDENCE_CATEGORIES).includes(entry)), "Artifact scope changed.")),
    check("artifact-reference-counts", () => assert(evidenceArtifact.recordedObservationRefs.length === 8 && evidenceArtifact.analyticalObservationRefs.length === 0, "Artifact references changed.")),
    check("no-biography-category", () => assert(!categories.includes("BIOGRAPHY") && !evidenceArtifact.classification.categories.includes("BIOGRAPHY"), "BIOGRAPHY category introduced.")),
    check("package-approved", () => assert(packageManifest.status === "APPROVED" && packageAssessment.packageApproved && packageAssessment.blockers.length === 0, "Package is not approved.", packageAssessment)),
    check("package-after-prerequisites", () => assert(packageReviewDecision.decision === "APPROVE" && evidenceReviewDecisions.length === 10 && researchSource.status === "APPROVED" && evidenceArtifact.state === "ACTIVE", "Package prerequisites are incomplete.")),
    ...["IDENTITY", "AFFILIATION", "POSITION", "CLASS_YEAR", "MEASUREMENTS"].map((category) => check(`${category.toLowerCase()}-separately-authorized`, () => { const index = categories.indexOf(category); assert(index >= 0 && populationAuthorizationDecisions[index].category === category && populationLinkageAssessments[index].result.readiness === "APPROVED_FOR_POPULATION_USE" && populationLinkageAssessments[index].result.countsTowardPopulationCoverage, `${category} is not authorized.`); })),
    check("five-distinct-category-links", () => assert(populationLinks.length === 5 && new Set(populationLinks.map((entry) => entry.linkId)).size === 5 && new Set(categories).size === 5, "Population links are not distinct.")),
    check("jersey-number-unlinked", () => assert(!linkedObservationRefs.has(observationByField.jerseyNumber.observationId), "Jersey number was linked.")),
    check("hometown-unlinked", () => assert(!linkedObservationRefs.has(observationByField.hometown.observationId), "Hometown was linked.")),
    check("no-eligibility-or-declaration-links", () => assert(!categories.includes("ELIGIBILITY") && !categories.includes("DECLARATION"), "Eligibility or declaration was linked.")),
    check("no-production-duplication", () => assert(!categories.includes("PRODUCTION") && !evidenceArtifact.classification.categories.includes("PRODUCTION"), "Production evidence was duplicated.")),
    check("category-limited-authorizations", () => assert(populationAuthorizationDecisions.every((entry) => entry.limitations.some((value) => value.includes("limited"))) && populationLinks.every((entry) => entry.recordedObservationRefs.length <= 2), "An authorization exceeds its category.")),
    check("original-population-inputs-immutable", () => assert(JSON.stringify(populationWorkflow) === originalPopulationWorkflowSnapshot && JSON.stringify(populationResult) === originalPopulationResultSnapshot, "Original Population inputs changed.")),
    check("derived-coverage-only", () => assert(populationLinkageAssessments.every(({ result }) => !result.originalWorkflowMutated && !result.originalPopulationResultMutated), "Coverage derivation mutated inputs.")),
    check("class-cycle-conflict-visible", () => { const entry = populationWorkflow.evidenceDeclarations.find((item) => item.category === "CLASS_YEAR"); assert(entry.status === "PARTIAL" && entry.limitations.some((value) => value.includes("2026") && value.includes("2027")), "Class-cycle conflict disappeared."); }),
    check("eligibility-remains-missing", () => assert(derivedResults.every((entry) => hasMissing(entry, "ELIGIBILITY")), "Eligibility blocker disappeared.")),
    check("declaration-remains-missing", () => assert(derivedResults.every((entry) => hasMissing(entry, "DECLARATION")), "Declaration blocker disappeared.")),
    check("overall-population-blocked", () => assert(populationResult.status === "BLOCKED" && derivedResults.every((entry) => entry.status === "BLOCKED"), "Population became ready.")),
    check("one-primary-artifact", () => assert(packageManifest.researchSourceRef === researchSource.sourceId && packageManifest.additionalRefs.length === 0, "Package contains another source.")),
    check("pending-links-preserved-as-package-input", () => assert(pendingPopulationLinks.every((entry) => entry.populationUseDecision === "PENDING") && packageReviewDecision.populationUseAuthorized === false, "Package approval authorized Population use.")),
    check("zero-external-effects", () => assert(populationLinkageAssessments.every(({ result }) => ["persistencePerformed", "promotionPerformed", "canonicalRecordCreated", "fiisExecutionPerformed", "runtimeIntegrationPerformed", "uiIntegrationPerformed", "simulatorIntegrationPerformed", "supabaseUsed"].every((key) => result[key] === false)), "An external effect occurred.")),
    check("rsp0001-regression", () => assert(rsp0001.failed === 0 && rsp0001.governance.package === "APPROVED", "RSP-0001 regression failed.", rsp0001)),
    check("sprint45-regression", () => assert(sprint45.failed === 0, "Sprint 45 failed.", sprint45)),
    check("sprint44-through37-regressions", () => assert(Object.values(sprint45.regressions).every((entry) => entry.failed === 0), "A transitive regression failed.", sprint45.regressions)),
    check("research-repository-baseline", () => assert(sprint45.regressions.researchRepository.failed === 0, "Research Repository baseline failed.", sprint45.regressions.researchRepository)),
  ];
  const passed = cases.filter((entry) => entry.passed).length;
  const failed = cases.length - passed;
  const result = { suite: "PeterWoodsRSP0002HumanReviewDiagnostics", total: cases.length, passed, failed, cases, reviewerDeclaration, reviewDecisions: { source: sourceIntakeDeclaration.reviewDecision, session: sessionReview.decision.decision, observations: observationReviews.map((entry) => entry.decision.decision), artifact: artifactReview.decision.decision, package: packageReviewDecision.decision }, observations: reviewed, artifact: { state: evidenceArtifact.state, verification: evidenceArtifact.verification.state, categories: evidenceArtifact.classification.categories }, package: { state: packageManifest.status, approved: packageAssessment.packageApproved }, populationAuthorizations: populationLinkageAssessments.map((entry, index) => ({ category: categories[index], readiness: entry.result.readiness, countsTowardCoverage: entry.result.countsTowardPopulationCoverage, derivedPopulationStatus: entry.result.derivedPopulationResult.status })), remainingBlockers: ["LEGACY_2026_VS_TARGET_2027_CLASS_CYCLE_CONFLICT", "ELIGIBILITY_EVIDENCE_MISSING", "DECLARATION_EVIDENCE_MISSING"], rsp0001: { total: rsp0001.total, passed: rsp0001.passed, failed: rsp0001.failed }, regressions: { sprint45: { total: sprint45.total, passed: sprint45.passed, failed: sprint45.failed }, ...sprint45.regressions } };
  if (throwOnFailure && failed) throw new Error(`${result.suite} failed ${failed} of ${result.total} checks.`);
  return result;
}

export default Object.freeze({ runRSP0002Diagnostics });
