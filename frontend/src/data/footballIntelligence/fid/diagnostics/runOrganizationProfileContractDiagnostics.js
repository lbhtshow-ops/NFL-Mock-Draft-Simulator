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
import { runFootballEntityContractDiagnostics } from "./runFootballEntityContractDiagnostics.js";
import { runPersonProfileContractDiagnostics } from "./runPersonProfileContractDiagnostics.js";
import { runPlayerProfileContractDiagnostics } from "./runPlayerProfileContractDiagnostics.js";
import { runProspectProfileContractDiagnostics } from "./runProspectProfileContractDiagnostics.js";
import { runFidPersonPlayerProspectFoundationDiagnostics } from "./runFidPersonPlayerProspectFoundationDiagnostics.js";

const SUITE = "OrganizationProfileContractDiagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTION_FILES = [
  "constants/footballEntityConstants.js", "contracts/FootballEntityContract.js",
  "constants/personProfileConstants.js", "contracts/PersonProfileContract.js",
  "constants/playerProfileConstants.js", "contracts/PlayerProfileContract.js",
  "constants/prospectProfileConstants.js", "contracts/ProspectProfileContract.js",
  "constants/organizationProfileConstants.js", "contracts/OrganizationProfileContract.js", "index.js",
].map((file) => resolve(ROOT, file));
const ORGANIZATION_EXPORTS = Object.freeze([
  "ORGANIZATION_PROFILE_CONTRACT_NAME", "ORGANIZATION_PROFILE_CONTRACT_VERSION", "ORGANIZATION_PROFILE_SCHEMA_VERSION",
  "ORGANIZATION_PROFILE_STATUSES", "ORGANIZATION_PROFILE_VERIFICATION_STATES",
  "ORGANIZATION_PROFILE_CONFIDENCE_LEVELS", "ORGANIZATION_TYPES", "ORGANIZATION_OPERATING_STATES",
  "ORGANIZATION_AFFILIATION_TYPES", "ORGANIZATION_AFFILIATION_STATUSES",
  "ORGANIZATION_LOCATION_USAGE_TYPES", "ORGANIZATION_TIMELINE_EVENT_TYPES",
  "createOrganizationProfile", "createUnavailableOrganizationProfile", "validateOrganizationProfile",
  "isOrganizationProfile", "isVerifiedOrganizationProfile", "isActiveOrganizationProfile",
  "isOperatingOrganizationProfile", "isDissolvedOrganizationProfile", "isDisputedOrganizationProfile",
  "getOrganizationProfileEntityRef",
]);
const APPROVED_FID_API = Object.freeze({
  ...footballEntityConstants, ...footballEntityContract, ...personProfileConstants, ...personProfileContract,
  ...playerProfileConstants, ...playerProfileContract, ...prospectProfileConstants, ...prospectProfileContract,
  ...organizationProfileConstants, ...organizationProfileContract,
});
const APPROVED_EXPORTS = Object.freeze(Object.keys(APPROVED_FID_API));

