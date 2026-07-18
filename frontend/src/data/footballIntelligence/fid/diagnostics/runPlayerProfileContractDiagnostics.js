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
import { runFootballEntityContractDiagnostics } from "./runFootballEntityContractDiagnostics.js";
import { runPersonProfileContractDiagnostics } from "./runPersonProfileContractDiagnostics.js";
import { runResearchSourceContractDiagnostics } from "../../../researchRepository/diagnostics/runResearchSourceContractDiagnostics.js";
import { runResearchSessionContractDiagnostics } from "../../../researchRepository/diagnostics/runResearchSessionContractDiagnostics.js";
import { runRecordedObservationContractDiagnostics } from "../../../researchRepository/diagnostics/runRecordedObservationContractDiagnostics.js";
import { runAnalyticalObservationContractDiagnostics } from "../../../researchRepository/diagnostics/runAnalyticalObservationContractDiagnostics.js";
import { runEvidenceArtifactContractDiagnostics } from "../../../researchRepository/diagnostics/runEvidenceArtifactContractDiagnostics.js";
import { runResearchRepositoryFoundationDiagnostics } from "../../../researchRepository/diagnostics/runResearchRepositoryFoundationDiagnostics.js";
import { runResearchRepositoryPersistenceDiagnostics } from "../../../researchRepository/diagnostics/runResearchRepositoryPersistenceDiagnostics.js";
import { runSupabaseResearchRepositoryAdapterDiagnostics } from "../../../researchRepository/diagnostics/runSupabaseResearchRepositoryAdapterDiagnostics.js";

const SUITE = "PlayerProfileContractDiagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTION_FILES = [
  "constants/footballEntityConstants.js", "contracts/FootballEntityContract.js",
  "constants/personProfileConstants.js", "contracts/PersonProfileContract.js",
  "constants/playerProfileConstants.js", "contracts/PlayerProfileContract.js", "index.js",
].map((file) => resolve(ROOT, file));
const PLAYER_EXPORTS = Object.freeze([
  "PLAYER_PROFILE_CONTRACT_NAME", "PLAYER_PROFILE_CONTRACT_VERSION", "PLAYER_PROFILE_SCHEMA_VERSION",
  "PLAYER_PROFILE_STATUSES", "PLAYER_PROFILE_VERIFICATION_STATES", "PLAYER_PROFILE_CONFIDENCE_LEVELS",
  "PLAYER_PARTICIPATION_STATES", "PLAYER_COMPETITION_LEVELS", "PLAYER_POSITION_ASSIGNMENT_TYPES",
  "PLAYER_ASSIGNMENT_STATUSES", "PLAYER_ROSTER_DESIGNATIONS", "PLAYER_ELIGIBILITY_STATES",
  "PLAYER_CAREER_EVENT_TYPES", "createPlayerProfile", "createUnavailablePlayerProfile", "validatePlayerProfile",
  "isPlayerProfile", "isVerifiedPlayerProfile", "isActivePlayerProfile", "isRetiredPlayerProfile",
  "isDisputedPlayerProfile", "getPlayerProfileEntityRef", "getPlayerProfilePersonRef",
]);
const ORIGINAL_FID_API = Object.freeze({
  ...footballEntityConstants,
  ...footballEntityContract,
  ...personProfileConstants,
  ...personProfileContract,
  ...playerProfileConstants,
  ...playerProfileContract,
});
const ORIGINAL_FID_EXPORTS = Object.freeze(Object.keys(ORIGINAL_FID_API));

