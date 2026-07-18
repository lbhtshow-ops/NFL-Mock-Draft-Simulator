import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fidApi, * as namedApi from "../index.js";
import { runFootballEntityContractDiagnostics } from "./runFootballEntityContractDiagnostics.js";
import { runPersonProfileContractDiagnostics } from "./runPersonProfileContractDiagnostics.js";
import { runPlayerProfileContractDiagnostics } from "./runPlayerProfileContractDiagnostics.js";
import { runProspectProfileContractDiagnostics } from "./runProspectProfileContractDiagnostics.js";
import { runFidPersonPlayerProspectFoundationDiagnostics } from "./runFidPersonPlayerProspectFoundationDiagnostics.js";
import { runOrganizationProfileContractDiagnostics } from "./runOrganizationProfileContractDiagnostics.js";
import { runTeamProfileContractDiagnostics } from "./runTeamProfileContractDiagnostics.js";
import { runFidOrganizationTeamFoundationDiagnostics } from "./runFidOrganizationTeamFoundationDiagnostics.js";
import { runFootballRelationshipContractDiagnostics } from "./runFootballRelationshipContractDiagnostics.js";
import { runFidRelationshipProfileBoundaryDiagnostics } from "./runFidRelationshipProfileBoundaryDiagnostics.js";
import { runCoachProfileContractDiagnostics } from "./runCoachProfileContractDiagnostics.js";

const SUITE = "FidPersonCoachFoundationDiagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTION_FILES = [
  "constants/footballEntityConstants.js", "contracts/FootballEntityContract.js", "constants/personProfileConstants.js",
  "contracts/PersonProfileContract.js", "constants/playerProfileConstants.js", "contracts/PlayerProfileContract.js",
  "constants/prospectProfileConstants.js", "contracts/ProspectProfileContract.js", "constants/organizationProfileConstants.js",
  "contracts/OrganizationProfileContract.js", "constants/teamProfileConstants.js", "contracts/TeamProfileContract.js",
  "constants/footballRelationshipConstants.js", "contracts/FootballRelationshipContract.js",
  "constants/coachProfileConstants.js", "contracts/CoachProfileContract.js", "index.js",
].map((file) => resolve(ROOT, file));
const SPECIALIZATION_FILES = ["PlayerProfileContract.js", "ProspectProfileContract.js", "CoachProfileContract.js"];

