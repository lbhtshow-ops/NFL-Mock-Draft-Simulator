import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fidApi, * as namedApi from "../index.js";
import { runFootballEntityContractDiagnostics } from "./runFootballEntityContractDiagnostics.js";
import { runResearchSourceContractDiagnostics } from "../../../researchRepository/diagnostics/runResearchSourceContractDiagnostics.js";
import { runResearchSessionContractDiagnostics } from "../../../researchRepository/diagnostics/runResearchSessionContractDiagnostics.js";
import { runRecordedObservationContractDiagnostics } from "../../../researchRepository/diagnostics/runRecordedObservationContractDiagnostics.js";
import { runAnalyticalObservationContractDiagnostics } from "../../../researchRepository/diagnostics/runAnalyticalObservationContractDiagnostics.js";
import { runEvidenceArtifactContractDiagnostics } from "../../../researchRepository/diagnostics/runEvidenceArtifactContractDiagnostics.js";
import { runResearchRepositoryFoundationDiagnostics } from "../../../researchRepository/diagnostics/runResearchRepositoryFoundationDiagnostics.js";
import { runResearchRepositoryPersistenceDiagnostics } from "../../../researchRepository/diagnostics/runResearchRepositoryPersistenceDiagnostics.js";
import { runSupabaseResearchRepositoryAdapterDiagnostics } from "../../../researchRepository/diagnostics/runSupabaseResearchRepositoryAdapterDiagnostics.js";

const SUITE = "PersonProfileContractDiagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTION_FILES = [
  resolve(ROOT, "constants/footballEntityConstants.js"), resolve(ROOT, "contracts/FootballEntityContract.js"),
  resolve(ROOT, "constants/personProfileConstants.js"), resolve(ROOT, "contracts/PersonProfileContract.js"),
  resolve(ROOT, "index.js"),
];
const PERSON_EXPORTS = Object.freeze([
  "PERSON_PROFILE_CONTRACT_NAME", "PERSON_PROFILE_CONTRACT_VERSION", "PERSON_PROFILE_SCHEMA_VERSION",
  "PERSON_PROFILE_STATUSES", "PERSON_PROFILE_VERIFICATION_STATES", "PERSON_PROFILE_CONFIDENCE_LEVELS",
  "PERSON_STATES", "PERSON_NAME_USAGE_CATEGORIES", "PERSON_EDUCATION_TYPES", "PERSON_CAREER_EVENT_TYPES",
  "createPersonProfile", "createUnavailablePersonProfile", "validatePersonProfile", "isPersonProfile",
  "isVerifiedPersonProfile", "isActivePersonProfile", "isDisputedPersonProfile", "isDeceasedPersonProfile",
  "getPersonProfileEntityRef",
]);
const ENTITY_EXPORTS = Object.freeze([
  "FOOTBALL_ENTITY_CONTRACT_NAME", "FOOTBALL_ENTITY_CONTRACT_VERSION", "FOOTBALL_ENTITY_SCHEMA_VERSION",
  "FOOTBALL_ENTITY_TYPES", "FOOTBALL_ENTITY_STATUSES", "FOOTBALL_ENTITY_VERIFICATION_STATES",
  "FOOTBALL_ENTITY_IDENTITY_CONFIDENCE_LEVELS", "FOOTBALL_ENTITY_ALIAS_TYPES",
  "FOOTBALL_ENTITY_EXTERNAL_IDENTIFIER_TYPES", "FOOTBALL_ENTITY_REFERENCE_TYPES",
  "createFootballEntity", "createUnavailableFootballEntity", "validateFootballEntity", "isFootballEntity",
  "isVerifiedFootballEntity", "isActiveFootballEntity", "isMergedFootballEntity",
  "isDisputedFootballEntity", "getFootballEntityCanonicalName",
]);

function assert(condition, message, details = null) {
  if (!condition) { const error = new Error(message); error.details = details; throw error; }
}

function hasCode(value, code, field = "errors") {
  return (value?.validation?.[field] || value?.[field] || []).some((entry) => entry.code === code);
}

function base(overrides = {}) {
  return {
    profileId: "person-profile-1",
    entityRef: "entity-person-1",
    status: fidApi.PERSON_PROFILE_STATUSES.CANDIDATE,
    personState: fidApi.PERSON_STATES.UNKNOWN,
    verification: {
      state: fidApi.PERSON_PROFILE_VERIFICATION_STATES.UNVERIFIED,
      confidence: fidApi.PERSON_PROFILE_CONFIDENCE_LEVELS.UNSPECIFIED,
    },
    ...overrides,
  };
}

function verified(overrides = {}) {
  return base({
    status: fidApi.PERSON_PROFILE_STATUSES.ACTIVE,
    personState: fidApi.PERSON_STATES.LIVING,
    verification: {
      state: fidApi.PERSON_PROFILE_VERIFICATION_STATES.VERIFIED,
      confidence: fidApi.PERSON_PROFILE_CONFIDENCE_LEVELS.HIGH,
      verifiedBy: "reviewer-1",
      verifiedAt: "2026-07-14",
    },
    ...overrides,
  });
}

