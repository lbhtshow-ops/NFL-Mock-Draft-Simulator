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
import coachConstants from "../constants/coachProfileConstants.js";
import coachContract from "../contracts/CoachProfileContract.js";
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

const SUITE = "CoachProfileContractDiagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTION_FILES = [
  "constants/footballEntityConstants.js", "contracts/FootballEntityContract.js", "constants/personProfileConstants.js",
  "contracts/PersonProfileContract.js", "constants/playerProfileConstants.js", "contracts/PlayerProfileContract.js",
  "constants/prospectProfileConstants.js", "contracts/ProspectProfileContract.js", "constants/organizationProfileConstants.js",
  "contracts/OrganizationProfileContract.js", "constants/teamProfileConstants.js", "contracts/TeamProfileContract.js",
  "constants/footballRelationshipConstants.js", "contracts/FootballRelationshipContract.js",
  "constants/coachProfileConstants.js", "contracts/CoachProfileContract.js", "index.js",
].map((file) => resolve(ROOT, file));
const COACH_EXPORTS = Object.freeze([...Object.keys(coachConstants), ...Object.keys(coachContract).filter((name) => !Object.hasOwn(coachConstants, name))]);
const SPRINT_11_API = Object.freeze({
  ...footballEntityConstants,
  ...footballEntityContract,
  ...personProfileConstants,
  ...personProfileContract,
  ...playerProfileConstants,
  ...playerProfileContract,
  ...prospectProfileConstants,
  ...prospectProfileContract,
  ...organizationProfileConstants,
  ...organizationProfileContract,
  ...teamProfileConstants,
  ...teamProfileContract,
  ...footballRelationshipConstants,
  ...footballRelationshipContract,
  ...coachConstants,
  ...coachContract,
});