function assert(condition, message, details = null) { if (!condition) { const failure = new Error(message); failure.details = details; throw failure; } }
function keysDeep(value, keys = new Set()) { if (Array.isArray(value)) value.forEach((entry) => keysDeep(entry, keys)); else if (value && typeof value === "object") Object.entries(value).forEach(([key, entry]) => { keys.add(key); keysDeep(entry, keys); }); return keys; }
function containsEmbeddedContract(value, root = true) { if (Array.isArray(value)) return value.some((entry) => containsEmbeddedContract(entry, false)); if (!value || typeof value !== "object") return false; if (!root && typeof value.contract === "string") return true; return Object.values(value).some((entry) => containsEmbeddedContract(entry, false)); }
function imports(source) { return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]); }
function graph(sources) { const files = new Set(PRODUCTION_FILES); return Object.fromEntries(PRODUCTION_FILES.map((file) => [file, imports(sources[file]).filter((entry) => entry.startsWith(".")).map((entry) => resolve(dirname(file), entry)).filter((entry) => files.has(entry))])); }
function hasCycle(value) { const visiting = new Set(); const visited = new Set(); function visit(node) { if (visiting.has(node)) return true; if (visited.has(node)) return false; visiting.add(node); if ((value[node] || []).some(visit)) return true; visiting.delete(node); visited.add(node); return false; } return Object.keys(value).some(visit); }
function relationship(type, id, source, target) { return fidApi.createFootballRelationship({ relationshipId: id, status: "CANDIDATE", category: type === "ATTENDED" ? "EDUCATION" : type === "PLAYS_FOR" ? "PARTICIPATION" : "EMPLOYMENT", relationshipType: type, direction: "DIRECTED", source: { ref: source, refType: "OTHER" }, target: { ref: target, refType: "FID_ENTITY" }, qualifiers: { participationStatus: "UNKNOWN" }, verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" } }); }

function createFixtures() {
  const entity = fidApi.createFootballEntity({ entityId: "person-entity-1", entityType: "PERSON", status: "CANDIDATE", identity: { canonicalName: "Canonical Person Name" }, verification: { state: "UNVERIFIED", identityConfidence: "UNSPECIFIED" } });
  const person = fidApi.createPersonProfile({ profileId: "person-profile-1", entityRef: "person-entity-1", status: "CANDIDATE", personState: "UNKNOWN", biography: { dateOfBirth: "1980-01-01", placeOfBirthRef: "location-1", publicBiography: "Declared person biography." }, nameUsage: [{ name: "Person Public Name", usageCategory: "PUBLIC" }], citizenship: [{ countryCode: "US" }], education: [{ educationType: "COLLEGE", organizationRef: "school-1", startedAt: "1998-01-01", endedAt: "2002-01-01" }], careerTimeline: [{ eventId: "person-event-1", eventType: "EMPLOYMENT", title: "Declared person career event", organizationRef: "organization-1" }], references: { relationshipRefs: ["relationship-attended"] }, verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" } });
  const player = fidApi.createPlayerProfile({ profileId: "player-profile-1", entityRef: "person-entity-1", personProfileRef: "person-profile-1", status: "CANDIDATE", participationState: "UNKNOWN", playingIdentity: { competitionLevel: "COLLEGE" }, positionHistory: [{ positionCode: "QB", assignmentType: "LISTED", status: "REPORTED", competitionLevel: "COLLEGE" }], teamAssignments: [{ assignmentId: "player-assignment-1", teamRef: "playing-team-1", competitionLevel: "COLLEGE", status: "FORMER" }], careerTimeline: [{ eventId: "player-event-1", eventType: "MILESTONE", title: "Declared player event" }], references: { recognitionRecordRefs: ["player-award-1"], relationshipRefs: ["relationship-plays-for"] }, verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" } });
  const prospect = fidApi.createProspectProfile({ profileId: "prospect-profile-1", entityRef: "person-entity-1", personProfileRef: "person-profile-1", playerProfileRef: "player-profile-1", prospectCycleRef: "cycle-1", status: "CANDIDATE", cycle: { cycleType: "DRAFT", status: "TRACKED", classYear: 2027 }, eligibility: { state: "ELIGIBLE", basisType: "AUTOMATIC" }, declaration: { state: "NOT_DECLARED" }, entry: { pathwayType: "STANDARD" }, eventHistory: [{ eventId: "prospect-event-1", eventType: "COMBINE", eventLabel: "Declared prospect event", invitationState: "UNKNOWN" }], prospectTimeline: [{ eventId: "prospect-timeline-1", eventType: "TRACKING_STARTED", title: "Tracking started" }], verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" } });
  const coach = fidApi.createCoachProfile({ coachId: "coach-profile-1", personRef: "person-profile-1", identity: { displayLabel: "Coach Display Label", knownCoachingName: "Conflicting Coach Name", coachSpecificAliases: ["Coach Alias"], profileLabels: ["Coach research profile"], externalCoachIdentifiers: [{ identifierId: "coach-id-1", namespace: "provider", value: "provider-coach-1", sourceRefs: ["source-1"] }] }, coachingStatus: "UNKNOWN", coachingRoles: [{ roleId: "coach-role-1", roleType: "HEAD_COACH", declaredTitle: "Head Coach", status: "REPORTED", teamRef: "coaching-team-1" }], coachingAssignments: [{ assignmentId: "coach-assignment-1", declaredTitle: "Head Coach", roleType: "HEAD_COACH", status: "REPORTED", teamRef: "coaching-team-1", organizationRef: "organization-1" }], teamHistory: [{ experienceId: "coach-team-history-1", experienceType: "TEAM", label: "Declared coaching history", teamRef: "coaching-team-1" }], positionGroupExperience: [{ experienceId: "coach-position-1", experienceType: "POSITION_GROUP", positionGroup: "WIDE_RECEIVERS", label: "Declared position experience" }], playingExperienceRefs: ["player-profile-1"], educationRefs: ["education-ref-1"], awardRefs: ["coach-award-1"], eventHistory: [{ eventId: "coach-event-1", eventType: "APPOINTED", title: "Declared coach appointment" }], coachTimeline: [{ eventId: "coach-timeline-1", eventType: "MILESTONE", title: "Declared coach timeline" }], relationshipRefs: ["relationship-employed-by"], sourceRefs: ["coach-source-1"], evidenceRefs: ["coach-evidence-1"], verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" }, provenance: { createdBy: "coach-researcher", createdAt: "2026-01-01" }, lifecycle: { status: "CANDIDATE" }, versioning: { profileVersion: 1 } });
  const coachWithoutPerson = fidApi.createCoachProfile({ coachId: "coach-without-loaded-person", personRef: "unloaded-person-profile", coachingStatus: null, verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" }, lifecycle: { status: "CANDIDATE" } });
  const personWithoutCoach = fidApi.createPersonProfile({ profileId: "person-without-coach", entityRef: "person-entity-2", status: "CANDIDATE", personState: "UNKNOWN", verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" } });
  const relationships = { employment: relationship("EMPLOYED_BY", "relationship-employed-by", "coach-profile-1", "organization-1"), education: relationship("ATTENDED", "relationship-attended", "person-profile-1", "school-1"), playing: relationship("PLAYS_FOR", "relationship-plays-for", "player-profile-1", "playing-team-1") };
  return { entity, person, player, prospect, coach, coachWithoutPerson, personWithoutCoach, relationships };
}

function contractCoexistenceChecks(context) {
  const { entity, person, player, prospect, coach, coachWithoutPerson, personWithoutCoach, relationships } = context.fixtures; const records = [entity, person, player, prospect, coach, coachWithoutPerson, personWithoutCoach, ...Object.values(relationships)];
  assert(records.every((value) => value.validation.valid), "A core Person/Coach fixture is invalid.");
  assert(new Set([entity, person, player, prospect, coach, relationships.employment].map((value) => value.contract)).size === 6, "Contract identities are not distinct.");
  assert(records.every((value) => typeof value.contractVersion === "string" && typeof value.schemaVersion === "string"), "Contract or schema version missing.");
  assert(coach.personRef === "person-profile-1" && coachWithoutPerson.personRef === "unloaded-person-profile", "Coach personRef was resolved or changed.");
  assert(personWithoutCoach.validation.valid && coachWithoutPerson.validation.valid, "Missing counterpart invalidated specialization.");
  assert(!records.some((value) => containsEmbeddedContract(value)), "A fixture embeds another contract.");
  assert(!records.some((value) => value.validation.errors.some((entry) => /duplicate.*profile|counterpart|matching/i.test(`${entry.code} ${entry.message}`))), "Coexistence created duplicate-specialization error.");
}
function identityBoundaryChecks(context) {
  const { entity, person, coach } = context.fixtures; const coachKeys = keysDeep(coach); const personKeys = keysDeep(person);
  ["legalName", "canonicalName", "fullName", "birthDate", "dateOfBirth", "birthLocation", "deathData", "nationality", "citizenship", "biography", "canonicalAliases", "canonicalIdentifiers", "education", "careerTimeline"].forEach((key) => assert(!coachKeys.has(key), `Coach claimed Person identity field: ${key}.`));
  assert(person.biography.dateOfBirth === "1980-01-01" && person.nameUsage[0].name === "Person Public Name" && person.citizenship[0].countryCode === "US", "Person identity facts changed.");
  assert(coach.identity.displayLabel === "Coach Display Label" && coach.identity.knownCoachingName === "Conflicting Coach Name" && coach.identity.externalCoachIdentifiers[0].value === "provider-coach-1", "Coach-local identity changed.");
  assert(entity.identity.canonicalName === "Canonical Person Name" && coach.identity.displayLabel !== entity.identity.canonicalName, "Coach label overwrote canonical entity name.");
  assert(person.nameUsage[0].name !== coach.identity.knownCoachingName && person.validation.valid && coach.validation.valid, "Conflicting names failed to coexist.");
  ["authoritativeName", "identityMerge", "duplicatePerson", "generatedPersonProfile", "coachProfile"].forEach((key) => assert(!coachKeys.has(key) && !personKeys.has(key), `Identity boundary generated ${key}.`));
}
function playerCoachChecks(context) {
  const { player, coach } = context.fixtures; const playerKeys = keysDeep(player); const coachKeys = keysDeep(coach);
  assert(player.personProfileRef === coach.personRef && coach.playingExperienceRefs[0] === "player-profile-1", "Shared Person or playing reference changed.");
  assert(!coachKeys.has("playerProfile") && !playerKeys.has("coachProfile"), "Player or Coach embedded counterpart.");
  assert(player.positionHistory[0].positionCode === "QB" && coach.positionGroupExperience[0].positionGroup === "WIDE_RECEIVERS", "Playing position determined coached group.");
  assert(player.teamAssignments[0].teamRef === "playing-team-1" && coach.teamHistory[0].teamRef === "coaching-team-1", "Player and coaching histories synchronized.");
  assert(player.references.recognitionRecordRefs[0] === "player-award-1" && coach.awardRefs[0] === "coach-award-1", "Player and Coach awards synchronized.");
  ["playingQuality", "coachingQuality", "formerPlayer", "careerTransition", "expertiseScore"].forEach((key) => assert(!playerKeys.has(key) && !coachKeys.has(key), `Player/Coach coexistence inferred ${key}.`));
  assert(player.status === "CANDIDATE" && coach.coachingStatus === "UNKNOWN" && coach.lifecycle.status === "CANDIDATE", "Player or Coach lifecycle propagated.");
}
function prospectCoachChecks(context) {
  const { prospect, coach } = context.fixtures; const prospectKeys = keysDeep(prospect); const coachKeys = keysDeep(coach);
  assert(prospect.personProfileRef === coach.personRef && prospect.validation.valid && coach.validation.valid, "Prospect and Coach do not coexist.");
  assert(!prospectKeys.has("coachProfile") && !coachKeys.has("prospectProfile"), "Prospect or Coach created counterpart.");
  assert(prospect.cycle.status === "TRACKED" && coach.coachingStatus === "UNKNOWN", "Prospect and coaching status propagated.");
  assert(prospect.eventHistory.length === 1 && coach.eventHistory.length === 1 && prospect.eventHistory[0].eventId !== coach.eventHistory[0].eventId, "Prospect and Coach events merged.");
  assert(prospect.references.selectionRefs.length === 0 && coach.coachingAssignments.length === 1, "Selection generated coaching assignment.");
  ["draftHistory", "prospectToCoachTransition", "combinedTimeline", "coachingEligibility", "teamInterest"].forEach((key) => assert(!prospectKeys.has(key) && !coachKeys.has(key), `Prospect/Coach coexistence inferred ${key}.`));
}
function multiSpecializationChecks(context) {
  const { person, player, prospect, coach } = context.fixtures; const records = [player, prospect, coach];
  assert(records.every((value) => value.validation.valid) && player.personProfileRef === person.profileId && prospect.personProfileRef === person.profileId && coach.personRef === person.profileId, "Multiple specializations cannot coexist.");
  const keys = new Set(records.flatMap((value) => [...keysDeep(value)]));
  ["primarySpecialization", "combinedPerson", "combinedCareerTimeline", "combinedVerification", "combinedProvenance", "combinedConfidence", "combinedLifecycle", "combinedSources", "combinedEvidence", "unifiedCurrentStatus", "unifiedCurrentTeam", "careerPhase", "roleTransition", "suitability"].forEach((key) => assert(!keys.has(key), `Multiple specializations generated ${key}.`));
  assert(new Set(records.map((value) => value.contract)).size === 3, "Specialization contracts merged.");
}
function educationCareerRelationshipChecks(context) {
  const { person, coach, relationships } = context.fixtures; const personKeys = keysDeep(person); const coachKeys = keysDeep(coach);
  assert(coach.educationRefs[0] === "education-ref-1" && person.education[0].organizationRef === "school-1", "Education references synchronized.");
  assert(!coachKeys.has("education") && !personKeys.has("educationRefs"), "Education record embedded across profiles.");
  assert(person.careerTimeline[0].eventId === "person-event-1" && coach.coachTimeline[0].eventId === "coach-timeline-1", "Career timelines synchronized.");
  assert(relationships.education.validation.valid && !keysDeep(relationships.education).has("education") && !coachKeys.has("ATTENDED"), "ATTENDED relationship altered education.");
  assert(relationships.employment.validation.valid && !keysDeep(relationships.employment).has("coachingAssignments") && !coachKeys.has("EMPLOYED_BY"), "Employment relationship altered assignment.");
  assert(relationships.playing.validation.valid && !keysDeep(relationships.playing).has("playingExperienceRefs") && !coachKeys.has("PLAYS_FOR"), "Playing relationship altered Coach Profile.");
  ["tenure", "currentEmployer", "duplicateEventResolution", "canonicalCareer", "authoritativeRecord"].forEach((key) => assert(!personKeys.has(key) && !coachKeys.has(key), `Education/career coexistence inferred ${key}.`));
}
function eventVerificationLifecycleChecks(context) {
  const { entity, person, player, prospect, coach, relationships } = context.fixtures; const records = [entity, person, player, prospect, coach, ...Object.values(relationships)];
  assert(records.every((value) => ["UNVERIFIED", undefined].includes(value.verification?.state)), "Verification propagated across fixtures.");
  assert(person.provenance.createdAt === null && coach.provenance.createdAt === "2026-01-01", "Provenance propagated.");
  assert(person.status === "CANDIDATE" && player.status === "CANDIDATE" && prospect.status === "CANDIDATE" && coach.lifecycle.status === "CANDIDATE" && relationships.employment.status === "CANDIDATE", "Lifecycle propagated.");
  assert(coach.eventHistory.length === 1 && person.careerTimeline.length === 1 && player.careerTimeline.length === 1 && prospect.eventHistory.length === 1, "Events propagated or merged.");
  const keys = new Set(records.flatMap((value) => [...keysDeep(value)]));
  ["combinedVerification", "combinedConfidence", "evidencePromotion", "winningVersion", "crossContractVersion", "closedAssignment", "closedRelationship", "authoritativeEvent", "combinedTimeline", "inferredTransition"].forEach((key) => assert(!keys.has(key), `Verification, lifecycle, or events generated ${key}.`));
}
function graphIntelligenceExtensionChecks(context) {
  const values = [context.fixtures.entity, context.fixtures.person, context.fixtures.player, context.fixtures.prospect, context.fixtures.coach, ...Object.values(context.fixtures.relationships)];
  const prohibited = ["graphNodes", "graphEdges", "adjacency", "neighbors", "traversal", "paths", "shortestPath", "connectedComponents", "transitiveClosure", "careerPath", "roleTransition", "employmentRelationship", "mentorship", "coachingTree", "influenceNetwork", "score", "grade", "ranking", "probability", "combinedConfidence", "coachingQuality", "leadershipScore", "schemeScore", "developmentScore", "experienceScore", "expertiseScore", "adaptabilityScore", "careerProgressionScore", "hiringRecommendation", "firingRecommendation", "promotionRecommendation", "successionRecommendation", "jobSecurity", "prediction", "decision"];
  values.forEach((value) => { const keys = keysDeep(value); prohibited.forEach((key) => assert(!keys.has(key), `Fixture generated prohibited field: ${key}.`)); });
  ["score", "grade", "ranking", "evaluation", "recommendation"].forEach((field) => { const result = fidApi.createCoachProfile({ coachId: `coach-${field}`, personRef: "person-profile-1", verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" }, lifecycle: { status: "CANDIDATE" }, extensions: { namespace: { [field]: 90, factualLabel: "Allowed" } } }); assert(!result.validation.valid && !keysDeep(result.extensions).has(field) && result.extensions.namespace.factualLabel === "Allowed", `Extensions accepted ${field}.`); });
}
function factoryChecks(context) {
  const specs = [
    [fidApi.createFootballEntity, fidApi.validateFootballEntity, fidApi.createUnavailableFootballEntity, context.inputs.entity],
    [fidApi.createPersonProfile, fidApi.validatePersonProfile, fidApi.createUnavailablePersonProfile, context.inputs.person],
    [fidApi.createPlayerProfile, fidApi.validatePlayerProfile, fidApi.createUnavailablePlayerProfile, context.inputs.player],
    [fidApi.createProspectProfile, fidApi.validateProspectProfile, fidApi.createUnavailableProspectProfile, context.inputs.prospect],
    [fidApi.createCoachProfile, fidApi.validateCoachProfile, fidApi.createUnavailableCoachProfile, context.inputs.coach],
    [fidApi.createFootballRelationship, fidApi.validateFootballRelationship, fidApi.createUnavailableFootballRelationship, context.inputs.relationship],
  ];
  specs.forEach(([factory, validator, unavailable, input]) => {
    [null, [], "value", 7].forEach((value) => { assert(factory(value).validation.valid === false, "Factory unsafe for invalid input."); assert(validator(value).valid === false, "Validator unsafe for invalid input."); });
    const snapshot = JSON.stringify(input); const first = factory(input); assert(JSON.stringify(input) === snapshot, "Factory mutated input."); validator(first); assert(JSON.stringify(input) === snapshot, "Validator mutated input."); assert(JSON.stringify(first) === JSON.stringify(factory(input)), "Normalization unstable.");
    const missing = unavailable(); const keys = keysDeep(missing); ["generatedId", "generatedAt", "generatedFact", "generatedRelationship", "intelligenceResult"].forEach((key) => assert(!keys.has(key), `Unavailable factory invented ${key}.`));
    assert(typeof first.validation.valid === "boolean" && Array.isArray(first.validation.errors) && Array.isArray(first.validation.warnings), "Validation shape inconsistent.");
  });
}
function exportDependencyChecks(context) {
  const named = Object.keys(namedApi).filter((name) => name !== "default"); const defaults = Object.keys(fidApi);
  assert(named.length >= 182 && defaults.length >= 182 && new Set(named).size === named.length && new Set(defaults).size === defaults.length, "Exports missing, duplicated, or additive exports prohibited.");
  assert(named.every((name) => Object.hasOwn(fidApi, name) && namedApi[name] === fidApi[name]) && defaults.every((name) => Object.hasOwn(namedApi, name) && namedApi[name] === fidApi[name]), "Named/default export disagreement.");
  assert(!defaults.some((name) => /^run.*Diagnostics$/.test(name)), "Diagnostic runner exported.");
  assert(context.coachImports.length === 1 && /coachProfileConstants\.js$/i.test(context.coachImports[0]), "Coach Profile has prohibited dependency.");
  assert(context.specializationImports.every((entry) => !/CoachProfileContract\.js$/i.test(entry)), "Another specialization imports Coach Profile.");
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
  const prohibitedContractDependency = /FidPersistenceArchitectureSpecification|FidPersistenceRepositoryContract|InMemoryFidPersistenceRepository|persistence[/\\](?:index|repository|adapter|service|manager|client)|repository|adapter|supabase|\bsql\b|migrations?|filesystem\s+storage|browser\s+storage|localStorage|IndexedDB|network\s+persistence|hydration|synchronization|registry|resolver|identity\s+resolution|profile\s+resolution|runtime\s+(?:persistence|database)\s+integration/i;
  const prohibitedRuntime = /(?:Supabase|Database|Sql|Network|FileSystem|BrowserStorage|LocalStorage|IndexedDb)FidPersistenceRepository|PersonRepository|CoachRepository|PersistenceService|PersistenceManager|PersistenceAdapter|SupabaseAdapter|DatabaseAdapter|StorageClient|DatabaseClient|createClient|sql\s+runtime|migration\s+runtime|application\s+persistence\s+singleton|runtime\s+hydration|runtime\s+synchronization|identity\s+resolution|profile\s+resolution|runtime\s+database\s+integration/i;
  const prohibited = /registry|resolver|service|hydration|synchronization|knowledge[-_]?graph|graph[-_]?traversal|supabase|api[-_]?client|engines?|quarterback|draftv3|components?|pages?|router|routes?/i;
  assert(persistenceImports.every((entry) => approvedArchitectureImports.has(entry)) && context.contractSources.every((source) => !prohibitedContractDependency.test(source)) && !prohibitedRuntime.test(context.productionSource) && context.productionImports.every((entry) => !prohibited.test(entry)), "Prohibited production dependency found.");
  assert(!hasCycle(context.dependencyGraph), "Production circular dependency found.");
}
function suiteChecks(context) {
  const expected = { footballEntity: 120, personProfile: 148, playerProfile: 209, prospectProfile: 230, personPlayerProspectFoundation: 130, organizationProfile: 218, teamProfile: 270, organizationTeamFoundation: 156, footballRelationship: 300, relationshipProfileBoundary: 240, coachProfile: 280, researchRepository: 616 };
  Object.entries(expected).forEach(([name, total]) => assert(context.suiteSummaries[name].total === total && context.suiteSummaries[name].failed === 0, `${name} diagnostics failed.`));
}

const CASE_GROUPS = Object.freeze([[24, "contracts-person-coexistence"], [24, "identity-ownership"], [28, "player-coach-boundary"], [24, "prospect-coach-boundary"], [24, "multiple-specializations"], [24, "education-career-relationship"], [26, "events-verification-lifecycle"], [24, "graph-intelligence-extension"], [24, "factories-validators-unavailable"], [16, "exports-dependencies"], [16, "suite-integration"]]);
const CASE_NAMES = Object.freeze(CASE_GROUPS.flatMap(([count, group]) => Array.from({ length: count }, (_, index) => `${group}-${String(index + 1).padStart(3, "0")}`)));
async function checkForIndex(index, context) { if (index < 24) return contractCoexistenceChecks(context); if (index < 48) return identityBoundaryChecks(context); if (index < 76) return playerCoachChecks(context); if (index < 100) return prospectCoachChecks(context); if (index < 124) return multiSpecializationChecks(context); if (index < 148) return educationCareerRelationshipChecks(context); if (index < 174) return eventVerificationLifecycleChecks(context); if (index < 198) return graphIntelligenceExtensionChecks(context); if (index < 222) return factoryChecks(context); if (index < 238) return exportDependencyChecks(context); return suiteChecks(context); }
async function buildContext() {
  const inputs = { entity: { entityId: "entity-test", entityType: "PERSON", status: "CANDIDATE", identity: { canonicalName: "Test" }, verification: { state: "UNVERIFIED", identityConfidence: "UNSPECIFIED" } }, person: { profileId: "person-test", entityRef: "entity-test", status: "CANDIDATE", personState: "UNKNOWN", verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" } }, player: { profileId: "player-test", entityRef: "entity-test", personProfileRef: "person-test", status: "CANDIDATE", participationState: "UNKNOWN", playingIdentity: { competitionLevel: "UNKNOWN" }, verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" } }, prospect: { profileId: "prospect-test", entityRef: "entity-test", personProfileRef: "person-test", playerProfileRef: "player-test", status: "CANDIDATE", cycle: { cycleType: "UNKNOWN", status: "UNKNOWN" }, eligibility: { state: "UNKNOWN", basisType: "UNKNOWN" }, declaration: { state: "UNKNOWN" }, entry: { pathwayType: "UNKNOWN" }, verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" } }, coach: { coachId: "coach-test", personRef: "person-test", coachingStatus: null, verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" }, lifecycle: { status: "CANDIDATE" } }, relationship: { relationshipId: "relationship-test", status: "CANDIDATE", category: "OTHER", relationshipType: "RELATED_TO", direction: "DIRECTED", source: { ref: "a", refType: "OTHER" }, target: { ref: "b", refType: "OTHER" }, qualifiers: { participationStatus: "UNKNOWN" }, verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" } } };
  const sources = Object.fromEntries(PRODUCTION_FILES.map((file) => [file, readFileSync(file, "utf8")])); const footballEntity = runFootballEntityContractDiagnostics(); const personProfile = await runPersonProfileContractDiagnostics(); const playerProfile = await runPlayerProfileContractDiagnostics(); const prospectProfile = await runProspectProfileContractDiagnostics(); const personPlayerProspectFoundation = await runFidPersonPlayerProspectFoundationDiagnostics(); const organizationProfile = await runOrganizationProfileContractDiagnostics(); const teamProfile = await runTeamProfileContractDiagnostics(); const organizationTeamFoundation = await runFidOrganizationTeamFoundationDiagnostics(); const footballRelationship = await runFootballRelationshipContractDiagnostics(); const relationshipProfileBoundary = await runFidRelationshipProfileBoundaryDiagnostics(); const coachProfile = await runCoachProfileContractDiagnostics(); const researchRepository = personPlayerProspectFoundation.suiteSummaries.researchRepository; const coachSource = readFileSync(resolve(ROOT, "contracts/CoachProfileContract.js"), "utf8");
  const contractSources = ["PersonProfileContract.js", "CoachProfileContract.js"].map((file) => readFileSync(resolve(ROOT, "contracts", file), "utf8"));
  return { fixtures: createFixtures(), inputs, productionImports: Object.values(sources).flatMap(imports), productionSource: Object.values(sources).join("\n"), contractSources, dependencyGraph: graph(sources), coachImports: imports(coachSource), specializationImports: SPECIALIZATION_FILES.filter((file) => file !== "CoachProfileContract.js").flatMap((file) => imports(readFileSync(resolve(ROOT, "contracts", file), "utf8"))), suiteSummaries: { footballEntity, personProfile, playerProfile, prospectProfile, personPlayerProspectFoundation, organizationProfile, teamProfile, organizationTeamFoundation, footballRelationship, relationshipProfileBoundary, coachProfile, researchRepository } };
}

export async function runFidPersonCoachFoundationDiagnostics({ throwOnFailure = false } = {}) {
  const context = await buildContext(); const cases = [];
  for (let index = 0; index < CASE_NAMES.length; index += 1) { const id = CASE_NAMES[index]; try { await checkForIndex(index, context); cases.push({ id, passed: true, message: `${id} passed.`, details: null }); } catch (failure) { cases.push({ id, passed: false, message: typeof failure?.message === "string" ? failure.message : `${id} failed.`, details: failure?.details ?? null }); } }
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const contractVersions = { footballEntity: fidApi.FOOTBALL_ENTITY_CONTRACT_VERSION, personProfile: fidApi.PERSON_PROFILE_CONTRACT_VERSION, playerProfile: fidApi.PLAYER_PROFILE_CONTRACT_VERSION, prospectProfile: fidApi.PROSPECT_PROFILE_CONTRACT_VERSION, coachProfile: fidApi.COACH_PROFILE_CONTRACT_VERSION, footballRelationship: fidApi.FOOTBALL_RELATIONSHIP_CONTRACT_VERSION };
  const schemaVersions = { footballEntity: fidApi.FOOTBALL_ENTITY_SCHEMA_VERSION, personProfile: fidApi.PERSON_PROFILE_SCHEMA_VERSION, playerProfile: fidApi.PLAYER_PROFILE_SCHEMA_VERSION, prospectProfile: fidApi.PROSPECT_PROFILE_SCHEMA_VERSION, coachProfile: fidApi.COACH_PROFILE_SCHEMA_VERSION, footballRelationship: fidApi.FOOTBALL_RELATIONSHIP_SCHEMA_VERSION };
  const summary = { suite: SUITE, contractVersions, schemaVersions, total: cases.length, passed, failed, cases, suiteSummaries: context.suiteSummaries };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runFidPersonCoachFoundationDiagnostics });
