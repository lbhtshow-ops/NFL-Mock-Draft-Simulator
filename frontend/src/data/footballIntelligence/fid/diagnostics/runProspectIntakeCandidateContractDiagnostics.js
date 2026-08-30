import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fidApi, * as namedFidApi from "../index.js";
import intakeApi, * as namedIntakeApi from "../prospectIntake/index.js";
import constantsApi, * as namedConstantsApi from "../prospectIntake/prospectIntakeCandidateConstants.js";
import candidateApi, * as namedCandidateApi from "../prospectIntake/ProspectIntakeCandidateContract.js";
import architectureApi, * as namedArchitectureApi from "../prospectIntake/ProspectIntakeArchitectureSpecification.js";
import { runProspectIntakeArchitectureDiagnostics } from "./runProspectIntakeArchitectureDiagnostics.js";

const SUITE = "ProspectIntakeCandidateContractDiagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONSTANTS_SOURCE = readFileSync(resolve(ROOT, "prospectIntake/prospectIntakeCandidateConstants.js"), "utf8");
const CONTRACT_SOURCE = readFileSync(resolve(ROOT, "prospectIntake/ProspectIntakeCandidateContract.js"), "utf8");
const ARCHITECTURE_SOURCE = readFileSync(resolve(ROOT, "prospectIntake/ProspectIntakeArchitectureSpecification.js"), "utf8");
const INTAKE_INDEX_SOURCE = readFileSync(resolve(ROOT, "prospectIntake/index.js"), "utf8");
const FID_INDEX_SOURCE = readFileSync(resolve(ROOT, "index.js"), "utf8");
const GROUPS = Object.freeze(["identity-schema", "minimal-normalization", "invalid-inputs", "nested-records", "lifecycle-versioning", "reference-history", "extension-boundary", "module-separation", "exports", "prior-baseline"]);
const CASE_NAMES = Object.freeze(GROUPS.flatMap((group) => Array.from({ length: 10 }, (_, index) => `${group}-${String(index + 1).padStart(3, "0")}`)));

function assert(condition, message) { if (!condition) throw new Error(message); }
function imports(source) { return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]); }
function minimal(variant = 1, overrides = {}) { return { intakeId: `candidate-${variant}`, cycleRef: "2027-nfl-draft", stage: "DISCOVERED", status: "OPEN", ...overrides }; }

function identitySchemaChecks(variant) {
  const candidate = candidateApi.createProspectIntakeCandidate(minimal(variant));
  assert(candidate.contract === "ProspectIntakeCandidate", "Candidate identity changed.");
  assert(candidate.contractVersion === "FID-PROSPECT-INTAKE-CANDIDATE-1.0.0" && candidate.schemaVersion === "FID-PROSPECT-INTAKE-CANDIDATE-SCHEMA-1.0.0", "Candidate version changed.");
  assert(candidateApi.isProspectIntakeCandidate(candidate) && candidateApi.validateProspectIntakeCandidate(candidate).valid, "Candidate type guard or validation failed.");
}

function minimalNormalizationChecks(variant) {
  const candidate = candidateApi.createProspectIntakeCandidate(minimal(variant, { sourceRefs: [" source-a ", "source-a", "source-b"] }));
  assert(candidate.validation.valid && candidate.sourceRefs.length === 2 && candidate.sourceRefs[0] === "source-a", "Reference normalization changed.");
  assert(candidate.discoveryContext === null && candidate.reviewRecords.length === 0 && candidate.extensions && candidate.lifecycle, "Stable defaults changed.");
}

function invalidInputChecks(variant) {
  assert(!candidateApi.createProspectIntakeCandidate(null).validation.valid, "Non-object input accepted.");
  assert(!candidateApi.createProspectIntakeCandidate({ ...minimal(variant), unsupportedField: true }).validation.valid, "Unknown field accepted.");
  assert(!candidateApi.createProspectIntakeCandidate({ ...minimal(variant), stage: "RUNTIME_READY" }).validation.valid, "Unknown stage accepted.");
  assert(!candidateApi.createUnavailableProspectIntakeCandidate({ ...minimal(variant), reason: "Unavailable" }).validation.valid, "Unavailable candidate reported valid.");
}

function nestedRecordChecks(variant) {
  const candidate = candidateApi.createProspectIntakeCandidate(minimal(variant, { reviewRecords: [{ reviewId: `review-${variant}`, reviewType: "EVIDENCE_REVIEW", status: "COMPLETED", outcome: "APPROVED" }], blockerRecords: [{ blockerId: `blocker-${variant}`, blockerType: "OTHER", status: "OPEN" }] }));
  assert(candidate.validation.valid && candidate.reviewRecords.length === 1 && candidate.blockerRecords.length === 1, "Nested records changed.");
  assert(!candidateApi.createProspectIntakeCandidate(minimal(variant, { reviewRecords: [{ reviewId: "same" }, { reviewId: "same" }] })).validation.valid, "Duplicate nested IDs accepted.");
}

function lifecycleVersioningChecks(variant) {
  const candidate = candidateApi.createProspectIntakeCandidate(minimal(variant, { version: 2, workflowRevision: 4, lifecycle: { state: "REOPENED", openedAt: "2026-01-01", replacesIntakeRef: `prior-${variant}` } }));
  assert(candidate.validation.valid && candidate.version === 2 && candidate.workflowRevision === 4, "Version behavior changed.");
  assert(!candidateApi.createProspectIntakeCandidate(minimal(variant, { lifecycle: { openedAt: "2027-02-01", closedAt: "2027-01-01" } })).validation.valid, "Invalid lifecycle dates accepted.");
  assert(!candidateApi.createProspectIntakeCandidate(minimal(variant, { lifecycle: { replacesIntakeRef: `candidate-${variant}` } })).validation.valid, "Self replacement accepted.");
}

