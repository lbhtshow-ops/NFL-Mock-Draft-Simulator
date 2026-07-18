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

const SUITE = "FidRelationshipProfileBoundaryDiagnostics";
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

function assert(condition, message, details = null) { if (!condition) { const failure = new Error(message); failure.details = details; throw failure; } }
function keysDeep(value, keys = new Set()) { if (Array.isArray(value)) value.forEach((entry) => keysDeep(entry, keys)); else if (value && typeof value === "object") Object.entries(value).forEach(([key, entry]) => { keys.add(key); keysDeep(entry, keys); }); return keys; }
function containsEmbeddedContract(value, root = true) { if (Array.isArray(value)) return value.some((entry) => containsEmbeddedContract(entry, false)); if (!value || typeof value !== "object") return false; if (!root && typeof value.contract === "string") return true; return Object.values(value).some((entry) => containsEmbeddedContract(entry, false)); }
function imports(source) { return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]); }
function graph(sources) { const files = new Set(PRODUCTION_FILES); return Object.fromEntries(PRODUCTION_FILES.map((file) => [file, imports(sources[file]).filter((entry) => entry.startsWith(".")).map((entry) => resolve(dirname(file), entry)).filter((entry) => files.has(entry))])); }
function hasCycle(value) { const visiting = new Set(); const visited = new Set(); function visit(node) { if (visiting.has(node)) return true; if (visited.has(node)) return false; visiting.add(node); if ((value[node] || []).some(visit)) return true; visiting.delete(node); visited.add(node); return false; } return Object.keys(value).some(visit); }
function relationshipInput(relationshipType, sourceRef, targetRef, overrides = {}) {
  return {
    relationshipId: `relationship-${relationshipType.toLowerCase()}`, status: "CANDIDATE", category: "AFFILIATION",
    relationshipType, direction: "DIRECTED", source: { ref: sourceRef, refType: "FID_ENTITY" },
    target: { ref: targetRef, refType: "FID_ENTITY" }, qualifiers: { participationStatus: "UNKNOWN" },
    verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" }, ...overrides,
  };
}

