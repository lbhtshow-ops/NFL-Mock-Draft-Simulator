import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fidApi, * as namedFidApi from "../index.js";
import draftSelectionApi, * as namedDraftSelectionApi from "../draftSelection/index.js";
import constants, * as namedConstants from "../draftSelection/draftSelectionConstants.js";
import contract, * as namedContract from "../draftSelection/DraftSelectionContract.js";

const SUITE = "DraftSelectionContractDiagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONSTANTS_SOURCE = readFileSync(resolve(ROOT, "draftSelection/draftSelectionConstants.js"), "utf8");
const CONTRACT_SOURCE = readFileSync(resolve(ROOT, "draftSelection/DraftSelectionContract.js"), "utf8");
const DOMAIN_INDEX_SOURCE = readFileSync(resolve(ROOT, "draftSelection/index.js"), "utf8");
const FID_INDEX_SOURCE = readFileSync(resolve(ROOT, "index.js"), "utf8");
const PROSPECT_PROFILE_SOURCE = readFileSync(resolve(ROOT, "contracts/ProspectProfileContract.js"), "utf8");
const PLAYER_PROFILE_SOURCE = readFileSync(resolve(ROOT, "contracts/PlayerProfileContract.js"), "utf8");
const RELATIONSHIP_SOURCE = readFileSync(resolve(ROOT, "contracts/FootballRelationshipContract.js"), "utf8");
const RELATIONSHIP_CONSTANTS_SOURCE = readFileSync(resolve(ROOT, "constants/footballRelationshipConstants.js"), "utf8");

function assert(condition, message) { if (!condition) throw new Error(message); }
function hasCode(value, code, field = "errors") { return (value?.validation?.[field] || value?.[field] || []).some((entry) => entry.code === code); }
function base(overrides = {}) { return { selectionRef: "draft-selection:synthetic:2027:1", selectionRevision: 1, prospectRef: "prospect:synthetic", selectingOrganizationRef: "organization:synthetic", draftCycleRef: "draft-cycle:2027", round: 1, overallPick: 1, selectionType: "STANDARD", ...overrides }; }
function create(overrides = {}) { return draftSelectionApi.createDraftSelection(base(overrides)); }
function imports(source) { return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]); }