function assert(condition, message, details = null) { if (!condition) { const failure = new Error(message); failure.details = details; throw failure; } }
function keysDeep(value, keys = new Set()) { if (Array.isArray(value)) value.forEach((entry) => keysDeep(entry, keys)); else if (value && typeof value === "object") Object.entries(value).forEach(([key, entry]) => { keys.add(key); keysDeep(entry, keys); }); return keys; }
function imports(source) { return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]); }
function graph(sources) { const files = new Set(PRODUCTION_FILES); return Object.fromEntries(PRODUCTION_FILES.map((file) => [file, imports(sources[file]).filter((entry) => entry.startsWith(".")).map((entry) => resolve(dirname(file), entry)).filter((entry) => files.has(entry))])); }
function hasCycle(value) { const visiting = new Set(); const visited = new Set(); function visit(node) { if (visiting.has(node)) return true; if (visited.has(node)) return false; visiting.add(node); if ((value[node] || []).some(visit)) return true; visiting.delete(node); visited.add(node); return false; } return Object.keys(value).some(visit); }
function period(overrides = {}) { return { startedAt: "2020-01-01", endedAt: null, ...overrides }; }
function role(overrides = {}) { return { roleId: "role-1", roleType: "HEAD_COACH", declaredTitle: "Head Coach", status: "REPORTED", interim: false, teamRef: "team-1", organizationRef: "organization-1", competitionRef: "competition-1", seasonRefs: ["season-1"], period: period(), sourceRefs: ["source-1"], evidenceRefs: ["evidence-1"], verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" }, ...overrides }; }
function assignment(overrides = {}) { return { assignmentId: "assignment-1", declaredTitle: "Declared assignment", roleType: "HEAD_COACH", status: "REPORTED", teamRef: "team-1", organizationRef: "organization-1", level: "NFL", period: period(), sourceRefs: ["source-1"], evidenceRefs: ["evidence-1"], ...overrides }; }
function experience(overrides = {}) { return { experienceId: "experience-1", experienceType: "SYSTEM", label: "Declared experience", teamRef: "team-1", organizationRef: "organization-1", seasonRefs: ["season-1"], period: period(), sourceRefs: ["source-1"], evidenceRefs: ["evidence-1"], ...overrides }; }
function responsibility(overrides = {}) { return { responsibilityId: "responsibility-1", responsibilityType: "PLAY_CALLER", declaredLabel: "Reported play caller", status: "REPORTED", uncertainty: "Source-limited", qualifiers: ["reported"], teamRef: "team-1", sourceRefs: ["source-1"], evidenceRefs: ["evidence-1"], ...overrides }; }
function event(overrides = {}) { return { eventId: "event-1", eventType: "APPOINTED", title: "Declared appointment", occurredAt: "2020-01-01", teamRef: "team-1", assignmentRefs: ["assignment-1"], sourceRefs: ["source-1"], evidenceRefs: ["evidence-1"], ...overrides }; }
function base(overrides = {}) { return { coachId: "coach-1", personRef: "person-profile-1", identity: { displayLabel: "Coach Label", knownCoachingName: "Known Coaching Name", profileLabels: ["research profile"], coachSpecificAliases: ["Coach Alias"], externalCoachIdentifiers: [{ identifierId: "identifier-1", namespace: "provider", value: "coach-123", sourceRefs: ["source-1"] }] }, coachingStatus: "UNKNOWN", verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" }, lifecycle: { status: "CANDIDATE" }, ...overrides }; }
function full(overrides = {}) { const histories = Object.fromEntries(["levelHistory", "organizationHistory", "teamHistory", "systemExperience", "schemeExperience", "terminologyExperience", "unitExperience", "positionGroupExperience", "coordinatorExperience", "headCoachingExperience", "interimExperience"].map((path, index) => [path, [experience({ experienceId: `${path}-1`, experienceType: index === 0 ? "LEVEL" : index === 1 ? "ORGANIZATION" : index === 2 ? "TEAM" : index === 3 ? "SYSTEM" : index === 4 ? "SCHEME" : index === 5 ? "TERMINOLOGY" : index === 6 ? "UNIT" : index === 7 ? "POSITION_GROUP" : index === 8 ? "COORDINATOR" : index === 9 ? "HEAD_COACH" : "INTERIM", level: "NFL", unit: "OFFENSE", positionGroup: "QUARTERBACKS", systemRef: "system-1", schemeRef: "scheme-1", terminologyRef: "terminology-1", philosophyRefs: ["philosophy-1"], playbookRefs: ["playbook-1"] })]])); return base({ coachingStatus: "ACTIVE", coachingRoles: [role()], roleHistory: [role({ roleId: "role-history-1" })], coachingAssignments: [assignment()], coachingHistory: [assignment({ assignmentId: "assignment-history-1", status: "FORMER" })], ...histories, responsibilityHistory: [responsibility()], playingExperienceRefs: ["player-profile-1"], educationRefs: ["education-1"], certificationRefs: ["certification-1"], awardRefs: ["award-1"], recognitionRefs: ["recognition-1"], milestoneRefs: ["milestone-1"], philosophyRefs: ["philosophy-1"], playbookRefs: ["playbook-1"], eventHistory: [event()], coachTimeline: [event({ eventId: "timeline-1", eventType: "MILESTONE" })], relationshipRefs: ["relationship-1"], sourceRefs: ["source-1"], evidenceRefs: ["evidence-1"], provenance: { createdBy: "researcher", createdAt: "2020-01-01", updatedBy: "reviewer", updatedAt: "2020-01-02" }, versioning: { profileVersion: 1 }, notes: "Factual profile", ...overrides }); }
function created(input) { return fidApi.createCoachProfile(input); }

function identityFactoryChecks() {
  const minimal = created(base()); const complete = created(full());
  assert(minimal.validation.valid && complete.validation.valid && fidApi.isCoachProfile(minimal), "Valid Coach Profile fixture rejected.");
  assert(minimal.contract === fidApi.COACH_PROFILE_CONTRACT_NAME && minimal.contractVersion === fidApi.COACH_PROFILE_CONTRACT_VERSION && minimal.schemaVersion === fidApi.COACH_PROFILE_SCHEMA_VERSION, "Contract identity or version invalid.");
  assert(Object.values(coachConstants).filter((value) => value && typeof value === "object").every(Object.isFrozen), "Coach constants are not frozen.");
  assert(typeof fidApi.createCoachProfile === "function" && typeof fidApi.createUnavailableCoachProfile === "function" && typeof fidApi.validateCoachProfile === "function" && typeof fidApi.isCoachProfile === "function", "Factory API incomplete.");
  [null, [], "coach", 7].forEach((value) => { assert(created(value).validation.valid === false, "Factory unsafe for invalid input."); assert(fidApi.validateCoachProfile(value).valid === false, "Validator unsafe for invalid input."); });
  const input = full(); const snapshot = JSON.stringify(input); const first = created(input); assert(JSON.stringify(input) === snapshot, "Factory mutated input."); fidApi.validateCoachProfile(first); assert(JSON.stringify(input) === snapshot, "Validator mutated input."); assert(JSON.stringify(first) === JSON.stringify(created(input)), "Normalization unstable.");
  assert(!created(base({ coachId: null })).validation.valid && !created(base({ personRef: null })).validation.valid, "Required identity not enforced.");
  const empty = fidApi.createUnavailableCoachProfile(); assert(empty.coachId === null && empty.personRef === null && empty.coachingStatus === null && empty.coachingRoles.length === 0 && empty.coachingAssignments.length === 0 && empty.relationshipRefs.length === 0 && empty.verification.state === null, "Unavailable factory invented facts.");
}
function personBoundaryChecks() {
  const result = created(full()); const keys = keysDeep(result);
  assert(result.personRef === "person-profile-1" && typeof result.personRef === "string", "Person reference did not remain unresolved.");
  ["personProfile", "legalName", "canonicalName", "birthDate", "birthPlace", "nationality", "biography", "canonicalAliases", "canonicalIdentifiers"].forEach((key) => assert(!keys.has(key), `Canonical Person ownership duplicated: ${key}.`));
  assert(result.identity.displayLabel === "Coach Label" && result.identity.knownCoachingName === "Known Coaching Name" && result.identity.externalCoachIdentifiers[0].value === "coach-123", "Coach-local identity data lost.");
  assert(!keys.has("hydratedPerson") && !keys.has("synchronizedPerson") && !keys.has("createdPersonProfile"), "Person Profile runtime behavior created.");
  assert(created(base({ personRef: "not-loaded" })).validation.valid, "Person reference was resolved during validation.");
}
function statusRoleChecks() {
  Object.values(fidApi.COACHING_STATUSES).forEach((coachingStatus) => assert(created(base({ coachingStatus })).validation.valid, `Coaching status rejected: ${coachingStatus}.`));
  assert(created(base({ coachingStatus: null })).coachingStatus === null, "Explicit null coaching status changed.");
  assert(created(base({ coachingStatus: "UNKNOWN" })).coachingStatus === "UNKNOWN" && created(base({ coachingStatus: "UNSPECIFIED" })).coachingStatus === "UNSPECIFIED", "Unknown and unspecified collapsed.");
  assert(created(base({ coachingAssignments: [assignment({ status: "CURRENT" })], coachingStatus: null })).coachingStatus === null, "Latest assignment inferred active status.");
  assert(created(base({ coachingAssignments: [], coachingStatus: null })).coachingStatus === null, "Missing assignment inferred inactive status.");
  Object.values(fidApi.COACHING_ROLE_TYPES).forEach((roleType) => assert(created(base({ coachingRoles: [role({ roleType })] })).validation.valid, `Role type rejected: ${roleType}.`));
  const result = created(base({ coachingRoles: [role({ roleType: "OFFENSIVE_COORDINATOR", unit: "OFFENSE", positionGroup: "QUARTERBACKS", level: "NFL", interim: true })] })); const item = result.coachingRoles[0];
  assert(item.declaredTitle === "Head Coach" && item.teamRef === "team-1" && item.organizationRef === "organization-1" && item.competitionRef === "competition-1" && item.seasonRefs.every((ref) => typeof ref === "string"), "Role context not preserved.");
  assert(item.interim === true && item.unit === "OFFENSE" && item.positionGroup === "QUARTERBACKS" && item.level === "NFL", "Role qualifiers not preserved.");
  ["EMPLOYED_BY", "WORKS_FOR", "COACHES", "COACHED_BY", "MEMBER_OF", "ASSIGNED_TO"].forEach((key) => assert(!keysDeep(result).has(key), `Role generated Relationship: ${key}.`));
  assert(!created(base({ coachingRoles: [role({ period: period({ startedAt: "2021-01-01", endedAt: "2020-01-01" }) })] })).validation.valid, "Invalid role dates accepted.");
}
function assignmentLevelChecks() {
  const overlapping = created(base({ coachingAssignments: [assignment(), assignment({ assignmentId: "assignment-2", teamRef: "team-2", status: "DISPUTED" })] }));
  assert(overlapping.validation.valid && overlapping.coachingAssignments.length === 2, "Overlapping or conflicting assignments rejected.");
  const keys = keysDeep(overlapping); ["legalEmployment", "payrollStatus", "contractTerms", "currentEmployer", "staffRecord", "teamProfile", "organizationProfile", "relationship", "tenure", "continuity", "promotion", "demotion", "authoritativeAssignment"].forEach((key) => assert(!keys.has(key), `Assignment inferred prohibited state: ${key}.`));
  assert(!created(base({ coachingAssignments: [assignment({ period: period({ startedAt: "2022-01-01", endedAt: "2021-01-01" }) })] })).validation.valid, "Invalid assignment dates accepted.");
  Object.values(fidApi.COACH_FOOTBALL_LEVELS).forEach((level) => assert(created(base({ levelHistory: [experience({ experienceType: "LEVEL", level })] })).validation.valid, `Football level rejected: ${level}.`));
  const level = created(base({ levelHistory: [experience({ experienceType: "LEVEL", level: "NFL" })] })); ["totalYears", "highestLevel", "experienceScore", "professionalEquivalency", "careerProgression", "readiness", "successProbability"].forEach((key) => assert(!keysDeep(level).has(key), `Level experience calculated ${key}.`));
}
function experienceBoundaryChecks() {
  Object.values(fidApi.COACH_EXPERIENCE_TYPES).forEach((experienceType) => assert(created(base({ systemExperience: [experience({ experienceType })] })).validation.valid, `Experience type rejected: ${experienceType}.`));
  Object.values(fidApi.COACH_UNIT_TYPES).forEach((unit) => assert(created(base({ unitExperience: [experience({ experienceType: "UNIT", unit })] })).validation.valid, `Unit rejected: ${unit}.`));
  Object.values(fidApi.COACH_POSITION_GROUP_TYPES).forEach((positionGroup) => assert(created(base({ positionGroupExperience: [experience({ experienceType: "POSITION_GROUP", positionGroup })] })).validation.valid, `Position group rejected: ${positionGroup}.`));
  const result = created(full()); const keys = keysDeep(result);
  assert(result.systemExperience[0].systemRef === "system-1" && result.schemeExperience[0].schemeRef === "scheme-1" && result.terminologyExperience[0].terminologyRef === "terminology-1", "System or scheme context lost.");
  ["schemeQuality", "innovationScore", "effectivenessScore", "playerFit", "teamFit", "coachFit", "adaptabilityScore", "masteryScore", "expectedPerformance", "hiringRecommendation"].forEach((key) => assert(!keys.has(key), `Experience inferred ${key}.`));
  ["directResponsibility", "soleResponsibility", "developmentSuccess", "performanceAttribution", "coordinatorAuthority", "playCallingAuthority", "hiringAuthority"].forEach((key) => assert(!keys.has(key), `Unit experience inferred ${key}.`));
  ["careerRecord", "winPercentage", "playoffSuccess", "expectedWins", "leadershipGrade", "gameManagementGrade", "staffBuildingGrade", "jobSecurity", "careerTier"].forEach((key) => assert(!keys.has(key), `Head-coach experience calculated ${key}.`));
}
function responsibilityPlayingRecognitionChecks() {
  Object.values(fidApi.COACH_RESPONSIBILITY_TYPES).forEach((responsibilityType) => assert(created(base({ responsibilityHistory: [responsibility({ responsibilityType })] })).validation.valid, `Responsibility rejected: ${responsibilityType}.`));
  const result = created(full()); const item = result.responsibilityHistory[0]; assert(item.uncertainty === "Source-limited" && item.qualifiers[0] === "reported", "Responsibility uncertainty or qualifiers lost.");
  ["inferredPlayCaller", "soleAuthority", "successionAuthority"].forEach((key) => assert(!keysDeep(result).has(key), `Responsibility inferred ${key}.`));
  assert(result.playingExperienceRefs[0] === "player-profile-1" && !keysDeep(result).has("playerProfile"), "Playing experience embedded or resolved Player Profile.");
  ["playingQuality", "coachingQuality", "positionExpertise", "coachingTraits"].forEach((key) => assert(!keysDeep(result).has(key), `Playing experience inferred ${key}.`));
  assert(result.awardRefs[0] === "award-1" && result.recognitionRefs[0] === "recognition-1" && result.milestoneRefs[0] === "milestone-1", "Recognition references not preserved.");
  ["prestigeScore", "resumeScore", "careerSuccessScore", "individualAttribution"].forEach((key) => assert(!keysDeep(result).has(key), `Recognition calculated ${key}.`));
}
function eventRelationshipChecks() {
  Object.values(fidApi.COACH_EVENT_TYPES).forEach((eventType) => assert(created(base({ eventHistory: [event({ eventType })] })).validation.valid, `Event type rejected: ${eventType}.`));
  assert(!created(base({ eventHistory: [event({ period: period({ startedAt: "2022-01-01", endedAt: "2021-01-01" }) })] })).validation.valid, "Invalid event dates accepted.");
  const result = created(base({ coachingStatus: "UNKNOWN", coachingAssignments: [], eventHistory: [event({ eventType: "APPOINTED" }), event({ eventId: "event-2", eventType: "DISMISSED" })], relationshipRefs: ["relationship-1"] })); const keys = keysDeep(result);
  assert(result.coachingStatus === "UNKNOWN" && result.lifecycle.status === "CANDIDATE" && result.coachingAssignments.length === 0, "Event altered status, lifecycle, or assignments.");
  ["legalCause", "fault", "authoritativeEvent", "closedAssignment", "createdRelationship"].forEach((key) => assert(!keys.has(key), `Event inferred ${key}.`));
  assert(result.relationshipRefs[0] === "relationship-1" && !keys.has("footballRelationship") && !keys.has("hydratedRelationship"), "Relationship reference embedded or hydrated.");
  ["EMPLOYED_BY", "WORKS_FOR", "COACHES", "COACHED_BY", "ATTENDED", "PLAYED_FOR"].forEach((key) => assert(!keys.has(key), `Independent Relationship generated: ${key}.`));
}
function verificationLifecycleChecks() {
  const verified = created(full({ verification: { state: "VERIFIED", confidence: "HIGH", verifiedBy: "reviewer", verifiedAt: "2020-01-02" } })); assert(fidApi.isVerifiedCoachProfile(verified), "Verified Coach Profile guard failed.");
  assert(!created(base({ verification: { state: "VERIFIED", confidence: "HIGH" } })).validation.valid, "Verified profile without verification context accepted.");
  const disputed = created(base({ verification: { state: "DISPUTED", confidence: "LOW", disputes: ["dispute-1"] }, lifecycle: { status: "DISPUTED", notes: "Disputed" } })); assert(disputed.validation.valid && fidApi.isDisputedCoachProfile(disputed), "Disputed profile invalid.");
  assert(!created(base({ versioning: { supersedesCoachProfileRef: "coach-1" } })).validation.valid && !created(base({ versioning: { supersededByCoachProfileRef: "coach-1" } })).validation.valid, "Version self-reference accepted.");
  assert(!created(base({ lifecycle: { status: "SUPERSEDED" } })).validation.valid, "Superseded lifecycle lacks replacement.");
  const result = created(full()); ["combinedConfidence", "autoVerified", "promotedEvidence", "winningProfile", "mergedProfile", "currentRole", "currentEmployer", "tenure"].forEach((key) => assert(!keysDeep(result).has(key), `Lifecycle or verification inferred ${key}.`));
}
function exclusionChecks() {
  const prohibited = ["score", "grade", "ranking", "probability", "recommendation", "prediction", "decision", "jobSecurity", "schemeFit", "winsAboveExpectation", "evaluation", "intelligenceResult", "currentEmployer", "currentRole", "tenure", "staffHierarchy", "rosterManagement"];
  const result = created(base(Object.fromEntries(prohibited.map((key) => [key, "prohibited"])))); const keys = keysDeep(result); prohibited.forEach((key) => assert(!keys.has(key), `Prohibited field retained: ${key}.`));
  const extensionResult = created(base({ extensions: { namespace: { score: 90, factualLabel: "Allowed" } } })); assert(!extensionResult.validation.valid && !keysDeep(extensionResult.extensions).has("score") && extensionResult.extensions.namespace.factualLabel === "Allowed", "Extensions bypassed Coach Profile ownership.");
  assert(!created(base({ extensions: [] })).validation.valid, "Invalid extensions structure accepted.");
}
async function integrationChecks(context) {
  const expected = { footballEntity: 120, personProfile: 148, playerProfile: 209, prospectProfile: 230, personPlayerProspectFoundation: 130, organizationProfile: 218, teamProfile: 270, organizationTeamFoundation: 156, footballRelationship: 300, relationshipProfileBoundary: 240, researchRepository: 616 };
  Object.entries(expected).forEach(([name, total]) => assert(context.suiteSummaries[name].total === total && context.suiteSummaries[name].failed === 0, `${name} diagnostics failed.`));
  const named = Object.keys(namedApi).filter((name) => name !== "default"); const defaults = Object.keys(fidApi);
  const protectedNames = Object.keys(SPRINT_11_API);
  assert(protectedNames.length === 182 && named.length >= protectedNames.length && defaults.length >= protectedNames.length && new Set(named).size === named.length && new Set(defaults).size === defaults.length, "FID export surface invalid.");
  assert(protectedNames.every((name) => Object.hasOwn(namedApi, name) && Object.hasOwn(fidApi, name) && namedApi[name] === SPRINT_11_API[name] && fidApi[name] === SPRINT_11_API[name]), "Protected Sprint 11 export missing or incompatible.");
  assert(named.length === defaults.length && named.every((name) => Object.hasOwn(fidApi, name) && namedApi[name] === fidApi[name]) && defaults.every((name) => Object.hasOwn(namedApi, name) && namedApi[name] === fidApi[name]), "Named and default FID exports disagree.");
  assert(COACH_EXPORTS.length === 23 && COACH_EXPORTS.every((name) => Object.hasOwn(namedApi, name) && Object.hasOwn(fidApi, name) && namedApi[name] === fidApi[name]), "Coach exports missing or inconsistent.");
  assert(!defaults.some((name) => /^run.*Diagnostics$/.test(name)), "Diagnostic runner exported.");
  assert(context.coachImports.length === 1 && /coachProfileConstants\.js$/i.test(context.coachImports[0]), "Coach contract has prohibited dependency.");
  assert(!context.coachSource.includes("FootballRelationshipContract") && !context.coachSource.includes("PersonProfileContract"), "Coach contract imports another runtime contract.");
  assert(!hasCycle(context.dependencyGraph), "Production circular dependency found.");
  const prohibited = /relationship(?:registry|resolver|service|manager|repository|persistence|hydration|synchronization)|knowledge[-_]?graph|graph[-_]?traversal|supabase|engines?|quarterback|draftv3|components?|pages?|router|routes?/i;
  assert(context.productionImports.every((entry) => !prohibited.test(entry)), "Prohibited production dependency found.");
}

const CASE_GROUPS = Object.freeze([[28, "contract-factory-identity"], [24, "person-specialization-boundary"], [42, "status-role-records"], [34, "assignment-level-history"], [42, "system-scheme-unit-experience"], [28, "responsibility-playing-recognition"], [28, "event-timeline-relationship"], [24, "verification-lifecycle-versioning"], [14, "evaluation-intelligence-exclusion"], [16, "exports-dependencies-integration"]]);
const CASE_NAMES = Object.freeze(CASE_GROUPS.flatMap(([count, group]) => Array.from({ length: count }, (_, index) => `${group}-${String(index + 1).padStart(3, "0")}`)));
async function checkForIndex(index, context) { if (index < 28) return identityFactoryChecks(); if (index < 52) return personBoundaryChecks(); if (index < 94) return statusRoleChecks(); if (index < 128) return assignmentLevelChecks(); if (index < 170) return experienceBoundaryChecks(); if (index < 198) return responsibilityPlayingRecognitionChecks(); if (index < 226) return eventRelationshipChecks(); if (index < 250) return verificationLifecycleChecks(); if (index < 264) return exclusionChecks(); return integrationChecks(context); }
async function buildContext() {
  const sources = Object.fromEntries(PRODUCTION_FILES.map((file) => [file, readFileSync(file, "utf8")]));
  const footballEntity = runFootballEntityContractDiagnostics(); const personProfile = await runPersonProfileContractDiagnostics(); const playerProfile = await runPlayerProfileContractDiagnostics(); const prospectProfile = await runProspectProfileContractDiagnostics(); const personPlayerProspectFoundation = await runFidPersonPlayerProspectFoundationDiagnostics(); const organizationProfile = await runOrganizationProfileContractDiagnostics(); const teamProfile = await runTeamProfileContractDiagnostics(); const organizationTeamFoundation = await runFidOrganizationTeamFoundationDiagnostics(); const footballRelationship = await runFootballRelationshipContractDiagnostics(); const relationshipProfileBoundary = await runFidRelationshipProfileBoundaryDiagnostics(); const researchRepository = personPlayerProspectFoundation.suiteSummaries.researchRepository;
  const coachSource = readFileSync(resolve(ROOT, "contracts/CoachProfileContract.js"), "utf8");
  return { productionImports: Object.values(sources).flatMap(imports), dependencyGraph: graph(sources), coachSource, coachImports: imports(coachSource), suiteSummaries: { footballEntity, personProfile, playerProfile, prospectProfile, personPlayerProspectFoundation, organizationProfile, teamProfile, organizationTeamFoundation, footballRelationship, relationshipProfileBoundary, researchRepository } };
}

export async function runCoachProfileContractDiagnostics({ throwOnFailure = false } = {}) {
  const context = await buildContext(); const cases = [];
  for (let index = 0; index < CASE_NAMES.length; index += 1) { const id = CASE_NAMES[index]; try { await checkForIndex(index, context); cases.push({ id, passed: true, message: `${id} passed.`, details: null }); } catch (failure) { cases.push({ id, passed: false, message: typeof failure?.message === "string" ? failure.message : `${id} failed.`, details: failure?.details ?? null }); } }
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const summary = { suite: SUITE, contractVersion: fidApi.COACH_PROFILE_CONTRACT_VERSION, schemaVersion: fidApi.COACH_PROFILE_SCHEMA_VERSION, total: cases.length, passed, failed, cases, suiteSummaries: context.suiteSummaries };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runCoachProfileContractDiagnostics });
