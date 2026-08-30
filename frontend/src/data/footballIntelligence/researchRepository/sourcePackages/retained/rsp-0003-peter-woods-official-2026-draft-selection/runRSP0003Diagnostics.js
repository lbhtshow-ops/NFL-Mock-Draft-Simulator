import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sourceIntakeDeclaration, sourceIntakeReview, researchSource } from "./sourceIntake.js";
import { recordedObservations as baselineObservations, observationByField, subjectRef, cycleRef } from "./recordedObservations.js";
import { analyticalObservations } from "./analyticalObservations.js";
import { evidenceArtifact as pendingEvidenceArtifact } from "./evidenceArtifact.js";
import { reviewerDeclaration, sessionReview, observationReviews, artifactReview, researchSession, recordedObservations, evidenceArtifact, evidenceReviewDecisions, evidenceReviewState } from "./evidenceReview.js";
import { populationLinks, populationLinkDeclaration } from "./populationLinkDeclaration.js";
import { populationLinkageResult } from "./populationLinkage.js";
import { packageReviewDecision, packageManifest, packageAssessment } from "./packageManifest.js";
import { runRSP0001Diagnostics } from "../rsp-0001-peter-woods-sports-reference-production-statistics/runRSP0001Diagnostics.js";
import { runRSP0002Diagnostics } from "../rsp-0002-peter-woods-clemson-official-biography/runRSP0002Diagnostics.js";
import { runDraftSelectionContractDiagnostics } from "../../../../fid/diagnostics/runDraftSelectionContractDiagnostics.js";
import { runProspectEligibilitySufficiencyPolicyDiagnostics } from "../../../../fid/population/runProspectEligibilitySufficiencyPolicyDiagnostics.js";

const ROOT = dirname(fileURLToPath(import.meta.url));
const sha256 = (file) => createHash("sha256").update(readFileSync(resolve(ROOT, file))).digest("hex").toUpperCase();
const packageSources = ["sourceIntake.js", "researchSession.js", "recordedObservations.js", "analyticalObservations.js", "evidenceArtifact.js", "evidenceReview.js", "populationLinkDeclaration.js", "populationLinkage.js", "packageManifest.js"].map((file) => readFileSync(resolve(ROOT, file), "utf8")).join("\n");
const assert = (condition, message, details = null) => { if (!condition) throw Object.assign(new Error(message), { details }); };
const check = (id, fn) => { try { fn(); return { id, passed: true }; } catch (error) { return { id, passed: false, message: error.message, details: error.details ?? null }; } };
const fields = Object.freeze(recordedObservations.map((entry) => entry.record.field));
const descriptions = recordedObservations.map((entry) => entry.description).join(" ").toLowerCase();
const baselineClaims = baselineObservations.map((entry) => entry.record.valueText);
const reviewedClaims = recordedObservations.map((entry) => entry.record.valueText);
const baselineLocators = baselineObservations.map((entry) => entry.spatial.documentLocator);
const reviewedLocators = recordedObservations.map((entry) => entry.spatial.documentLocator);

