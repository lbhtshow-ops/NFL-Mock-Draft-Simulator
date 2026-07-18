import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fidApi, * as namedApi from "../index.js";
import footballEntityConstants from "../constants/footballEntityConstants.js";
import footballEntityContract from "../contracts/FootballEntityContract.js";
import personProfileConstants from "../constants/personProfileConstants.js";
import personProfileContract from "../contracts/PersonProfileContract.js";
import playerProfileConstants from "../constants/playerProfileConstants.js";
import playerProfileContract from "../contracts/PlayerProfileContract.js";
import prospectProfileConstants from "../constants/prospectProfileConstants.js";
import prospectProfileContract from "../contracts/ProspectProfileContract.js";
import organizationProfileConstants from "../constants/organizationProfileConstants.js";
import organizationProfileContract from "../contracts/OrganizationProfileContract.js";
import teamProfileConstants from "../constants/teamProfileConstants.js";
import teamProfileContract from "../contracts/TeamProfileContract.js";
import footballRelationshipConstants from "../constants/footballRelationshipConstants.js";
import footballRelationshipContract from "../contracts/FootballRelationshipContract.js";
import { runFootballEntityContractDiagnostics } from "./runFootballEntityContractDiagnostics.js";
import { runPersonProfileContractDiagnostics } from "./runPersonProfileContractDiagnostics.js";
import { runPlayerProfileContractDiagnostics } from "./runPlayerProfileContractDiagnostics.js";
import { runProspectProfileContractDiagnostics } from "./runProspectProfileContractDiagnostics.js";
import { runFidPersonPlayerProspectFoundationDiagnostics } from "./runFidPersonPlayerProspectFoundationDiagnostics.js";
import { runOrganizationProfileContractDiagnostics } from "./runOrganizationProfileContractDiagnostics.js";
import { runTeamProfileContractDiagnostics } from "./runTeamProfileContractDiagnostics.js";
import { runFidOrganizationTeamFoundationDiagnostics } from "./runFidOrganizationTeamFoundationDiagnostics.js";

const SUITE = "FootballRelationshipContractDiagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTION_FILES = [
  "constants/footballEntityConstants.js", "contracts/FootballEntityContract.js",
  "constants/personProfileConstants.js", "contracts/PersonProfileContract.js",
  "constants/playerProfileConstants.js", "contracts/PlayerProfileContract.js",
  "constants/prospectProfileConstants.js", "contracts/ProspectProfileContract.js",
  "constants/organizationProfileConstants.js", "contracts/OrganizationProfileContract.js",
  "constants/teamProfileConstants.js", "contracts/TeamProfileContract.js",
  "constants/footballRelationshipConstants.js", "contracts/FootballRelationshipContract.js", "index.js",
].map((file) => resolve(ROOT, file));
const PROFILE_CONTRACT_FILES = [
  "PersonProfileContract.js", "PlayerProfileContract.js", "ProspectProfileContract.js",
  "OrganizationProfileContract.js", "TeamProfileContract.js",
];
const REFERENCE_FIELDS = [
  "researchSourceRefs", "researchSessionRefs", "recordedObservationRefs", "analyticalObservationRefs",
  "evidenceArtifactRefs", "relatedRelationshipRefs", "supersedingRelationshipRefs",
  "conflictingRelationshipRefs", "documentRefs", "datasetRefs", "transactionRefs", "contractRefs",
  "assignmentRefs", "rosterRefs", "staffRefs", "selectionRefs", "otherRefs",
];
const RELATIONSHIP_EXPORTS = Object.freeze([
  "FOOTBALL_RELATIONSHIP_CONTRACT_NAME", "FOOTBALL_RELATIONSHIP_CONTRACT_VERSION",
  "FOOTBALL_RELATIONSHIP_SCHEMA_VERSION", "FOOTBALL_RELATIONSHIP_STATUSES",
  "FOOTBALL_RELATIONSHIP_VERIFICATION_STATES", "FOOTBALL_RELATIONSHIP_CONFIDENCE_LEVELS",
  "FOOTBALL_RELATIONSHIP_DIRECTIONS", "FOOTBALL_RELATIONSHIP_SUBJECT_REF_TYPES",
  "FOOTBALL_RELATIONSHIP_CATEGORIES", "FOOTBALL_RELATIONSHIP_TYPES",
  "FOOTBALL_RELATIONSHIP_PARTICIPATION_STATUSES", "FOOTBALL_RELATIONSHIP_BASIS_TYPES",
  "createFootballRelationship", "createUnavailableFootballRelationship", "validateFootballRelationship",
  "isFootballRelationship", "isVerifiedFootballRelationship", "isActiveFootballRelationship",
  "isCurrentFootballRelationship", "isHistoricalFootballRelationship", "isDisputedFootballRelationship",
  "isSymmetricFootballRelationship", "getFootballRelationshipSourceRef", "getFootballRelationshipTargetRef",
]);
const SPRINT_9_API = Object.freeze({
  ...footballEntityConstants, ...footballEntityContract, ...personProfileConstants, ...personProfileContract,
  ...playerProfileConstants, ...playerProfileContract, ...prospectProfileConstants, ...prospectProfileContract,
  ...organizationProfileConstants, ...organizationProfileContract, ...teamProfileConstants, ...teamProfileContract,
  ...footballRelationshipConstants, ...footballRelationshipContract,
});
const SPRINT_9_EXPORTS = Object.freeze(Object.keys(SPRINT_9_API));