function assert(condition, message, details = null) {
  if (!condition) { const error = new Error(message); error.details = details; throw error; }
}
function hasCode(value, code, field = "errors") {
  return (value?.validation?.[field] || value?.[field] || []).some((entry) => entry.code === code);
}
function base(overrides = {}) {
  return { profileId: "organization-profile-1", entityRef: "entity-organization-1", status: "CANDIDATE",
    organizationType: "UNKNOWN", operatingState: "UNKNOWN",
    verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" }, ...overrides };
}
function verified(overrides = {}) {
  return base({ status: "ACTIVE", organizationType: "PROFESSIONAL_FRANCHISE", operatingState: "OPERATING",
    verification: { state: "VERIFIED", confidence: "HIGH", verifiedBy: "reviewer", verifiedAt: "2027-01-01" }, ...overrides });
}
function location(overrides = {}) { return { locationId: "location-1", locationType: "HEADQUARTERS", label: "Declared location", ...overrides }; }
function affiliation(overrides = {}) { return { affiliationId: "affiliation-1", affiliationType: "MEMBER", organizationRef: "organization-2", status: "REPORTED", ...overrides }; }
function timeline(overrides = {}) { return { eventId: "event-1", eventType: "MILESTONE", title: "Documented event", ...overrides }; }
function created(input) { return fidApi.createOrganizationProfile(input); }
function keysDeep(value, keys = new Set()) {
  if (Array.isArray(value)) value.forEach((entry) => keysDeep(entry, keys));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, entry]) => { keys.add(key); keysDeep(entry, keys); });
  return keys;
}
function imports(source) { return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]); }
function isCanonicalFootballRelationshipModule(entry) {
  return /(?:^|\/)(?:footballRelationshipConstants|FootballRelationshipContract)\.js$/i.test(entry.replaceAll("\\", "/"));
}
function isProhibitedRelationshipInfrastructure(entry) {
  if (isCanonicalFootballRelationshipModule(entry)) return false;
  return /relationships?|graph[-_]?traversal|knowledge[-_]?graph|inverse[-_]?relationship/i.test(entry);
}
function graph(sources) {
  const files = new Set(PRODUCTION_FILES);
  return Object.fromEntries(PRODUCTION_FILES.map((file) => [file, imports(sources[file]).filter((entry) => entry.startsWith("."))
    .map((entry) => resolve(dirname(file), entry)).filter((entry) => files.has(entry))]));
}
function hasCycle(value) {
  const visiting = new Set(); const visited = new Set();
  function visit(node) { if (visiting.has(node)) return true; if (visited.has(node)) return false; visiting.add(node);
    if ((value[node] || []).some(visit)) return true; visiting.delete(node); visited.add(node); return false; }
  return Object.keys(value).some(visit);
}

function identityChecks() {
  assert(fidApi.isVerifiedOrganizationProfile(created(verified())), "Verified Organization Profile invalid.");
  assert(created(base()).validation.valid, "Minimal candidate invalid.");
  Object.values(fidApi.ORGANIZATION_PROFILE_STATUSES).forEach((status) => {
    const input = base({ status }); if (status === "ARCHIVED") input.metadata = { notes: "Archive context" };
    assert(created(input).validation.valid, `Profile status rejected: ${status}.`);
  });
  Object.values(fidApi.ORGANIZATION_TYPES).forEach((organizationType) => assert(created(base({ organizationType })).validation.valid, `Organization type rejected: ${organizationType}.`));
  Object.values(fidApi.ORGANIZATION_OPERATING_STATES).forEach((operatingState) => assert(created(base({ operatingState })).validation.valid, `Operating state rejected: ${operatingState}.`));
  Object.values(fidApi.ORGANIZATION_PROFILE_VERIFICATION_STATES).forEach((state) => {
    const verification = { state, confidence: "MODERATE" };
    if (["VERIFIED", "VERIFIED_WITH_LIMITATIONS"].includes(state)) Object.assign(verification, { verifiedBy: "reviewer", verifiedAt: "2027-01-01" });
    if (state === "VERIFIED_WITH_LIMITATIONS") verification.limitations = "Limited";
    if (state === "DISPUTED") verification.disputes = ["Disputed fact"];
    assert(created(base({ verification })).validation.valid, `Verification state rejected: ${state}.`);
  });
  Object.values(fidApi.ORGANIZATION_PROFILE_CONFIDENCE_LEVELS).forEach((confidence) => assert(created(base({ verification: { state: "UNVERIFIED", confidence } })).validation.valid, `Confidence rejected: ${confidence}.`));
  assert(hasCode(created(base()), "EXPLICIT_UNKNOWN_VALUE", "warnings"), "Explicit UNKNOWN warning missing.");
  assert(!created(base({ organizationType: "INVALID" })).validation.valid, "Invalid organization type accepted.");
  assert(!created(base({ operatingState: "INVALID" })).validation.valid, "Invalid operating state accepted.");
  assert(!created(base({ status: "INVALID" })).validation.valid, "Invalid status accepted.");
  assert(!created(base({ verification: { state: "INVALID", confidence: "HIGH" } })).validation.valid, "Invalid verification state accepted.");
  assert(!created(base({ verification: { state: "UNVERIFIED", confidence: "INVALID" } })).validation.valid, "Invalid confidence accepted.");
  assert(!created(base({ profileId: null })).validation.valid && !created(base({ entityRef: null })).validation.valid, "Required identity accepted missing.");
  const result = created(base());
  assert(result.profileId === "organization-profile-1" && result.entityRef === "entity-organization-1", "Identity changed or inferred.");
  ["footballEntity", "canonicalName", "aliases", "externalIdentifiers", "entityType"].forEach((key) => assert(!keysDeep(result).has(key), `Canonical identity embedded: ${key}.`));
  assert(created(base({ entityRef: "unresolved-any-type" })).validation.valid, "Entity compatibility or existence resolved.");
}

