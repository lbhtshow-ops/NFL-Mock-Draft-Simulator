import { createPackageManifestTemplate } from "./sourcePackages/templates/packageManifestTemplate.js";
import { createSourceIntakeTemplate } from "./sourcePackages/templates/sourceIntakeTemplate.js";
import { createResearchSessionTemplate } from "./sourcePackages/templates/researchSessionTemplate.js";
import { createRecordedObservationsTemplate } from "./sourcePackages/templates/recordedObservationsTemplate.js";
import { createAnalyticalObservationsTemplate } from "./sourcePackages/templates/analyticalObservationsTemplate.js";
import { createEvidenceArtifactTemplate } from "./sourcePackages/templates/evidenceArtifactTemplate.js";
import { createEvidenceReviewTemplate } from "./sourcePackages/templates/evidenceReviewTemplate.js";
import { createPopulationLinkageTemplate } from "./sourcePackages/templates/populationLinkageTemplate.js";
import { runResearchSourcePackageDiagnostics } from "./runResearchSourcePackageDiagnostics.js";

const assert = (condition, message, details = null) => { if (!condition) throw Object.assign(new Error(message), { details }); return details ?? true; };
const check = (name, fn) => { try { return { name, passed: true, details: fn() }; } catch (error) { return { name, passed: false, error: error.message, details: error.details ?? null }; } };
const serialized = (records) => JSON.stringify(records);

export function runResearchSourcePackageAuthoringDiagnostics({ throwOnFailure = false } = {}) {
  const templates = { packageManifest: createPackageManifestTemplate(), sourceIntake: createSourceIntakeTemplate(), researchSession: createResearchSessionTemplate(), recordedObservations: createRecordedObservationsTemplate(), analyticalObservations: createAnalyticalObservationsTemplate(), evidenceArtifact: createEvidenceArtifactTemplate(), evidenceReview: createEvidenceReviewTemplate(), populationLinkage: createPopulationLinkageTemplate() };
  const content = serialized(templates); const sprint43 = runResearchSourcePackageDiagnostics();
  const cases = [
    check("all-javascript-templates-import", () => assert(Object.keys(templates).length === 8, "A JavaScript template is missing.")),
    check("standard-version-1.0", () => assert(templates.packageManifest.packageStandardVersion === "1.0", "Package standard version changed.")),
    check("package-default-draft", () => assert(templates.packageManifest.status === "DRAFT" && templates.packageManifest.governance.authorized === false, "Package template can imply approval.")),
    check("source-default-unapproved", () => assert(templates.sourceIntake.reviewDecision === "PENDING" && templates.sourceIntake.reviewerAuthorized === false, "Source template can imply approval.")),
    check("observations-default-unverified", () => assert(templates.recordedObservations.observations.length === 0 && templates.recordedObservations.authoringShape.verification.state === "PENDING", "Observation template can imply verification.")),
    check("analysis-default-unreviewed", () => assert(templates.analyticalObservations.analyses.length === 0 && templates.analyticalObservations.authoringShape.review.state === "PENDING", "Analysis template can imply review.")),
    check("artifact-default-inactive", () => assert(templates.evidenceArtifact.state === "DRAFT" && templates.evidenceArtifact.verification.state === "UNVERIFIED" && templates.evidenceArtifact.review.outcome === "NO_DECISION", "Artifact template can imply approval.")),
    check("population-default-unapproved", () => assert(templates.populationLinkage.populationUseDecision === "PENDING" && templates.populationLinkage.reviewer.authorized === false && templates.populationLinkage.coverageContribution === false, "Population template can imply authorization.")),
    check("session-default-unverified", () => assert(templates.researchSession.status === "PLANNED" && templates.researchSession.verification.state === "UNVERIFIED", "Session template can imply verification.")),
    check("review-default-unauthorized", () => assert(templates.evidenceReview.decision === "PENDING" && templates.evidenceReview.reviewerAuthorized === false, "Review template can imply authorization.")),
    check("no-real-prospect-observations", () => assert(!/(Peter Woods|Arch Manning|Caleb Downs|Francis Mauigoa)/i.test(content), "Template contains a real prospect claim.")),
    check("no-secret-shaped-values", () => assert(!/(api[_-]?key|password|bearer\s+[a-z0-9]|sk-[a-z0-9])/i.test(content), "Template contains a secret-shaped value.")),
    check("sprint43-regression", () => assert(sprint43.failed === 0, "Sprint 43 regression failed.", sprint43)),
    check("sprint43-transitive-regressions", () => assert(Object.values(sprint43.regressions).every((suite) => suite.failed === 0), "A Research Repository or Sprint 41–37 regression failed.", sprint43.regressions)),
  ];
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const result = { suite: "ResearchSourcePackageAuthoringDiagnostics", total: cases.length, passed, failed, cases, templateDefaults: templates, sprint43: { total: sprint43.total, passed: sprint43.passed, failed: sprint43.failed }, regressions: sprint43.regressions, externalEffects: { persistencePerformed: false, supabaseUsed: false, runtimeIntegrationPerformed: false, populationModified: false, fiisExecutionPerformed: false, promotionPerformed: false, canonicalRecordCreated: false } };
  if (throwOnFailure && failed) throw new Error(`${result.suite} failed ${failed} of ${result.total} checks.`); return result;
}

export default Object.freeze({ runResearchSourcePackageAuthoringDiagnostics });