function assert(condition, message, details = null) {
  if (!condition) { const error = new Error(message); error.details = details; throw error; }
}
function hasCode(value, code, field = "errors") {
  return (value?.validation?.[field] || value?.[field] || []).some((entry) => entry.code === code);
}
function base(overrides = {}) {
  return {
    profileId: "player-profile-1", entityRef: "entity-player-1", personProfileRef: null,
    status: fidApi.PLAYER_PROFILE_STATUSES.CANDIDATE,
    participationState: fidApi.PLAYER_PARTICIPATION_STATES.UNKNOWN,
    playingIdentity: { competitionLevel: fidApi.PLAYER_COMPETITION_LEVELS.UNKNOWN },
    verification: { state: fidApi.PLAYER_PROFILE_VERIFICATION_STATES.UNVERIFIED,
      confidence: fidApi.PLAYER_PROFILE_CONFIDENCE_LEVELS.UNSPECIFIED },
    ...overrides,
  };
}
function verified(overrides = {}) {
  return base({ status: "ACTIVE", participationState: "ACTIVE", playingIdentity: { competitionLevel: "PROFESSIONAL" },
    verification: { state: "VERIFIED", confidence: "HIGH", verifiedBy: "reviewer", verifiedAt: "2026-07-14" }, ...overrides });
}
function position(overrides = {}) {
  return { positionCode: "QB", assignmentType: "LISTED", status: "REPORTED", competitionLevel: "COLLEGE", ...overrides };
}
function assignment(overrides = {}) {
  return { assignmentId: "assignment-1", teamRef: "team-1", competitionLevel: "COLLEGE", status: "REPORTED", ...overrides };
}
function roster(overrides = {}) {
  return { rosterEventId: "roster-1", teamRef: "team-1", designation: "ACTIVE_ROSTER", effectiveAt: "2026-01-01", ...overrides };
}
function eligibility(overrides = {}) {
  return { eligibilityEventId: "eligibility-1", state: "ELIGIBLE", seasonRef: "season-1", ...overrides };
}
function career(overrides = {}) {
  return { eventId: "career-1", eventType: "MILESTONE", title: "Documented event", ...overrides };
}
function created(input) { return fidApi.createPlayerProfile(input); }
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
  assert(fidApi.isVerifiedPlayerProfile(created(verified())), "Verified profile invalid.");
  assert(created(base()).validation.valid, "Minimal profile invalid.");
  const active = created(base({ status: "ACTIVE" }));
  assert(active.validation.valid && hasCode(active, "ACTIVE_PROFILE_UNVERIFIED", "warnings"), "Active warning missing.");
  assert(Object.values(fidApi.PLAYER_PROFILE_STATUSES).every((status) => created(base({ status, metadata: status === "ARCHIVED" ? { notes: "Archived" } : undefined })).validation.valid), "Profile status invalid.");
  assert(Object.values(fidApi.PLAYER_PARTICIPATION_STATES).every((participationState) => created(base({ participationState })).validation.valid), "Participation state invalid.");
  assert(!created(base({ status: "BAD" })).validation.valid && !created(base({ participationState: "BAD" })).validation.valid, "Unknown enum accepted.");
  assert(!created(base({ verification: { state: "BAD", confidence: "HIGH" } })).validation.valid && !created(base({ verification: { state: "UNVERIFIED", confidence: "BAD" } })).validation.valid, "Unknown verification accepted.");
  assert(!created(base({ profileId: null })).validation.valid && !created(base({ entityRef: null })).validation.valid && !created(base({ personProfileRef: {} })).validation.valid, "Required reference validation failed.");
  assert(created(base({ profileId: null, entityRef: "e" })).profileId === null && created(base({ entityRef: null })).entityRef === null && created(base()).personProfileRef === null, "Reference inferred.");
  assert(!created(base({ entityRef: {} })).validation.valid && !created(base({ personProfileRef: {} })).validation.valid, "Embedded profile accepted.");
  const keys = keysDeep(created({ ...base(), canonicalName: "Name", biography: {}, aliases: [] }));
  assert(!keys.has("canonicalName") && !keys.has("biography") && !keys.has("aliases"), "Identity or biography duplicated.");
}

function playingChecks() {
  const value = created(base({ playingIdentity: { competitionLevel: "COLLEGE", preferredPositionRef: "position-1", preferredPositionCode: "QB", throws: "Right", kicks: "Right", uniformNumber: "07", experienceLabel: "Declared" } }));
  assert(value.validation.valid && value.playingIdentity.uniformNumber === "07", "Playing identity invalid.");
  assert(Object.values(fidApi.PLAYER_COMPETITION_LEVELS).every((competitionLevel) => created(base({ playingIdentity: { competitionLevel } })).validation.valid), "Competition level invalid.");
  assert(hasCode(created(base()), "UNKNOWN_COMPETITION_LEVEL", "warnings"), "UNKNOWN warning missing.");
  assert(value.playingIdentity.preferredPositionRef === "position-1" && value.playingIdentity.preferredPositionCode === "QB", "Preferred positions not preserved.");
  const empty = created(base({ playingIdentity: { competitionLevel: "COLLEGE" }, positionHistory: [position()] }));
  assert(empty.playingIdentity.preferredPositionRef === null && empty.playingIdentity.preferredPositionCode === null, "Preferred position inferred.");
  assert(created(base({ playingIdentity: { competitionLevel: "COLLEGE", preferredPositionCode: "QB" } })).playingIdentity.preferredPositionRef === null, "Ref inferred from code.");
  assert(created(base({ playingIdentity: { competitionLevel: "COLLEGE", preferredPositionRef: "p" } })).playingIdentity.preferredPositionCode === null, "Code inferred from ref.");
  assert(empty.playingIdentity.throws === null && empty.playingIdentity.kicks === null && empty.playingIdentity.uniformNumber === null, "Playing facts inferred.");
  const keys = keysDeep(empty); assert(!keys.has("experience") && !keys.has("currentPosition"), "Experience or current position calculated.");
}