function created(input) { return fidApi.createPersonProfile(input); }

function event(overrides = {}) {
  return { eventId: "event-1", eventType: fidApi.PERSON_CAREER_EVENT_TYPES.MILESTONE, title: "Documented event", ...overrides };
}

function education(overrides = {}) {
  return { educationType: fidApi.PERSON_EDUCATION_TYPES.COLLEGE, organizationRef: "organization-1", ...overrides };
}

function keysDeep(value, keys = new Set()) {
  if (Array.isArray(value)) value.forEach((entry) => keysDeep(entry, keys));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, entry]) => { keys.add(key); keysDeep(entry, keys); });
  return keys;
}

function importSpecifiers(source) {
  return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);
}

function isCanonicalFootballRelationshipModule(entry) {
  return /(?:^|\/)(?:footballRelationshipConstants|FootballRelationshipContract)\.js$/i.test(entry.replaceAll("\\", "/"));
}

function isProhibitedRelationshipInfrastructure(entry) {
  if (isCanonicalFootballRelationshipModule(entry)) return false;
  return /relationships?|graph[-_]?traversal|knowledge[-_]?graph|inverse[-_]?relationship/i.test(entry);
}

function graph(sources) {
  const files = new Set(PRODUCTION_FILES);
  return Object.fromEntries(PRODUCTION_FILES.map((file) => [file,
    importSpecifiers(sources[file]).filter((entry) => entry.startsWith("."))
      .map((entry) => resolve(dirname(file), entry)).filter((entry) => files.has(entry))]));
}

function hasCycle(value) {
  const visiting = new Set(); const visited = new Set();
  function visit(node) {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    if ((value[node] || []).some(visit)) return true;
    visiting.delete(node); visited.add(node); return false;
  }
  return Object.keys(value).some(visit);
}

async function summaries() {
  return {
    footballEntity: runFootballEntityContractDiagnostics(),
    researchSource: runResearchSourceContractDiagnostics(),
    researchSession: runResearchSessionContractDiagnostics(),
    recordedObservation: runRecordedObservationContractDiagnostics(),
    analyticalObservation: runAnalyticalObservationContractDiagnostics(),
    evidenceArtifact: runEvidenceArtifactContractDiagnostics(),
    foundation: runResearchRepositoryFoundationDiagnostics(),
    persistence: runResearchRepositoryPersistenceDiagnostics(),
    supabase: await runSupabaseResearchRepositoryAdapterDiagnostics(),
  };
}

