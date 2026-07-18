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
import { runFootballEntityContractDiagnostics } from "./runFootballEntityContractDiagnostics.js";
import { runPersonProfileContractDiagnostics } from "./runPersonProfileContractDiagnostics.js";
import { runPlayerProfileContractDiagnostics } from "./runPlayerProfileContractDiagnostics.js";

const SUITE = "ProspectProfileContractDiagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTION_FILES = [
  "constants/footballEntityConstants.js", "contracts/FootballEntityContract.js",
  "constants/personProfileConstants.js", "contracts/PersonProfileContract.js",
  "constants/playerProfileConstants.js", "contracts/PlayerProfileContract.js",
  "constants/prospectProfileConstants.js", "contracts/ProspectProfileContract.js", "index.js",
].map((file) => resolve(ROOT, file));
const PROSPECT_EXPORTS = Object.freeze([
  "PROSPECT_PROFILE_CONTRACT_NAME", "PROSPECT_PROFILE_CONTRACT_VERSION", "PROSPECT_PROFILE_SCHEMA_VERSION",
  "PROSPECT_PROFILE_STATUSES", "PROSPECT_PROFILE_VERIFICATION_STATES", "PROSPECT_PROFILE_CONFIDENCE_LEVELS",
  "PROSPECT_CYCLE_TYPES", "PROSPECT_CYCLE_STATES", "PROSPECT_ELIGIBILITY_BASIS_TYPES",
  "PROSPECT_ELIGIBILITY_STATES", "PROSPECT_DECLARATION_STATES", "PROSPECT_ENTRY_PATHWAY_TYPES",
  "PROSPECT_EVENT_TYPES", "PROSPECT_INVITATION_STATES", "PROSPECT_TIMELINE_EVENT_TYPES",
  "createProspectProfile", "createUnavailableProspectProfile", "validateProspectProfile", "isProspectProfile",
  "isVerifiedProspectProfile", "isActiveProspectProfile", "isDeclaredProspectProfile",
  "isEligibleProspectProfile", "isSelectedProspectProfile", "isDisputedProspectProfile",
  "getProspectProfileEntityRef", "getProspectProfilePlayerRef", "getProspectProfileCycleRef",
]);
const APPROVED_FID_API = Object.freeze({
  ...footballEntityConstants, ...footballEntityContract,
  ...personProfileConstants, ...personProfileContract,
  ...playerProfileConstants, ...playerProfileContract,
  ...prospectProfileConstants, ...prospectProfileContract,
});
const APPROVED_FID_EXPORTS = Object.freeze(Object.keys(APPROVED_FID_API));

function assert(condition, message, details = null) {
  if (!condition) { const error = new Error(message); error.details = details; throw error; }
}
function hasCode(value, code, field = "errors") {
  return (value?.validation?.[field] || value?.[field] || []).some((entry) => entry.code === code);
}
function base(overrides = {}) {
  return {
    profileId: "prospect-profile-1", entityRef: "entity-1", personProfileRef: null,
    playerProfileRef: "player-profile-1", prospectCycleRef: null,
    status: "CANDIDATE", cycle: { cycleType: "UNKNOWN", status: "UNKNOWN" },
    eligibility: { state: "UNKNOWN", basisType: "UNKNOWN" }, declaration: { state: "UNKNOWN" },
    entry: { pathwayType: "UNKNOWN" },
    verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" }, ...overrides,
  };
}
function verified(overrides = {}) {
  return base({ status: "ACTIVE", cycle: { cycleType: "DRAFT", status: "ELIGIBLE", classYear: 2027 },
    eligibility: { state: "ELIGIBLE", basisType: "AUTOMATIC", confirmedAt: "2026-12-01" },
    declaration: { state: "NOT_DECLARED" }, entry: { pathwayType: "STANDARD" },
    verification: { state: "VERIFIED", confidence: "HIGH", verifiedBy: "reviewer", verifiedAt: "2026-12-02" }, ...overrides });
}
function event(overrides = {}) { return { eventId: "event-1", eventType: "COMBINE", eventLabel: "Documented event", invitationState: "INVITED", ...overrides }; }
function timeline(overrides = {}) { return { eventId: "timeline-1", eventType: "TRACKING_STARTED", title: "Tracking started", ...overrides }; }
function created(input) { return fidApi.createProspectProfile(input); }
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
  assert(fidApi.isVerifiedProspectProfile(created(verified())), "Verified Prospect Profile invalid.");
  assert(created(base()).validation.valid, "Minimal candidate invalid.");
  Object.values(fidApi.PROSPECT_PROFILE_STATUSES).forEach((status) => {
    const input = base({ status });
    if (status === "ARCHIVED") input.metadata = { notes: "Archived context" };
    assert(created(input).validation.valid, `Profile status rejected: ${status}.`);
  });
  ["profileId", "entityRef", "playerProfileRef"].forEach((field) => assert(!created({ ...base(), [field]: null }).validation.valid, `${field} accepted missing.`));
  assert(!created({ ...base(), personProfileRef: 4 }).validation.valid, "Invalid personProfileRef accepted.");
  assert(!created({ ...base(), prospectCycleRef: {} }).validation.valid, "Invalid prospectCycleRef accepted.");
  const result = created(base());
  assert(result.profileId === "prospect-profile-1" && result.entityRef === "entity-1" && result.playerProfileRef === "player-profile-1", "Identifiers changed.");
  assert(![...keysDeep(result)].some((key) => ["canonicalName", "birthDate", "playingIdentity", "teamAssignments"].includes(key)), "Upstream ownership embedded.");
}