function assert(condition, message, details = null) { if (!condition) { const failure = new Error(message); failure.details = details; throw failure; } }
function hasCode(value, code, field = "errors") { return (value?.validation?.[field] || value?.[field] || []).some((entry) => entry.code === code); }
function base(overrides = {}) {
  return {
    relationshipId: "relationship-1", status: "CANDIDATE", category: "AFFILIATION",
    relationshipType: "ASSOCIATED_WITH", direction: "DIRECTED",
    source: { ref: "player-profile-1", refType: "PLAYER_PROFILE" },
    target: { ref: "team-profile-1", refType: "TEAM_PROFILE" },
    qualifiers: { participationStatus: "UNKNOWN" },
    verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" }, ...overrides,
  };
}
function verified(overrides = {}) {
  return base({ status: "ACTIVE", relationshipType: "PLAYS_FOR",
    qualifiers: { participationStatus: "CURRENT" },
    verification: { state: "VERIFIED", confidence: "HIGH", verifiedBy: "reviewer", verifiedAt: "2027-01-02" },
    basis: [{ basisId: "basis-1", basisType: "OFFICIAL_RECORD", ref: "record-1" }], ...overrides });
}
function basis(overrides = {}) { return { basisId: "basis-1", basisType: "OFFICIAL_RECORD", ref: "record-1", ...overrides }; }
function created(input) { return fidApi.createFootballRelationship(input); }
function keysDeep(value, keys = new Set()) { if (Array.isArray(value)) value.forEach((entry) => keysDeep(entry, keys)); else if (value && typeof value === "object") Object.entries(value).forEach(([key, entry]) => { keys.add(key); keysDeep(entry, keys); }); return keys; }
function imports(source) { return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]); }
function graph(sources) { const files = new Set(PRODUCTION_FILES); return Object.fromEntries(PRODUCTION_FILES.map((file) => [file, imports(sources[file]).filter((entry) => entry.startsWith(".")).map((entry) => resolve(dirname(file), entry)).filter((entry) => files.has(entry))])); }
function hasCycle(value) { const visiting = new Set(); const visited = new Set(); function visit(node) { if (visiting.has(node)) return true; if (visited.has(node)) return false; visiting.add(node); if ((value[node] || []).some(visit)) return true; visiting.delete(node); visited.add(node); return false; } return Object.keys(value).some(visit); }
function isCanonicalRelationshipModule(entry) { return /(?:^|\/)(?:footballRelationshipConstants|FootballRelationshipContract)\.js$/i.test(entry.replaceAll("\\", "/")); }
function isProhibitedRelationshipInfrastructure(entry) { if (isCanonicalRelationshipModule(entry)) return false; return /relationship(?:service|registry|resolver|manager|repository|persistence|hydrator|synchronizer|graph)|graph[-_]?traversal|knowledge[-_]?graph|inverse[-_]?relationship|relationship[-_]?(?:promotion|runtime)/i.test(entry); }