export async function runRSP0003Diagnostics({ throwOnFailure = false } = {}) {
  const rsp0001 = runRSP0001Diagnostics();
  const rsp0002 = runRSP0002Diagnostics();
  const sprint47 = runDraftSelectionContractDiagnostics();
  const sprint46 = await runProspectEligibilitySufficiencyPolicyDiagnostics();
  const cases = [
    check("package-id", () => assert(packageManifest.packageId === "research-package:rsp-0003", "Package ID changed.")),
    check("subject", () => assert(subjectRef === "2026-peter-woods" && packageManifest.subjectRef === subjectRef, "Subject reference changed.")),
    check("draft-cycle", () => assert(cycleRef === "draft-cycle:2026" && packageManifest.cycleRef === cycleRef, "Draft cycle changed.")),
    check("one-primary-source", () => assert(packageManifest.researchSourceRef === researchSource.sourceId && packageManifest.additionalRefs.length === 0, "Package does not contain exactly one primary source.")),
    check("authoritative-publisher", () => assert(sourceIntakeDeclaration.publisher === "Kansas City Chiefs" && sourceIntakeDeclaration.sourceClass === "OFFICIAL", "Publisher authority changed.")),
    check("source-title", () => assert(sourceIntakeDeclaration.title === "Five Things to Know About New Chiefs DL Peter Woods", "Source title changed.")),
    check("source-url", () => assert(sourceIntakeDeclaration.artifactIdentity === "https://www.chiefs.com/news/five-things-to-know-about-new-chiefs-dt-peter-woods-", "Source URL changed.")),
    check("access-date", () => assert(sourceIntakeDeclaration.accessDate === "2026-07-18", "Access date missing.")),
    check("explicit-author", () => assert(sourceIntakeDeclaration.author === "Matt McMullen, Senior Team Reporter", "Explicit author not preserved.")),
    check("explicit-publication-date", () => assert(sourceIntakeDeclaration.publicationDate === "2026-04-24T09:38:00", "Publication timestamp not preserved.")),
    check("reviewer-declaration", () => assert(JSON.stringify(reviewerDeclaration) === JSON.stringify({ reviewerRef: "reviewer:repository-owner", reviewerAuthorized: true, reviewedAt: "2026-07-18" }), "Reviewer declaration changed.")),
    check("source-approved", () => assert(sourceIntakeReview.outcome === "APPROVED" && researchSource.status === "APPROVED" && sourceIntakeReview.approved && sourceIntakeDeclaration.reviewDecision === "APPROVE", "Source approval failed.")),
    check("session-source-reference", () => assert(researchSession.sourceRefs.length === 1 && researchSession.sourceRefs[0] === researchSource.sourceId, "Session source reference changed.")),
    check("session-verified", () => assert(sessionReview.result.outcome === "VERIFIED" && researchSession.verification.state === "VERIFIED" && researchSession.verification.verifiedBy === reviewerDeclaration.reviewerRef, "Session verification failed.")),
    check("observation-source-and-session", () => assert(recordedObservations.every((entry) => entry.sessionRef === researchSession.sessionId && entry.sourceRefs.length === 1 && entry.sourceRefs[0] === researchSource.sourceId), "Observation lineage is invalid.")),
    check("observation-locators", () => assert(recordedObservations.every((entry) => entry.spatial.documentLocator.section && entry.spatial.documentLocator.notes), "An observation locator is missing.")),
    check("six-independent-observation-decisions", () => assert(observationReviews.length === 6 && new Set(observationReviews.map((entry) => entry.decision.targetRef)).size === 6 && observationReviews.every((entry) => entry.decision.decision === "APPROVE"), "Observations were not independently approved.")),
    check("all-observations-verified", () => assert(recordedObservations.every((entry) => entry.verification.state === "VERIFIED" && entry.verification.verifiedBy === reviewerDeclaration.reviewerRef), "An observation is not verified.")),
    check("observation-claims-preserved", () => assert(JSON.stringify(reviewedClaims) === JSON.stringify(baselineClaims), "Observation claim text changed.")),
    check("observation-locators-preserved", () => assert(JSON.stringify(reviewedLocators) === JSON.stringify(baselineLocators), "Observation locators changed.")),
    check("identity-fact", () => assert(observationByField.identity.record.valueText === "Peter Woods", "Identity fact changed.")),
    check("organization-fact", () => assert(observationByField.selectingOrganization.record.valueText === "Kansas City Chiefs", "Selecting organization changed.")),
    check("cycle-fact", () => assert(observationByField.draftCycle.record.valueText === "2026 NFL Draft", "Draft-cycle fact changed.")),
    check("round-fact", () => assert(observationByField.round.record.valueText === "First round", "Round fact changed.")),
    check("overall-pick-fact", () => assert(observationByField.overallPick.record.valueText === "29", "Overall pick changed.")),
    check("selection-event-fact", () => assert(observationByField.selectionEvent.record.valueText === "Kansas City Chiefs selected Peter Woods", "Selection-event fact changed.")),
    check("selection-date-unknown", () => assert(!fields.includes("selectionDate") && evidenceArtifact.assessment.limitations.some((entry) => entry.includes("Selection date is UNKNOWN")), "Selection date was inferred.")),
    check("zero-analytical-observations", () => assert(analyticalObservations.length === 0 && evidenceArtifact.analyticalObservationRefs.length === 0, "Analytical observation exists.")),
    check("no-eligibility-conclusion", () => assert(!fields.includes("eligibility") && !descriptions.includes("eligible for"), "Eligibility conclusion exists.")),
    check("no-declaration-conclusion", () => assert(!fields.includes("declaration") && !descriptions.includes("declared for"), "Declaration conclusion exists.")),
    check("no-2027-lifecycle-conclusion", () => assert(!descriptions.includes("no longer") && !descriptions.includes("2027 prospect"), "2027 lifecycle conclusion exists.")),
    check("pending-artifact-preserved", () => assert(pendingEvidenceArtifact.state === "DRAFT" && pendingEvidenceArtifact.verification.state === "PENDING_REVIEW", "Pending artifact declaration changed.")),
    check("artifact-active-verified", () => assert(artifactReview.result.outcome === "VERIFIED" && evidenceArtifact.state === "ACTIVE" && evidenceArtifact.verification.state === "VERIFIED" && evidenceArtifact.verification.verifiedBy === reviewerDeclaration.reviewerRef, "Artifact approval failed.")),
    check("artifact-classification", () => assert(JSON.stringify(evidenceArtifact.classification.domains) === JSON.stringify(["DRAFT_SELECTION"]) && JSON.stringify(evidenceArtifact.classification.categories) === JSON.stringify(["OTHER"]), "Artifact classification changed.")),
    check("review-decision-count", () => assert(evidenceReviewDecisions.length === 8 && evidenceReviewState.state === "VERIFIED", "Review decision set is incomplete.")),
    check("package-approved", () => assert(packageReviewDecision.decision === "APPROVE" && !packageReviewDecision.populationUseAuthorized && packageManifest.status === "APPROVED" && packageManifest.governance.authorized && packageAssessment.packageApproved && packageAssessment.blockers.length === 0, "Package approval failed.", packageAssessment)),
    check("no-population-link", () => assert(populationLinks.length === 0 && populationLinkDeclaration.status === "NOT_CREATED" && !populationLinkDeclaration.populationUseAuthorized, "Population link exists.")),
    check("no-population-coverage", () => assert(!populationLinkageResult.countsTowardPopulationCoverage && !populationLinkageResult.populationUseAuthorized, "Population coverage changed.")),
    check("no-draft-selection-instance", () => assert(!/createDraftSelection\s*\(/.test(packageSources), "DraftSelection instance was created.")),
    check("no-profile-or-relationship-revision", () => assert(!/(createProspectProfile|createPlayerProfile|createFootballRelationship)\s*\(/.test(packageSources), "Canonical profile or relationship was created.")),
    check("no-population-workflow-or-result", () => assert(!/(createPopulationWorkflow|createPopulationResult|validatePopulationReadiness)\s*\(/.test(packageSources), "Population workflow or result was created.")),
    check("retained-content-hash", () => assert(sha256("retained-content.md") === "33F0D36F7C953E1192309488686EC0A66E8EEBC1D6E5BFEF48D0D9626A217BF6", "Retained content hash changed.")),
    check("observation-file-hash", () => assert(sha256("recordedObservations.js") === "99A578FAE13C775A2C962893AC9DFBEEDDF2F5BBA71524B1014F6B87C7ADE19B", "Observation file hash changed.")),
    check("rsp0001-regression", () => assert(rsp0001.failed === 0, "RSP-0001 failed.", rsp0001)),
    check("rsp0002-regression", () => assert(rsp0002.failed === 0, "RSP-0002 failed.", rsp0002)),
    check("sprint47-regression", () => assert(sprint47.failed === 0 && sprint47.total === 51, "Sprint 47 failed.", sprint47)),
    check("sprint46-regression", () => assert(sprint46.failed === 0 && sprint46.total === 39, "Sprint 46 failed.", sprint46)),
    check("population-regression", () => assert(sprint46.regressions.population.failed === 0, "Population baseline failed.", sprint46.regressions.population)),
    check("prospect-profile-fid-regression", () => assert(sprint46.regressions.prospectProfile.failed === 0, "ProspectProfile baseline failed.", sprint46.regressions.prospectProfile)),
    check("research-repository-regression", () => assert(sprint46.regressions.researchRepository.failed === 0, "Research Repository baseline failed.", sprint46.regressions.researchRepository)),
    check("zero-external-effects", () => assert(["persistencePerformed", "supabaseUsed", "fiisExecutionPerformed", "promotionPerformed", "canonicalRecordCreated", "resolverInvoked", "runtimeIntegrationPerformed", "uiIntegrationPerformed", "simulatorIntegrationPerformed"].every((key) => packageAssessment[key] === false), "External effect reported.")),
  ];
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const result = { suite: "PeterWoodsRSP0003HumanReviewDiagnostics", total: cases.length, passed, failed, cases, reviewerDeclaration, source: { title: sourceIntakeDeclaration.title, publisher: sourceIntakeDeclaration.publisher, author: sourceIntakeDeclaration.author, publicationDate: sourceIntakeDeclaration.publicationDate, accessDate: sourceIntakeDeclaration.accessDate, url: sourceIntakeDeclaration.artifactIdentity, decision: sourceIntakeDeclaration.reviewDecision }, observations: recordedObservations.map((entry, index) => ({ field: entry.record.field, valueText: entry.record.valueText, locator: entry.spatial.documentLocator, reviewId: observationReviews[index].decision.reviewId, decision: observationReviews[index].decision.decision, verification: entry.verification.state })), artifact: { state: evidenceArtifact.state, verification: evidenceArtifact.verification.state, reviewId: artifactReview.decision.reviewId, domains: evidenceArtifact.classification.domains, categories: evidenceArtifact.classification.categories }, governance: { source: researchSource.status, session: researchSession.verification.state, observations: recordedObservations.map((entry) => entry.verification.state), artifact: `${evidenceArtifact.state}/${evidenceArtifact.verification.state}`, package: packageManifest.status, populationUseAuthorized: false }, hashes: { retainedContent: sha256("retained-content.md"), recordedObservations: sha256("recordedObservations.js") }, regressions: { rsp0001: { total: rsp0001.total, failed: rsp0001.failed }, rsp0002: { total: rsp0002.total, failed: rsp0002.failed }, sprint47: { total: sprint47.total, failed: sprint47.failed }, sprint46: { total: sprint46.total, failed: sprint46.failed }, population: sprint46.regressions.population, prospectProfile: sprint46.regressions.prospectProfile, researchRepository: sprint46.regressions.researchRepository } };
  if (throwOnFailure && failed) throw new Error(`${result.suite} failed ${failed} of ${result.total} checks.`);
  return result;
}

export default Object.freeze({ runRSP0003Diagnostics });