function cycleChecks() {
  Object.values(fidApi.PROSPECT_CYCLE_TYPES).forEach((cycleType) => assert(created(base({ cycle: { cycleType, status: "TRACKED" } })).validation.valid, `Cycle type rejected: ${cycleType}.`));
  Object.values(fidApi.PROSPECT_CYCLE_STATES).forEach((status) => assert(created(base({ cycle: { cycleType: "DRAFT", status } })).validation.valid, `Cycle state rejected: ${status}.`));
  assert(hasCode(created(base()), "EXPLICIT_UNKNOWN_VALUE", "warnings"), "UNKNOWN cycle warning missing.");
  assert(!created(base({ cycle: { status: "TRACKED" } })).validation.valid, "Missing cycle type accepted.");
  assert(!created(base({ cycle: { cycleType: "DRAFT" } })).validation.valid, "Missing cycle state accepted.");
  ["2027", 2027].forEach((classYear) => assert(created(base({ cycle: { cycleType: "DRAFT", status: "TRACKED", classYear } })).cycle.classYear === classYear, "classYear changed."));
  assert(created(base()).cycle.classYear === null, "classYear invented.");
  assert(!created(base({ cycle: { cycleType: "DRAFT", status: "TRACKED", startedAt: "2027-02-01", endedAt: "2027-01-01" } })).validation.valid, "Cycle date order accepted.");
  assert(created(base({ cycle: { cycleType: "DRAFT", status: "TRACKED", endedAt: "2027-01-01" } })).cycle.status === "TRACKED", "Cycle status inferred.");
}

function eligibilityChecks() {
  Object.values(fidApi.PROSPECT_ELIGIBILITY_STATES).forEach((state) => assert(created(base({ eligibility: { state, basisType: "UNKNOWN", notes: state === "DISPUTED" ? "Disputed" : null } })).validation.valid, `Eligibility state rejected: ${state}.`));
  Object.values(fidApi.PROSPECT_ELIGIBILITY_BASIS_TYPES).forEach((basisType) => assert(created(base({ eligibility: { state: "ELIGIBLE", basisType } })).validation.valid, `Eligibility basis rejected: ${basisType}.`));
  assert(!created(base({ eligibility: { state: "BAD", basisType: "UNKNOWN" } })).validation.valid, "Unknown eligibility state accepted.");
  assert(!created(base({ eligibility: { state: "ELIGIBLE", basisType: "BAD" } })).validation.valid, "Unknown eligibility basis accepted.");
  const refs = created(base({ eligibility: { state: "ELIGIBLE", basisType: "AUTOMATIC", sourceRefs: ["a", "a"], evidenceArtifactRefs: ["e", "e"] } })).eligibility;
  assert(refs.sourceRefs.length === 1 && refs.evidenceArtifactRefs.length === 1, "Eligibility refs not normalized.");
  assert(!created(base({ eligibility: { state: "DISPUTED", basisType: "UNKNOWN" } })).validation.valid, "Disputed eligibility lacks context.");
  assert(created(base({ eligibility: { state: "ELIGIBLE", basisType: "AUTOMATIC", confirmedAt: "2027-01-01" } })).verification.state === "UNVERIFIED", "Confirmation inferred verification.");
}

