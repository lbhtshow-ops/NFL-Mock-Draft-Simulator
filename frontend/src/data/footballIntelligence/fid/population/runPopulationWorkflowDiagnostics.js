import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fidApi, * as namedFidApi from "../index.js";
import populationApi, * as namedPopulationApi from "./index.js";
import constantsApi, * as namedConstantsApi from "./populationConstants.js";
import workflowApi, * as namedWorkflowApi from "./PopulationWorkflow.js";
import validationApi, * as namedValidationApi from "./PopulationValidation.js";
import resultApi, * as namedResultApi from "./PopulationResultContract.js";

const SUITE = "PopulationWorkflowDiagnostics";
const ROOT = dirname(fileURLToPath(import.meta.url));
const PRODUCTION_SOURCE = ["populationConstants.js", "PopulationWorkflow.js", "PopulationValidation.js", "PopulationResultContract.js", "index.js"].map((file) => readFileSync(resolve(ROOT, file), "utf8")).join("\n");
const GROUPS = Object.freeze(["workflow-contract", "source-evidence", "fiis-ready-result", "blocked-result", "boundaries", "exports"]);
const CASE_NAMES = Object.freeze(GROUPS.flatMap((group) => Array.from({ length: 10 }, (_, index) => `${group}-${String(index + 1).padStart(3, "0")}`)));

function assert(condition, message) { if (!condition) throw new Error(message); }
function imports(source) { return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]); }
function fixture(variant = 1, overrides = {}) {
  const sourceRef = `source:population:${variant}`; const candidateRef = `intake-candidate:population:${variant}`;
  return fidApi.createPopulationWorkflow({
    workflowId: `population-workflow:${variant}`, workflowRevision: 1, workflowType: "PROSPECT", status: "VALIDATING", cycleRef: "draft-cycle:2027", candidateRef,
    subjectRefs: [`subject:${variant}`], sourceMetadata: [{ sourceId: `source-metadata:${variant}`, sourceType: "INTERNAL_RECORD", sourceRef, label: `Validation source ${variant}`, capturedAt: "2026-07-18", status: "REVIEWED", evidenceRefs: [`evidence:${variant}:identity`] }],
    evidenceDeclarations: [{ evidenceId: `evidence-declaration:${variant}:identity`, category: "IDENTITY", status: "SUFFICIENT", sourceRefs: [sourceRef], evidenceRefs: [`evidence:${variant}:identity`], subjectRef: `subject:${variant}` }],
    populationRecords: [{ populationRecordId: `population-record:${variant}`, recordType: "ProspectIntakeCandidate", recordRef: candidateRef, candidateRef, payload: { contract: "ProspectIntakeCandidate", recordRef: candidateRef }, sourceRefs: [sourceRef], evidenceRefs: [`evidence:${variant}:identity`] }],
    requiredEvidenceCategories: ["IDENTITY"],
    fiisIntakeRequestInput: { requestId: `fiis-request:population:${variant}`, requestRevision: 1, intakeType: "PROSPECT", domain: "FOOTBALL_INTELLIGENCE", sport: "FOOTBALL", cycleRef: "draft-cycle:2027", candidateRef, requestedOperations: ["REVIEW"], targetDeclarations: [], identityInputs: [], researchRefs: [], sourceRefs: [sourceRef], evidenceRefs: [`evidence:${variant}:identity`], observationRefs: [], claimRefs: [], reviewRequirements: [{ requirementId: `review:${variant}`, requirementType: "HUMAN_REVIEW", targetRefs: [candidateRef], required: true }], authorizationRequirements: [], status: "DRAFT", verification: { state: "UNVERIFIED" }, lifecycle: { state: "OPEN" } },
    verification: { state: "REVIEWED", reviewedBy: "population-diagnostics", reviewedAt: "2026-07-18" }, provenance: { createdBy: "population-diagnostics", createdAt: "2026-07-18", sourceRefs: [sourceRef] }, lifecycle: { state: "OPEN", openedAt: "2026-07-18" }, notes: "Declarative population validation only.", ...overrides,
  });
}