const CASES = [
  ["fully-valid-verified-profile", () => assert(fidApi.isVerifiedPersonProfile(created(verified())), "Verified profile invalid.")],
  ["valid-minimal-candidate", () => assert(created(base()).validation.valid, "Minimal candidate invalid.")],
  ["active-unverified-warning", () => { const value = created(base({ status: "ACTIVE" })); assert(value.validation.valid && hasCode(value, "ACTIVE_PROFILE_UNVERIFIED", "warnings"), "Active warning missing."); }],
  ["valid-incomplete", () => assert(created(base({ status: "INCOMPLETE" })).validation.valid, "Incomplete invalid.")],
  ["valid-historical", () => assert(created(base({ status: "HISTORICAL" })).validation.valid, "Historical invalid.")],
  ["valid-restricted", () => assert(created(base({ status: "RESTRICTED" })).validation.valid, "Restricted invalid.")],
  ["valid-rejected", () => assert(created(base({ status: "REJECTED" })).validation.valid, "Rejected invalid.")],
  ["valid-archived", () => assert(created(base({ status: "ARCHIVED", metadata: { notes: "Archived record." } })).validation.valid, "Archived invalid.")],
  ["every-person-state", () => assert(Object.values(fidApi.PERSON_STATES).every((personState) => created(base({ personState })).validation.valid), "Recognized person state rejected.")],
  ["unknown-profile-status", () => assert(hasCode(created(base({ status: "BAD" })), "UNRECOGNIZED_ENUM_VALUE"), "Unknown status accepted.")],
  ["unknown-person-state", () => assert(hasCode(created(base({ personState: "BAD" })), "UNRECOGNIZED_ENUM_VALUE"), "Unknown person state accepted.")],
  ["unknown-verification-state", () => assert(hasCode(created(base({ verification: { state: "BAD", confidence: "HIGH" } })), "UNRECOGNIZED_ENUM_VALUE"), "Unknown verification accepted.")],
  ["unknown-confidence", () => assert(hasCode(created(base({ verification: { state: "UNVERIFIED", confidence: "BAD" } })), "UNRECOGNIZED_ENUM_VALUE"), "Unknown confidence accepted.")],
  ["unknown-name-usage", () => assert(hasCode(created(base({ nameUsage: [{ name: "Name", usageCategory: "BAD" }] })), "UNRECOGNIZED_ENUM_VALUE"), "Unknown usage accepted.")],
  ["unknown-education-type", () => assert(hasCode(created(base({ education: [education({ educationType: "BAD" })] })), "UNRECOGNIZED_ENUM_VALUE"), "Unknown education type accepted.")],
  ["unknown-career-event-type", () => assert(hasCode(created(base({ careerTimeline: [event({ eventType: "BAD" })] })), "UNRECOGNIZED_ENUM_VALUE"), "Unknown event type accepted.")],
  ["missing-profile-id", () => assert(!created(base({ profileId: null })).validation.valid, "Missing profile ID accepted.")],
  ["missing-entity-ref", () => assert(!created(base({ entityRef: null })).validation.valid, "Missing entity ref accepted.")],
  ["profile-id-not-inferred", () => assert(created(base({ profileId: null, entityRef: "entity-x" })).profileId === null, "Profile ID inferred.")],
  ["entity-ref-not-inferred", () => assert(created(base({ profileId: "profile-x", entityRef: null })).entityRef === null, "Entity ref inferred.")],
  ["football-entity-not-embedded", () => { const value = created(base({ entityRef: fidApi.createFootballEntity({}) })); assert(!value.validation.valid && value.entityRef === null, "Football Entity embedded."); }],
  ["canonical-identity-not-duplicated", () => { const value = created({ ...base(), entityId: "duplicate", entityType: "PERSON", canonicalName: "Name", aliases: [] }); const keys = keysDeep(value); assert(!keys.has("entityId") && !keys.has("entityType") && !keys.has("canonicalName") && !keys.has("aliases"), "Canonical identity duplicated."); }],
  ["valid-biography", () => assert(created(base({ biography: { dateOfBirth: "1980-01-01", placeOfBirthRef: "location-1", publicBiography: "Publicly documented context." } })).validation.valid, "Biography invalid.")],
  ["birth-death-date-order", () => assert(hasCode(created(base({ biography: { dateOfBirth: "2020-01-01", dateOfDeath: "2010-01-01" } })), "INVALID_DATE_ORDER"), "Biography date order accepted.")],
  ["age-not-calculated", () => assert(!Object.hasOwn(created(base({ biography: { dateOfBirth: "1980-01-01" } })).biography, "age"), "Age calculated.")],
  ["birthplace-not-inferred", () => { const value = created(base({ biography: { placeOfBirthRef: "location-1" } })); assert(value.biography.placeOfBirthLabel === null, "Birthplace label inferred."); }],
  ["death-place-not-inferred", () => { const value = created(base({ biography: { placeOfDeathRef: "location-2" } })); assert(value.biography.placeOfDeathLabel === null, "Death place inferred."); }],
  ["deceased-without-date-warning", () => { const value = created(base({ personState: "DECEASED" })); assert(value.validation.valid && hasCode(value, "DEATH_DATE_UNKNOWN", "warnings"), "Death-date warning missing."); }],
  ["death-date-state-warning", () => { const value = created(base({ personState: "LIVING", biography: { dateOfDeath: "2020-01-01" } })); assert(value.validation.valid && hasCode(value, "DEATH_DATE_STATE_MISMATCH", "warnings"), "State mismatch warning missing."); }],
  ["person-state-not-inferred", () => assert(created(base({ personState: "UNKNOWN", biography: { dateOfDeath: "2020-01-01" } })).personState === "UNKNOWN", "Person state inferred.")],
  ["valid-name-usage", () => assert(created(base({ nameUsage: [{ name: "Public Name", usageCategory: "PUBLIC" }] })).validation.valid, "Name usage invalid.")],
  ["duplicate-name-usage", () => { const entry = { name: "Name", usageCategory: "PUBLIC" }; assert(created(base({ nameUsage: [entry, { ...entry }] })).nameUsage.length === 1, "Name usage duplicate retained."); }],
  ["different-name-categories-preserved", () => { const value = created(base({ nameUsage: [{ name: "Name", usageCategory: "PUBLIC" }, { name: "Name", usageCategory: "PROFESSIONAL" }] })); assert(value.nameUsage.length === 2, "Distinct usage categories collapsed."); }],
  ["invalid-name-usage-structure", () => assert(!created(base({ nameUsage: ["Name"] })).validation.valid, "Invalid name usage accepted.")],
  ["name-usage-missing-name", () => assert(!created(base({ nameUsage: [{ usageCategory: "PUBLIC" }] })).validation.valid, "Missing name accepted.")],
  ["name-usage-unknown-category", () => assert(!created(base({ nameUsage: [{ name: "Name", usageCategory: "BAD" }] })).validation.valid, "Unknown category accepted.")],
  ["name-usage-date-order", () => assert(hasCode(created(base({ nameUsage: [{ name: "Name", usageCategory: "FORMER", validFrom: "2020-01-01", validTo: "2010-01-01" }] })), "INVALID_DATE_ORDER"), "Name date order accepted.")],
  ["name-usage-no-canonical-change", () => assert(!Object.hasOwn(created(base({ nameUsage: [{ name: "Name", usageCategory: "PUBLIC" }] })), "canonicalName"), "Canonical identity altered.")],
  ["name-usage-no-aliases", () => assert(!Object.hasOwn(created(base({ nameUsage: [{ name: "Name", usageCategory: "PUBLIC" }] })), "aliases"), "Alias registry created.")],
  ["valid-citizenship", () => assert(created(base({ citizenship: [{ countryCode: "US" }] })).validation.valid, "Citizenship invalid.")],
  ["citizenship-country-required", () => assert(hasCode(created(base({ citizenship: [{ notes: "Unknown" }] })), "CITIZENSHIP_COUNTRY_REQUIRED"), "Country information not required.")],
  ["duplicate-citizenship", () => { const entry = { countryCode: "US" }; assert(created(base({ citizenship: [entry, { ...entry }] })).citizenship.length === 1, "Citizenship duplicate retained."); }],
  ["citizenship-date-order", () => assert(hasCode(created(base({ citizenship: [{ countryCode: "US", validFrom: "2020-01-01", validTo: "2010-01-01" }] })), "INVALID_DATE_ORDER"), "Citizenship date order accepted.")],
  ["conflicting-citizenship-coexists", () => assert(created(base({ citizenship: [{ countryCode: "US" }, { countryCode: "CA" }] })).citizenship.length === 2, "Citizenship conflict resolved.")],
  ["citizenship-not-inferred", () => assert(created(base({ biography: { placeOfBirthRef: "country-us" } })).citizenship.length === 0, "Citizenship inferred.")],
  ["valid-language", () => assert(created(base({ languages: [{ languageCode: "en" }] })).validation.valid, "Language invalid.")],
  ["language-identifier-required", () => assert(hasCode(created(base({ languages: [{ proficiency: "declared" }] })), "LANGUAGE_IDENTIFIER_REQUIRED"), "Language identifier not required.")],
  ["duplicate-language", () => { const entry = { languageCode: "en" }; assert(created(base({ languages: [entry, { ...entry }] })).languages.length === 1, "Language duplicate retained."); }],
  ["proficiency-not-inferred", () => assert(created(base({ languages: [{ language: "English" }] })).languages[0].proficiency === null, "Proficiency inferred.")],
  ["language-not-inferred", () => assert(created(base({ citizenship: [{ countryCode: "US" }] })).languages.length === 0, "Language inferred.")],
  ["valid-education", () => assert(created(base({ education: [education()] })).validation.valid, "Education invalid.")],
  ["education-organization-required", () => assert(hasCode(created(base({ education: [education({ organizationRef: null })] })), "EDUCATION_ORGANIZATION_REQUIRED"), "Education organization not required.")],
  ["education-date-order", () => assert(hasCode(created(base({ education: [education({ startedAt: "2020-01-01", endedAt: "2010-01-01" })] })), "INVALID_DATE_ORDER"), "Education date order accepted.")],
  ["invalid-completed", () => assert(hasCode(created(base({ education: [education({ completed: "yes" })] })), "INVALID_BOOLEAN"), "Invalid completed accepted.")],
  ["completion-not-inferred", () => assert(created(base({ education: [education({ endedAt: "2020-01-01", credential: "Credential" })] })).education[0].completed === null, "Completion inferred.")],
  ["education-no-relationship", () => assert(!Object.hasOwn(created(base({ education: [education()] })).education[0], "relationship"), "Education relationship created.")],
  ["valid-career-event", () => assert(created(base({ careerTimeline: [event()] })).validation.valid, "Career event invalid.")],
  ["every-career-event-type", () => assert(Object.values(fidApi.PERSON_CAREER_EVENT_TYPES).every((eventType) => created(base({ careerTimeline: [event({ eventType })] })).validation.valid), "Recognized event type rejected.")],
  ["event-id-required", () => assert(!created(base({ careerTimeline: [event({ eventId: null })] })).validation.valid, "Event ID not required.")],
  ["event-context-required", () => assert(hasCode(created(base({ careerTimeline: [event({ title: null, description: null })] })), "CAREER_EVENT_CONTEXT_REQUIRED"), "Event context not required.")],
  ["event-date-order", () => assert(hasCode(created(base({ careerTimeline: [event({ startedAt: "2020-01-01", endedAt: "2010-01-01" })] })), "INVALID_DATE_ORDER"), "Event date order accepted.")],
  ["invalid-event-source-ref", () => assert(!created(base({ careerTimeline: [event({ sourceRefs: [{}] })] })).validation.valid, "Invalid source ref accepted.")],
  ["invalid-event-evidence-ref", () => assert(!created(base({ careerTimeline: [event({ evidenceArtifactRefs: [7] })] })).validation.valid, "Invalid evidence ref accepted.")],
  ["duplicate-exact-events", () => { const item = event(); assert(created(base({ careerTimeline: [item, { ...item }] })).careerTimeline.length === 1, "Duplicate event retained."); }],
  ["duplicate-event-id-different-content", () => assert(hasCode(created(base({ careerTimeline: [event(), event({ title: "Different" })] })), "DUPLICATE_EVENT_ID"), "Duplicate event ID not rejected.")],
  ["conflicting-events-coexist", () => assert(created(base({ careerTimeline: [event(), event({ eventId: "event-2", title: "Conflicting report" })] })).careerTimeline.length === 2, "Conflicting events resolved.")],
  ["event-no-employment", () => assert(!Object.hasOwn(created(base({ careerTimeline: [event({ eventType: "EMPLOYMENT" })] })), "employment"), "Employment created.")],
  ["role-change-no-role-profile", () => assert(!Object.hasOwn(created(base({ careerTimeline: [event({ eventType: "ROLE_CHANGE", roleRef: "role-1" })] })), "roleProfile"), "Role profile created.")],
  ["departure-no-status-change", () => assert(created(base({ status: "ACTIVE", careerTimeline: [event({ eventType: "DEPARTURE" })] })).status === "ACTIVE", "Departure changed status.")],
  ["retirement-no-status-change", () => assert(created(base({ status: "CANDIDATE", careerTimeline: [event({ eventType: "RETIREMENT" })] })).status === "CANDIDATE", "Retirement changed status.")],
  ["award-no-evaluation", () => assert(!Object.hasOwn(created(base({ careerTimeline: [event({ eventType: "AWARD" })] })), "evaluation"), "Award created evaluation.")],
  ["current-employment-not-inferred", () => assert(!Object.hasOwn(created(base({ careerTimeline: [event({ eventType: "EMPLOYMENT", organizationRef: "org-1" })] })), "currentEmployment"), "Current employment inferred.")],
  ["tenure-not-calculated", () => assert(!Object.hasOwn(created(base({ careerTimeline: [event({ startedAt: "2020-01-01", endedAt: "2021-01-01" })] })), "tenure"), "Tenure calculated.")],
  ["valid-references", () => assert(created(base({ references: { researchSourceRefs: ["source-1"] } })).validation.valid, "References invalid.")],
  ["duplicate-references", () => assert(created(base({ references: { researchSourceRefs: ["a", "a", "b"] } })).references.researchSourceRefs.join(",") === "a,b", "Reference duplicates retained.")],
  ["references-unresolved", () => assert(created(base({ references: { otherRefs: ["missing"] } })).references.otherRefs[0] === "missing", "Reference resolved.")],
  ["references-not-hydrated", () => assert(typeof created(base({ references: { relationshipRefs: ["relationship-1"] } })).references.relationshipRefs[0] === "string", "Reference hydrated.")],
  ["research-does-not-verify", () => assert(created(base({ references: { evidenceArtifactRefs: ["evidence-1"] } })).verification.state === "UNVERIFIED", "Research implied verification.")],
  ["verification-does-not-verify-entity", () => assert(created(verified()).entityRef === "entity-person-1" && !Object.hasOwn(created(verified()), "entityVerification"), "Entity verification inferred.")],
  ["relationship-ref-no-relationship", () => assert(!Object.hasOwn(created(base({ references: { relationshipRefs: ["relationship-1"] } })), "relationships"), "Relationship created.")],
  ["verified-requires-verifier", () => assert(hasCode(created(verified({ verification: { state: "VERIFIED", confidence: "HIGH", verifiedAt: "2026-07-14" } })), "VERIFIER_REQUIRED"), "Verifier not required.")],
  ["verified-requires-date", () => assert(hasCode(created(verified({ verification: { state: "VERIFIED", confidence: "HIGH", verifiedBy: "reviewer" } })), "VERIFICATION_DATE_REQUIRED"), "Verification date not required.")],
  ["limitations-context-required", () => assert(hasCode(created(verified({ verification: { state: "VERIFIED_WITH_LIMITATIONS", confidence: "HIGH", verifiedBy: "reviewer", verifiedAt: "2026-07-14" } })), "VERIFICATION_LIMITATION_REQUIRED"), "Limitation context not required.")],
  ["dispute-context-required", () => assert(hasCode(created(base({ verification: { state: "DISPUTED", confidence: "LOW" } })), "DISPUTE_CONTEXT_REQUIRED"), "Dispute context not required.")],
  ["rejected-verification-preserved", () => { const value = created(base({ verification: { state: "REJECTED", confidence: "LOW" } })); assert(value.validation.valid && value.verification.state === "REJECTED", "Rejected verification not preserved."); }],
  ["active-not-verified", () => { const value = created(base({ status: "ACTIVE" })); assert(fidApi.isActivePersonProfile(value) && !fidApi.isVerifiedPersonProfile(value), "ACTIVE implied verification."); }],
  ["verified-not-active", () => { const value = created(verified({ status: "HISTORICAL" })); assert(fidApi.isVerifiedPersonProfile(value) && !fidApi.isActivePersonProfile(value), "Verification implied ACTIVE."); }],
  ["valid-provenance", () => assert(created(base({ provenance: { createdBy: "creator", createdAt: "2026-07-14", originSystem: "system" } })).validation.valid, "Provenance invalid.")],
  ["invalid-provenance", () => assert(!created(base({ provenance: [] })).validation.valid, "Invalid provenance accepted.")],
  ["dates-not-generated", () => { const value = created(base()); assert(value.biography.dateOfBirth === null && value.verification.verifiedAt === null && value.provenance.createdAt === null, "Date generated."); }],
  ["valid-versioning", () => assert(created(base({ versioning: { profileVersion: "v1", supersedesProfileRef: "profile-old" } })).validation.valid, "Versioning invalid.")],
  ["profile-version-not-generated", () => assert(created(base()).versioning.profileVersion === null, "Version generated.")],
  ["profile-version-not-incremented", () => assert(created(base({ versioning: { profileVersion: 4 } })).versioning.profileVersion === 4, "Version incremented.")],
  ["supersedes-self-rejected", () => assert(hasCode(created(base({ versioning: { supersedesProfileRef: "person-profile-1" } })), "SELF_REFERENCE"), "Supersedes self accepted.")],
  ["superseded-by-self-rejected", () => assert(hasCode(created(base({ versioning: { supersededByProfileRef: "person-profile-1" } })), "SELF_REFERENCE"), "SupersededBy self accepted.")],
  ["same-version-refs-rejected", () => assert(hasCode(created(base({ versioning: { supersedesProfileRef: "p2", supersededByProfileRef: "p2" } })), "CONFLICTING_VERSION_REFERENCES"), "Conflicting refs accepted.")],
  ["valid-metadata", () => assert(created(base({ metadata: { tags: ["person"], domains: ["biography"], visibility: "internal" } })).validation.valid, "Metadata invalid.")],
  ["tags-domains-normalize", () => { const value = created(base({ metadata: { tags: ["a", "a"], domains: ["b", "b"] } })); assert(value.metadata.tags.length === 1 && value.metadata.domains.length === 1, "Metadata duplicates retained."); }],
  ["visibility-not-inferred", () => assert(created(base()).metadata.visibility === null, "Visibility inferred.")],
  ["restrictions-not-inferred", () => assert(created(base()).metadata.restrictions === null, "Restrictions inferred.")],
  ["no-player-profile-fields", () => assert(!keysDeep(created(base())).has("playerProfile"), "Player profile field found.")],
  ["no-prospect-profile-fields", () => assert(!keysDeep(created(base())).has("prospectProfile"), "Prospect profile field found.")],
  ["no-coach-profile-fields", () => assert(!keysDeep(created(base())).has("coachProfile"), "Coach profile field found.")],
  ["no-executive-profile-fields", () => assert(!keysDeep(created(base())).has("executiveProfile"), "Executive profile field found.")],
  ["no-scout-profile-fields", () => assert(!keysDeep(created(base())).has("scoutProfile"), "Scout profile field found.")],
  ["no-team-fields", () => assert(!keysDeep(created(base())).has("team"), "Team field found.")],
  ["no-employment-fields", () => assert(!keysDeep(created(base())).has("employment"), "Employment field found.")],
  ["no-athletic-measurements", () => assert(!keysDeep(created(base())).has("measurements"), "Measurements found.")],
  ["no-statistics", () => assert(!keysDeep(created(base())).has("statistics"), "Statistics found.")],
  ["no-production", () => assert(!keysDeep(created(base())).has("production"), "Production found.")],
  ["no-traits", () => assert(!keysDeep(created(base())).has("traits"), "Traits found.")],
  ["no-components", () => assert(!keysDeep(created(base())).has("components"), "Components found.")],
  ["no-score", () => assert(!keysDeep(created(base())).has("score"), "Score found.")],
  ["no-grade", () => assert(!keysDeep(created(base())).has("grade"), "Grade found.")],
  ["no-ranking", () => assert(!keysDeep(created(base())).has("ranking"), "Ranking found.")],
  ["no-projection", () => assert(!keysDeep(created(base())).has("projection"), "Projection found.")],
  ["no-recommendation", () => assert(!keysDeep(created(base())).has("recommendation"), "Recommendation found.")],
  ["no-evaluation-result", () => assert(!keysDeep(created(base())).has("evaluationResult"), "Evaluation result found.")],
  ["factory-no-mutation", () => { const input = base({ education: [education()] }); const before = JSON.stringify(input); created(input); assert(JSON.stringify(input) === before, "Factory mutated input."); }],
  ["validator-no-mutation", () => { const input = created(base()); const before = JSON.stringify(input); fidApi.validatePersonProfile(input); assert(JSON.stringify(input) === before, "Validator mutated input."); }],
  ["stable-normalization", () => assert(JSON.stringify(created(base())) === JSON.stringify(created(base())), "Normalization unstable.")],
  ["null-input-safe", () => assert(created(null).validation.valid === false, "Null input threw or passed.")],
  ["array-input-safe", () => assert(created([]).validation.valid === false, "Array input threw or passed.")],
  ["primitive-input-safe", () => assert(created(7).validation.valid === false, "Primitive input threw or passed.")],
  ["validation-shape", () => assert(["valid", "errors", "warnings", "checkedAt", "contractVersion", "schemaVersion"].every((key) => Object.hasOwn(created(base()).validation, key)), "Validation shape incomplete.")],
  ["guards-return-booleans", () => { const value = created(base()); assert([fidApi.isPersonProfile, fidApi.isVerifiedPersonProfile, fidApi.isActivePersonProfile, fidApi.isDisputedPersonProfile, fidApi.isDeceasedPersonProfile].every((guard) => typeof guard(value) === "boolean"), "Guard result not boolean."); }],
  ["entity-ref-helper", () => assert(fidApi.getPersonProfileEntityRef(created(base())) === "entity-person-1" && fidApi.getPersonProfileEntityRef({}) === null, "Entity-ref helper failed.")],
  ["unavailable-complete-shape", () => assert(["contract", "contractVersion", "schemaVersion", "profileId", "entityRef", "status", "personState", "biography", "nameUsage", "citizenship", "languages", "education", "careerTimeline", "references", "verification", "provenance", "versioning", "metadata", "validation"].every((key) => Object.hasOwn(fidApi.createUnavailablePersonProfile(), key)), "Unavailable shape incomplete.")],
  ["unavailable-preserves-identifiers", () => { const value = fidApi.createUnavailablePersonProfile({ profileId: "p", entityRef: "e", status: "HISTORICAL", personState: "UNKNOWN", reason: "Unavailable" }); assert(value.profileId === "p" && value.entityRef === "e" && value.status === "HISTORICAL" && value.personState === "UNKNOWN" && value.metadata.notes === "Unavailable", "Unavailable identifiers not preserved."); }],
  ["unavailable-invents-nothing", () => { const value = fidApi.createUnavailablePersonProfile(); assert(value.nameUsage.length === 0 && value.citizenship.length === 0 && value.languages.length === 0 && value.education.length === 0 && value.careerTimeline.length === 0 && Object.values(value.references).every((refs) => refs.length === 0) && value.versioning.profileVersion === null, "Unavailable factory invented data."); }],
  ["entity-exports-intact", () => assert(ENTITY_EXPORTS.every((name) => fidApi[name] === namedApi[name]), "Football Entity exports regressed.")],
  ["person-named-exports", () => assert(PERSON_EXPORTS.every((name) => Object.hasOwn(namedApi, name)), "Person Profile named exports incomplete.")],
  ["default-export-surface", () => assert([...ENTITY_EXPORTS, ...PERSON_EXPORTS].every((name) => fidApi[name] === namedApi[name]), "Default API incomplete.")],
  ["no-export-collisions", () => {
    const named = Object.keys(namedApi).filter((name) => name !== "default");
    const defaults = Object.keys(fidApi);
    const originalExports = [...ENTITY_EXPORTS, ...PERSON_EXPORTS];
    const missing = originalExports.filter(
      (name) => !Object.hasOwn(namedApi, name) || !Object.hasOwn(fidApi, name)
    );
    const disagreements = originalExports.filter(
      (name) => namedApi[name] !== fidApi[name]
    );
    assert(
      named.length === new Set(named).size &&
        defaults.length === new Set(defaults).size &&
        originalExports.length === new Set(originalExports).size &&
        missing.length === 0 &&
        disagreements.length === 0,
      "Export collision, missing original export, or named/default disagreement found.",
      { missing, disagreements }
    );
  }],
  ["diagnostic-runners-excluded", () => assert(!Object.keys(fidApi).some((name) => /^run.*Diagnostics$/.test(name)), "Diagnostic runner exported.")],
  ["no-research-repository-modification", ({ productionImports }) => assert(productionImports.every((entry) => !entry.includes("researchRepository")), "Research Repository dependency found.")],
  ["no-persistence-dependency", ({ personProfileSource, productionImports, productionSource }) => {
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
    const persistenceImports = productionImports.filter((entry) => /persistence/i.test(entry));
    const prohibitedContractDependency = /FidPersistenceArchitectureSpecification|FidPersistenceRepositoryContract|InMemoryFidPersistenceRepository|persistence[/\\](?:index|repository|adapter|service|manager|client)|repository|adapter|supabase|\bsql\b|migrations?|filesystem\s+storage|browser\s+storage|hydration|synchronization|registry|resolver|profile\s+resolution|runtime\s+(?:persistence|database)\s+integration/i;
    const prohibitedRuntime = /(?:Supabase|Database|Sql|Network|FileSystem|BrowserStorage|LocalStorage|IndexedDb)FidPersistenceRepository|PersonRepository|PersistenceService|PersistenceManager|PersistenceAdapter|SupabaseAdapter|DatabaseAdapter|StorageClient|DatabaseClient|createClient|sql\s+runtime|migration\s+runtime|application\s+persistence\s+singleton|runtime\s+hydration|runtime\s+synchronization|profile\s+resolution|runtime\s+database\s+integration/i;
    assert(
      !prohibitedContractDependency.test(personProfileSource) &&
        persistenceImports.every((entry) => approvedArchitectureImports.has(entry)) &&
        !prohibitedRuntime.test(productionSource),
      "Person Profile persistence boundary violated."
    );
  }],
  ["no-supabase-dependency", ({ productionImports }) => assert(productionImports.every((entry) => !/supabase/i.test(entry)), "Supabase dependency found.")],
  ["no-registry-dependency", ({ productionImports }) => assert(productionImports.every((entry) => !/registry/i.test(entry)), "Registry dependency found.")],
  ["no-resolver-dependency", ({ productionImports }) => assert(productionImports.every((entry) => !/resolver/i.test(entry)), "Resolver dependency found.")],
  ["no-relationship-dependency", ({ productionImports }) => {
    const personProfileImports = importSpecifiers(readFileSync(resolve(ROOT, "contracts/PersonProfileContract.js"), "utf8"));
    assert(productionImports.every((entry) => !isProhibitedRelationshipInfrastructure(entry))
      && personProfileImports.every((entry) => !isCanonicalFootballRelationshipModule(entry)
        && !isProhibitedRelationshipInfrastructure(entry)), "Relationship dependency found.");
  }],
  ["no-engine-dependency", ({ productionImports }) => assert(productionImports.every((entry) => !/engines/i.test(entry)), "Engine dependency found.")],
  ["no-ui-dependency", ({ productionImports }) => assert(productionImports.every((entry) => !/components|pages/i.test(entry)), "UI dependency found.")],
  ["no-routing-dependency", ({ productionImports }) => assert(productionImports.every((entry) => !/router|routes/i.test(entry)), "Routing dependency found.")],
  ["no-circular-production-dependency", ({ dependencyGraph }) => assert(!hasCycle(dependencyGraph), "Circular dependency found.")],
  ["football-entity-diagnostics-pass", ({ existing }) => assert(existing.footballEntity.total === 120 && existing.footballEntity.failed === 0, "Football Entity diagnostics failed.")],
  ["research-repository-diagnostics-pass", ({ existing }) => { const summaries = Object.entries(existing).filter(([name]) => name !== "footballEntity").map(([, summary]) => summary); assert(summaries.reduce((sum, summary) => sum + summary.total, 0) === 616 && summaries.every((summary) => summary.failed === 0), "Research Repository diagnostics failed."); }],
  ["production-build-integrity", () => assert([...ENTITY_EXPORTS, ...PERSON_EXPORTS].every((name) => fidApi[name] != null) && fidApi.isPersonProfile(created(base())), "Production module integrity failed.")],
];