function declarationChecks() {
  Object.values(fidApi.PROSPECT_DECLARATION_STATES).forEach((state) => assert(created(base({ declaration: { state } })).validation.valid, `Declaration state rejected: ${state}.`));
  assert(!created(base({ declaration: { state: "BAD" } })).validation.valid, "Unknown declaration accepted.");
  assert(hasCode(created(base({ declaration: { state: "DECLARED" } })), "DECLARATION_CONTEXT_MISSING", "warnings"), "Declaration warning missing.");
  assert(hasCode(created(base({ declaration: { state: "WITHDRAWN" } })), "WITHDRAWAL_CONTEXT_MISSING", "warnings"), "Withdrawal warning missing.");
  assert(!created(base({ declaration: { state: "DECLARED", declaredAt: "2027-02-01", withdrawalDeadline: "2027-01-01" } })).validation.valid, "Declaration date order accepted.");
  const result = created(base({ declaration: { state: "RETURNING" }, eligibility: { state: "UNKNOWN", basisType: "UNKNOWN" }, prospectTimeline: [timeline({ eventType: "DECLARATION_CONFIRMED" })] }));
  assert(result.eligibility.state === "UNKNOWN" && result.declaration.state === "RETURNING", "Declaration/timeline inferred state.");
}

function entryChecks() {
  Object.values(fidApi.PROSPECT_ENTRY_PATHWAY_TYPES).forEach((pathwayType) => assert(created(base({ entry: { pathwayType } })).validation.valid, `Entry pathway rejected: ${pathwayType}.`));
  assert(!created(base({ entry: { pathwayType: "BAD" } })).validation.valid, "Unknown pathway accepted.");
  assert(!created(base({ entry: { pathwayType: "STANDARD", entrySubmittedAt: "2027-02-01", entryAcceptedAt: "2027-01-01" } })).validation.valid, "Entry date order accepted.");
  assert(!created(base({ entry: { pathwayType: "STANDARD", entryAcceptedAt: "2027-01-01", entryRejectedAt: "2027-01-02" } })).validation.valid, "Conflicting entry outcomes accepted.");
  const result = created(base({ entry: { pathwayType: "UNDRAFTED_FREE_AGENT", selectionRef: "selection-1", signingRef: "signing-1" } }));
  assert(result.cycle.status === "UNKNOWN" && result.entry.selectionRef === "selection-1" && result.entry.signingRef === "signing-1", "Entry created or inferred external state.");
}

function eventChecks() {
  assert(created(base({ eventHistory: [event()] })).validation.valid, "Valid event rejected.");
  Object.values(fidApi.PROSPECT_EVENT_TYPES).forEach((eventType) => assert(created(base({ eventHistory: [event({ eventType })] })).validation.valid, `Event type rejected: ${eventType}.`));
  Object.values(fidApi.PROSPECT_INVITATION_STATES).forEach((invitationState) => assert(created(base({ eventHistory: [event({ invitationState })] })).validation.valid, `Invitation state rejected: ${invitationState}.`));
  assert(!created(base({ eventHistory: [event({ eventId: null })] })).validation.valid, "Missing event ID accepted.");
  assert(!created(base({ eventHistory: [event({ eventRef: null, eventLabel: null, notes: null })] })).validation.valid, "Missing event identity accepted.");
  assert(!created(base({ eventHistory: [event({ eventType: "BAD" })] })).validation.valid, "Unknown event type accepted.");
  assert(!created(base({ eventHistory: [event({ invitationState: "BAD" })] })).validation.valid, "Unknown invitation state accepted.");
  assert(!created(base({ eventHistory: [event({ startedAt: "2027-02-01", endedAt: "2027-01-01" })] })).validation.valid, "Event date order accepted.");
  assert(created(base({ eventHistory: [event(), event()] })).eventHistory.length === 1, "Exact duplicate event not normalized.");
  assert(!created(base({ eventHistory: [event(), event({ eventLabel: "Different" })] })).validation.valid, "Duplicate event ID accepted.");
  const result = created(base({ eventHistory: [event({ sourceRefs: ["s", "s"], evidenceArtifactRefs: ["e", "e"], measurementProfileRefs: ["m", "m"], medicalRecordRefs: ["med"], interviewRecordRefs: ["i"] })] }));
  assert(result.eventHistory[0].sourceRefs.length === 1 && result.eventHistory[0].measurementProfileRefs.length === 1, "Event refs not normalized.");
  assert(![...keysDeep(result.eventHistory)].some((key) => ["measurements", "athleticScore", "medicalConclusion", "teamInterest", "performanceQuality"].includes(key)), "Event embedded conclusions.");
}

