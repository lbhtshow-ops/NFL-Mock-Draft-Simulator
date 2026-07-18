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
import coachProfileConstants from "../constants/coachProfileConstants.js";
import coachProfileContract from "../contracts/CoachProfileContract.js";
import executiveProfileConstants from "../constants/executiveProfileConstants.js";
import executiveProfileContract from "../contracts/ExecutiveProfileContract.js";
import { runExecutiveProfileContractDiagnostics } from "./runExecutiveProfileContractDiagnostics.js";

const SUITE = "FidExecutiveProfileFoundationDiagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTION_FILES = [
  "constants/footballEntityConstants.js", "contracts/FootballEntityContract.js",
  "constants/personProfileConstants.js", "contracts/PersonProfileContract.js",
  "constants/playerProfileConstants.js", "contracts/PlayerProfileContract.js",
  "constants/prospectProfileConstants.js", "contracts/ProspectProfileContract.js",
  "constants/organizationProfileConstants.js", "contracts/OrganizationProfileContract.js",
  "constants/teamProfileConstants.js", "contracts/TeamProfileContract.js",
  "constants/footballRelationshipConstants.js", "contracts/FootballRelationshipContract.js",
  "constants/coachProfileConstants.js", "contracts/CoachProfileContract.js",
  "constants/executiveProfileConstants.js", "contracts/ExecutiveProfileContract.js", "index.js",
].map((file) => resolve(ROOT, file));
const PROTECTED_API = Object.freeze({
  ...footballEntityConstants, ...footballEntityContract,
  ...personProfileConstants, ...personProfileContract,
  ...playerProfileConstants, ...playerProfileContract,
  ...prospectProfileConstants, ...prospectProfileContract,
  ...organizationProfileConstants, ...organizationProfileContract,
  ...teamProfileConstants, ...teamProfileContract,
  ...footballRelationshipConstants, ...footballRelationshipContract,
  ...coachProfileConstants, ...coachProfileContract,
  ...executiveProfileConstants, ...executiveProfileContract,
});