function positionChecks() {
  assert(created(base({ positionHistory: [position()] })).validation.valid, "Position record invalid.");
  assert(Object.values(fidApi.PLAYER_POSITION_ASSIGNMENT_TYPES).every((assignmentType) => created(base({ positionHistory: [position({ assignmentType })] })).validation.valid), "Assignment type invalid.");
  assert(Object.values(fidApi.PLAYER_ASSIGNMENT_STATUSES).every((status) => created(base({ positionHistory: [position({ status })] })).validation.valid), "Assignment status invalid.");
  assert(!created(base({ positionHistory: [position({ positionCode: null })] })).validation.valid, "Position identifier not required.");
  assert(!created(base({ positionHistory: [position({ assignmentType: "BAD" })] })).validation.valid && !created(base({ positionHistory: [position({ status: "BAD" })] })).validation.valid && !created(base({ positionHistory: [position({ competitionLevel: "BAD" })] })).validation.valid, "Unknown position enum accepted.");
  assert(hasCode(created(base({ positionHistory: [position({ startedAt: "2026-01-01", endedAt: "2025-01-01" })] })), "INVALID_DATE_ORDER"), "Position date order accepted.");
  assert(!created(base({ positionHistory: [position({ sourceRefs: [{}] })] })).validation.valid && !created(base({ positionHistory: [position({ evidenceArtifactRefs: [7] })] })).validation.valid, "Invalid position reference accepted.");
  const exact = position(); assert(created(base({ positionHistory: [exact, { ...exact }] })).positionHistory.length === 1, "Exact position duplicate retained.");
  assert(created(base({ positionHistory: [position(), position({ positionCode: "WR" })] })).positionHistory.length === 2, "Conflicting positions collapsed.");
  const reported = created(base({ positionHistory: [position({ status: "REPORTED", endedAt: null })] }));
  assert(reported.positionHistory[0].status === "REPORTED" && reported.playingIdentity.preferredPositionCode === null, "Current/preferred position inferred.");
  assert(!Object.hasOwn(reported, "positionOntology"), "Position ontology created.");
}

function assignmentChecks() {
  assert(created(base({ teamAssignments: [assignment()] })).validation.valid, "Assignment invalid.");
  assert(!created(base({ teamAssignments: [assignment({ assignmentId: null })] })).validation.valid && !created(base({ teamAssignments: [assignment({ teamRef: null })] })).validation.valid, "Assignment requirements missing.");
  assert(!created(base({ teamAssignments: [assignment({ competitionLevel: null })] })).validation.valid && !created(base({ teamAssignments: [assignment({ status: null })] })).validation.valid, "Assignment enum required.");
  assert(hasCode(created(base({ teamAssignments: [assignment({ startedAt: "2026-01-01", endedAt: "2025-01-01" })] })), "INVALID_DATE_ORDER"), "Assignment dates accepted.");
  const normalized = created(base({ teamAssignments: [assignment({ positionRefs: ["p", "p"], positionCodes: ["QB", "QB"], sourceRefs: ["s", "s"], evidenceArtifactRefs: ["e", "e"] })] })).teamAssignments[0];
  assert(normalized.positionRefs.length === 1 && normalized.positionCodes.length === 1 && normalized.sourceRefs.length === 1 && normalized.evidenceArtifactRefs.length === 1, "Assignment arrays not normalized.");
  const item = assignment(); assert(created(base({ teamAssignments: [item, { ...item }] })).teamAssignments.length === 1, "Exact assignment duplicate retained.");
  assert(hasCode(created(base({ teamAssignments: [item, assignment({ teamRef: "team-2" })] })), "DUPLICATE_RECORD_ID"), "Duplicate assignment ID not rejected.");
  assert(created(base({ teamAssignments: [item, assignment({ assignmentId: "assignment-2", teamRef: "team-2" })] })).teamAssignments.length === 2, "Conflicting assignments collapsed.");
  const profile = created(base({ participationState: "UNKNOWN", teamAssignments: [assignment({ status: "REPORTED", seasonRef: "season-1", competitionRef: "competition-1", roleRef: "role-1" })] }));
  const keys = keysDeep(profile); assert(profile.teamAssignments[0].status === "REPORTED" && profile.participationState === "UNKNOWN", "Assignment inferred current state.");
  ["currentTeam", "employment", "relationships", "transaction", "season", "competition", "role"].forEach((key) => assert(!keys.has(key), `Assignment created ${key}.`));
}