function detailChecks() {
  const details = { foundedAt: "1960-01-01", establishedAt: "1961-01-01", dissolvedAt: "2020-01-01",
    legalForm: "Declared form", jurisdictionRef: "jurisdiction-1", jurisdictionLabel: "Declared jurisdiction",
    publicDescription: "A factual public description.", websiteRef: "https://example.test", notes: "Documented" };
  const result = created(base({ operatingState: "DISSOLVED", organizationDetails: details }));
  assert(result.validation.valid && result.organizationDetails.foundedAt !== result.organizationDetails.establishedAt, "Organization details invalid or dates conflated.");
  const empty = created(base());
  assert(empty.organizationDetails.foundedAt === null && empty.organizationDetails.establishedAt === null && empty.organizationDetails.dissolvedAt === null, "Organization dates inferred.");
  assert(!created(base({ organizationDetails: { foundedAt: "2020-01-01", dissolvedAt: "2019-01-01" } })).validation.valid, "Invalid detail date order accepted.");
  const mismatch = created(base({ operatingState: "OPERATING", organizationDetails: { dissolvedAt: "2020-01-01" } }));
  assert(mismatch.operatingState === "OPERATING" && hasCode(mismatch, "DISSOLVED_DATE_STATE_MISMATCH", "warnings"), "dissolvedAt changed state or warning missing.");
  assert(empty.organizationDetails.legalForm === null && empty.organizationDetails.jurisdictionRef === null && empty.organizationDetails.websiteRef === null, "Organization facts inferred.");
  assert(![...keysDeep(result)].some((key) => ["websiteContent", "reputation", "successEvaluation", "reputationScore"].includes(key)), "Details created fetched or evaluative data.");
}

function locationChecks() {
  assert(created(base({ locations: [location()] })).validation.valid, "Valid location rejected.");
  Object.values(fidApi.ORGANIZATION_LOCATION_USAGE_TYPES).forEach((locationType) => assert(created(base({ locations: [location({ locationType })] })).validation.valid, `Location type rejected: ${locationType}.`));
  assert(!created(base({ locations: [location({ locationId: null })] })).validation.valid, "Missing location ID accepted.");
  assert(!created(base({ locations: [location({ locationType: "INVALID" })] })).validation.valid, "Invalid location type accepted.");
  assert(!created(base({ locations: [location({ locationRef: null, label: null, notes: null })] })).validation.valid, "Missing location identity accepted.");
  assert(!created(base({ locations: [location({ validFrom: "2027-02-01", validTo: "2027-01-01" })] })).validation.valid, "Location date order accepted.");
  assert(created(base({ locations: [location(), location()] })).locations.length === 1, "Exact location duplicate not normalized.");
  assert(!created(base({ locations: [location(), location({ label: "Different" })] })).validation.valid, "Duplicate location ID conflict accepted.");
  assert(created(base({ locations: [location({ locationId: "a" }), location({ locationId: "b", label: "Other" })] })).locations.length === 2, "Distinct locations did not coexist.");
  const result = created(base({ locations: [location({ locationRef: "loc", sourceRefs: ["s", "s"], evidenceArtifactRefs: ["e", "e"] })] }));
  assert(result.locations[0].sourceRefs.length === 1 && result.locations[0].evidenceArtifactRefs.length === 1, "Location references not normalized.");
  assert(![...keysDeep(result)].some((key) => ["currentLocation", "jurisdiction", "teamProfile", "relationships", "coordinates", "geocode"].includes(key)), "Location inferred external state.");
}