function createFixtures() {
  const entity = fidApi.createFootballEntity({ entityId: "person-entity-1", entityType: "PERSON", status: "CANDIDATE", identity: { canonicalName: "Declared Person" }, verification: { state: "UNVERIFIED", identityConfidence: "UNSPECIFIED" } });
  const person = fidApi.createPersonProfile({ profileId: "person-profile-1", entityRef: "person-entity-1", status: "CANDIDATE", personState: "UNKNOWN", education: [{ educationType: "COLLEGE", organizationRef: "school-entity-1", startedAt: "2022-01-01", endedAt: null }], careerTimeline: [{ eventId: "person-career-1", eventType: "EMPLOYMENT", title: "Declared employment", organizationRef: "organization-entity-1" }], references: { relationshipRefs: ["relationship-attended"] }, verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" } });
  const player = fidApi.createPlayerProfile({ profileId: "player-profile-1", entityRef: "player-entity-1", personProfileRef: "person-profile-1", status: "CANDIDATE", participationState: "UNKNOWN", playingIdentity: { competitionLevel: "COLLEGE" }, positionHistory: [{ positionCode: "QB", assignmentType: "LISTED", status: "REPORTED", competitionLevel: "COLLEGE" }], teamAssignments: [{ assignmentId: "assignment-1", teamRef: "team-entity-1", competitionLevel: "COLLEGE", status: "CURRENT", startedAt: "2025-01-01", endedAt: null }], rosterHistory: [{ rosterEventId: "roster-1", teamRef: "team-entity-1", designation: "ACTIVE_ROSTER", effectiveAt: "2025-01-01" }], careerTimeline: [{ eventId: "player-career-1", eventType: "TRANSFER", title: "Declared transfer" }], references: { relationshipRefs: ["relationship-plays_for"] }, verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" } });
  const prospect = fidApi.createProspectProfile({ profileId: "prospect-profile-1", entityRef: "player-entity-1", personProfileRef: "person-profile-1", playerProfileRef: "player-profile-1", prospectCycleRef: "cycle-1", status: "CANDIDATE", cycle: { cycleType: "DRAFT", status: "TRACKED", classYear: 2027 }, eligibility: { state: "ELIGIBLE", basisType: "AUTOMATIC" }, declaration: { state: "NOT_DECLARED" }, entry: { pathwayType: "STANDARD", signingRef: "signing-1" }, eventHistory: [{ eventId: "prospect-event-1", eventType: "COMBINE", eventLabel: "Declared event", invitationState: "UNKNOWN" }], prospectTimeline: [{ eventId: "prospect-timeline-1", eventType: "SELECTION", title: "Declared selection" }], references: { selectionRefs: ["selection-1"], transactionRefs: ["transaction-1"], draftClassRefs: ["draft-class-2027"], relationshipRefs: ["relationship-selected_by"] }, verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" } });
  const organization = fidApi.createOrganizationProfile({ profileId: "organization-profile-1", entityRef: "organization-entity-1", status: "CANDIDATE", organizationType: "LEAGUE", operatingState: "UNKNOWN", locations: [{ locationId: "location-1", locationType: "HEADQUARTERS", label: "Declared location", locationRef: "location-entity-1" }], affiliations: [{ affiliationId: "affiliation-1", affiliationType: "MEMBER", organizationRef: "parent-organization-1", status: "CURRENT", validFrom: "2020-01-01", validTo: null }], organizationalTimeline: [{ eventId: "organization-event-1", eventType: "MILESTONE", title: "Declared milestone" }], references: { relationshipRefs: ["relationship-member_of"] }, verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" } });
  const team = fidApi.createTeamProfile({ profileId: "team-profile-1", entityRef: "team-entity-1", organizationProfileRef: "organization-profile-1", organizationEntityRef: "organization-entity-1", status: "CANDIDATE", teamType: "COLLEGIATE", competitionLevel: "COLLEGE", competitiveState: "UNKNOWN", competitionMemberships: [{ membershipId: "membership-1", leagueRef: "league-entity-1", conferenceRef: "conference-entity-1", divisionRef: "division-entity-1", status: "CURRENT", validFrom: "2025-01-01", validTo: null }], seasonParticipation: [{ participationId: "participation-1", seasonRef: "season-2026", status: "REPORTED" }], venues: [{ venueUsageId: "venue-1", venueRef: "venue-entity-1", venueLabel: "Declared home", usageType: "HOME", validFrom: "2025-01-01", validTo: null }], teamTimeline: [{ eventId: "team-event-1", eventType: "MILESTONE", title: "Declared milestone" }], references: { relationshipRefs: ["relationship-home_venue_is"] }, verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" } });
  const relationships = {
    playsFor: fidApi.createFootballRelationship(relationshipInput("PLAYS_FOR", "player-entity-1", "team-entity-1", { qualifiers: { participationStatus: "CURRENT", teamRef: "different-team-qualifier", positionCode: "WR" }, period: { startedAt: "2026-01-01", endedAt: null } })),
    assignedTo: fidApi.createFootballRelationship(relationshipInput("ASSIGNED_TO", "player-entity-1", "team-entity-2")),
    memberOf: fidApi.createFootballRelationship(relationshipInput("MEMBER_OF", "organization-entity-1", "parent-organization-1", { qualifiers: { participationStatus: "CURRENT" }, period: { startedAt: "2021-01-01" } })),
    participatesIn: fidApi.createFootballRelationship(relationshipInput("PARTICIPATES_IN", "team-entity-1", "league-entity-1")),
    homeVenue: fidApi.createFootballRelationship(relationshipInput("HOME_VENUE_IS", "team-entity-1", "venue-entity-1", { qualifiers: { participationStatus: "CURRENT" } })),
    locatedAt: fidApi.createFootballRelationship(relationshipInput("LOCATED_AT", "organization-entity-1", "location-entity-1")),
    attended: fidApi.createFootballRelationship(relationshipInput("ATTENDED", "person-entity-1", "school-entity-1")),
    selectedBy: fidApi.createFootballRelationship(relationshipInput("SELECTED_BY", "player-entity-1", "team-entity-2")),
  };
  return { entity, person, player, prospect, organization, team, relationships };
}

function contractChecks(context) {
  const records = [context.fixtures.entity, context.fixtures.person, context.fixtures.player, context.fixtures.prospect, context.fixtures.organization, context.fixtures.team, context.fixtures.relationships.playsFor];
  assert(records.every((value) => value.validation.valid), "A canonical fixture is invalid.", records.filter((value) => !value.validation.valid).map((value) => ({ contract: value.contract, errors: value.validation.errors })));
  assert(new Set(records.map((value) => value.contract)).size === 7, "Contract identities are not unique.");
  assert(records.every((value) => typeof value.contractVersion === "string" && typeof value.schemaVersion === "string"), "Contract or schema version missing.");
  assert(records.every((value) => typeof value.validation.valid === "boolean" && Array.isArray(value.validation.errors) && Array.isArray(value.validation.warnings) && value.validation.contractVersion === value.contractVersion && value.validation.schemaVersion === value.schemaVersion), "Validation shapes inconsistent.");
  assert(records.every((value) => !containsEmbeddedContract(value)), "A fixture embeds another contract.");
  assert(records.every((value) => [...keysDeep(value)].filter((key) => /Refs?$/.test(key)).every((key) => key !== "resolvedRef")), "A fixture resolved references.");
}
function coexistenceChecks(context) {
  const { player, organization, team, person, prospect, relationships } = context.fixtures;
  assert(player.teamAssignments.length === 1 && relationships.playsFor.validation.valid, "Assignment and PLAYS_FOR do not coexist.");
  assert(organization.affiliations.length === 1 && relationships.memberOf.validation.valid, "Affiliation and MEMBER_OF do not coexist.");
  assert(team.competitionMemberships.length === 1 && relationships.participatesIn.validation.valid, "Membership and PARTICIPATES_IN do not coexist.");
  assert(team.venues.length === 1 && relationships.homeVenue.validation.valid, "Venue and HOME_VENUE_IS do not coexist.");
  assert(person.education.length === 1 && relationships.attended.validation.valid, "Education and ATTENDED do not coexist.");
  assert(prospect.references.selectionRefs.length === 1 && relationships.selectedBy.validation.valid, "Selection reference and SELECTED_BY do not coexist.");
  assert(![player, organization, team, person, prospect, ...Object.values(relationships)].some((value) => value.validation.errors.some((entry) => /duplicate|matching|authorit/i.test(`${entry.code} ${entry.message}`))), "Coexistence produced duplicate or authority errors.");
  const boundaryKeys = [player, organization, team, person, prospect, ...Object.values(relationships)].flatMap((value) => [...keysDeep(value)].filter((key) => /^(?:authoritative|authoritySource|preferredRecord|synchronizationState|synchronizedAt)$/i.test(key)));
  assert(boundaryKeys.length === 0, "Coexistence created authority or synchronization state.", boundaryKeys);
}
function assignmentChecks(context) {
  const { player, relationships } = context.fixtures; const assignment = player.teamAssignments[0]; const playsFor = relationships.playsFor;
  assert(!keysDeep(player).has("PLAYS_FOR") && !keysDeep(player).has("playsFor"), "Assignment created PLAYS_FOR.");
  assert(!keysDeep(playsFor).has("teamAssignments") && !keysDeep(relationships.assignedTo).has("teamAssignments"), "Relationship created assignment.");
  assert(assignment.status === "CURRENT" && playsFor.qualifiers.participationStatus === "CURRENT", "Declared states changed.");
  assert(assignment.startedAt === "2025-01-01" && playsFor.period.startedAt === "2026-01-01", "Assignment and Relationship dates synchronized.");
  assert(assignment.teamRef === "team-entity-1" && playsFor.qualifiers.teamRef === "different-team-qualifier", "Team qualifier altered assignment.");
  assert(player.positionHistory[0].positionCode === "QB" && playsFor.qualifiers.positionCode === "WR", "Position qualifier altered position history.");
  assert(player.rosterHistory.length === 1 && !keysDeep(playsFor).has("rosterHistory"), "PLAYS_FOR created roster membership.");
  assert(!Object.hasOwn(player, "currentTeam") && !Object.hasOwn(player.playingIdentity, "currentTeam"), "Current team calculated.");
}
function affiliationChecks(context) {
  const { organization, relationships } = context.fixtures; const affiliation = organization.affiliations[0]; const memberOf = relationships.memberOf;
  ["MEMBER_OF", "AFFILIATED_WITH", "OWNED_BY", "PARENT_OF", "SUBSIDIARY_OF"].forEach((type) => assert(!keysDeep(organization).has(type), `Affiliation created ${type}.`));
  assert(!keysDeep(memberOf).has("affiliations"), "Relationship created affiliation.");
  assert(affiliation.status === "CURRENT" && memberOf.qualifiers.participationStatus === "CURRENT", "Affiliation or Relationship state changed.");
  assert(affiliation.validFrom === "2020-01-01" && memberOf.period.startedAt === "2021-01-01", "Affiliation and period dates synchronized.");
  assert(!Object.hasOwn(organization, "legalOwnership") && !Object.hasOwn(organization, "resolvedHierarchy"), "Affiliation established ownership or hierarchy.");
  assert(organization.validation.valid && memberOf.validation.valid, "Conflicting affiliation and Relationship did not coexist.");
}
function membershipChecks(context) {
  const { team, relationships } = context.fixtures; const membership = team.competitionMemberships[0]; const relation = relationships.participatesIn;
  assert(!keysDeep(team).has("PARTICIPATES_IN") && !keysDeep(team).has("MEMBER_OF"), "Membership created Relationship.");
  assert(!keysDeep(relation).has("competitionMemberships"), "Relationship created membership.");
  assert(membership.leagueRef === "league-entity-1" && membership.conferenceRef === "conference-entity-1" && membership.divisionRef === "division-entity-1", "Competition references changed.");
  assert(membership.status === "CURRENT" && relation.qualifiers.participationStatus === "UNKNOWN", "Membership status propagated.");
  assert(membership.validFrom === "2025-01-01" && relation.period.startedAt === null, "Membership dates propagated.");
  assert(!Object.hasOwn(team, "currentCompetition") && !Object.hasOwn(team, "graphEdges"), "Current competition or graph edges generated.");
}
function venueEducationProspectChecks(context) {
  const { team, organization, person, prospect, relationships } = context.fixtures;
  assert(!keysDeep(team).has("HOME_VENUE_IS") && !keysDeep(relationships.homeVenue).has("venues"), "Venue and HOME_VENUE_IS synchronized.");
  assert(!keysDeep(organization).has("LOCATED_AT") && !keysDeep(relationships.locatedAt).has("locations"), "Location and LOCATED_AT synchronized.");
  assert(team.venues[0].usageType === "HOME" && relationships.homeVenue.qualifiers.participationStatus === "CURRENT" && !Object.hasOwn(team.venues[0], "current"), "Venue current state inferred.");
  assert(!keysDeep(team).has("geocode") && !keysDeep(organization).has("coordinates"), "Geocoding generated.");
  assert(!keysDeep(person).has("ATTENDED") && !keysDeep(relationships.attended).has("education"), "Education and ATTENDED synchronized.");
  assert(!keysDeep(person).has("currentEmployer") && !keysDeep(person).has("tenure") && !keysDeep(person).has("roleProfile"), "Employment, tenure, or role inferred.");
  assert(!keysDeep(prospect).has("SELECTED_BY") && !keysDeep(relationships.selectedBy).has("selectionRecord"), "Selection reference and Relationship synchronized.");
  assert(prospect.cycle.status === "TRACKED" && prospect.eligibility.state === "ELIGIBLE" && !Object.hasOwn(prospect, "draftResult"), "Relationship altered Prospect state or generated result.");
}
function timelineVerificationConflictChecks(context) {
  const { entity, person, player, prospect, organization, team, relationships } = context.fixtures; const profiles = [entity, person, player, prospect, organization, team];
  assert(!profiles.some((value) => [...keysDeep(value)].some((key) => /generatedRelationship|inferredRelationship/.test(key))), "Timeline generated Relationship.");
  assert(!Object.values(relationships).some((value) => [...keysDeep(value)].some((key) => /Timeline$/.test(key))), "Relationship generated timeline.");
  assert(person.careerTimeline[0].eventType === "EMPLOYMENT" && relationships.attended.status === "CANDIDATE", "Timeline altered Relationship lifecycle.");
  assert(profiles.every((value) => value.verification.state === "UNVERIFIED") && Object.values(relationships).every((value) => value.verification.state === "UNVERIFIED"), "Verification propagated.");
  const disputed = fidApi.createFootballRelationship(relationshipInput("RELATED_TO", "a", "b", { verification: { state: "DISPUTED", confidence: "LOW", disputes: ["conflict-1"] }, references: { conflictingRelationshipRefs: ["relationship-other"] } }));
  assert(disputed.validation.valid && disputed.references.conflictingRelationshipRefs[0] === "relationship-other" && profiles.every((value) => value.verification.state === "UNVERIFIED"), "Conflict resolved or propagated.");
  assert(!Object.hasOwn(disputed, "winningRecord") && !Object.hasOwn(disputed, "conflictScore") && !Object.hasOwn(disputed, "combinedConfidence"), "Conflict winner or score calculated.");
}
function inverseGraphIntelligenceChecks(context) {
  const values = [...Object.values(context.fixtures.relationships), context.fixtures.player, context.fixtures.organization, context.fixtures.team, context.fixtures.person, context.fixtures.prospect];
  const prohibitedKeys = ["HAS_PLAYER", "EMPLOYS", "HAS_MEMBER", "OWNS", "COACHES", "SELECTED", "inverseMap", "inverseRelationship", "adjacency", "neighbors", "graphNodes", "graphEdges", "traversal", "paths", "shortestPath", "connectedComponents", "centrality", "influence", "transitiveClosure", "inferredRelationships", "score", "grade", "ranking", "probability", "strength", "relationshipWeight", "reliabilityScore", "fit", "teamInterest", "rosterLikelihood", "employmentLikelihood", "ownershipConclusion", "legalConclusion", "recommendation", "prediction", "decision"];
  values.forEach((value) => { const keys = keysDeep(value); prohibitedKeys.forEach((key) => assert(!keys.has(key), `Generated prohibited key: ${key}.`)); });
  const symmetric = fidApi.createFootballRelationship(relationshipInput("RELATED_TO", "a", "b", { direction: "SYMMETRIC" }));
  const reciprocal = fidApi.createFootballRelationship(relationshipInput("ASSOCIATED_WITH", "a", "b", { direction: "RECIPROCAL" }));
  assert(symmetric.source.ref === "a" && symmetric.target.ref === "b" && reciprocal.source.ref === "a" && reciprocal.target.ref === "b", "Symmetric or reciprocal direction generated reverse record.");
}
function exportDependencyChecks(context) {
  const named = Object.keys(namedApi).filter((name) => name !== "default"); const defaults = Object.keys(fidApi);
  assert(named.length >= 159 && defaults.length >= 159, "Current exports missing or additive exports prohibited.");
  assert(new Set(named).size === named.length && new Set(defaults).size === defaults.length, "Duplicate export identifier.");
  assert(named.every((name) => Object.hasOwn(fidApi, name) && namedApi[name] === fidApi[name]), "Named/default export disagreement.");
  assert(!defaults.some((name) => /^run.*Diagnostics$/.test(name)), "Diagnostic runner entered production exports.");
  const prohibited = /relationship(?:registry|resolver|service|manager|repository|persistence|hydration|hydrator|synchronization|synchronizer|runtime)|inverse[-_]?generator|graph[-_]?(?:infrastructure|traversal)|knowledge[-_]?graph/i;
  assert(context.productionImports.every((entry) => !prohibited.test(entry)), "Prohibited Relationship infrastructure imported.");
  assert(context.profileImports.every((entry) => !/(?:footballRelationshipConstants|FootballRelationshipContract)\.js$/i.test(entry)), "Profile contract imports canonical Relationship module.");
  assert(context.relationshipImports.length === 1 && /footballRelationshipConstants\.js$/i.test(context.relationshipImports[0]), "Relationship contract imports beyond approved constants.");
  assert(!hasCycle(context.dependencyGraph), "Production circular dependency found.");
  ["engines", "quarterback", "draftv3", "components", "pages", "router", "routes"].forEach((term) => assert(context.productionImports.every((entry) => !entry.toLowerCase().replaceAll("/", "").includes(term)), `Prohibited production dependency: ${term}.`));
}
function factoryChecks(context) {
  const specs = [
    [fidApi.createFootballEntity, fidApi.validateFootballEntity, fidApi.createUnavailableFootballEntity, context.inputs.entity],
    [fidApi.createPersonProfile, fidApi.validatePersonProfile, fidApi.createUnavailablePersonProfile, context.inputs.person],
    [fidApi.createPlayerProfile, fidApi.validatePlayerProfile, fidApi.createUnavailablePlayerProfile, context.inputs.player],
    [fidApi.createProspectProfile, fidApi.validateProspectProfile, fidApi.createUnavailableProspectProfile, context.inputs.prospect],
    [fidApi.createOrganizationProfile, fidApi.validateOrganizationProfile, fidApi.createUnavailableOrganizationProfile, context.inputs.organization],
    [fidApi.createTeamProfile, fidApi.validateTeamProfile, fidApi.createUnavailableTeamProfile, context.inputs.team],
    [fidApi.createFootballRelationship, fidApi.validateFootballRelationship, fidApi.createUnavailableFootballRelationship, context.inputs.relationship],
  ];
  specs.forEach(([factory, validator, unavailable, input]) => {
    [null, [], "value", 7].forEach((value) => { const result = factory(value); assert(result && result.validation && result.validation.valid === false, "Factory unsafe for invalid input."); assert(validator(value).valid === false, "Validator unsafe for invalid input."); });
    const snapshot = JSON.stringify(input); const first = factory(input); assert(JSON.stringify(input) === snapshot, "Factory mutated input."); validator(first); assert(JSON.stringify(input) === snapshot, "Validator mutated input."); assert(JSON.stringify(first) === JSON.stringify(factory(input)), "Normalization unstable.");
    const missing = unavailable(); const keys = keysDeep(missing); assert(!keys.has("generatedId") && !keys.has("generatedAt") && !keys.has("generatedVersion") && !keys.has("generatedRelationship"), "Unavailable factory invented state.");
  });
}
function suiteChecks(context) {
  const expected = { footballEntity: 120, personProfile: 148, playerProfile: 209, prospectProfile: 230, personPlayerProspectFoundation: 130, organizationProfile: 218, teamProfile: 270, organizationTeamFoundation: 156, footballRelationship: 300, researchRepository: 616 };
  Object.entries(expected).forEach(([name, total]) => assert(context.suiteSummaries[name].total === total && context.suiteSummaries[name].failed === 0, `${name} diagnostics failed.`));
}

const CASE_GROUPS = Object.freeze([
  [16, "contracts-validation-fixtures"], [30, "coexistence-independence"], [24, "player-assignment-boundary"],
  [22, "organization-affiliation-boundary"], [18, "team-membership-boundary"], [18, "venue-location-boundary"],
  [24, "education-career-prospect-boundary"], [26, "timeline-verification-conflict-boundary"],
  [24, "inverse-graph-intelligence-exclusion"], [20, "exports-dependencies-suite-integrity"], [18, "factory-validator-unavailable-integrity"],
]);
const CASE_NAMES = Object.freeze(CASE_GROUPS.flatMap(([count, group]) => Array.from({ length: count }, (_, index) => `${group}-${String(index + 1).padStart(3, "0")}`)));
async function checkForIndex(index, context) {
  if (index < 16) return contractChecks(context); if (index < 46) return coexistenceChecks(context);
  if (index < 70) return assignmentChecks(context); if (index < 92) return affiliationChecks(context);
  if (index < 110) return membershipChecks(context); if (index < 128) return venueEducationProspectChecks(context);
  if (index < 152) return venueEducationProspectChecks(context); if (index < 178) return timelineVerificationConflictChecks(context);
  if (index < 202) return inverseGraphIntelligenceChecks(context); if (index < 212) return exportDependencyChecks(context);
  if (index < 222) return suiteChecks(context); return factoryChecks(context);
}
async function buildContext() {
  const inputs = {
    entity: { entityId: "entity-test", entityType: "PERSON", status: "CANDIDATE", identity: { canonicalName: "Test" }, verification: { state: "UNVERIFIED", identityConfidence: "UNSPECIFIED" } },
    person: { profileId: "person-test", entityRef: "entity-test", status: "CANDIDATE", personState: "UNKNOWN", verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" } },
    player: { profileId: "player-test", entityRef: "entity-test", status: "CANDIDATE", participationState: "UNKNOWN", playingIdentity: { competitionLevel: "UNKNOWN" }, verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" } },
    prospect: { profileId: "prospect-test", entityRef: "entity-test", playerProfileRef: "player-test", status: "CANDIDATE", cycle: { cycleType: "UNKNOWN", status: "UNKNOWN" }, eligibility: { state: "UNKNOWN", basisType: "UNKNOWN" }, declaration: { state: "UNKNOWN" }, entry: { pathwayType: "UNKNOWN" }, verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" } },
    organization: { profileId: "organization-test", entityRef: "organization-test", status: "CANDIDATE", organizationType: "UNKNOWN", operatingState: "UNKNOWN", verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" } },
    team: { profileId: "team-test", entityRef: "team-test", status: "CANDIDATE", teamType: "UNKNOWN", competitionLevel: "UNKNOWN", competitiveState: "UNKNOWN", verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" } },
    relationship: relationshipInput("RELATED_TO", "source-test", "target-test"),
  };
  const sources = Object.fromEntries(PRODUCTION_FILES.map((file) => [file, readFileSync(file, "utf8")]));
  const footballEntity = runFootballEntityContractDiagnostics(); const personProfile = await runPersonProfileContractDiagnostics();
  const playerProfile = await runPlayerProfileContractDiagnostics(); const prospectProfile = await runProspectProfileContractDiagnostics();
  const personPlayerProspectFoundation = await runFidPersonPlayerProspectFoundationDiagnostics();
  const organizationProfile = await runOrganizationProfileContractDiagnostics(); const teamProfile = await runTeamProfileContractDiagnostics();
  const organizationTeamFoundation = await runFidOrganizationTeamFoundationDiagnostics();
  const footballRelationship = await runFootballRelationshipContractDiagnostics();
  const researchRepository = personPlayerProspectFoundation.suiteSummaries.researchRepository;
  return { fixtures: createFixtures(), inputs, productionImports: Object.values(sources).flatMap(imports), dependencyGraph: graph(sources), profileImports: PROFILE_CONTRACT_FILES.flatMap((file) => imports(readFileSync(resolve(ROOT, "contracts", file), "utf8"))), relationshipImports: imports(readFileSync(resolve(ROOT, "contracts/FootballRelationshipContract.js"), "utf8")), suiteSummaries: { footballEntity, personProfile, playerProfile, prospectProfile, personPlayerProspectFoundation, organizationProfile, teamProfile, organizationTeamFoundation, footballRelationship, researchRepository } };
}

export async function runFidRelationshipProfileBoundaryDiagnostics({ throwOnFailure = false } = {}) {
  const context = await buildContext(); const cases = [];
  for (let index = 0; index < CASE_NAMES.length; index += 1) { const id = CASE_NAMES[index]; try { await checkForIndex(index, context); cases.push({ id, passed: true, message: `${id} passed.`, details: null }); } catch (failure) { cases.push({ id, passed: false, message: typeof failure?.message === "string" ? failure.message : `${id} failed.`, details: failure?.details ?? null }); } }
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const contractVersions = { footballEntity: fidApi.FOOTBALL_ENTITY_CONTRACT_VERSION, personProfile: fidApi.PERSON_PROFILE_CONTRACT_VERSION, playerProfile: fidApi.PLAYER_PROFILE_CONTRACT_VERSION, prospectProfile: fidApi.PROSPECT_PROFILE_CONTRACT_VERSION, organizationProfile: fidApi.ORGANIZATION_PROFILE_CONTRACT_VERSION, teamProfile: fidApi.TEAM_PROFILE_CONTRACT_VERSION, footballRelationship: fidApi.FOOTBALL_RELATIONSHIP_CONTRACT_VERSION };
  const schemaVersions = { footballEntity: fidApi.FOOTBALL_ENTITY_SCHEMA_VERSION, personProfile: fidApi.PERSON_PROFILE_SCHEMA_VERSION, playerProfile: fidApi.PLAYER_PROFILE_SCHEMA_VERSION, prospectProfile: fidApi.PROSPECT_PROFILE_SCHEMA_VERSION, organizationProfile: fidApi.ORGANIZATION_PROFILE_SCHEMA_VERSION, teamProfile: fidApi.TEAM_PROFILE_SCHEMA_VERSION, footballRelationship: fidApi.FOOTBALL_RELATIONSHIP_SCHEMA_VERSION };
  const summary = { suite: SUITE, contractVersions, schemaVersions, total: cases.length, passed, failed, cases, suiteSummaries: context.suiteSummaries };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runFidRelationshipProfileBoundaryDiagnostics });