function rosterChecks() {
  assert(created(base({ rosterHistory: [roster()] })).validation.valid, "Roster event invalid.");
  assert(Object.values(fidApi.PLAYER_ROSTER_DESIGNATIONS).every((designation) => created(base({ rosterHistory: [roster({ designation })] })).validation.valid), "Roster designation invalid.");
  assert(!created(base({ rosterHistory: [roster({ rosterEventId: null })] })).validation.valid && !created(base({ rosterHistory: [roster({ teamRef: null })] })).validation.valid, "Roster identity requirement missing.");
  assert(!created(base({ rosterHistory: [roster({ designation: "BAD" })] })).validation.valid, "Unknown designation accepted.");
  assert(!created(base({ rosterHistory: [roster({ effectiveAt: null })] })).validation.valid && created(base({ rosterHistory: [roster({ effectiveAt: null, notes: "Date unavailable" })] })).validation.valid, "Roster date context failed.");
  assert(hasCode(created(base({ rosterHistory: [roster({ effectiveAt: "2026-01-01", endedAt: "2025-01-01" })] })), "INVALID_DATE_ORDER"), "Roster date order accepted.");
  const item = roster(); assert(hasCode(created(base({ rosterHistory: [item, roster({ designation: "RESERVE" })] })), "DUPLICATE_RECORD_ID") && created(base({ rosterHistory: [item, { ...item }] })).rosterHistory.length === 1, "Roster duplicate handling failed.");
  const profile = created(base({ participationState: "UNKNOWN", rosterHistory: [roster({ designation: "INJURED_RESERVE" }), roster({ rosterEventId: "r2", designation: "SUSPENDED_LIST", effectiveAt: "2026-02-01" })] }));
  const keys = keysDeep(profile); assert(profile.participationState === "UNKNOWN" && !keys.has("currentRoster") && !keys.has("injury") && !keys.has("evaluation") && !keys.has("transaction"), "Roster event created owned state.");
}

function eligibilityChecks() {
  assert(created(base({ eligibilityHistory: [eligibility()] })).validation.valid, "Eligibility invalid.");
  assert(Object.values(fidApi.PLAYER_ELIGIBILITY_STATES).every((state) => created(base({ eligibilityHistory: [eligibility({ state })] })).validation.valid), "Eligibility state invalid.");
  assert(!created(base({ eligibilityHistory: [eligibility({ eligibilityEventId: null })] })).validation.valid && !created(base({ eligibilityHistory: [eligibility({ state: "BAD" })] })).validation.valid, "Eligibility identity invalid.");
  assert(!created(base({ eligibilityHistory: [eligibility({ seasonRef: null })] })).validation.valid && created(base({ eligibilityHistory: [eligibility({ seasonRef: null, notes: "Context unavailable" })] })).validation.valid, "Eligibility context failed.");
  assert(hasCode(created(base({ eligibilityHistory: [eligibility({ effectiveAt: "2026-01-01", endedAt: "2025-01-01" })] })), "INVALID_DATE_ORDER"), "Eligibility date order accepted.");
  const item = eligibility(); assert(hasCode(created(base({ eligibilityHistory: [item, eligibility({ state: "INELIGIBLE" })] })), "DUPLICATE_RECORD_ID") && created(base({ eligibilityHistory: [item, { ...item }] })).eligibilityHistory.length === 1, "Eligibility duplicates failed.");
  const profile = created(base({ participationState: "UNKNOWN", eligibilityHistory: [eligibility()] }));
  assert(profile.participationState === "UNKNOWN" && !keysDeep(profile).has("draftEligibility") && !keysDeep(profile).has("currentEligibility"), "Eligibility inferred prohibited state.");
}

function timelineChecks() {
  assert(created(base({ careerTimeline: [career()] })).validation.valid, "Career event invalid.");
  assert(Object.values(fidApi.PLAYER_CAREER_EVENT_TYPES).every((eventType) => created(base({ careerTimeline: [career({ eventType })] })).validation.valid), "Career event type invalid.");
  assert(!created(base({ careerTimeline: [career({ eventId: null })] })).validation.valid && !created(base({ careerTimeline: [career({ title: null, description: null })] })).validation.valid && !created(base({ careerTimeline: [career({ eventType: "BAD" })] })).validation.valid, "Career requirements missing.");
  assert(hasCode(created(base({ careerTimeline: [career({ startedAt: "2026-01-01", endedAt: "2025-01-01" })] })), "INVALID_DATE_ORDER"), "Career date order accepted.");
  assert(!created(base({ careerTimeline: [career({ sourceRefs: [{}] })] })).validation.valid && !created(base({ careerTimeline: [career({ evidenceArtifactRefs: [7] })] })).validation.valid, "Career reference accepted.");
  const item = career(); assert(created(base({ careerTimeline: [item, { ...item }] })).careerTimeline.length === 1 && hasCode(created(base({ careerTimeline: [item, career({ title: "Different" })] })), "DUPLICATE_RECORD_ID"), "Career duplicate handling failed.");
  assert(created(base({ careerTimeline: [item, career({ eventId: "career-2", title: "Conflict" })] })).careerTimeline.length === 2, "Conflicting career events collapsed.");
  const profile = created(base({ participationState: "UNKNOWN", positionHistory: [], rosterHistory: [], careerTimeline: [career({ eventType: "TRANSFER" }), career({ eventId: "c2", eventType: "RETIREMENT" }), career({ eventId: "c3", eventType: "AWARD" }), career({ eventId: "c4", eventType: "POSITION_CHANGE" }), career({ eventId: "c5", eventType: "ROSTER_CHANGE" })] }));
  const keys = keysDeep(profile); assert(profile.participationState === "UNKNOWN" && profile.positionHistory.length === 0 && profile.rosterHistory.length === 0, "Timeline changed factual state.");
  ["recognitionIntelligence", "sequence", "currentState"].forEach((key) => assert(!keys.has(key), `Timeline inferred ${key}.`));
}