function assert(condition, message, details = null) { if (!condition) { const failure = new Error(message); failure.details = details; throw failure; } }
function keysDeep(value, keys = new Set()) { if (Array.isArray(value)) value.forEach((entry) => keysDeep(entry, keys)); else if (value && typeof value === "object") Object.entries(value).forEach(([key, entry]) => { keys.add(key); keysDeep(entry, keys); }); return keys; }
function imports(source) { return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]); }
function graph(sources) { const files = new Set(PRODUCTION_FILES); return Object.fromEntries(PRODUCTION_FILES.map((file) => [file, imports(sources[file]).filter((entry) => entry.startsWith(".")).map((entry) => resolve(dirname(file), entry)).filter((entry) => files.has(entry))])); }
function hasCycle(value) { const visiting = new Set(); const visited = new Set(); function visit(node) { if (visiting.has(node)) return true; if (visited.has(node)) return false; visiting.add(node); if ((value[node] || []).some(visit)) return true; visiting.delete(node); visited.add(node); return false; } return Object.keys(value).some(visit); }
function period() { return { startedAt: "2024-01-01", endedAt: null }; }
function recordVerification() { return { state: "UNVERIFIED", confidence: "UNSPECIFIED" }; }
function entityInput(overrides = {}) { return { entityId: "entity-executive-1", entityType: "PERSON", status: "CANDIDATE", identity: { canonicalName: "Canonical Person Name" }, verification: { state: "UNVERIFIED", identityConfidence: "UNSPECIFIED" }, ...overrides }; }
function personInput(overrides = {}) { return { profileId: "person-profile-1", entityRef: "entity-executive-1", status: "CANDIDATE", personState: "LIVING", biography: { dateOfBirth: "1975-01-01", placeOfBirthLabel: "Declared birthplace", publicBiography: "Canonical person-local biography." }, nameUsage: [{ name: "Canonical Person Name", usageCategory: "LEGAL_CONTEXT", sourceRef: "source-person-1" }], citizenship: [{ countryCode: "US", label: "United States", sourceRef: "source-person-1" }], education: [{ educationType: "UNIVERSITY", organizationRef: "education-organization-1", organizationLabel: "Declared University" }], verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" }, ...overrides }; }
function coachInput(overrides = {}) { return { coachId: "coach-profile-1", personRef: "person-profile-1", identity: { displayLabel: "Coach Display", knownCoachingName: "Coach Professional Name" }, coachingStatus: "UNKNOWN", coachingRoles: [{ roleId: "coach-role-1", roleType: "HEAD_COACH", declaredTitle: "Head Coach", status: "REPORTED", teamRef: "team-profile-1", period: period(), sourceRefs: ["source-coach-1"], verification: recordVerification() }], verification: recordVerification(), lifecycle: { status: "CANDIDATE" }, ...overrides }; }
function executiveRole(overrides = {}) { return { roleId: "executive-role-1", roleType: "GENERAL_MANAGER", declaredTitle: "General Manager", department: "GENERAL_MANAGEMENT", status: "REPORTED", organizationRef: "organization-profile-1", teamRef: "team-profile-1", period: period(), sourceRefs: ["source-executive-1"], evidenceRefs: ["evidence-executive-1"], verification: recordVerification(), ...overrides }; }
function executiveAssignment(overrides = {}) { return { assignmentId: "executive-assignment-1", roleType: "GENERAL_MANAGER", declaredTitle: "Declared Executive Assignment", department: "GENERAL_MANAGEMENT", status: "REPORTED", organizationRef: "organization-profile-1", teamRef: "team-profile-1", period: period(), sourceRefs: ["source-executive-1"], evidenceRefs: ["evidence-executive-1"], ...overrides }; }
function responsibility(overrides = {}) { return { responsibilityId: "responsibility-1", responsibilityType: "ROSTER_CONSTRUCTION", declaredLabel: "Reported roster responsibility", scope: "Declared scope", qualifiers: ["reported"], uncertainty: "Source-limited", status: "REPORTED", organizationRef: "organization-profile-1", teamRef: "team-profile-1", period: period(), sourceRefs: ["source-executive-1"], evidenceRefs: ["evidence-executive-1"], verification: recordVerification(), ...overrides }; }
function authority(overrides = {}) { return { authorityId: "authority-1", authorityType: "DRAFT_INPUT", declaredLabel: "Reported draft input", scope: "Declared scope", qualifiers: ["reported"], uncertainty: "Source-limited", involvementRefs: ["draft-1"], organizationRef: "organization-profile-1", teamRef: "team-profile-1", period: period(), sourceRefs: ["source-executive-1"], evidenceRefs: ["evidence-executive-1"], verification: recordVerification(), ...overrides }; }
function involvement(overrides = {}) { return { involvementId: "involvement-1", involvementType: "DRAFT", recordRef: "draft-1", declaredRole: "Reported participant", qualifiers: ["reported"], organizationRef: "organization-profile-1", teamRef: "team-profile-1", period: period(), sourceRefs: ["source-executive-1"], evidenceRefs: ["evidence-executive-1"], verification: recordVerification(), ...overrides }; }
function executiveEvent(overrides = {}) { return { eventId: "executive-event-1", eventType: "APPOINTED", title: "Declared appointment", occurredAt: "2024-01-01", organizationRef: "organization-profile-1", teamRef: "team-profile-1", assignmentRefs: ["executive-assignment-1"], authorityRefs: ["authority-1"], sourceRefs: ["source-executive-1"], evidenceRefs: ["evidence-executive-1"], verification: recordVerification(), ...overrides }; }
function executiveInput(overrides = {}) { return { executiveId: "executive-profile-1", personRef: "person-profile-1", identity: { displayLabel: "Conflicting Executive Display", knownProfessionalName: "Executive Professional Name", profileLabels: ["executive research"], executiveSpecificAliases: ["Executive Alias"], externalExecutiveIdentifiers: [{ identifierId: "executive-provider-1", namespace: "provider", value: "provider-executive-1", sourceRefs: ["source-executive-1"] }] }, executiveStatus: "UNKNOWN", executiveRoles: [executiveRole()], executiveAssignments: [executiveAssignment()], responsibilityHistory: [responsibility()], authorityDeclarations: [authority(), authority({ authorityId: "authority-2", authorityType: "FINAL_DRAFT_AUTHORITY", uncertainty: "Conflicting source" })], decisionInvolvement: [involvement(), involvement({ involvementId: "involvement-2", involvementType: "TRANSACTION", recordRef: "transaction-1" })], draftInvolvementRefs: ["draft-1"], transactionInvolvementRefs: ["transaction-1"], rosterDecisionRefs: ["roster-1"], contractDecisionRefs: ["contract-1"], hiringDecisionRefs: ["hiring-1"], firingDecisionRefs: ["dismissal-1"], promotionDecisionRefs: ["promotion-1"], ownershipInterestRefs: ["ownership-interest-1"], committeeMembershipRefs: ["committee-membership-1"], appointmentRefs: ["appointment-1"], educationRefs: ["education-1"], eventHistory: [executiveEvent()], executiveTimeline: [executiveEvent({ eventId: "executive-timeline-1", eventType: "MILESTONE" })], relationshipRefs: ["relationship-employed-by", "relationship-works-for"], sourceRefs: ["source-executive-1"], evidenceRefs: ["evidence-executive-1"], verification: recordVerification(), lifecycle: { status: "CANDIDATE" }, provenance: { createdBy: "researcher", createdAt: "2024-01-01" }, versioning: { profileVersion: 1 }, ...overrides }; }
function organizationInput(overrides = {}) { return { profileId: "organization-profile-1", entityRef: "organization-entity-1", status: "CANDIDATE", organizationType: "PROFESSIONAL_FRANCHISE", operatingState: "OPERATING", affiliations: [{ affiliationId: "organization-affiliation-1", affiliationType: "MEMBER", organizationRef: "league-organization-1", status: "REPORTED", sourceRefs: ["source-organization-1"], notes: "Declared leadership-adjacent organization fact." }], verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" }, ...overrides }; }
function teamInput(overrides = {}) { return { profileId: "team-profile-1", entityRef: "team-entity-1", organizationProfileRef: "organization-profile-1", organizationEntityRef: "organization-entity-1", status: "CANDIDATE", teamType: "PROFESSIONAL", competitionLevel: "PROFESSIONAL", competitiveState: "UNKNOWN", competitionMemberships: [{ membershipId: "team-membership-1", leagueRef: "league-1", organizationRef: "organization-profile-1", status: "REPORTED", sourceRefs: ["source-team-1"] }], verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" }, ...overrides }; }
function relationshipInput(relationshipId, relationshipType, category, sourceRef, targetRef, overrides = {}) { return { relationshipId, status: "CANDIDATE", category, relationshipType, direction: "DIRECTED", source: { ref: sourceRef, refType: "PERSON_PROFILE" }, target: { ref: targetRef, refType: "ORGANIZATION_PROFILE" }, qualifiers: { participationStatus: "REPORTED" }, verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" }, ...overrides }; }
function createFixtures() {
  const relationships = [
    relationshipInput("relationship-employed-by", "EMPLOYED_BY", "EMPLOYMENT", "person-profile-1", "organization-profile-1"),
    relationshipInput("relationship-works-for", "WORKS_FOR", "EMPLOYMENT", "person-profile-1", "team-profile-1", { target: { ref: "team-profile-1", refType: "TEAM_PROFILE" } }),
    relationshipInput("relationship-member-of", "MEMBER_OF", "MEMBERSHIP", "person-profile-1", "organization-profile-1"),
    relationshipInput("relationship-owned-by", "OWNED_BY", "OWNERSHIP", "organization-profile-1", "person-profile-1", { source: { ref: "organization-profile-1", refType: "ORGANIZATION_PROFILE" }, target: { ref: "person-profile-1", refType: "PERSON_PROFILE" } }),
    relationshipInput("relationship-reports-to", "RELATED_TO", "HIERARCHY", "person-profile-1", "person-profile-2", { target: { ref: "person-profile-2", refType: "PERSON_PROFILE" }, metadata: { notes: "Reported reporting relationship; no dedicated REPORTS_TO vocabulary." } }),
    relationshipInput("relationship-appointed-by", "RELATED_TO", "GOVERNANCE", "person-profile-1", "person-profile-2", { target: { ref: "person-profile-2", refType: "PERSON_PROFILE" }, metadata: { notes: "Reported appointment relationship; no dedicated APPOINTED_BY vocabulary." } }),
    relationshipInput("relationship-serves-on", "HOLDS_ROLE_WITH", "GOVERNANCE", "person-profile-1", "organization-profile-1", { metadata: { notes: "Reported committee service using supported role vocabulary." } }),
  ].map((value) => fidApi.createFootballRelationship(value));
  return { entity: fidApi.createFootballEntity(entityInput()), person: fidApi.createPersonProfile(personInput()), coach: fidApi.createCoachProfile(coachInput()), executive: fidApi.createExecutiveProfile(executiveInput()), organization: fidApi.createOrganizationProfile(organizationInput()), team: fidApi.createTeamProfile(teamInput()), relationships };
}

function fixtureIdentityChecks() {
  const fixtures = createFixtures(); const values = [fixtures.entity, fixtures.person, fixtures.coach, fixtures.executive, fixtures.organization, fixtures.team, ...fixtures.relationships];
  assert(values.every((value) => value.validation.valid), "A cross-contract fixture is invalid.");
  assert(new Set(values.map((value) => `${value.contract}:${value.contractVersion}`)).size === 7, "Relevant contract identities are not independent.");
  assert(values.every((value) => typeof value.contractVersion === "string" && typeof value.schemaVersion === "string"), "Contract or schema version missing.");
  assert(fixtures.executive.personRef === fixtures.person.profileId && fixtures.coach.personRef === fixtures.person.profileId, "Specialization references not preserved.");
  assert(fixtures.organization.affiliations.length === 1 && fixtures.team.competitionMemberships.length === 1, "Organization or Team factual fixture missing.");
}
function personExecutiveChecks() {
  const { person, executive } = createFixtures(); const executiveOnly = fidApi.createExecutiveProfile(executiveInput({ personRef: "unloaded-person-profile" })); const personOnly = fidApi.createPersonProfile(personInput());
  assert(executiveOnly.validation.valid && personOnly.validation.valid, "A specialization required its counterpart to load.");
  assert(executive.personRef === "person-profile-1" && typeof executive.personRef === "string", "personRef was resolved or changed.");
  assert(!keysDeep(executive).has("personProfile") && !keysDeep(person).has("executiveProfile"), "Person and Executive embedded one another.");
  const prohibited = ["hydratedPerson", "hydratedExecutive", "synchronizedPerson", "synchronizedExecutive", "createdPersonProfile", "createdExecutiveProfile", "identityMerge", "duplicatePersonResolution", "authoritativeName"];
  prohibited.forEach((key) => assert(!keysDeep({ person, executive }).has(key), `Person/Executive coexistence produced ${key}.`));
  assert(person.verification.state === "UNVERIFIED" && executive.verification.state === "UNVERIFIED" && person.lifecycle === undefined && executive.lifecycle.status === "CANDIDATE", "Verification or lifecycle propagated.");
}
function identityOwnershipChecks() {
  const { entity, person, executive } = createFixtures(); const keys = keysDeep(executive);
  assert(entity.identity.canonicalName === "Canonical Person Name" && person.nameUsage[0].name === "Canonical Person Name", "Canonical identity fixture lost.");
  assert(executive.identity.displayLabel === "Conflicting Executive Display" && executive.identity.knownProfessionalName === "Executive Professional Name", "Executive-local labels lost.");
  ["legalName", "canonicalName", "canonicalFullName", "dateOfBirth", "dateOfDeath", "nationality", "citizenship", "publicBiography", "canonicalAliases", "canonicalIdentifiers", "education"].forEach((key) => assert(!keys.has(key), `Executive duplicated Person-owned field: ${key}.`));
  assert(person.biography.dateOfBirth === "1975-01-01" && person.citizenship[0].countryCode === "US" && person.education.length === 1, "Person-owned identity facts lost.");
  assert(executive.identity.externalExecutiveIdentifiers[0].value === "provider-executive-1" && !person.references.externalIdentifierRefs?.includes("provider-executive-1"), "Provider identifier became canonical Person identity.");
}
function coachExecutiveChecks() {
  const { coach, executive } = createFixtures(); const combined = { coach, executive }; const keys = keysDeep(combined);
  assert(coach.validation.valid && executive.validation.valid && coach.personRef === executive.personRef, "Coach and Executive cannot coexist.");
  ["combinedProfile", "primaryProfessionalIdentity", "coachToExecutivePromotion", "executiveToCoachDemotion", "careerTransition", "combinedAssignments", "combinedTimeline", "combinedVerification", "combinedLifecycle", "combinedProvenance", "combinedConfidence", "unifiedCurrentRole", "unifiedOrganization", "leadershipScore", "suitability", "careerProgression"].forEach((key) => assert(!keys.has(key), `Coach/Executive coexistence produced ${key}.`));
  assert(coach.coachingRoles[0].roleType === "HEAD_COACH" && executive.executiveRoles[0].roleType === "GENERAL_MANAGER" && executive.authorityDeclarations.length === 2, "Specialization roles or authority were merged.");
}
function organizationTeamChecks() {
  const { executive, organization, team } = createFixtures(); const keys = keysDeep({ executive, organization, team });
  assert(executive.executiveAssignments[0].organizationRef === organization.profileId && executive.executiveAssignments[0].teamRef === team.profileId, "Unresolved organization or team references changed.");
  assert(organization.affiliations.length === 1 && team.competitionMemberships.length === 1 && executive.ownershipInterestRefs.length === 1 && executive.committeeMembershipRefs.length === 1, "Boundary fixtures missing.");
  ["createdOrganizationProfile", "createdTeamProfile", "executiveStaffMembership", "currentEmployer", "currentTeam", "staffHierarchy", "reportingStructure", "legalOwnership", "controllingInterest", "beneficialOwnership", "ownershipPercentage", "fiduciaryAuthority", "votingPower", "legalConclusion", "tenure", "employmentContract", "authoritativeOrganizationRecord"].forEach((key) => assert(!keys.has(key), `Organization/Team coexistence inferred ${key}.`));
  assert(fidApi.createExecutiveProfile(executiveInput({ executiveAssignments: [] })).validation.valid && fidApi.createOrganizationProfile(organizationInput()).validation.valid && fidApi.createTeamProfile(teamInput()).validation.valid, "Independent Organization, Team, or Executive fixture invalid.");
}
function roleAuthorityChecks() {
  const { coach, executive } = createFixtures(); const keys = keysDeep({ coach, executive });
  assert(executive.executiveRoles.length === 1 && executive.executiveAssignments.length === 1 && executive.responsibilityHistory.length === 1 && executive.authorityDeclarations.length === 2 && executive.decisionInvolvement.length === 2, "Factual categories were merged.");
  assert(executive.authorityDeclarations[0].uncertainty === "Source-limited" && executive.authorityDeclarations[1].uncertainty === "Conflicting source", "Authority uncertainty or conflict lost.");
  ["inferredResponsibility", "inferredAuthority", "actualDecisionCausation", "legalAuthority", "winningAuthority", "responsibilityPercentage", "accountabilityPercentage", "influenceScore", "dailyControl", "transactionApproval", "contractApproval", "playCallingAuthority"].forEach((key) => assert(!keys.has(key), `Role/responsibility/authority audit produced ${key}.`));
  assert(coach.coachingRoles[0].roleType === "HEAD_COACH" && !keysDeep(coach).has("executiveAuthority"), "Head Coach role inferred Executive authority.");
}
function decisionRelationshipChecks() {
  const { executive, relationships } = createFixtures(); const keys = keysDeep({ executive, relationships });
  assert(executive.draftInvolvementRefs[0] === "draft-1" && executive.transactionInvolvementRefs[0] === "transaction-1" && executive.decisionInvolvement.every((entry) => typeof entry.recordRef === "string"), "Decision references were resolved.");
  assert(relationships.length === 7 && relationships.every((value) => value.validation.valid), "Relationship coexistence fixture invalid.");
  ["decisionObject", "transactionRecord", "draftRecord", "rosterRecord", "contractRecord", "staffRecord", "finalAuthority", "credit", "blame", "success", "failure", "hitRate", "decisionValue", "expectedValue", "surplusValue", "decisionQuality", "recommendation", "prediction", "inverseRelationship", "relationshipVocabularyMap"].forEach((key) => assert(!keys.has(key), `Decision or Relationship coexistence produced ${key}.`));
  assert(executive.relationshipRefs.every((ref) => typeof ref === "string") && !keysDeep(executive).has("footballRelationship"), "Executive embedded a Relationship.");
}
function eventVerificationLifecycleChecks() {
  const { entity, person, coach, executive, organization, team, relationships } = createFixtures(); const all = { entity, person, coach, executive, organization, team, relationships }; const keys = keysDeep(all);
  assert(executive.eventHistory.length === 1 && executive.executiveAssignments.length === 1 && executive.executiveStatus === "UNKNOWN" && executive.lifecycle.status === "CANDIDATE", "Event altered Executive state.");
  ["closedAssignment", "createdRelationship", "updatedPersonTimeline", "updatedCoachTimeline", "updatedOrganizationTimeline", "updatedTeamTimeline", "combinedTimeline", "currentRole", "currentEmployer", "eventCause", "fault", "careerTransition", "combinedVerification", "combinedConfidence", "evidencePromotion", "winningVersion", "currentProfile"].forEach((key) => assert(!keys.has(key), `Event, verification, or lifecycle audit produced ${key}.`));
  assert([entity.verification.state, person.verification.state, coach.verification.state, executive.verification.state, organization.verification.state, team.verification.state, relationships[0].verification.state].every((state) => state === "UNVERIFIED"), "Verification state propagated or changed.");
}
function graphIntelligenceExtensionChecks() {
  const fixtures = createFixtures(); const keys = keysDeep(fixtures);
  ["graphNode", "graphEdge", "adjacency", "neighbors", "traversal", "pathResult", "pathResults", "shortestPath", "connectedComponents", "transitiveClosure", "ownershipGraph", "hierarchyGraph", "reportingTree", "decisionChain", "influenceNetwork", "executiveTree", "employmentInference", "ownershipInference", "authorityInference", "mentorshipInference", "successionPath"].forEach((key) => assert(!keys.has(key), `Graph behavior produced ${key}.`));
  ["score", "grade", "rating", "ranking", "probability", "executiveQualityScore", "leadershipScore", "decisionQualityScore", "influenceScore", "responsibilityScore", "authorityScore", "draftGrade", "tradeGrade", "rosterGrade", "hiringGrade", "performanceScore", "successScore", "expectedValue", "surplusValue", "decisionValue", "fit", "jobSecurity", "recommendation", "prediction", "decision"].forEach((key) => assert(!keys.has(key), `Intelligence field produced: ${key}.`));
  const prohibited = ["score", "grade", "rating", "ranking", "evaluation", "recommendation", "prediction", "probability", "decisionQuality", "performanceScore", "influenceScore", "expectedValue", "surplusValue", "jobSecurity", "fit"];
  prohibited.forEach((key) => { const result = fidApi.createExecutiveProfile(executiveInput({ extensions: { namespace: { [key]: 90, factualLabel: "Allowed" } } })); assert(!result.validation.valid && !keysDeep(result.extensions).has(key), `Executive extensions retained ${key}.`); });
  assert(fidApi.createExecutiveProfile(executiveInput({ extensions: { research: { factualLabel: "Allowed", reported: true } } })).validation.valid, "Safe factual extension rejected.");
}
function factoryValidatorChecks() {
  const specs = [
    [fidApi.createFootballEntity, fidApi.validateFootballEntity, fidApi.createUnavailableFootballEntity, entityInput(), "entityId"],
    [fidApi.createPersonProfile, fidApi.validatePersonProfile, fidApi.createUnavailablePersonProfile, personInput(), "profileId"],
    [fidApi.createCoachProfile, fidApi.validateCoachProfile, fidApi.createUnavailableCoachProfile, coachInput(), "coachId"],
    [fidApi.createExecutiveProfile, fidApi.validateExecutiveProfile, fidApi.createUnavailableExecutiveProfile, executiveInput(), "executiveId"],
    [fidApi.createOrganizationProfile, fidApi.validateOrganizationProfile, fidApi.createUnavailableOrganizationProfile, organizationInput(), "profileId"],
    [fidApi.createTeamProfile, fidApi.validateTeamProfile, fidApi.createUnavailableTeamProfile, teamInput(), "profileId"],
    [fidApi.createFootballRelationship, fidApi.validateFootballRelationship, fidApi.createUnavailableFootballRelationship, relationshipInput("relationship-1", "ASSOCIATED_WITH", "AFFILIATION", "person-profile-1", "organization-profile-1"), "relationshipId"],
  ];
  specs.forEach(([create, validate, unavailable, input, idField]) => {
    [null, [], "invalid", 7].forEach((value) => { assert(create(value).validation.valid === false && validate(value).valid === false, "Factory or validator rejected ordinary invalid input by throwing."); });
    const snapshot = JSON.stringify(input); const first = create(input); assert(JSON.stringify(input) === snapshot, "Factory mutated input."); validate(first); assert(JSON.stringify(input) === snapshot && JSON.stringify(first) === JSON.stringify(create(input)), "Validator mutated input or normalization is unstable.");
    assert(first.validation && Array.isArray(first.validation.errors) && Array.isArray(first.validation.warnings) && typeof first.validation.valid === "boolean", "Validation result shape inconsistent.");
    const empty = unavailable(); assert(empty[idField] === null && empty.validation.valid === false, "Unavailable factory invented identity or validity.");
    ["score", "grade", "assignment", "authority", "ownership", "relationshipGraph"].forEach((key) => assert(!keysDeep(empty).has(key), `Unavailable factory invented ${key}.`));
  });
}
async function exportDependencyIntegrationChecks(context) {
  const named = Object.keys(namedApi).filter((name) => name !== "default"); const defaults = Object.keys(fidApi); const protectedNames = Object.keys(PROTECTED_API);
  assert(protectedNames.length === 205 && named.length >= protectedNames.length && defaults.length >= protectedNames.length, "Protected FID API baseline missing.");
  assert(protectedNames.every((name) => Object.hasOwn(namedApi, name) && Object.hasOwn(fidApi, name) && namedApi[name] === PROTECTED_API[name] && fidApi[name] === PROTECTED_API[name]), "Protected export missing or replaced.");
  assert(new Set(named).size === named.length && new Set(defaults).size === defaults.length && named.length === defaults.length, "FID export collision detected.");
  assert(named.every((name) => Object.hasOwn(fidApi, name) && namedApi[name] === fidApi[name]) && defaults.every((name) => Object.hasOwn(namedApi, name)), "Named/default exports disagree.");
  assert(!defaults.some((name) => /^run.*Diagnostics$/.test(name)), "Diagnostic runner exported.");
  assert(context.executiveImports.length === 1 && /executiveProfileConstants\.js$/i.test(context.executiveImports[0]), "Executive Profile has prohibited runtime dependency.");
  assert(context.specializationImports.every((entry) => !/ExecutiveProfileContract|executiveProfileConstants/.test(entry)), "Approved specialization imports Executive Profile.");
  assert(!hasCycle(context.dependencyGraph), "Production circular dependency found.");
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
  const prohibitedContractDependency = /FidPersistenceArchitectureSpecification|FidPersistenceRepositoryContract|InMemoryFidPersistenceRepository|persistence[/\\](?:index|repository|adapter|service|manager|client)|repository|adapter|supabase|\bsql\b|migrations?|filesystem\s+storage|browser\s+storage|localStorage|IndexedDB|network\s+persistence|hydration|synchronization|registry|resolver|identity\s+resolution|profile\s+resolution|relationship\s+resolution|runtime\s+(?:persistence|database)\s+integration/i;
  const prohibitedRuntime = /(?:Supabase|Database|Sql|Network|FileSystem|BrowserStorage|LocalStorage|IndexedDb)FidPersistenceRepository|EntityRepository|PersonRepository|CoachRepository|ExecutiveRepository|OrganizationRepository|TeamRepository|RelationshipRepository|PersistenceService|PersistenceManager|PersistenceAdapter|SupabaseAdapter|DatabaseAdapter|StorageClient|DatabaseClient|createClient|sql\s+runtime|migration\s+runtime|application\s+persistence\s+singleton|runtime\s+hydration|runtime\s+synchronization|identity\s+resolution|profile\s+resolution|relationship\s+resolution|runtime\s+database\s+integration/i;
  const prohibited = /registry|resolver|service|manager|hydration|synchronization|knowledge[-_]?graph|graph[-_]?traversal|supabase|engines?|quarterback|draftv3|components?|pages?|router|routes?|apiClient/i;
  assert(persistenceImports.every((entry) => approvedArchitectureImports.has(entry)) && context.contractSources.every((source) => !prohibitedContractDependency.test(source)) && !prohibitedRuntime.test(context.productionSource) && context.productionImports.every((entry) => !prohibited.test(entry)), "Prohibited production dependency found.");
  const expected = { footballEntity: 120, personProfile: 148, playerProfile: 209, prospectProfile: 230, personPlayerProspectFoundation: 130, coachProfile: 280, personCoachFoundation: 254, executiveProfile: 391, organizationProfile: 218, teamProfile: 270, organizationTeamFoundation: 156, footballRelationship: 300, relationshipProfileBoundary: 240, researchRepository: 616 };
  Object.entries(expected).forEach(([name, total]) => assert(context.suiteSummaries[name].total === total && context.suiteSummaries[name].failed === 0, `${name} diagnostics failed.`));
}

const CASE_GROUPS = Object.freeze([[35, "fixtures-contract-identity"], [35, "person-executive-coexistence"], [30, "identity-ownership"], [30, "coach-executive-coexistence"], [32, "organization-team-boundary"], [35, "role-responsibility-authority"], [35, "decision-relationship-boundary"], [35, "event-verification-lifecycle"], [35, "graph-intelligence-extension-exclusion"], [25, "factory-validator"], [25, "exports-dependencies-integration"]]);
const CASE_NAMES = Object.freeze(CASE_GROUPS.flatMap(([count, group]) => Array.from({ length: count }, (_, index) => `${group}-${String(index + 1).padStart(3, "0")}`)));
async function checkForIndex(index, context) { if (index < 35) return fixtureIdentityChecks(); if (index < 70) return personExecutiveChecks(); if (index < 100) return identityOwnershipChecks(); if (index < 130) return coachExecutiveChecks(); if (index < 162) return organizationTeamChecks(); if (index < 197) return roleAuthorityChecks(); if (index < 232) return decisionRelationshipChecks(); if (index < 267) return eventVerificationLifecycleChecks(); if (index < 302) return graphIntelligenceExtensionChecks(); if (index < 327) return factoryValidatorChecks(); return exportDependencyIntegrationChecks(context); }
async function buildContext() {
  const sources = Object.fromEntries(PRODUCTION_FILES.map((file) => [file, readFileSync(file, "utf8")]));
  const executiveProfile = await runExecutiveProfileContractDiagnostics(); const existing = executiveProfile.suiteSummaries;
  const executiveSource = sources[resolve(ROOT, "contracts/ExecutiveProfileContract.js")];
  const specializationFiles = ["contracts/PlayerProfileContract.js", "contracts/ProspectProfileContract.js", "contracts/CoachProfileContract.js"].map((file) => sources[resolve(ROOT, file)]);
  const contractSources = ["FootballEntityContract.js", "PersonProfileContract.js", "CoachProfileContract.js", "ExecutiveProfileContract.js", "OrganizationProfileContract.js", "TeamProfileContract.js", "FootballRelationshipContract.js"].map((file) => sources[resolve(ROOT, "contracts", file)]);
  return { executiveImports: imports(executiveSource), specializationImports: specializationFiles.flatMap(imports), productionImports: Object.values(sources).flatMap(imports), productionSource: Object.values(sources).join("\n"), contractSources, dependencyGraph: graph(sources), suiteSummaries: { ...existing, executiveProfile } };
}

export async function runFidExecutiveProfileFoundationDiagnostics({ throwOnFailure = false } = {}) {
  const context = await buildContext(); const cases = [];
  for (let index = 0; index < CASE_NAMES.length; index += 1) { const id = CASE_NAMES[index]; try { await checkForIndex(index, context); cases.push({ id, passed: true, message: `${id} passed.`, details: null }); } catch (failure) { cases.push({ id, passed: false, message: typeof failure?.message === "string" ? failure.message : `${id} failed.`, details: failure?.details ?? null }); } }
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const contractVersions = Object.freeze({ footballEntity: fidApi.FOOTBALL_ENTITY_CONTRACT_VERSION, personProfile: fidApi.PERSON_PROFILE_CONTRACT_VERSION, coachProfile: fidApi.COACH_PROFILE_CONTRACT_VERSION, executiveProfile: fidApi.EXECUTIVE_PROFILE_CONTRACT_VERSION, organizationProfile: fidApi.ORGANIZATION_PROFILE_CONTRACT_VERSION, teamProfile: fidApi.TEAM_PROFILE_CONTRACT_VERSION, footballRelationship: fidApi.FOOTBALL_RELATIONSHIP_CONTRACT_VERSION });
  const schemaVersions = Object.freeze({ footballEntity: fidApi.FOOTBALL_ENTITY_SCHEMA_VERSION, personProfile: fidApi.PERSON_PROFILE_SCHEMA_VERSION, coachProfile: fidApi.COACH_PROFILE_SCHEMA_VERSION, executiveProfile: fidApi.EXECUTIVE_PROFILE_SCHEMA_VERSION, organizationProfile: fidApi.ORGANIZATION_PROFILE_SCHEMA_VERSION, teamProfile: fidApi.TEAM_PROFILE_SCHEMA_VERSION, footballRelationship: fidApi.FOOTBALL_RELATIONSHIP_SCHEMA_VERSION });
  const summary = { suite: SUITE, contractVersions, schemaVersions, total: cases.length, passed, failed, cases, suiteSummaries: context.suiteSummaries };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runFidExecutiveProfileFoundationDiagnostics });