function referenceHistoryChecks(variant) {
  const transition = { transitionId: `transition-${variant}`, fromStage: "DISCOVERED", toStage: "RESEARCH_COLLECTION", fromStatus: "OPEN", toStatus: "IN_REVIEW" };
  const candidate = candidateApi.createProspectIntakeCandidate(minimal(variant, { workflowHistory: [transition], promotionDecisionRefs: [`decision-${variant}`], proposedProspectProfileRef: `prospect-${variant}` }));
  assert(candidate.validation.valid && candidate.workflowHistory.length === 1 && candidate.stage === "DISCOVERED", "History inferred or changed current state.");
  assert(candidate.promotionDecisionRefs[0] === `decision-${variant}` && candidate.proposedProspectProfileRef === `prospect-${variant}`, "Unresolved references changed.");
}

function extensionBoundaryChecks(variant) {
  const safe = candidateApi.createProspectIntakeCandidate(minimal(variant, { extensions: { descriptive: { label: "safe" } } }));
  const prohibited = candidateApi.createProspectIntakeCandidate(minimal(variant, { extensions: { nested: { databaseClient: "blocked" } } }));
  assert(safe.validation.valid && safe.extensions.descriptive.label === "safe", "Safe extension rejected.");
  assert(!prohibited.validation.valid && !Object.hasOwn(prohibited.extensions.nested, "databaseClient"), "Runtime extension retained.");
}

function moduleSeparationChecks() {
  assert(imports(CONSTANTS_SOURCE).length === 0, "Candidate constants are not standalone.");
  assert(JSON.stringify(imports(CONTRACT_SOURCE)) === JSON.stringify(["./prospectIntakeCandidateConstants.js"]), "Candidate contract has an unexpected dependency.");
  assert(JSON.stringify(imports(ARCHITECTURE_SOURCE)) === JSON.stringify(["./prospectIntakeCandidateConstants.js"]), "Architecture specification has an unexpected dependency.");
  assert(!/createProspectIntakeCandidate|normalizeCandidate|CANDIDATE_KEYS/.test(ARCHITECTURE_SOURCE), "Candidate implementation remains embedded in architecture documentation.");
  assert(!/(persistence|supabase|database|resolver|engine|components|pages|router|simulator)/i.test(imports(CONTRACT_SOURCE).join(" ")), "Prohibited production dependency introduced.");
}

function exportChecks() {
  const modules = [[namedConstantsApi, constantsApi], [namedCandidateApi, candidateApi], [namedArchitectureApi, architectureApi]];
  const additions = [...new Set(modules.flatMap(([named]) => Object.keys(named).filter((name) => name !== "default")))];
  assert(modules.every(([named, defaults]) => Object.keys(named).filter((name) => name !== "default").every((name) => named[name] === defaults[name])), "Named/default module exports disagree.");
  assert(additions.every((name) => namedIntakeApi[name] === intakeApi[name] && namedFidApi[name] === fidApi[name] && fidApi[name] === intakeApi[name]), "Barrel export identity changed.");
  assert(/prospectIntakeCandidateConstants/.test(INTAKE_INDEX_SOURCE) && /ProspectIntakeCandidateContract/.test(INTAKE_INDEX_SOURCE), "Dedicated modules are absent from the intake barrel.");
  assert(!Object.keys(fidApi).some((name) => /^run.*Diagnostics$/.test(name)) && !/runProspectIntakeCandidateContractDiagnostics/.test(INTAKE_INDEX_SOURCE + FID_INDEX_SOURCE), "Diagnostic entered production exports.");
}

function priorBaselineChecks(_variant, context) {
  const prior = context.suiteSummaries.prospectIntakeArchitecture;
  assert(prior?.total === 400 && prior.passed === 400 && prior.failed === 0, "Prospect Intake Architecture baseline failed.");
}

const CHECKS = Object.freeze([identitySchemaChecks, minimalNormalizationChecks, invalidInputChecks, nestedRecordChecks, lifecycleVersioningChecks, referenceHistoryChecks, extensionBoundaryChecks, moduleSeparationChecks, exportChecks, priorBaselineChecks]);

export async function runProspectIntakeCandidateContractDiagnostics({ throwOnFailure = false } = {}) {
  const prospectIntakeArchitecture = await runProspectIntakeArchitectureDiagnostics();
  const context = { suiteSummaries: { ...prospectIntakeArchitecture.suiteSummaries, prospectIntakeArchitecture } };
  const cases = [];
  CASE_NAMES.forEach((id, index) => { const group = Math.floor(index / 10); const variant = (index % 10) + 1; try { CHECKS[group](variant, context); cases.push({ id, passed: true, message: `${id} passed.`, details: null }); } catch (failure) { cases.push({ id, passed: false, message: failure?.message ?? `${id} failed.`, details: failure?.details ?? null }); } });
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const summary = { suite: SUITE, contractVersion: fidApi.PROSPECT_INTAKE_CANDIDATE_CONTRACT_VERSION, schemaVersion: fidApi.PROSPECT_INTAKE_CANDIDATE_SCHEMA_VERSION, total: cases.length, passed, failed, cases, suiteSummaries: context.suiteSummaries };
  if (throwOnFailure && failed) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runProspectIntakeCandidateContractDiagnostics });