function referenceChecks() {
  const fields = ["researchSourceRefs", "researchSessionRefs", "recordedObservationRefs", "analyticalObservationRefs", "evidenceArtifactRefs", "relationshipRefs", "measurementProfileRefs", "athleticProfileRefs", "productionProfileRefs", "statisticsDatasetRefs", "injuryRecordRefs", "medicalRecordRefs", "recognitionRecordRefs", "transactionRefs", "snapshotRefs", "documentRefs", "datasetRefs", "otherRefs"];
  const references = Object.fromEntries(fields.map((field) => [field, [`${field}-1`, `${field}-1`]]));
  const value = created(base({ references }));
  assert(value.validation.valid && fields.every((field) => value.references[field].length === 1 && typeof value.references[field][0] === "string"), "Reference collections failed.");
  ["measurementProfileRefs", "athleticProfileRefs", "productionProfileRefs", "statisticsDatasetRefs", "injuryRecordRefs", "medicalRecordRefs", "recognitionRecordRefs", "transactionRefs"].forEach((field) => assert(!created(base({ references: { [field]: [{}] } })).validation.valid, `Invalid ${field} accepted.`));
  assert(value.references.otherRefs[0] === "otherRefs-1" && !keysDeep(value).has("hydrated"), "Reference resolved or hydrated.");
  assert(created(base({ references: { researchSourceRefs: ["source"] } })).verification.state === "UNVERIFIED", "Research implied verification.");
  const verifiedValue = created(verified({ references: { relationshipRefs: ["relationship"] } }));
  const keys = keysDeep(verifiedValue); assert(!keys.has("entityVerification") && !keys.has("personVerification") && !keys.has("relationships"), "Verification or relationship inferred.");
  assert(hasCode(created(verified({ verification: { state: "VERIFIED", confidence: "HIGH", verifiedAt: "2026-07-14" } })), "VERIFIER_REQUIRED"), "Verifier not required.");
  assert(hasCode(created(verified({ verification: { state: "VERIFIED", confidence: "HIGH", verifiedBy: "r" } })), "VERIFICATION_DATE_REQUIRED"), "Verification date not required.");
  assert(hasCode(created(verified({ verification: { state: "VERIFIED_WITH_LIMITATIONS", confidence: "HIGH", verifiedBy: "r", verifiedAt: "2026-07-14" } })), "VERIFICATION_LIMITATION_REQUIRED"), "Limitations not required.");
  assert(hasCode(created(base({ verification: { state: "DISPUTED", confidence: "LOW" } })), "DISPUTE_CONTEXT_REQUIRED"), "Dispute context not required.");
  assert(created(base({ verification: { state: "REJECTED", confidence: "LOW" } })).verification.state === "REJECTED", "Rejected state lost.");
  assert(fidApi.isActivePlayerProfile(created(base({ status: "ACTIVE", participationState: "INACTIVE" }))) && !fidApi.isActivePlayerProfile(created(base({ status: "CANDIDATE", participationState: "ACTIVE" }))), "Active concepts conflated.");
  assert(created(base({ status: "CANDIDATE", participationState: "RETIRED" })).status === "CANDIDATE" && created(base({ participationState: "DECEASED" })).personProfileRef === null, "Participation altered another profile.");
}

function provenanceChecks() {
  assert(created(base({ provenance: { createdBy: "creator", createdAt: "2026-07-14" } })).validation.valid && !created(base({ provenance: [] })).validation.valid, "Provenance validation failed.");
  const empty = created(base()); assert(empty.provenance.createdAt === null && empty.verification.verifiedAt === null, "Dates generated.");
  assert(created(base({ versioning: { profileVersion: "v1", supersedesProfileRef: "old" } })).validation.valid && empty.versioning.profileVersion === null && created(base({ versioning: { profileVersion: 5 } })).versioning.profileVersion === 5, "Versioning failed.");
  assert(hasCode(created(base({ versioning: { supersedesProfileRef: "player-profile-1" } })), "SELF_REFERENCE") && hasCode(created(base({ versioning: { supersededByProfileRef: "player-profile-1" } })), "SELF_REFERENCE"), "Self reference accepted.");
  assert(hasCode(created(base({ versioning: { supersedesProfileRef: "p2", supersededByProfileRef: "p2" } })), "CONFLICTING_VERSION_REFERENCES"), "Conflicting version refs accepted.");
  const metadata = created(base({ metadata: { tags: ["a", "a"], domains: ["b", "b"] } })).metadata;
  assert(metadata.tags.length === 1 && metadata.domains.length === 1 && metadata.visibility === null && metadata.restrictions === null, "Metadata normalization failed.");
}