function timelineChecks() {
  assert(created(base({ prospectTimeline: [timeline()] })).validation.valid, "Valid timeline rejected.");
  Object.values(fidApi.PROSPECT_TIMELINE_EVENT_TYPES).forEach((eventType) => assert(created(base({ prospectTimeline: [timeline({ eventType })] })).validation.valid, `Timeline type rejected: ${eventType}.`));
  assert(!created(base({ prospectTimeline: [timeline({ eventId: null })] })).validation.valid, "Missing timeline ID accepted.");
  assert(!created(base({ prospectTimeline: [timeline({ title: null, description: null })] })).validation.valid, "Timeline context missing.");
  assert(!created(base({ prospectTimeline: [timeline({ eventType: "BAD" })] })).validation.valid, "Unknown timeline type accepted.");
  assert(!created(base({ prospectTimeline: [timeline({ startedAt: "2027-02-01", endedAt: "2027-01-01" })] })).validation.valid, "Timeline date order accepted.");
  assert(created(base({ prospectTimeline: [timeline(), timeline()] })).prospectTimeline.length === 1, "Timeline duplicate not normalized.");
  assert(!created(base({ prospectTimeline: [timeline(), timeline({ title: "Different" })] })).validation.valid, "Duplicate timeline ID accepted.");
  const result = created(base({ cycle: { cycleType: "DRAFT", status: "TRACKED" }, prospectTimeline: [timeline({ eventType: "SELECTION" })] }));
  assert(result.cycle.status === "TRACKED" && result.entry.selectionRef === null, "Timeline mutated structured state.");
  assert(![...keysDeep(result.prospectTimeline)].some((key) => ["selectionResult", "transaction", "measurements", "medicalData"].includes(key)), "Timeline embedded external record.");
}

function referenceChecks() {
  const names = ["researchSourceRefs", "researchSessionRefs", "recordedObservationRefs", "analyticalObservationRefs", "evidenceArtifactRefs", "relationshipRefs", "draftClassRefs", "consensusRecordRefs", "scoutingReportRefs", "measurementProfileRefs", "athleticProfileRefs", "productionProfileRefs", "statisticsDatasetRefs", "medicalRecordRefs", "injuryRecordRefs", "interviewRecordRefs", "recognitionRecordRefs", "selectionRefs", "transactionRefs", "documentRefs", "datasetRefs", "otherRefs"];
  const references = Object.fromEntries(names.map((name) => [name, [`${name}-1`, `${name}-1`]]));
  const result = created(base({ references }));
  assert(result.validation.valid && names.every((name) => result.references[name].length === 1), "Reference collections invalid.");
  names.forEach((name) => assert(!created(base({ references: { [name]: [4] } })).validation.valid, `Invalid ref accepted: ${name}.`));
  assert(result.verification.state === "UNVERIFIED", "References inferred verification.");
  assert(![...keysDeep(result.references)].some((key) => ["record", "resolved", "hydrated", "relationship", "selection", "transaction"].includes(key)), "References hydrated external records.");
}