function workflowChecks(variant) { const workflow = fixture(variant); assert(workflow.validation.valid && fidApi.isPopulationWorkflow(workflow), "Valid Population Workflow rejected."); assert(workflow.contract === "PopulationWorkflow" && workflow.workflowRevision === 1, "Workflow identity or revision changed."); assert(!fidApi.createUnavailablePopulationWorkflow({ reason: "Unavailable" }).validation.valid, "Unavailable workflow reported valid."); }
function sourceEvidenceChecks(variant) { const workflow = fixture(variant); assert(workflow.sourceMetadata.length === 1 && workflow.sourceMetadata[0].validation.valid, "Source metadata invalid."); assert(workflow.evidenceDeclarations.length === 1 && workflow.evidenceDeclarations[0].category === "IDENTITY", "Evidence category invalid."); const duplicate = fidApi.createPopulationWorkflow({ ...workflow, requiredEvidenceCategories: ["IDENTITY", "IDENTITY"] }); assert(!duplicate.validation.valid, "Duplicate evidence category accepted."); }
function readyResultChecks(variant) { const workflow = fixture(variant); const result = fidApi.validatePopulationReadiness(workflow, { resultId: `population-result:${variant}`, producedAt: "2026-07-18" }); assert(result.validation.valid && fidApi.isPopulationResult(result), "Ready Population Result invalid."); assert(result.readiness === "READY_FOR_FIIS_INTAKE" && result.fiisIntakeRequestValid && result.blockers.length === 0, "Ready workflow did not produce a FIIS-ready result."); assert(fidApi.isFiisIntakeRequest(result.fiisIntakeRequestInput), "Population Result is not suitable for FIIS intake."); }
function blockedResultChecks(variant) { const workflow = fixture(variant, { requiredEvidenceCategories: ["IDENTITY", "ELIGIBILITY"] }); const result = fidApi.validatePopulationReadiness(workflow, { resultId: `blocked-result:${variant}` }); assert(result.validation.valid && result.readiness === "BLOCKED", "Missing evidence did not block readiness."); assert(result.blockers.some((entry) => entry.blockerType === "MISSING_EVIDENCE"), "Missing-evidence blocker absent."); assert(!result.persistencePerformed && !result.promotionPerformed && !result.runtimeIntegrationPerformed, "Blocked validation performed an effect."); }
function boundaryChecks(variant) { const workflow = fixture(variant); const result = fidApi.validatePopulationReadiness(workflow); assert(!Object.hasOwn(workflow, "repository") && !Object.hasOwn(result, "persistenceEnvelope"), "Repository or persistence structure entered Population."); const dependencies = imports(PRODUCTION_SOURCE); assert(dependencies.every((entry) => !/(persistence|supabase|database|repository|resolver|components|pages|router|draftv3|simulator)/i.test(entry)), "Prohibited production dependency entered Population."); assert(!/\b(?:fetch|createClient|createVersion|appendRevision|executeProspectPromotion)\s*\(|\blocalStorage\s*\.|\bindexedDB\s*\./.test(PRODUCTION_SOURCE), "Prohibited runtime operation entered Population."); const unsafe = fidApi.createPopulationWorkflow({ ...workflow, extensions: { databaseClient: "forbidden" } }); assert(!unsafe.validation.valid, "Unsafe extension accepted."); }
function exportChecks() { const modules = [[namedConstantsApi, constantsApi], [namedWorkflowApi, workflowApi], [namedValidationApi, validationApi], [namedResultApi, resultApi]]; const names = [...new Set(modules.flatMap(([named]) => Object.keys(named).filter((name) => name !== "default")))]; assert(modules.every(([named, defaults]) => Object.keys(named).filter((name) => name !== "default").every((name) => named[name] === defaults[name])), "Module named/default exports disagree."); assert(names.every((name) => namedPopulationApi[name] === populationApi[name] && namedFidApi[name] === fidApi[name] && fidApi[name] === populationApi[name]), "Population barrel export identity failed."); assert(!Object.keys(fidApi).some((name) => /^run.*Diagnostics$/.test(name)), "Diagnostic entered production exports."); }

const CHECKS = Object.freeze([workflowChecks, sourceEvidenceChecks, readyResultChecks, blockedResultChecks, boundaryChecks, exportChecks]);

export function runPopulationWorkflowDiagnostics({ throwOnFailure = false } = {}) {
  const cases = []; CASE_NAMES.forEach((id, index) => { const group = Math.floor(index / 10); const variant = (index % 10) + 1; try { CHECKS[group](variant); cases.push({ id, passed: true, message: `${id} passed.`, details: null }); } catch (failure) { cases.push({ id, passed: false, message: failure?.message ?? `${id} failed.`, details: failure?.details ?? null }); } });
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const result = { suite: SUITE, contractVersion: fidApi.POPULATION_WORKFLOW_CONTRACT_VERSION, schemaVersion: fidApi.POPULATION_WORKFLOW_SCHEMA_VERSION, total: cases.length, passed, failed, cases };
  if (throwOnFailure && failed) throw new Error(`${SUITE} failed ${failed} of ${cases.length} checks.`); return result;
}

export default Object.freeze({ runPopulationWorkflowDiagnostics });