function prohibitedChecks() {
  const keys = keysDeep(created(base()));
  ["prospect", "draftEligibility", "draftClass", "measurements", "athleticTesting", "statistics", "production", "injury", "medicalIntelligence", "traits", "components", "score", "grade", "ranking", "projection", "recommendation", "evaluationResult", "archetype", "comparison", "teamFit", "draftValue"].forEach((key) => assert(!keys.has(key), `Prohibited field found: ${key}.`));
}

function stabilityChecks() {
  const input = base({ teamAssignments: [assignment()] }); const before = JSON.stringify(input); created(input); assert(JSON.stringify(input) === before, "Factory mutated input.");
  const normalized = created(input); const normalizedBefore = JSON.stringify(normalized); fidApi.validatePlayerProfile(normalized); assert(JSON.stringify(normalized) === normalizedBefore, "Validator mutated input.");
  assert(JSON.stringify(created(input)) === JSON.stringify(created(input)), "Normalization unstable.");
  assert(!created(null).validation.valid && !created([]).validation.valid && !created(7).validation.valid, "Invalid input unsafe.");
  assert(["valid", "errors", "warnings", "checkedAt", "contractVersion", "schemaVersion"].every((key) => Object.hasOwn(normalized.validation, key)), "Validation shape invalid.");
  assert([fidApi.isPlayerProfile, fidApi.isVerifiedPlayerProfile, fidApi.isActivePlayerProfile, fidApi.isRetiredPlayerProfile, fidApi.isDisputedPlayerProfile].every((guard) => typeof guard(normalized) === "boolean"), "Guard not boolean.");
  assert(fidApi.getPlayerProfileEntityRef(normalized) === "entity-player-1" && fidApi.getPlayerProfilePersonRef(normalized) === null, "Reference helper failed.");
  const unavailable = fidApi.createUnavailablePlayerProfile({ profileId: "p", entityRef: "e", personProfileRef: "person", status: "HISTORICAL", participationState: "INACTIVE", reason: "Unavailable" });
  const shape = ["contract", "contractVersion", "schemaVersion", "profileId", "entityRef", "personProfileRef", "status", "participationState", "playingIdentity", "positionHistory", "teamAssignments", "rosterHistory", "eligibilityHistory", "careerTimeline", "references", "verification", "provenance", "versioning", "metadata", "validation"];
  assert(shape.every((key) => Object.hasOwn(unavailable, key)) && unavailable.profileId === "p" && unavailable.entityRef === "e" && unavailable.personProfileRef === "person" && unavailable.metadata.notes === "Unavailable", "Unavailable shape/preservation failed.");
  assert(unavailable.positionHistory.length === 0 && unavailable.teamAssignments.length === 0 && unavailable.rosterHistory.length === 0 && unavailable.eligibilityHistory.length === 0 && unavailable.careerTimeline.length === 0 && Object.values(unavailable.references).every((refs) => refs.length === 0), "Unavailable facts invented.");
}