async function buildContext() {
  const sources = Object.fromEntries(PRODUCTION_FILES.map((file) => [file, readFileSync(file, "utf8")]));
  return {
    productionImports: Object.values(sources).flatMap(importSpecifiers),
    productionSource: Object.values(sources).join("\n"),
    personProfileSource: sources[resolve(ROOT, "contracts/PersonProfileContract.js")],
    dependencyGraph: graph(sources),
    existing: await summaries(),
  };
}

export async function runPersonProfileContractDiagnostics({ throwOnFailure = false } = {}) {
  const context = await buildContext();
  const cases = [];
  for (const [id, execute] of CASES) {
    try {
      await execute(context);
      cases.push({ id, passed: true, message: `${id} passed.`, details: null });
    } catch (error) {
      cases.push({ id, passed: false, message: typeof error?.message === "string" ? error.message : `${id} failed.`, details: error?.details ?? null });
    }
  }
  const passed = cases.filter((entry) => entry.passed).length;
  const failed = cases.length - passed;
  const summary = {
    suite: SUITE,
    contractVersion: fidApi.PERSON_PROFILE_CONTRACT_VERSION,
    schemaVersion: fidApi.PERSON_PROFILE_SCHEMA_VERSION,
    total: cases.length,
    passed,
    failed,
    cases,
    existingSuiteSummaries: context.existing,
  };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runPersonProfileContractDiagnostics });