function affiliationChecks() {
  assert(created(base({ affiliations: [affiliation()] })).validation.valid, "Valid affiliation rejected.");
  Object.values(fidApi.ORGANIZATION_AFFILIATION_TYPES).forEach((affiliationType) => assert(created(base({ affiliations: [affiliation({ affiliationType })] })).validation.valid, `Affiliation type rejected: ${affiliationType}.`));
  Object.values(fidApi.ORGANIZATION_AFFILIATION_STATUSES).forEach((status) => assert(created(base({ affiliations: [affiliation({ status })] })).validation.valid, `Affiliation status rejected: ${status}.`));
  assert(!created(base({ affiliations: [affiliation({ affiliationId: null })] })).validation.valid, "Missing affiliation ID accepted.");
  assert(!created(base({ affiliations: [affiliation({ affiliationType: "INVALID" })] })).validation.valid, "Invalid affiliation type accepted.");
  assert(!created(base({ affiliations: [affiliation({ status: "INVALID" })] })).validation.valid, "Invalid affiliation status accepted.");
  assert(!created(base({ affiliations: [affiliation({ organizationRef: null, relatedEntityRef: null })] })).validation.valid, "Affiliation without related organization accepted.");
  assert(!created(base({ affiliations: [affiliation({ validFrom: "2027-02-01", validTo: "2027-01-01" })] })).validation.valid, "Affiliation date order accepted.");
  assert(created(base({ affiliations: [affiliation(), affiliation()] })).affiliations.length === 1, "Affiliation duplicate not normalized.");
  assert(!created(base({ affiliations: [affiliation(), affiliation({ organizationRef: "other" })] })).validation.valid, "Duplicate affiliation ID conflict accepted.");
  assert(created(base({ affiliations: [affiliation({ affiliationId: "a" }), affiliation({ affiliationId: "b", status: "DISPUTED" })] })).affiliations.length === 2, "Conflicting affiliations did not coexist.");
  const open = created(base({ affiliations: [affiliation({ status: "REPORTED", validTo: null })] }));
  assert(open.affiliations[0].status === "REPORTED", "Open-ended affiliation inferred CURRENT.");
  const keys = keysDeep(created(base({ affiliations: [affiliation({ affiliationType: "PARENT" }), affiliation({ affiliationId: "b", affiliationType: "PREDECESSOR" })] })));
  ["ownership", "legalControl", "leagueParticipation", "governingAuthority", "graphEdge", "relationship", "versionChange", "entityLifecycle"].forEach((key) => assert(!keys.has(key), `Affiliation created external state: ${key}.`));
}

function timelineChecks() {
  assert(created(base({ organizationalTimeline: [timeline()] })).validation.valid, "Valid timeline event rejected.");
  Object.values(fidApi.ORGANIZATION_TIMELINE_EVENT_TYPES).forEach((eventType) => assert(created(base({ organizationalTimeline: [timeline({ eventType })] })).validation.valid, `Timeline type rejected: ${eventType}.`));
  assert(!created(base({ organizationalTimeline: [timeline({ eventId: null })] })).validation.valid, "Missing event ID accepted.");
  assert(!created(base({ organizationalTimeline: [timeline({ eventType: "INVALID" })] })).validation.valid, "Invalid timeline type accepted.");
  assert(!created(base({ organizationalTimeline: [timeline({ title: null, description: null })] })).validation.valid, "Timeline context missing.");
  assert(!created(base({ organizationalTimeline: [timeline({ startedAt: "2027-02-01", endedAt: "2027-01-01" })] })).validation.valid, "Timeline date order accepted.");
  assert(created(base({ organizationalTimeline: [timeline(), timeline()] })).organizationalTimeline.length === 1, "Timeline duplicate not normalized.");
  assert(!created(base({ organizationalTimeline: [timeline(), timeline({ title: "Different" })] })).validation.valid, "Duplicate timeline ID accepted.");
  const result = created(base({ operatingState: "UNKNOWN", organizationalTimeline: [
    timeline({ eventId: "f", eventType: "FOUNDED" }), timeline({ eventId: "e", eventType: "ESTABLISHED" }),
    timeline({ eventId: "r", eventType: "RENAMED" }), timeline({ eventId: "l", eventType: "RELOCATED" }),
    timeline({ eventId: "a", eventType: "AFFILIATION_STARTED" }), timeline({ eventId: "m", eventType: "MERGER" }),
    timeline({ eventId: "d", eventType: "DISSOLUTION" }), timeline({ eventId: "o", eventType: "OWNERSHIP_CHANGE" }),
  ] }));
  assert(result.validation.valid && result.organizationDetails.foundedAt === null && result.organizationDetails.establishedAt === null
    && result.locations.length === 0 && result.affiliations.length === 0 && result.operatingState === "UNKNOWN", "Timeline mutated structured state.");
  ["canonicalName", "ownership", "currentState", "versionChange"].forEach((key) => assert(!keysDeep(result).has(key), `Timeline created inferred data: ${key}.`));
}