async function integrationChecks(context) {
  assert(context.existing.footballEntity.failed === 0 && context.existing.footballEntity.total === 120, "Football Entity diagnostics failed.");
  assert(context.existing.personProfile.failed === 0 && context.existing.personProfile.total === 148, "Person Profile diagnostics failed.");
  const research = Object.entries(context.existing).filter(([name]) => !["footballEntity", "personProfile"].includes(name)).map(([, value]) => value);
  assert(research.reduce((sum, value) => sum + value.total, 0) === 616 && research.every((value) => value.failed === 0), "Research Repository diagnostics failed.");
  assert(PLAYER_EXPORTS.every((name) => fidApi[name] === namedApi[name]), "Player Profile export incomplete.");
  const named = Object.keys(namedApi).filter((name) => name !== "default"); const defaults = Object.keys(fidApi);
  assert(ORIGINAL_FID_EXPORTS.length === 61
    && new Set(named).size === named.length
    && new Set(defaults).size === defaults.length
    && ORIGINAL_FID_EXPORTS.every((name) => Object.hasOwn(namedApi, name)
      && Object.hasOwn(fidApi, name)
      && namedApi[name] === ORIGINAL_FID_API[name]
      && fidApi[name] === ORIGINAL_FID_API[name]
      && namedApi[name] === fidApi[name]), "FID exports invalid.");
  assert(!Object.keys(fidApi).some((name) => /^run.*Diagnostics$/.test(name)), "Diagnostic exported.");
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
  const prohibitedPlayerDependency = /FidPersistenceArchitectureSpecification|FidPersistenceRepositoryContract|InMemoryFidPersistenceRepository|persistence[/\\](?:index|repository|adapter|service|manager|client)|repository|adapter|supabase|\bsql\b|migrations?|filesystem\s+storage|browser\s+storage|localStorage|IndexedDB|network\s+persistence|hydration|synchronization|registry|resolver|identity\s+resolution|runtime\s+(?:persistence|database)\s+integration/i;
  const prohibitedRuntime = /(?:Supabase|Database|Sql|Network|FileSystem|BrowserStorage|LocalStorage|IndexedDb)FidPersistenceRepository|PlayerRepository|PersistenceService|PersistenceManager|PersistenceAdapter|SupabaseAdapter|DatabaseAdapter|StorageClient|DatabaseClient|createClient|sql\s+runtime|migration\s+runtime|application\s+persistence\s+singleton|runtime\s+hydration|runtime\s+synchronization|identity\s+resolution|runtime\s+database\s+integration/i;
  assert(persistenceImports.every((entry) => approvedArchitectureImports.has(entry)) && !prohibitedPlayerDependency.test(context.playerProfileSource) && !prohibitedRuntime.test(context.productionSource), "Prohibited dependency: persistence.");
  ["supabase", "registry", "resolver", "ontology", "engines", "components", "pages", "router", "routes"].forEach((term) => assert(context.productionImports.every((entry) => !entry.toLowerCase().includes(term)), `Prohibited dependency: ${term}.`));
  const playerProfileImports = imports(readFileSync(resolve(ROOT, "contracts/PlayerProfileContract.js"), "utf8"));
  assert(context.productionImports.every((entry) => !isProhibitedRelationshipInfrastructure(entry))
    && playerProfileImports.every((entry) => !isCanonicalFootballRelationshipModule(entry)
      && !isProhibitedRelationshipInfrastructure(entry)), "Prohibited dependency: relationship.");
  assert(!hasCycle(context.dependencyGraph), "Circular dependency found.");
  assert(PLAYER_EXPORTS.every((name) => fidApi[name] != null) && fidApi.isPlayerProfile(created(base())), "Production module integrity failed.");
}

const CASE_NAMES = [
  "fully-valid-verified-player-profile","minimal-candidate-profile","active-unverified-warning","incomplete-profile","historical-profile","restricted-profile","rejected-profile","archived-profile","every-participation-state","every-profile-status","unknown-profile-status","unknown-participation-state","unknown-verification-state","unknown-confidence","missing-profile-id","missing-entity-ref","invalid-person-profile-ref","profile-id-not-inferred","entity-ref-not-inferred","person-ref-not-inferred","football-entity-not-embedded","person-profile-not-embedded","canonical-identity-not-duplicated","biography-not-duplicated",
  "valid-playing-identity","every-competition-level","unknown-competition-level-warning","preferred-position-ref","preferred-position-code","preferred-position-not-inferred","position-ref-not-inferred-from-code","position-code-not-inferred-from-ref","handedness-not-inferred","uniform-number-string","uniform-number-not-inferred","experience-not-calculated","current-position-not-calculated",
  "valid-position-record","every-assignment-type","every-assignment-status","position-identifier-required","unknown-assignment-type","unknown-assignment-status","unknown-position-competition-level","position-date-ordering","invalid-position-source-ref","invalid-position-evidence-ref","duplicate-position-normalization","conflicting-position-records","current-position-status-not-inferred","open-ended-not-current","history-no-preferred-update","position-ontology-not-created",
  "valid-team-assignment","assignment-id-required","team-or-organization-required","assignment-competition-level-required","assignment-status-required","assignment-date-order","assignment-position-refs-normalize","assignment-position-codes-normalize","assignment-source-refs-normalize","assignment-evidence-refs-normalize","duplicate-assignment-normalize","duplicate-assignment-id","conflicting-assignments","assignment-current-not-inferred","current-team-not-calculated","employment-not-created","assignment-relationship-not-created","participation-not-changed","transaction-not-created","season-not-resolved","competition-not-resolved","role-not-resolved",
  "valid-roster-event","every-roster-designation","roster-event-id-required","roster-team-required","unknown-roster-designation","roster-effective-date-required","roster-date-order","duplicate-roster-id","duplicate-roster-normalize","latest-roster-not-current","designation-no-participation-change","injured-reserve-no-injury","suspended-list-no-evaluation","roster-no-transaction",
  "valid-eligibility-event","every-eligibility-state","eligibility-id-required","unknown-eligibility-state","eligibility-context-required","eligibility-date-order","duplicate-eligibility-id","duplicate-eligibility-normalize","draft-eligibility-absent","eligibility-no-participation-change","latest-eligibility-not-current",
  "valid-career-event","every-career-event-type","career-event-id-required","career-event-context-required","unknown-career-event-type","career-date-order","invalid-career-source-ref","invalid-career-evidence-ref","duplicate-career-normalize","duplicate-career-id","conflicting-career-events","transfer-no-state-change","retirement-no-state-change","award-no-intelligence","position-change-no-history-update","roster-change-no-history-update","sequence-not-inferred","current-state-not-inferred",
  "valid-references","all-reference-collections","duplicate-references-normalize","invalid-measurement-ref","invalid-athletic-ref","invalid-production-ref","invalid-statistics-ref","invalid-injury-ref","invalid-medical-ref","invalid-recognition-ref","invalid-transaction-ref","references-unresolved","references-never-hydrated","research-no-verification","verification-no-entity-verification","verification-no-person-verification","relationship-ref-no-relationship","verified-requires-verifier","verified-requires-date","verified-limitations-context","disputed-requires-context","rejected-preserved","active-lifecycle-not-participation","active-participation-not-profile","retired-no-profile-status-change","deceased-no-person-change",
  "valid-provenance","invalid-provenance","dates-not-generated","valid-versioning","version-not-generated","version-not-incremented","self-supersedes-rejected","self-superseded-by-rejected","same-version-refs-rejected","valid-metadata","tags-domains-normalize","visibility-not-inferred","restrictions-not-inferred",
  "no-prospect-fields","no-draft-eligibility","no-draft-class","no-measurements","no-athletic-testing","no-statistics","no-production","no-injury","no-medical-intelligence","no-traits","no-components","no-score","no-grade","no-ranking","no-projection","no-recommendation","no-evaluation-result","no-archetype","no-comparison","no-team-fit","no-draft-value",
  "factory-no-mutation","validator-no-mutation","stable-normalization","null-input-safe","array-input-safe","primitive-input-safe","validation-shape","guards-booleans","reference-helpers","unavailable-complete","unavailable-preserves-identifiers","unavailable-invents-no-facts",
  "existing-38-exports-intact","player-export-surface","default-export-complete","no-export-collisions","diagnostics-excluded","football-entity-diagnostics","person-profile-diagnostics","research-repository-diagnostics","no-persistence-dependency","no-supabase-dependency","no-registry-dependency","no-resolver-dependency","no-relationship-dependency","no-ontology-dependency","no-engine-dependency","no-ui-dependency","no-routing-dependency","no-circular-dependency","production-build-integrity",
];

