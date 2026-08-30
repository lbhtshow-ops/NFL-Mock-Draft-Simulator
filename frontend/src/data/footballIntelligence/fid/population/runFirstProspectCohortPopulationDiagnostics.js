import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fidApi from "../index.js";
import { firstProspectCohortFixtures } from "./fixtures/firstProspectCohortFixtures.js";
import { runPopulationWorkflowDiagnostics } from "./runPopulationWorkflowDiagnostics.js";

const SUITE = "FirstProspectCohortPopulationDiagnostics";
const FRONTEND_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");
const COVERED_STATUSES = new Set(["DECLARED", "SUFFICIENT"]);

function normalizedIdentity(value) { return String(value ?? "").toLowerCase().replaceAll(/[^a-z0-9]/g, ""); }
function sourcePath(sourceRef) { return sourceRef.split("#")[0]; }
function buildProspectReport(fixture) {
  const workflow = fidApi.createPopulationWorkflow(fixture.workflowInput);
  const populationResult = fidApi.validatePopulationReadiness(workflow, { resultId: `population-result:first-cohort:${fixture.subject.slug}`, producedAt: "2026-07-18" });
  const fiisIntakeRequest = populationResult.fiisIntakeRequestInput;
  const required = workflow.requiredEvidenceCategories;
  const covered = required.filter((category) => workflow.evidenceDeclarations.some((entry) => entry.category === category && COVERED_STATUSES.has(entry.status)));
  const partial = required.filter((category) => workflow.evidenceDeclarations.some((entry) => entry.category === category && entry.status === "PARTIAL"));
  const missing = required.filter((category) => !covered.includes(category));
  const sourceChecks = workflow.sourceMetadata.map((source) => {
    const path = resolve(FRONTEND_ROOT, sourcePath(source.sourceRef)); const exists = existsSync(path); const content = exists ? readFileSync(path, "utf8") : "";
    const anchor = source.sourceRef.split("#")[1];
    return { sourceId: source.sourceId, sourceRef: source.sourceRef, exists, subjectReferenced: content.includes(anchor) || content.includes(fixture.subject.legacyProspectId) || content.includes(fixture.subject.name) };
  });
  const cycleConflict = fixture.subject.legacyDraftClass !== fixture.subject.targetDraftClass || !fixture.subject.legacyProspectId.startsWith(`${fixture.subject.targetDraftClass}-`);
  const blockers = [
    ...(cycleConflict ? [{ code: "LEGACY_TARGET_CYCLE_CONFLICT", field: "draftClass", legacyValue: fixture.subject.legacyDraftClass, targetValue: fixture.subject.targetDraftClass }] : []),
    ...missing.map((category) => ({ code: "REQUIRED_EVIDENCE_NOT_COVERED", category })),
    ...(fixture.subject.legacyResearchAvailable ? [] : [{ code: "LEGACY_RESEARCH_METADATA_UNAVAILABLE" }]),
  ];
  return {
    prospect: fixture.subject.name, slug: fixture.subject.slug, legacyProspectId: fixture.subject.legacyProspectId,
    workflowValid: workflow.validation.valid && fidApi.isPopulationWorkflow(workflow), populationResultValid: populationResult.validation.valid && fidApi.isPopulationResult(populationResult),
    fiisRequestValid: Boolean(fiisIntakeRequest && fidApi.isFiisIntakeRequest(fiisIntakeRequest)), readiness: populationResult.readiness,
    completeness: { requiredCount: required.length, coveredCount: covered.length, partialCount: partial.length, missingCount: missing.length, percentage: Math.round((covered.length / required.length) * 100), required, covered, partial, missing },
    sources: { declaredCount: workflow.sourceMetadata.length, allFilesExist: sourceChecks.every((entry) => entry.exists), allSubjectsReferenced: sourceChecks.every((entry) => entry.subjectReferenced), declarations: sourceChecks, legacyResearchAvailable: fixture.subject.legacyResearchAvailable },
    cycleConflict, blockers, unknownValuesPreserved: workflow.populationRecords[0].payload.unknownValues,
    effects: { canonicalRecordCreated: workflow.populationRecords[0].payload.canonicalRecordCreated, persistencePerformed: populationResult.persistencePerformed, promotionPerformed: populationResult.promotionPerformed, runtimeIntegrationPerformed: populationResult.runtimeIntegrationPerformed },
    workflow, populationResult, fiisIntakeRequest,
  };
}