function referenceChecks() {
  const names = ["researchSourceRefs", "researchSessionRefs", "recordedObservationRefs", "analyticalObservationRefs", "evidenceArtifactRefs", "relationshipRefs", "teamProfileRefs", "leagueRefs", "conferenceRefs", "divisionRefs", "schoolRefs", "locationRefs", "ownershipRecordRefs", "governanceRecordRefs", "staffRecordRefs", "documentRefs", "datasetRefs", "otherRefs"];
  const references = Object.fromEntries(names.map((name) => [name, [`${name}-1`, `${name}-1`]]));
  const result = created(base({ references }));
  assert(result.validation.valid && names.every((name) => result.references[name].length === 1), "Reference collections invalid.");
  names.forEach((name) => assert(!created(base({ references: { [name]: [4] } })).validation.valid, `Invalid reference accepted: ${name}.`));
  assert(result.verification.state === "UNVERIFIED", "Research references implied verification.");
  const keys = keysDeep(result.references);
  ["resolved", "hydrated", "relationship", "team", "ownership", "control", "employment"].forEach((key) => assert(!keys.has(key), `Reference created or hydrated record: ${key}.`));
}

function verificationChecks() {
  assert(!created(base({ verification: { state: "VERIFIED", confidence: "HIGH", verifiedAt: "2027-01-01" } })).validation.valid, "Verified without verifier accepted.");
  assert(!created(base({ verification: { state: "VERIFIED", confidence: "HIGH", verifiedBy: "reviewer" } })).validation.valid, "Verified without date accepted.");
  assert(!created(base({ verification: { state: "VERIFIED_WITH_LIMITATIONS", confidence: "HIGH", verifiedBy: "reviewer", verifiedAt: "2027-01-01" } })).validation.valid, "Limited verification lacks context.");
  assert(!created(base({ verification: { state: "DISPUTED", confidence: "LOW" } })).validation.valid, "Dispute lacks context.");
  assert(created(base({ status: "REJECTED" })).status === "REJECTED", "Rejected profile not preserved.");
  assert(hasCode(created(base({ status: "ACTIVE" })), "ACTIVE_PROFILE_UNVERIFIED", "warnings"), "Active warning missing.");
  assert(created(base({ status: "ACTIVE", operatingState: "UNKNOWN" })).operatingState === "UNKNOWN", "ACTIVE implied operating.");
  assert(created(base({ status: "CANDIDATE", operatingState: "OPERATING" })).status === "CANDIDATE", "OPERATING implied ACTIVE.");
  assert(created(base({ status: "CANDIDATE", operatingState: "DISSOLVED" })).status === "CANDIDATE", "DISSOLVED archived profile.");
  assert(created(base({ operatingState: "MERGED" })).operatingState === "MERGED", "MERGED state changed external lifecycle.");
  assert(hasCode(created(base({ operatingState: "OPERATING", organizationDetails: { dissolvedAt: "2020-01-01" } })), "DISSOLVED_DATE_STATE_MISMATCH", "warnings"), "Dissolved date mismatch warning absent.");
}