function checkForIndex(index, context) {
  if (index < 24) return identityChecks();
  if (index < 37) return playingChecks();
  if (index < 53) return positionChecks();
  if (index < 75) return assignmentChecks();
  if (index < 89) return rosterChecks();
  if (index < 100) return eligibilityChecks();
  if (index < 118) return timelineChecks();
  if (index < 145) return referenceChecks();
  if (index < 158) return provenanceChecks();
  if (index < 179) return prohibitedChecks();
  if (index < 191) return stabilityChecks();
  return integrationChecks(context);
}

async function existingSummaries() {
  return { footballEntity: runFootballEntityContractDiagnostics(), personProfile: await runPersonProfileContractDiagnostics(),
    researchSource: runResearchSourceContractDiagnostics(), researchSession: runResearchSessionContractDiagnostics(),
    recordedObservation: runRecordedObservationContractDiagnostics(), analyticalObservation: runAnalyticalObservationContractDiagnostics(),
    evidenceArtifact: runEvidenceArtifactContractDiagnostics(), foundation: runResearchRepositoryFoundationDiagnostics(),
    persistence: runResearchRepositoryPersistenceDiagnostics(), supabase: await runSupabaseResearchRepositoryAdapterDiagnostics() };
}

async function buildContext() {
  const sources = Object.fromEntries(PRODUCTION_FILES.map((file) => [file, readFileSync(file, "utf8")]));
  return { productionImports: Object.values(sources).flatMap(imports), productionSource: Object.values(sources).join("\n"), playerProfileSource: sources[resolve(ROOT, "contracts/PlayerProfileContract.js")], dependencyGraph: graph(sources), existing: await existingSummaries() };
}

export async function runPlayerProfileContractDiagnostics({ throwOnFailure = false } = {}) {
  const context = await buildContext(); const cases = [];
  for (let index = 0; index < CASE_NAMES.length; index += 1) {
    const id = CASE_NAMES[index];
    try { await checkForIndex(index, context); cases.push({ id, passed: true, message: `${id} passed.`, details: null }); }
    catch (error) { cases.push({ id, passed: false, message: typeof error?.message === "string" ? error.message : `${id} failed.`, details: error?.details ?? null }); }
  }
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const summary = { suite: SUITE, contractVersion: fidApi.PLAYER_PROFILE_CONTRACT_VERSION,
    schemaVersion: fidApi.PLAYER_PROFILE_SCHEMA_VERSION, total: cases.length, passed, failed, cases,
    existingSuiteSummaries: context.existing };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runPlayerProfileContractDiagnostics });