function identityChecks() {
  const result = created(base());
  assert(result.validation.valid && fidApi.isFootballRelationship(result), "Minimal Football Relationship invalid.");
  assert(result.contract === fidApi.FOOTBALL_RELATIONSHIP_CONTRACT_NAME && result.contractVersion === fidApi.FOOTBALL_RELATIONSHIP_CONTRACT_VERSION && result.schemaVersion === fidApi.FOOTBALL_RELATIONSHIP_SCHEMA_VERSION, "Contract identity changed.");
  ["relationshipId", "status", "category", "relationshipType", "direction"].forEach((field) => assert(!created({ ...base(), [field]: null }).validation.valid, `${field} accepted missing.`));
  Object.values(fidApi.FOOTBALL_RELATIONSHIP_STATUSES).forEach((status) => { const input = base({ status }); if (status === "DISPUTED") input.verification = { state: "DISPUTED", confidence: "LOW", notes: "Disputed" }; if (status === "SUPERSEDED") input.versioning = { supersededByRelationshipRef: "relationship-2" }; if (status === "ARCHIVED") input.metadata = { notes: "Archived" }; assert(created(input).validation.valid, `Status rejected: ${status}.`); });
  assert(result.relationshipId === "relationship-1" && result.source.ref === "player-profile-1" && result.target.ref === "team-profile-1", "Identity or endpoints changed.");
}
function enumChecks() {
  const fields = [
    ["FOOTBALL_RELATIONSHIP_CATEGORIES", (value) => base({ category: value })],
    ["FOOTBALL_RELATIONSHIP_TYPES", (value) => base({ relationshipType: value })],
    ["FOOTBALL_RELATIONSHIP_DIRECTIONS", (value) => base({ direction: value })],
    ["FOOTBALL_RELATIONSHIP_PARTICIPATION_STATUSES", (value) => base({ qualifiers: { participationStatus: value, notes: ["FORMER", "ENDED"].includes(value) ? "Ended" : null } })],
    ["FOOTBALL_RELATIONSHIP_BASIS_TYPES", (value) => base({ basis: [basis({ basisType: value })] })],
    ["FOOTBALL_RELATIONSHIP_CONFIDENCE_LEVELS", (value) => base({ verification: { state: "UNVERIFIED", confidence: value } })],
  ];
  fields.forEach(([name, input]) => Object.values(fidApi[name]).forEach((value) => assert(created(input(value)).validation.valid, `${name} rejected ${value}.`)));
  Object.values(fidApi.FOOTBALL_RELATIONSHIP_SUBJECT_REF_TYPES).forEach((refType) => assert(created(base({ source: { ref: "source", refType } })).validation.valid, `Subject ref type rejected: ${refType}.`));
  Object.values(fidApi.FOOTBALL_RELATIONSHIP_VERIFICATION_STATES).forEach((state) => { const verification = { state, confidence: "MODERATE" }; if (["VERIFIED", "VERIFIED_WITH_LIMITATIONS"].includes(state)) Object.assign(verification, { verifiedBy: "reviewer", verifiedAt: "2027-01-01" }); if (state === "VERIFIED_WITH_LIMITATIONS") verification.limitations = "Limited"; if (state === "DISPUTED") verification.disputes = ["dispute-1"]; assert(created(base({ verification })).validation.valid, `Verification state rejected: ${state}.`); });
  ["category", "relationshipType", "direction"].forEach((field) => assert(!created(base({ [field]: "INVALID" })).validation.valid, `${field} accepted unknown enum.`));
}
function endpointChecks() {
  assert(!created(base({ source: null })).validation.valid && !created(base({ target: null })).validation.valid, "Missing endpoint accepted.");
  assert(!created(base({ source: [] })).validation.valid && !created(base({ target: "target" })).validation.valid, "Invalid endpoint structure accepted.");
  assert(!created(base({ source: { ref: "source" } })).validation.valid, "Endpoint without refType accepted.");
  assert(!created(base({ source: { refType: "PLAYER_PROFILE" } })).validation.valid, "Endpoint without identity accepted.");
  assert(created(base({ source: { ref: null, label: "Unresolved subject", refType: "EXTERNAL_SUBJECT" } })).validation.valid, "Unresolved labeled endpoint rejected.");
  assert(!created(base({ source: { ref: "same", refType: "OTHER" }, target: { ref: "same", refType: "OTHER" } })).validation.valid, "Identical endpoint refs accepted.");
  assert(!created(base({ source: { label: "same", refType: "OTHER" }, target: { label: "same", refType: "OTHER" } })).validation.valid, "Identical endpoint labels accepted.");
  const result = created(base({ direction: "RECIPROCAL", source: { ref: "a", refType: "FID_ENTITY", role: "source" }, target: { ref: "b", refType: "FID_ENTITY", role: "target" } }));
  assert(result.source.ref === "a" && result.target.ref === "b" && !Object.hasOwn(result, "inverse") && !Object.hasOwn(result, "reverseRelationship"), "Direction generated or reversed endpoints.");
}
function qualifierChecks() {
  assert(!created(base({ qualifiers: [] })).validation.valid, "Invalid qualifiers structure accepted.");
  assert(!created(base({ qualifiers: { participationStatus: null } })).validation.valid, "Missing participation status accepted.");
  assert(!created(base({ qualifiers: { participationStatus: "INVALID" } })).validation.valid, "Unknown participation status accepted.");
  const result = created(base({ qualifiers: { participationStatus: "CURRENT", roleRef: " role-1 ", roleLabel: "Starter", positionRef: "position-1", positionCode: "QB", competitionRef: "competition-1", seasonRef: "season-1", teamRef: "team-1", organizationRef: "organization-1", locationRef: "location-1", jurisdictionRef: "jurisdiction-1", scope: "Declared scope", limitations: null, notes: null } }));
  assert(result.qualifiers.roleRef === "role-1" && result.qualifiers.positionCode === "QB" && result.qualifiers.limitations === null, "Qualifier normalization failed.");
  assert(!keysDeep(result.qualifiers).has("resolvedRole") && !keysDeep(result.qualifiers).has("currentTeam"), "Qualifiers resolved external state.");
}
function periodChecks() {
  const result = created(base({ period: { effectiveAt: "2027-01-01", startedAt: "2027-01-02", endedAt: null, announcedAt: "2026-12-20", reportedAt: "2026-12-21", dateLabel: "2027 season", isOpenEnded: true, notes: null } }));
  assert(result.validation.valid && result.period.endedAt === null && result.period.isOpenEnded === true, "Valid period rejected or null changed.");
  assert(!created(base({ period: [] })).validation.valid, "Invalid period structure accepted.");
  assert(!created(base({ period: { startedAt: "bad" } })).validation.valid, "Invalid period date accepted.");
  assert(!created(base({ period: { startedAt: "2027-02-01", endedAt: "2027-01-01" } })).validation.valid, "Invalid period order accepted.");
  assert(!created(base({ period: { isOpenEnded: "yes" } })).validation.valid, "Invalid open-ended boolean accepted.");
  assert(created(base({ qualifiers: { participationStatus: "FORMER" } })).validation.valid && hasCode(created(base({ qualifiers: { participationStatus: "FORMER" } })), "ENDED_PERIOD_CONTEXT_MISSING", "warnings"), "Former-period warning missing.");
}
function basisChecks() {
  assert(created(base({ basis: [basis()] })).validation.valid, "Valid basis rejected.");
  assert(!created(base({ basis: {} })).validation.valid, "Invalid basis collection accepted.");
  assert(!created(base({ basis: [null] })).validation.valid, "Invalid basis record accepted.");
  assert(!created(base({ basis: [basis({ basisId: null })] })).validation.valid, "Basis without ID accepted.");
  assert(!created(base({ basis: [basis({ basisType: "INVALID" })] })).validation.valid, "Unknown basis type accepted.");
  assert(!created(base({ basis: [basis({ ref: null })] })).validation.valid, "Unsupported basis accepted.");
  const duplicate = created(base({ basis: [basis(), basis()] }));
  assert(duplicate.validation.valid && duplicate.basis.length === 1 && hasCode(duplicate, "DUPLICATE_NORMALIZED_OBJECT", "warnings"), "Exact basis duplicate not normalized.");
  assert(!created(base({ basis: [basis(), basis({ ref: "record-2" })] })).validation.valid, "Conflicting basis ID accepted.");
  const refs = created(base({ basis: [basis({ ref: null, sourceRefs: ["source-1", "source-1"], evidenceArtifactRefs: ["evidence-1"] })] }));
  assert(refs.validation.valid && refs.basis[0].sourceRefs.length === 1, "Basis supporting references invalid.");
}
function referenceChecks() {
  const references = Object.fromEntries(REFERENCE_FIELDS.map((field) => [field, [`${field}-1`, `${field}-1`]]));
  const result = created(base({ references }));
  assert(result.validation.valid && REFERENCE_FIELDS.every((field) => result.references[field].length === 1), "Reference normalization failed.");
  REFERENCE_FIELDS.forEach((field) => assert(!created(base({ references: { [field]: [4] } })).validation.valid, `Invalid ${field} accepted.`));
  ["relatedRelationshipRefs", "supersedingRelationshipRefs", "conflictingRelationshipRefs"].forEach((field) => assert(!created(base({ references: { [field]: ["relationship-1"] } })).validation.valid, `Self ${field} accepted.`));
  assert(!keysDeep(result.references).has("resolved") && !keysDeep(result.references).has("hydrated"), "References were resolved or hydrated.");
}
function verificationChecks() {
  assert(fidApi.isVerifiedFootballRelationship(created(verified())), "Verified relationship guard failed.");
  assert(!created(base({ verification: { state: "VERIFIED", confidence: "HIGH", verifiedAt: "2027-01-01" } })).validation.valid, "Verified relationship without verifier accepted.");
  assert(!created(base({ verification: { state: "VERIFIED", confidence: "HIGH", verifiedBy: "reviewer" } })).validation.valid, "Verified relationship without date accepted.");
  assert(!created(base({ verification: { state: "VERIFIED_WITH_LIMITATIONS", confidence: "HIGH", verifiedBy: "reviewer", verifiedAt: "2027-01-01" } })).validation.valid, "Limited verification without context accepted.");
  assert(!created(base({ verification: { state: "DISPUTED", confidence: "LOW" } })).validation.valid, "Disputed verification without context accepted.");
  assert(!created(base({ verification: { state: "INVALID", confidence: "LOW" } })).validation.valid, "Unknown verification state accepted.");
  assert(!created(base({ verification: { state: "UNVERIFIED", confidence: "INVALID" } })).validation.valid, "Unknown confidence accepted.");
  assert(hasCode(created(base({ status: "ACTIVE" })), "ACTIVE_RELATIONSHIP_UNVERIFIED", "warnings"), "Active-unverified warning missing.");
}
function lifecycleChecks() {
  assert(fidApi.isActiveFootballRelationship(created(verified())), "Active guard failed.");
  assert(fidApi.isCurrentFootballRelationship(created(verified())), "Current guard failed.");
  assert(fidApi.isHistoricalFootballRelationship(created(base({ status: "HISTORICAL" }))), "Historical status guard failed.");
  assert(fidApi.isHistoricalFootballRelationship(created(base({ qualifiers: { participationStatus: "FORMER", notes: "Former" } }))), "Former participation guard failed.");
  assert(fidApi.isDisputedFootballRelationship(created(base({ status: "DISPUTED", verification: { state: "DISPUTED", confidence: "LOW", notes: "Disputed" } }))), "Disputed guard failed.");
  assert(fidApi.isSymmetricFootballRelationship(created(base({ direction: "SYMMETRIC" }))), "Symmetric guard failed.");
  assert(!created(base({ status: "DISPUTED" })).validation.valid, "Disputed lifecycle without context accepted.");
  assert(!created(base({ status: "SUPERSEDED" })).validation.valid, "Superseded relationship without replacement accepted.");
  assert(!created(base({ status: "ARCHIVED" })).validation.valid, "Archived relationship without context accepted.");
}
function versioningChecks() {
  const result = created(base({ provenance: { createdBy: "author", createdAt: "2027-01-01", updatedBy: "reviewer", updatedAt: "2027-01-02", originSystem: "system", originRecordRef: "record-1" }, versioning: { relationshipVersion: 1, supersedesRelationshipRef: "relationship-0", changeReason: "Correction" }, metadata: { tags: ["tag", "tag"], domains: ["domain", "domain"], restrictions: ["internal"], visibility: null } }));
  assert(result.validation.valid && result.versioning.relationshipVersion === 1 && result.metadata.tags.length === 1 && result.metadata.visibility === null, "Versioning or metadata normalization failed.");
  assert(!created(base({ provenance: { createdAt: "2027-02-01", updatedAt: "2027-01-01" } })).validation.valid, "Invalid provenance order accepted.");
  assert(!created(base({ versioning: { relationshipVersion: -1 } })).validation.valid, "Invalid relationship version accepted.");
  assert(!created(base({ versioning: { supersedesRelationshipRef: "relationship-1" } })).validation.valid, "Self supersedes accepted.");
  assert(!created(base({ versioning: { supersededByRelationshipRef: "relationship-1" } })).validation.valid, "Self supersededBy accepted.");
  assert(!created(base({ versioning: { supersedesRelationshipRef: "same", supersededByRelationshipRef: "same" } })).validation.valid, "Conflicting version references accepted.");
  assert(created(base()).provenance.createdAt === null && created(base()).versioning.relationshipVersion === null, "Provenance or version invented.");
}
function stabilityChecks() {
  const input = verified({ period: { startedAt: "2027-01-01", endedAt: null }, references: { documentRefs: ["document-1"] } }); const snapshot = JSON.stringify(input);
  const first = created(input); assert(JSON.stringify(input) === snapshot, "Factory mutated input.");
  fidApi.validateFootballRelationship(first); assert(JSON.stringify(input) === snapshot, "Validator mutated input.");
  assert(JSON.stringify(first) === JSON.stringify(created(input)), "Repeated normalization unstable.");
  [null, [], "relationship", 7].forEach((value) => assert(fidApi.validateFootballRelationship(value).valid === false, "Validator accepted invalid input or threw."));
  [null, {}, [], "relationship"].forEach((value) => assert(fidApi.isFootballRelationship(value) === false, "Type guard accepted invalid input."));
  assert(fidApi.getFootballRelationshipSourceRef(first) === "player-profile-1" && fidApi.getFootballRelationshipTargetRef(first) === "team-profile-1", "Endpoint helpers failed.");
  const unavailable = fidApi.createUnavailableFootballRelationship({ relationshipId: "unavailable-1", status: "CANDIDATE", reason: "Unavailable" });
  assert(Object.keys(first).every((key) => Object.hasOwn(unavailable, key)) && hasCode(unavailable, "FOOTBALL_RELATIONSHIP_UNAVAILABLE"), "Unavailable factory shape invalid.");
  assert(unavailable.period.effectiveAt === null && unavailable.basis.length === 0 && unavailable.references.relatedRelationshipRefs.length === 0, "Unavailable factory invented facts.");
}
function ownershipChecks() {
  const prohibited = ["score", "grade", "rank", "tier", "evaluation", "recommendation", "confidenceScore", "strengths", "concerns", "projection", "teamFit", "schemeFit", "intelligenceResult", "graphEdge", "inverseRelationship", "resolvedSource", "resolvedTarget", "sourceProfile", "targetProfile", "rosterRecord", "staffRecord"];
  const result = created(base(Object.fromEntries(prohibited.map((field) => [field, "prohibited"])))); const keys = keysDeep(result);
  prohibited.forEach((field) => assert(!keys.has(field), `Prohibited owned field retained: ${field}.`));
  assert(result.source.ref === "player-profile-1" && result.target.ref === "team-profile-1", "References were synchronized with profiles.");
  assert(!keys.has("adjacency") && !keys.has("neighbors") && !keys.has("traversal"), "Graph structure created.");
}
async function integrationChecks(context) {
  const expected = { footballEntity: 120, personProfile: 148, playerProfile: 209, prospectProfile: 230, personPlayerProspectFoundation: 130, organizationProfile: 218, teamProfile: 270, organizationTeamFoundation: 156 };
  Object.entries(expected).forEach(([name, total]) => assert(context.suites[name].total === total && context.suites[name].failed === 0, `${name} diagnostics failed.`));
  assert(context.suites.personPlayerProspectFoundation.suiteSummaries.researchRepository.total === 616 && context.suites.personPlayerProspectFoundation.suiteSummaries.researchRepository.failed === 0, "Research Repository diagnostics failed.");
  const named = Object.keys(namedApi).filter((name) => name !== "default"); const defaults = Object.keys(fidApi);
  assert(SPRINT_9_EXPORTS.length === 159
    && named.length >= SPRINT_9_EXPORTS.length
    && defaults.length >= SPRINT_9_EXPORTS.length
    && new Set(named).size === named.length
    && new Set(defaults).size === defaults.length
    && SPRINT_9_EXPORTS.every((name) => Object.hasOwn(namedApi, name)
      && Object.hasOwn(fidApi, name)
      && namedApi[name] === SPRINT_9_API[name]
      && fidApi[name] === SPRINT_9_API[name]
      && namedApi[name] === fidApi[name])
    && named.every((name) => Object.hasOwn(fidApi, name) && namedApi[name] === fidApi[name])
    && defaults.every((name) => Object.hasOwn(namedApi, name) && namedApi[name] === fidApi[name]), "FID export count or uniqueness invalid.");
  assert(RELATIONSHIP_EXPORTS.length === 24 && RELATIONSHIP_EXPORTS.every((name) => Object.hasOwn(namedApi, name) && Object.hasOwn(fidApi, name) && namedApi[name] === fidApi[name] && fidApi[name] != null), "Relationship exports missing or inconsistent.");
  assert(!defaults.some((name) => /^run.*Diagnostics$/.test(name)), "Diagnostic runner exported.");
  assert(context.productionImports.every((entry) => !isProhibitedRelationshipInfrastructure(entry)), "Prohibited Relationship infrastructure imported.");
  assert(context.profileImports.every((entry) => !isCanonicalRelationshipModule(entry) && !isProhibitedRelationshipInfrastructure(entry)), "Profile contract depends on Relationship modules.");
  assert(context.relationshipImports.length === 1 && context.relationshipImports.every((entry) => /footballRelationshipConstants\.js$/i.test(entry)), "Relationship contract dependency direction invalid.");
  assert(!hasCycle(context.dependencyGraph), "Circular production dependency found.");
}