function provenanceChecks() {
  assert(created(base({ provenance: { createdAt: "2027-01-01", updatedAt: "2027-01-02" } })).validation.valid, "Valid provenance rejected.");
  assert(!created(base({ provenance: { createdAt: "invalid" } })).validation.valid, "Invalid provenance accepted.");
  const result = created(base({ versioning: { profileVersion: "v1", supersedesProfileRef: "old" }, metadata: { tags: ["tag", "tag"], domains: ["domain", "domain"] } }));
  assert(result.provenance.createdAt === null && result.versioning.profileVersion === "v1" && result.metadata.tags.length === 1 && result.metadata.domains.length === 1, "Provenance/version/metadata normalization failed.");
  assert(created(base()).versioning.profileVersion === null, "Version generated or incremented.");
  assert(!created(base({ versioning: { supersedesProfileRef: "organization-profile-1" } })).validation.valid, "Self supersedes accepted.");
  assert(!created(base({ versioning: { supersededByProfileRef: "organization-profile-1" } })).validation.valid, "Self supersededBy accepted.");
  assert(!created(base({ versioning: { supersedesProfileRef: "same", supersededByProfileRef: "same" } })).validation.valid, "Same version references accepted.");
  assert(result.metadata.visibility === null && result.metadata.restrictions.length === 0, "Metadata invented.");
}

function prohibitedChecks() {
  const prohibited = ["teamProfile", "roster", "depthChart", "playerAssignments", "coachingStaffMembership",
    "executiveStaffMembership", "employmentRecords", "ownershipIntelligence", "teamIdentity", "footballIdentity",
    "scheme", "competitiveWindow", "salaryCap", "draftCapital", "teamNeeds", "performanceRecord", "standings",
    "wins", "losses", "statistics", "traits", "components", "score", "grade", "rankings", "projections",
    "recommendations", "evaluationResults", "reputationScore", "organizationalStrength", "successRating", "decision"];
  const result = created(base(Object.fromEntries(prohibited.map((key) => [key, "prohibited"]))));
  const keys = keysDeep(result); prohibited.forEach((key) => assert(!keys.has(key), `Prohibited field retained: ${key}.`));
}

function stabilityChecks() {
  const input = verified({ locations: [location()], affiliations: [affiliation()], organizationalTimeline: [timeline()] });
  const snapshot = JSON.stringify(input); const first = created(input);
  assert(JSON.stringify(input) === snapshot, "Factory mutated input."); fidApi.validateOrganizationProfile(first);
  assert(JSON.stringify(input) === snapshot, "Validator mutated input.");
  assert(JSON.stringify(first) === JSON.stringify(created(input)), "Normalization unstable.");
  [null, [], "value", 7].forEach((value) => assert(fidApi.validateOrganizationProfile(value).valid === false, "Invalid input unsafe."));
  assert(typeof first.validation.valid === "boolean" && Array.isArray(first.validation.errors) && Array.isArray(first.validation.warnings), "Validation shape invalid.");
  ["isOrganizationProfile", "isVerifiedOrganizationProfile", "isActiveOrganizationProfile", "isOperatingOrganizationProfile", "isDissolvedOrganizationProfile", "isDisputedOrganizationProfile"].forEach((name) => assert(typeof fidApi[name](first) === "boolean", `${name} did not return boolean.`));
  assert(fidApi.getOrganizationProfileEntityRef(first) === "entity-organization-1", "Entity-ref helper invalid.");
  const unavailable = fidApi.createUnavailableOrganizationProfile({ profileId: "p", entityRef: "e", status: "CANDIDATE", organizationType: "OTHER", operatingState: "INACTIVE", reason: "Unavailable" });
  assert(Object.keys(first).every((key) => Object.hasOwn(unavailable, key)) && unavailable.profileId === "p" && unavailable.entityRef === "e" && unavailable.organizationType === "OTHER" && unavailable.operatingState === "INACTIVE" && hasCode(unavailable, "ORGANIZATION_PROFILE_UNAVAILABLE"), "Unavailable factory incomplete or identifiers changed.");
  assert(unavailable.locations.length === 0 && unavailable.affiliations.length === 0 && unavailable.organizationalTimeline.length === 0 && unavailable.organizationDetails.foundedAt === null && unavailable.versioning.profileVersion === null, "Unavailable factory invented facts.");
}