const CASES = Object.freeze([
  ["minimal record", () => assert(create().validation.valid, "Minimal record rejected.")],
  ["contract identity", () => assert(create().contract === "DraftSelection", "Contract identity changed.")],
  ["stable normalization", () => assert(JSON.stringify(create()) === JSON.stringify(create()), "Normalization is unstable.")],
  ["input immutability", () => { const input = base({ sourceRefs: ["source:1"] }); const before = JSON.stringify(input); draftSelectionApi.createDraftSelection(input); assert(JSON.stringify(input) === before, "Input mutated."); }],
  ["type guard", () => assert(draftSelectionApi.isDraftSelection(create()), "Type guard rejected valid record.")],
  ["unavailable factory", () => assert(hasCode(draftSelectionApi.createUnavailableDraftSelection({ ...base(), reason: "Unavailable." }), "DRAFT_SELECTION_UNAVAILABLE"), "Unavailable marker absent.")],
  ["missing selection ref", () => assert(hasCode(create({ selectionRef: null }), "MISSING_REQUIRED_FIELD"), "Missing selection ref accepted.")],
  ["missing prospect ref", () => assert(hasCode(create({ prospectRef: null }), "MISSING_REQUIRED_FIELD"), "Missing prospect ref accepted.")],
  ["missing organization ref", () => assert(hasCode(create({ selectingOrganizationRef: null }), "MISSING_REQUIRED_FIELD"), "Missing organization ref accepted.")],
  ["missing cycle ref", () => assert(hasCode(create({ draftCycleRef: null }), "MISSING_REQUIRED_FIELD"), "Missing cycle ref accepted.")],
  ["invalid round", () => assert(hasCode(create({ round: 0 }), "INVALID_POSITIVE_INTEGER"), "Invalid round accepted.")],
  ["invalid overall pick", () => assert(hasCode(create({ overallPick: 1.5 }), "INVALID_POSITIVE_INTEGER"), "Invalid overall pick accepted.")],
  ["invalid revision", () => assert(hasCode(create({ selectionRevision: 0 }), "INVALID_POSITIVE_INTEGER"), "Invalid revision accepted.")],
  ["all selection types", () => Object.values(fidApi.DRAFT_SELECTION_TYPES).forEach((selectionType) => assert(create({ selectionType }).validation.valid, `Rejected ${selectionType}.`))],
  ["unknown selection type", () => assert(hasCode(create({ selectionType: "TRADE" }), "UNRECOGNIZED_ENUM_VALUE"), "Unknown type accepted.")],
  ["valid dates", () => assert(create({ selectionDate: "2027-04-29", effectiveAt: "2027-04-29T20:00:00Z" }).validation.valid, "Valid dates rejected.")],
  ["invalid selection date", () => assert(hasCode(create({ selectionDate: "not-a-date" }), "INVALID_DATE"), "Invalid date accepted.")],
  ["invalid lifecycle range", () => assert(hasCode(create({ lifecycle: { effectiveFrom: "2027-05-01", effectiveTo: "2027-04-01" } }), "INVALID_DATE_RANGE"), "Invalid lifecycle range accepted.")],
  ["invalid provenance range", () => assert(hasCode(create({ provenance: { createdAt: "2027-05-01", updatedAt: "2027-04-01" } }), "INVALID_DATE_RANGE"), "Invalid provenance range accepted.")],
  ["source references", () => assert(create({ sourceRefs: ["source:1"] }).sourceRefs[0] === "source:1", "Source reference lost.")],
  ["evidence references", () => assert(create({ evidenceArtifactRefs: ["artifact:1"] }).evidenceArtifactRefs[0] === "artifact:1", "Evidence reference lost.")],
  ["review references", () => assert(create({ reviewRefs: ["review:1"] }).reviewRefs[0] === "review:1", "Review reference lost.")],
  ["duplicate reference normalization", () => { const x = create({ sourceRefs: ["source:1", "source:1"] }); assert(x.sourceRefs.length === 1 && hasCode(x, "DUPLICATE_NORMALIZED_REFERENCE", "warnings"), "Duplicate refs not governed."); }],
  ["invalid reference collection", () => assert(hasCode(create({ sourceRefs: "source:1" }), "INVALID_REFERENCE_COLLECTION"), "Non-array refs accepted.")],
  ["verification default", () => assert(create().verification.state === "UNVERIFIED", "Verification default changed.")],
  ["verification enum", () => Object.values(fidApi.DRAFT_SELECTION_VERIFICATION_STATES).forEach((state) => assert(create({ verification: { state } }).validation.valid, `Rejected ${state}.`))],
  ["lifecycle default", () => assert(create().lifecycle.state === "ACTIVE", "Lifecycle default changed.")],
  ["lifecycle enum", () => Object.values(fidApi.DRAFT_SELECTION_LIFECYCLE_STATES).forEach((state) => assert(create({ lifecycle: { state } }).validation.valid, `Rejected ${state}.`))],
  ["revision one predecessor", () => assert(hasCode(create({ versioning: { predecessorSelectionRef: "selection:prior" } }), "UNEXPECTED_PREDECESSOR"), "Revision-one predecessor accepted.")],
  ["later revision predecessor required", () => assert(hasCode(create({ selectionRevision: 2 }), "MISSING_PREDECESSOR"), "Missing predecessor accepted.")],
  ["later revision valid", () => assert(create({ selectionRef: "selection:revision:2", selectionRevision: 2, versioning: { predecessorSelectionRef: "selection:revision:1" } }).validation.valid, "Valid later revision rejected.")],
  ["self version reference", () => assert(hasCode(create({ versioning: { replacementSelectionRef: "draft-selection:synthetic:2027:1" } }), "SELF_VERSION_REFERENCE"), "Self reference accepted.")],
  ["conflicting version refs", () => assert(hasCode(create({ selectionRef: "selection:current", selectionRevision: 2, versioning: { predecessorSelectionRef: "selection:same", replacementSelectionRef: "selection:same" } }), "CONFLICTING_VERSION_REFERENCES"), "Conflicting refs accepted.")],
  ["operation metadata", () => assert(create({ versioning: { requestId: "request:1", operationId: "operation:1", batchId: "batch:1" } }).versioning.batchId === "batch:1", "Operation metadata lost.")],
  ["unknown top-level field", () => assert(hasCode(create({ draftProjection: 1 }), "UNSUPPORTED_DRAFT_SELECTION_FIELD"), "Unknown field accepted.")],
  ["unknown nested field", () => assert(hasCode(create({ verification: { score: 1 } }), "UNSUPPORTED_NESTED_FIELD"), "Unknown nested field accepted.")],
  ["safe extensions", () => assert(create({ extensions: { descriptiveLabel: "safe" } }).validation.valid, "Safe extension rejected.")],
  ["prohibited extensions", () => assert(hasCode(create({ extensions: { simulator: true } }), "PROHIBITED_DRAFT_SELECTION_EXTENSION"), "Simulator extension accepted.")],
  ["constants standalone", () => assert(imports(CONSTANTS_SOURCE).length === 0, "Constants have dependencies.")],
  ["contract dependency boundary", () => assert(JSON.stringify(imports(CONTRACT_SOURCE)) === JSON.stringify(["./draftSelectionConstants.js"]), "Contract gained dependencies.")],
  ["no prohibited production dependency", () => assert(!/(population|researchRepository|persistence|supabase|runtime|resolver|simulator|components|pages)/i.test(imports(CONTRACT_SOURCE).join(" ")), "Prohibited dependency introduced.")],
  ["domain exports", () => Object.keys(namedDraftSelectionApi).filter((key) => key !== "default").forEach((key) => assert(namedDraftSelectionApi[key] === draftSelectionApi[key], `Domain export mismatch: ${key}.`))],
  ["module exports", () => { Object.keys(namedConstants).filter((key) => key !== "default").forEach((key) => assert(namedConstants[key] === constants[key], `Constant export mismatch: ${key}.`)); Object.keys(namedContract).filter((key) => key !== "default").forEach((key) => assert(namedContract[key] === contract[key], `Contract export mismatch: ${key}.`)); }],
  ["canonical FID exports", () => Object.keys(namedDraftSelectionApi).filter((key) => key !== "default").forEach((key) => assert(namedFidApi[key] === fidApi[key] && fidApi[key] === draftSelectionApi[key], `FID export mismatch: ${key}.`))],
  ["diagnostic excluded from production", () => assert(!/runDraftSelectionContractDiagnostics/.test(DOMAIN_INDEX_SOURCE + FID_INDEX_SOURCE) && !Object.keys(fidApi).some((key) => /^run.*Diagnostics$/.test(key)), "Diagnostic entered production exports.")],
  ["ProspectProfile reference compatibility", () => assert(/entry\.selectionRef/.test(PROSPECT_PROFILE_SOURCE) && /selectionRefs/.test(PROSPECT_PROFILE_SOURCE), "ProspectProfile selection reference support changed.")],
  ["FootballRelationship reference compatibility", () => assert(/selectionRefs/.test(RELATIONSHIP_SOURCE) && /SELECTED_BY/.test(RELATIONSHIP_CONSTANTS_SOURCE), "FootballRelationship selection compatibility changed.")],
  ["PlayerProfile boundary preserved", () => assert(!/selectionRef/.test(PLAYER_PROFILE_SOURCE), "PlayerProfile gained implicit DraftSelection ownership.")],
  ["selection fact ownership", () => assert(/round.*overallPick.*selectionType/s.test(CONTRACT_SOURCE), "Selection facts are not owned together.")],
  ["no evaluation ownership", () => assert(!Object.keys(create()).some((key) => /(grade|projection|ranking|evaluation|eligibility)/i.test(key)), "DraftSelection owns evaluation data.")],
  ["no side-effect ownership", () => assert(!Object.keys(create()).some((key) => /(persistence|promotion|runtime|supabase|simulator)/i.test(key)), "DraftSelection owns side effects.")],
]);

export function runDraftSelectionContractDiagnostics({ throwOnFailure = false } = {}) {
  const cases = CASES.map(([id, check]) => { try { check(); return { id, passed: true, message: `${id} passed.`, details: null }; } catch (failure) { return { id, passed: false, message: failure?.message ?? `${id} failed.`, details: failure?.details ?? null }; } });
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const summary = { suite: SUITE, contractVersion: fidApi.DRAFT_SELECTION_CONTRACT_VERSION, schemaVersion: fidApi.DRAFT_SELECTION_SCHEMA_VERSION, total: cases.length, passed, failed, cases, productionInstancesCreated: false, externalEffects: { persistence: false, runtimeIntegration: false, promotion: false, populationMutation: false, fiisExecution: false, simulatorIntegration: false } };
  if (throwOnFailure && failed) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runDraftSelectionContractDiagnostics });