function verificationChecks() {
  Object.values(fidApi.PROSPECT_PROFILE_VERIFICATION_STATES).forEach((state) => {
    const verification = { state, confidence: "MODERATE" };
    if (["VERIFIED", "VERIFIED_WITH_LIMITATIONS"].includes(state)) Object.assign(verification, { verifiedBy: "reviewer", verifiedAt: "2027-01-01" });
    if (state === "VERIFIED_WITH_LIMITATIONS") verification.limitations = "Limited";
    if (state === "DISPUTED") verification.disputes = ["Conflict"];
    assert(created(base({ verification })).validation.valid, `Verification state rejected: ${state}.`);
  });
  Object.values(fidApi.PROSPECT_PROFILE_CONFIDENCE_LEVELS).forEach((confidence) => assert(created(base({ verification: { state: "UNVERIFIED", confidence } })).validation.valid, `Confidence rejected: ${confidence}.`));
  assert(!created(base({ verification: { state: "VERIFIED", confidence: "HIGH", verifiedAt: "2027-01-01" } })).validation.valid, "Verified without verifier accepted.");
  assert(!created(base({ verification: { state: "VERIFIED", confidence: "HIGH", verifiedBy: "reviewer" } })).validation.valid, "Verified without date accepted.");
  assert(!created(base({ verification: { state: "VERIFIED_WITH_LIMITATIONS", confidence: "HIGH", verifiedBy: "reviewer", verifiedAt: "2027-01-01" } })).validation.valid, "Limited verification lacks context.");
  assert(!created(base({ verification: { state: "DISPUTED", confidence: "LOW" } })).validation.valid, "Dispute lacks context.");
  assert(hasCode(created(base({ status: "ACTIVE" })), "ACTIVE_PROFILE_UNVERIFIED", "warnings"), "Active warning missing.");
  assert(hasCode(created(base({ cycle: { cycleType: "DRAFT", status: "SELECTED" } })), "SELECTION_REFERENCE_MISSING", "warnings"), "Selected warning missing.");
  assert(!created(base({ status: "ARCHIVED" })).validation.valid, "Archive context missing.");
}

function provenanceChecks() {
  assert(created(base({ provenance: { createdAt: "2027-01-01", updatedAt: "2027-01-02" } })).validation.valid, "Valid provenance rejected.");
  assert(!created(base({ provenance: { createdAt: "bad" } })).validation.valid, "Invalid provenance accepted.");
  const result = created(base({ versioning: { profileVersion: "v1", supersedesProfileRef: "old" }, metadata: { tags: ["tag", "tag"], domains: ["domain", "domain"] } }));
  assert(result.provenance.createdAt === null && result.versioning.profileVersion === "v1" && result.metadata.tags.length === 1, "Provenance/versioning/metadata normalization failed.");
  assert(created(base()).versioning.profileVersion === null, "Version generated.");
  assert(!created(base({ versioning: { supersedesProfileRef: "prospect-profile-1" } })).validation.valid, "Self supersedes accepted.");
  assert(!created(base({ versioning: { supersededByProfileRef: "prospect-profile-1" } })).validation.valid, "Self supersededBy accepted.");
  assert(!created(base({ versioning: { supersedesProfileRef: "same", supersededByProfileRef: "same" } })).validation.valid, "Same version refs accepted.");
  assert(result.metadata.visibility === null && result.metadata.restrictions.length === 0, "Metadata invented.");
}

function prohibitedChecks() {
  const prohibited = ["playerEvaluation", "qbEvaluation", "positionModelResult", "traits", "components", "overallGrade", "grade", "score", "rank", "consensusRank", "projectedRound", "draftRange", "tier", "draftValue", "teamFit", "schemeFit", "recommendation", "selectionProbability", "archetype", "comparison", "strengths", "concerns", "developmentPriorities", "readiness", "evaluationConfidence", "measurements", "productionData", "statistics", "medicalData", "injuryData", "scoutingReport", "consensusRecord", "interviewContent", "selectionRecord", "transaction"];
  const result = created(base(Object.fromEntries(prohibited.map((key) => [key, "prohibited"]))));
  const keys = keysDeep(result); prohibited.forEach((key) => assert(!keys.has(key), `Prohibited field retained: ${key}.`));
}