async function integrationChecks(context) {
  assert(context.existing.footballEntity.total === 120 && context.existing.footballEntity.failed === 0, "Football Entity diagnostics failed.");
  assert(context.existing.personProfile.total === 148 && context.existing.personProfile.failed === 0, "Person Profile diagnostics failed.");
  assert(context.existing.playerProfile.total === 209 && context.existing.playerProfile.failed === 0, "Player Profile diagnostics failed.");
  assert(context.existing.prospectProfile.total === 230 && context.existing.prospectProfile.failed === 0, "Prospect Profile diagnostics failed.");
  assert(context.existing.foundation.total === 130 && context.existing.foundation.failed === 0, "Foundation diagnostics failed.");
  assert(context.existing.researchRepository.total === 616 && context.existing.researchRepository.failed === 0, "Research Repository diagnostics failed.");
  const named = Object.keys(namedApi).filter((name) => name !== "default"); const defaults = Object.keys(fidApi);
  assert(APPROVED_EXPORTS.length === 111 && new Set(named).size === named.length && new Set(defaults).size === defaults.length
    && APPROVED_EXPORTS.every((name) => Object.hasOwn(namedApi, name) && Object.hasOwn(fidApi, name)
      && namedApi[name] === APPROVED_FID_API[name] && fidApi[name] === APPROVED_FID_API[name] && namedApi[name] === fidApi[name]), "FID exports invalid.");
  assert(named.length >= APPROVED_EXPORTS.length && defaults.length >= APPROVED_EXPORTS.length, "Additive exports not permitted.");
  assert(ORGANIZATION_EXPORTS.every((name) => fidApi[name] != null && fidApi[name] === namedApi[name]), "Organization exports incomplete.");
  assert(!defaults.some((name) => /^run.*Diagnostics$/.test(name)), "Diagnostic runner exported.");
  const approvedArchitectureImports = new Set([
    "./persistence/index.js",
    "../persistence/index.js",
    "./persistence/FidPersistenceArchitectureSpecification.js",
    "../persistence/FidPersistenceArchitectureSpecification.js",
    "./persistence/FidPersistenceRepositoryContract.js",
    "../persistence/FidPersistenceRepositoryContract.js",
    "./persistence/InMemoryFidPersistenceRepository.js",
    "../persistence/InMemoryFidPersistenceRepository.js",
  ]);
  const persistenceImports = context.productionImports.filter((entry) => /persistence/i.test(entry));
  const prohibitedOrganizationDependency = /FidPersistenceArchitectureSpecification|FidPersistenceRepositoryContract|InMemoryFidPersistenceRepository|persistence[/\\](?:index|repository|adapter|service|manager|client)|repository|adapter|supabase|\bsql\b|migrations?|filesystem\s+storage|browser\s+storage|localStorage|IndexedDB|network\s+persistence|hydration|synchronization|registry|resolver|identity\s+resolution|runtime\s+(?:persistence|database)\s+integration/i;
  const prohibitedRuntime = /(?:Supabase|Database|Sql|Network|FileSystem|BrowserStorage|LocalStorage|IndexedDb)FidPersistenceRepository|OrganizationRepository|PersistenceService|PersistenceManager|PersistenceAdapter|SupabaseAdapter|DatabaseAdapter|StorageClient|DatabaseClient|createClient|sql\s+runtime|migration\s+runtime|application\s+persistence\s+singleton|runtime\s+hydration|runtime\s+synchronization|identity\s+resolution|runtime\s+database\s+integration/i;
  assert(persistenceImports.every((entry) => approvedArchitectureImports.has(entry)) && !prohibitedOrganizationDependency.test(context.organizationProfileSource) && !prohibitedRuntime.test(context.productionSource), "Prohibited dependency: persistence.");
  ["diagnostics", "researchrepository", "supabase", "registry", "resolver", "ontology", "engines", "quarterback", "draftv3", "components", "pages", "router", "routes"].forEach((term) => assert(context.productionImports.every((entry) => !entry.toLowerCase().replaceAll("/", "").includes(term)), `Prohibited dependency: ${term}.`));
  const organizationProfileImports = imports(readFileSync(resolve(ROOT, "contracts/OrganizationProfileContract.js"), "utf8"));
  assert(context.productionImports.every((entry) => !isProhibitedRelationshipInfrastructure(entry))
    && organizationProfileImports.every((entry) => !isCanonicalFootballRelationshipModule(entry)
      && !isProhibitedRelationshipInfrastructure(entry)), "Prohibited dependency: relationship.");
  assert(!hasCycle(context.dependencyGraph), "Circular production dependency found.");
  assert(fidApi.isOrganizationProfile(created(base())), "Production module integrity failed.");
}