export function runFirstProspectCohortPopulationDiagnostics({ throwOnFailure = false } = {}) {
  const populationBaseline = runPopulationWorkflowDiagnostics();
  const prospectReports = firstProspectCohortFixtures.map(buildProspectReport);
  const normalizedNames = prospectReports.map((entry) => normalizedIdentity(entry.prospect)); const legacyIds = prospectReports.map((entry) => entry.legacyProspectId);
  const duplicateIdentities = [
    ...normalizedNames.filter((value, index) => normalizedNames.indexOf(value) !== index).map((value) => ({ type: "NORMALIZED_NAME", value })),
    ...legacyIds.filter((value, index) => legacyIds.indexOf(value) !== index).map((value) => ({ type: "LEGACY_ID", value })),
  ];
  const cases = [
    { id: "population-regression-baseline", passed: populationBaseline.total === 60 && populationBaseline.failed === 0, message: "Population Workflow regression baseline remains 60/60.", details: populationBaseline },
    ...prospectReports.flatMap((report) => [
      { id: `${report.slug}:workflow`, passed: report.workflowValid, message: `${report.prospect} Population Workflow validates.`, details: report.workflow.validation },
      { id: `${report.slug}:population-result`, passed: report.populationResultValid, message: `${report.prospect} Population Result validates.`, details: report.populationResult.validation },
      { id: `${report.slug}:fiis-request`, passed: report.fiisRequestValid, message: `${report.prospect} FIIS Intake Request validates.`, details: report.fiisIntakeRequest?.validation },
      { id: `${report.slug}:source-references`, passed: report.sources.allFilesExist && report.sources.allSubjectsReferenced, message: `${report.prospect} source declarations resolve to existing repository records.`, details: report.sources },
      { id: `${report.slug}:unknown-preservation`, passed: report.unknownValuesPreserved.includes("eligibility") && report.unknownValuesPreserved.includes("declaration"), message: `${report.prospect} preserves eligibility and declaration as unknown.`, details: report.unknownValuesPreserved },
      { id: `${report.slug}:readiness-blocked`, passed: report.readiness === "BLOCKED" && report.completeness.missing.includes("ELIGIBILITY") && report.completeness.missing.includes("DECLARATION"), message: `${report.prospect} readiness is blocked by missing governed evidence.`, details: report.completeness },
      { id: `${report.slug}:cycle-conflict`, passed: report.cycleConflict, message: `${report.prospect} 2026/2027 cycle conflict is detected.`, details: report.blockers },
      { id: `${report.slug}:no-effects`, passed: report.effects.canonicalRecordCreated === false && report.effects.persistencePerformed === false && report.effects.promotionPerformed === false && report.effects.runtimeIntegrationPerformed === false, message: `${report.prospect} produced no canonical, persistence, promotion, or runtime effect.`, details: report.effects },
    ]),
    { id: "cohort:duplicate-identities", passed: duplicateIdentities.length === 0, message: duplicateIdentities.length ? "Duplicate cohort identities detected." : "No duplicate cohort identities detected.", details: duplicateIdentities },
    { id: "cohort:source-declarations", passed: prospectReports.every((entry) => entry.sources.declaredCount >= 9), message: "Every cohort member declares all reusable repository source families.", details: prospectReports.map(({ prospect, sources }) => ({ prospect, declaredCount: sources.declaredCount })) },
    { id: "cohort:validation-only", passed: prospectReports.every((entry) => entry.readiness === "BLOCKED" && entry.fiisRequestValid), message: "All FIIS declarations validate while population readiness remains safely blocked.", details: prospectReports.map(({ prospect, readiness, fiisRequestValid }) => ({ prospect, readiness, fiisRequestValid })) },
  ];
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const cohortCompleteness = { prospectCount: prospectReports.length, averagePercentage: Math.round(prospectReports.reduce((sum, entry) => sum + entry.completeness.percentage, 0) / prospectReports.length), readyForFiisCount: prospectReports.filter((entry) => entry.readiness === "READY_FOR_FIIS_INTAKE").length, validFiisRequestCount: prospectReports.filter((entry) => entry.fiisRequestValid).length, cycleConflictCount: prospectReports.filter((entry) => entry.cycleConflict).length, duplicateIdentityCount: duplicateIdentities.length, governedResearchMetadataCount: 0, legacyResearchMetadataCount: prospectReports.filter((entry) => entry.sources.legacyResearchAvailable).length };
  const governanceGaps = [
    { code: "CYCLE_CLASSIFICATION_CONFLICT", affectedProspects: prospectReports.filter((entry) => entry.cycleConflict).map((entry) => entry.prospect), description: "Legacy IDs and registry draftClass are 2026 while the governed target cycle is 2027." },
    { code: "GOVERNED_ELIGIBILITY_EVIDENCE_MISSING", affectedProspects: prospectReports.map((entry) => entry.prospect), description: "No governed eligibility evidence exists in the referenced repository data." },
    { code: "GOVERNED_DECLARATION_EVIDENCE_MISSING", affectedProspects: prospectReports.map((entry) => entry.prospect), description: "No governed declaration evidence exists in the referenced repository data." },
    { code: "GOVERNED_RESEARCH_RECORDS_MISSING", affectedProspects: prospectReports.map((entry) => entry.prospect), description: "Peter Woods has legacy research metadata, but no cohort member has Research Repository contract records." },
  ];
  const result = { suite: SUITE, total: cases.length, passed, failed, cases, cohortCompleteness, prospectReports, duplicateIdentities, governanceGaps, populationBaseline: { total: populationBaseline.total, passed: populationBaseline.passed, failed: populationBaseline.failed } };
  if (throwOnFailure && failed) throw new Error(`${SUITE} failed ${failed} of ${cases.length} checks.`); return result;
}

export default Object.freeze({ runFirstProspectCohortPopulationDiagnostics });