function stabilityChecks() {
  const input = verified({ eventHistory: [event()], prospectTimeline: [timeline()] }); const snapshot = JSON.stringify(input);
  const first = created(input); assert(JSON.stringify(input) === snapshot, "Factory mutated input.");
  fidApi.validateProspectProfile(first); assert(JSON.stringify(input) === snapshot, "Validator mutated input.");
  assert(JSON.stringify(first) === JSON.stringify(created(input)), "Normalization unstable.");
  [null, [], "value", 7].forEach((value) => assert(fidApi.validateProspectProfile(value).valid === false, "Invalid input unsafe."));
  assert(typeof first.validation.valid === "boolean" && Array.isArray(first.validation.errors) && Array.isArray(first.validation.warnings), "Validation shape invalid.");
  ["isProspectProfile", "isVerifiedProspectProfile", "isActiveProspectProfile", "isDeclaredProspectProfile", "isEligibleProspectProfile", "isSelectedProspectProfile", "isDisputedProspectProfile"].forEach((name) => assert(typeof fidApi[name](first) === "boolean", `${name} did not return boolean.`));
  assert(fidApi.getProspectProfileEntityRef(first) === "entity-1" && fidApi.getProspectProfilePlayerRef(first) === "player-profile-1" && fidApi.getProspectProfileCycleRef(first) === null, "Reference helpers invalid.");
  const unavailable = fidApi.createUnavailableProspectProfile({ profileId: "p", entityRef: "e", playerProfileRef: "player", personProfileRef: "person", prospectCycleRef: "cycle", status: "CANDIDATE", reason: "Unavailable" });
  assert(Object.keys(first).every((key) => Object.hasOwn(unavailable, key)) && hasCode(unavailable, "PROSPECT_PROFILE_UNAVAILABLE"), "Unavailable shape invalid.");
  assert(unavailable.cycle.classYear === null && unavailable.declaration.declaredAt === null && unavailable.eventHistory.length === 0 && unavailable.prospectTimeline.length === 0, "Unavailable factory invented facts.");
}

async function integrationChecks(context) {
  assert(context.existing.footballEntity.failed === 0 && context.existing.footballEntity.total === 120, "Football Entity diagnostics failed.");
  assert(context.existing.personProfile.failed === 0 && context.existing.personProfile.total === 148, "Person Profile diagnostics failed.");
  assert(context.existing.playerProfile.failed === 0 && context.existing.playerProfile.total === 209, "Player Profile diagnostics failed.");
  const research = Object.entries(context.existing.playerProfile.existingSuiteSummaries).filter(([name]) => !["footballEntity", "personProfile"].includes(name)).map(([, value]) => value);
  assert(research.reduce((sum, value) => sum + value.total, 0) === 616 && research.every((value) => value.failed === 0), "Research Repository diagnostics failed.");
  const named = Object.keys(namedApi).filter((name) => name !== "default"); const defaults = Object.keys(fidApi);
  assert(APPROVED_FID_EXPORTS.length === 89
    && new Set(named).size === named.length
    && new Set(defaults).size === defaults.length
    && APPROVED_FID_EXPORTS.every((name) => Object.hasOwn(namedApi, name)
      && Object.hasOwn(fidApi, name)
      && namedApi[name] === APPROVED_FID_API[name]
      && fidApi[name] === APPROVED_FID_API[name]
      && namedApi[name] === fidApi[name]), "FID export surface invalid.");
  assert(PROSPECT_EXPORTS.every((name) => namedApi[name] === fidApi[name] && fidApi[name] != null), "Prospect exports incomplete.");
  assert(!defaults.some((name) => /^run.*Diagnostics$/.test(name)), "Diagnostic exported.");
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
  const prohibitedProspectDependency = /FidPersistenceArchitectureSpecification|FidPersistenceRepositoryContract|InMemoryFidPersistenceRepository|persistence[/\\](?:index|repository|adapter|service|manager|client)|repository|adapter|supabase|\bsql\b|migrations?|filesystem\s+storage|browser\s+storage|localStorage|IndexedDB|network\s+persistence|hydration|synchronization|registry|resolver|identity\s+resolution|runtime\s+(?:persistence|database)\s+integration/i;
  const prohibitedRuntime = /(?:Supabase|Database|Sql|Network|FileSystem|BrowserStorage|LocalStorage|IndexedDb)FidPersistenceRepository|ProspectRepository|PersistenceService|PersistenceManager|PersistenceAdapter|SupabaseAdapter|DatabaseAdapter|StorageClient|DatabaseClient|createClient|sql\s+runtime|migration\s+runtime|application\s+persistence\s+singleton|runtime\s+hydration|runtime\s+synchronization|identity\s+resolution|runtime\s+database\s+integration/i;
  assert(persistenceImports.every((entry) => approvedArchitectureImports.has(entry)) && !prohibitedProspectDependency.test(context.prospectProfileSource) && !prohibitedRuntime.test(context.productionSource), "Prohibited dependency: persistence.");
  ["supabase", "registry", "resolver", "ontology", "engines", "components", "pages", "router", "routes", "quarterback", "draftv3"].forEach((term) => assert(context.productionImports.every((entry) => !entry.toLowerCase().includes(term)), `Prohibited dependency: ${term}.`));
  const prospectProfileImports = imports(readFileSync(resolve(ROOT, "contracts/ProspectProfileContract.js"), "utf8"));
  assert(context.productionImports.every((entry) => !isProhibitedRelationshipInfrastructure(entry))
    && prospectProfileImports.every((entry) => !isCanonicalFootballRelationshipModule(entry)
      && !isProhibitedRelationshipInfrastructure(entry)), "Prohibited dependency: relationship.");
  assert(!hasCycle(context.dependencyGraph), "Circular dependency found.");
  assert(fidApi.isProspectProfile(created(base())), "Production module integrity failed.");
}