const CASE_GROUPS = Object.freeze([
  [25, "identity-and-lifecycle"], [14, "organization-details"], [17, "locations"], [22, "affiliations"],
  [21, "timeline"], [21, "references"], [12, "verification-and-state"], [13, "provenance-versioning-metadata"],
  [32, "ownership-prohibitions"], [17, "factories-and-guards"], [24, "exports-dependencies-integrity"],
]);
const CASE_NAMES = Object.freeze(CASE_GROUPS.flatMap(([count, group]) => Array.from({ length: count }, (_, index) => `${group}-${String(index + 1).padStart(2, "0")}`)));

async function checkForIndex(index, context) {
  if (index < 25) return identityChecks();
  if (index < 39) return detailChecks();
  if (index < 56) return locationChecks();
  if (index < 78) return affiliationChecks();
  if (index < 99) return timelineChecks();
  if (index < 120) return referenceChecks();
  if (index < 132) return verificationChecks();
  if (index < 145) return provenanceChecks();
  if (index < 177) return prohibitedChecks();
  if (index < 194) return stabilityChecks();
  return integrationChecks(context);
}

async function buildContext() {
  const sources = Object.fromEntries(PRODUCTION_FILES.map((file) => [file, readFileSync(file, "utf8")]));
  const footballEntity = runFootballEntityContractDiagnostics();
  const personProfile = await runPersonProfileContractDiagnostics();
  const playerProfile = await runPlayerProfileContractDiagnostics();
  const prospectProfile = await runProspectProfileContractDiagnostics();
  const foundation = await runFidPersonPlayerProspectFoundationDiagnostics();
  return { productionImports: Object.values(sources).flatMap(imports), productionSource: Object.values(sources).join("\n"), organizationProfileSource: sources[resolve(ROOT, "contracts/OrganizationProfileContract.js")], dependencyGraph: graph(sources),
    existing: { footballEntity, personProfile, playerProfile, prospectProfile, foundation,
      researchRepository: foundation.suiteSummaries.researchRepository } };
}

export async function runOrganizationProfileContractDiagnostics({ throwOnFailure = false } = {}) {
  const context = await buildContext(); const cases = [];
  for (let index = 0; index < CASE_NAMES.length; index += 1) {
    const id = CASE_NAMES[index];
    try { await checkForIndex(index, context); cases.push({ id, passed: true, message: `${id} passed.`, details: null }); }
    catch (error) { cases.push({ id, passed: false, message: typeof error?.message === "string" ? error.message : `${id} failed.`, details: error?.details ?? null }); }
  }
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const summary = { suite: SUITE, contractVersion: fidApi.ORGANIZATION_PROFILE_CONTRACT_VERSION,
    schemaVersion: fidApi.ORGANIZATION_PROFILE_SCHEMA_VERSION, total: cases.length, passed, failed, cases,
    existingSuiteSummaries: context.existing };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runOrganizationProfileContractDiagnostics });