const CASE_GROUPS = Object.freeze([
  [24, "identity-contract-lifecycle"], [55, "enum-coverage"], [28, "endpoint-reference-boundary"],
  [22, "qualifiers"], [20, "temporal-period"], [28, "basis-provenance"], [24, "reference-collections"],
  [24, "verification"], [18, "state-guards"], [18, "versioning-conflicts"], [18, "stability-factories"],
  [13, "ownership-graph-intelligence-exclusion"], [8, "exports-dependencies-integration"],
]);
const CASE_NAMES = Object.freeze(CASE_GROUPS.flatMap(([count, group]) => Array.from({ length: count }, (_, index) => `${group}-${String(index + 1).padStart(2, "0")}`)));
async function checkForIndex(index, context) {
  if (index < 24) return identityChecks(); if (index < 79) return enumChecks(); if (index < 107) return endpointChecks();
  if (index < 129) return qualifierChecks(); if (index < 149) return periodChecks(); if (index < 177) return basisChecks();
  if (index < 201) return referenceChecks(); if (index < 225) return verificationChecks(); if (index < 243) return lifecycleChecks();
  if (index < 261) return versioningChecks(); if (index < 279) return stabilityChecks(); if (index < 292) return ownershipChecks();
  return integrationChecks(context);
}
async function buildContext() {
  const sources = Object.fromEntries(PRODUCTION_FILES.map((file) => [file, readFileSync(file, "utf8")]));
  const footballEntity = runFootballEntityContractDiagnostics(); const personProfile = await runPersonProfileContractDiagnostics();
  const playerProfile = await runPlayerProfileContractDiagnostics(); const prospectProfile = await runProspectProfileContractDiagnostics();
  const personPlayerProspectFoundation = await runFidPersonPlayerProspectFoundationDiagnostics();
  const organizationProfile = await runOrganizationProfileContractDiagnostics(); const teamProfile = await runTeamProfileContractDiagnostics();
  const organizationTeamFoundation = await runFidOrganizationTeamFoundationDiagnostics();
  return {
    productionImports: Object.values(sources).flatMap(imports), dependencyGraph: graph(sources),
    profileImports: PROFILE_CONTRACT_FILES.flatMap((file) => imports(readFileSync(resolve(ROOT, "contracts", file), "utf8"))),
    relationshipImports: imports(readFileSync(resolve(ROOT, "contracts/FootballRelationshipContract.js"), "utf8")),
    suites: { footballEntity, personProfile, playerProfile, prospectProfile, personPlayerProspectFoundation, organizationProfile, teamProfile, organizationTeamFoundation },
  };
}

export async function runFootballRelationshipContractDiagnostics({ throwOnFailure = false } = {}) {
  const context = await buildContext(); const cases = [];
  for (let index = 0; index < CASE_NAMES.length; index += 1) { const id = CASE_NAMES[index]; try { await checkForIndex(index, context); cases.push({ id, passed: true, message: `${id} passed.`, details: null }); } catch (failure) { cases.push({ id, passed: false, message: typeof failure?.message === "string" ? failure.message : `${id} failed.`, details: failure?.details ?? null }); } }
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const summary = { suite: SUITE, contractVersion: fidApi.FOOTBALL_RELATIONSHIP_CONTRACT_VERSION, schemaVersion: fidApi.FOOTBALL_RELATIONSHIP_SCHEMA_VERSION, total: cases.length, passed, failed, cases, existingSuiteSummaries: context.suites };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runFootballRelationshipContractDiagnostics });