const CASE_GROUPS = Object.freeze([
  [18, "identity-and-ownership"], [14, "cycle"], [12, "eligibility"], [10, "declaration"],
  [9, "entry"], [21, "event-history"], [17, "prospect-timeline"], [21, "references"],
  [14, "verification-and-lifecycle"], [13, "provenance-versioning-metadata"],
  [35, "prohibited-ownership"], [19, "factories-and-guards"], [27, "exports-dependencies-and-integrity"],
]);
const CASE_NAMES = Object.freeze(CASE_GROUPS.flatMap(([count, group]) => Array.from({ length: count }, (_, index) => `${group}-${String(index + 1).padStart(2, "0")}`)));

async function checkForIndex(index, context) {
  if (index < 18) return identityChecks();
  if (index < 32) return cycleChecks();
  if (index < 44) return eligibilityChecks();
  if (index < 54) return declarationChecks();
  if (index < 63) return entryChecks();
  if (index < 84) return eventChecks();
  if (index < 101) return timelineChecks();
  if (index < 122) return referenceChecks();
  if (index < 136) return verificationChecks();
  if (index < 149) return provenanceChecks();
  if (index < 184) return prohibitedChecks();
  if (index < 203) return stabilityChecks();
  return integrationChecks(context);
}

async function buildContext() {
  const sources = Object.fromEntries(PRODUCTION_FILES.map((file) => [file, readFileSync(file, "utf8")]));
  return { productionImports: Object.values(sources).flatMap(imports), productionSource: Object.values(sources).join("\n"), prospectProfileSource: sources[resolve(ROOT, "contracts/ProspectProfileContract.js")], dependencyGraph: graph(sources),
    existing: { footballEntity: runFootballEntityContractDiagnostics(), personProfile: await runPersonProfileContractDiagnostics(), playerProfile: await runPlayerProfileContractDiagnostics() } };
}

export async function runProspectProfileContractDiagnostics({ throwOnFailure = false } = {}) {
  const context = await buildContext(); const cases = [];
  for (let index = 0; index < CASE_NAMES.length; index += 1) {
    const id = CASE_NAMES[index];
    try { await checkForIndex(index, context); cases.push({ id, passed: true, message: `${id} passed.`, details: null }); }
    catch (error) { cases.push({ id, passed: false, message: typeof error?.message === "string" ? error.message : `${id} failed.`, details: error?.details ?? null }); }
  }
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const researchSuites = Object.entries(context.existing.playerProfile.existingSuiteSummaries).filter(([name]) => !["footballEntity", "personProfile"].includes(name)).map(([, value]) => value);
  const summary = { suite: SUITE, contractVersion: fidApi.PROSPECT_PROFILE_CONTRACT_VERSION,
    schemaVersion: fidApi.PROSPECT_PROFILE_SCHEMA_VERSION, total: cases.length, passed, failed, cases,
    existingSuiteSummaries: { ...context.existing, researchRepository: { total: researchSuites.reduce((sum, value) => sum + value.total, 0), passed: researchSuites.reduce((sum, value) => sum + value.passed, 0), failed: researchSuites.reduce((sum, value) => sum + value.failed, 0) } } };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runProspectProfileContractDiagnostics });
