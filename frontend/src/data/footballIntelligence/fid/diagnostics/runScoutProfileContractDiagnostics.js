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
import scoutConstants from "../constants/scoutProfileConstants.js";
import scoutContract from "../contracts/ScoutProfileContract.js";
import { runFidExecutiveProfileFoundationDiagnostics } from "./runFidExecutiveProfileFoundationDiagnostics.js";

const SUITE = "ScoutProfileContractDiagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTION_FILES = [
  "constants/footballEntityConstants.js", "contracts/FootballEntityContract.js", "constants/personProfileConstants.js", "contracts/PersonProfileContract.js",
  "constants/playerProfileConstants.js", "contracts/PlayerProfileContract.js", "constants/prospectProfileConstants.js", "contracts/ProspectProfileContract.js",
  "constants/organizationProfileConstants.js", "contracts/OrganizationProfileContract.js", "constants/teamProfileConstants.js", "contracts/TeamProfileContract.js",
  "constants/footballRelationshipConstants.js", "contracts/FootballRelationshipContract.js", "constants/coachProfileConstants.js", "contracts/CoachProfileContract.js",
  "constants/executiveProfileConstants.js", "contracts/ExecutiveProfileContract.js", "constants/scoutProfileConstants.js", "contracts/ScoutProfileContract.js", "index.js",
].map((file) => resolve(ROOT, file));
const PROTECTED_API = Object.freeze({ ...footballEntityConstants, ...footballEntityContract, ...personProfileConstants, ...personProfileContract, ...playerProfileConstants, ...playerProfileContract, ...prospectProfileConstants, ...prospectProfileContract, ...organizationProfileConstants, ...organizationProfileContract, ...teamProfileConstants, ...teamProfileContract, ...footballRelationshipConstants, ...footballRelationshipContract, ...coachProfileConstants, ...coachProfileContract, ...executiveProfileConstants, ...executiveProfileContract });
const SCOUT_EXPORTS = Object.freeze([...Object.keys(scoutConstants), ...Object.keys(scoutContract).filter((name) => !Object.hasOwn(scoutConstants, name))]);

function assert(condition, message, details = null) { if (!condition) { const failure = new Error(message); failure.details = details; throw failure; } }
function keysDeep(value, keys = new Set()) { if (Array.isArray(value)) value.forEach((entry) => keysDeep(entry, keys)); else if (value && typeof value === "object") Object.entries(value).forEach(([key, entry]) => { keys.add(key); keysDeep(entry, keys); }); return keys; }
function imports(source) { return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]); }
function graph(sources) { const files = new Set(PRODUCTION_FILES); return Object.fromEntries(PRODUCTION_FILES.map((file) => [file, imports(sources[file]).filter((entry) => entry.startsWith(".")).map((entry) => resolve(dirname(file), entry)).filter((entry) => files.has(entry))])); }
function hasCycle(value) { const visiting = new Set(); const visited = new Set(); function visit(node) { if (visiting.has(node)) return true; if (visited.has(node)) return false; visiting.add(node); if ((value[node] || []).some(visit)) return true; visiting.delete(node); visited.add(node); return false; } return Object.keys(value).some(visit); }
function period(overrides = {}) { return { startedAt: "2024-01-01", endedAt: null, ...overrides }; }
function verification(overrides = {}) { return { state: "UNVERIFIED", confidence: "UNSPECIFIED", ...overrides }; }
function role(overrides = {}) { return { roleId: "role-1", roleType: "AREA_SCOUT", declaredTitle: "Area Scout", department: "COLLEGE_SCOUTING", level: "NFL", status: "REPORTED", interim: false, organizationRef: "organization-1", teamRef: "team-1", competitionRef: "competition-1", seasonRefs: ["season-1"], period: period(), sourceRefs: ["source-1"], evidenceRefs: ["evidence-1"], verification: verification(), ...overrides }; }
function assignment(overrides = {}) { return { assignmentId: "assignment-1", roleType: "AREA_SCOUT", declaredTitle: "Declared scouting assignment", department: "COLLEGE_SCOUTING", level: "NFL", status: "REPORTED", organizationRef: "organization-1", teamRef: "team-1", period: period(), sourceRefs: ["source-1"], evidenceRefs: ["evidence-1"], ...overrides }; }
function history(overrides = {}) { return { historyId: "history-1", label: "Declared scouting history", department: "COLLEGE_SCOUTING", level: "NFL", roleRef: "role-1", organizationRef: "organization-1", teamRef: "team-1", period: period(), sourceRefs: ["source-1"], evidenceRefs: ["evidence-1"], ...overrides }; }
function coverage(overrides = {}) { return { coverageId: "coverage-1", coverageType: "GEOGRAPHIC_REGION", regionType: "SOUTHEAST", regionLabel: "Declared Southeast territory", leagueRef: "league-1", conferenceRef: "conference-1", schoolRef: "school-1", draftClassRef: "draft-class-1", level: "COLLEGE_FBS", positionGroup: "QB", eventRef: "event-1", assignmentRef: "assignment-1", scope: "Declared coverage scope", uncertainty: "Source-limited", organizationRef: "organization-1", teamRef: "team-1", competitionRef: "competition-1", seasonRefs: ["season-1"], period: period(), sourceRefs: ["source-1"], evidenceRefs: ["evidence-1"], verification: verification(), ...overrides }; }
function responsibility(overrides = {}) { return { responsibilityId: "responsibility-1", responsibilityType: "LIVE_EVALUATION", declaredLabel: "Reported live evaluation responsibility", scope: "Declared scope", qualifiers: ["reported"], uncertainty: "Source-limited", status: "REPORTED", organizationRef: "organization-1", teamRef: "team-1", period: period(), sourceRefs: ["source-1"], evidenceRefs: ["evidence-1"], verification: verification(), ...overrides }; }
function event(overrides = {}) { return { eventId: "event-1", eventType: "COVERAGE_ASSIGNED", title: "Declared coverage assignment", occurredAt: "2024-01-01", assignmentRefs: ["assignment-1"], coverageRefs: ["coverage-1"], organizationRef: "organization-1", teamRef: "team-1", sourceRefs: ["source-1"], evidenceRefs: ["evidence-1"], verification: verification(), ...overrides }; }
function base(overrides = {}) { return { scoutId: "scout-1", personRef: "person-profile-1", identity: { displayLabel: "Scout Display", knownProfessionalName: "Scout Professional Name", profileLabels: ["scouting research"], scoutSpecificAliases: ["Scout Alias"], externalScoutIdentifiers: [{ identifierId: "identifier-1", namespace: "provider", value: "scout-provider-1", sourceRefs: ["source-1"] }] }, scoutStatus: "UNKNOWN", verification: verification(), lifecycle: { status: "CANDIDATE" }, ...overrides }; }
function full(overrides = {}) { return base({ scoutStatus: "ACTIVE", scoutRoles: [role()], scoutAssignments: [assignment()], scoutingHistory: [assignment({ assignmentId: "history-assignment-1", status: "FORMER" })], organizationHistory: [history({ historyId: "organization-history-1" })], teamHistory: [history({ historyId: "team-history-1" })], levelHistory: [history({ historyId: "level-history-1" })], departmentHistory: [history({ historyId: "department-history-1" })], coverageHistory: [coverage()], regionHistory: [coverage({ coverageId: "region-coverage-1" })], competitionHistory: [coverage({ coverageId: "competition-coverage-1", coverageType: "COMPETITION" })], positionCoverageHistory: [coverage({ coverageId: "position-coverage-1", coverageType: "POSITION_GROUP" })], responsibilityHistory: [responsibility()], evaluationAssignmentRefs: ["evaluation-assignment-1"], scoutingReportRefs: ["scouting-report-1"], observationRefs: ["observation-1"], evidenceArtifactRefs: ["evidence-artifact-1"], prospectCoverageRefs: ["prospect-profile-1"], playerCoverageRefs: ["player-profile-1"], draftClassRefs: ["draft-class-1"], eventHistory: [event()], scoutTimeline: [event({ eventId: "timeline-1", eventType: "MILESTONE" })], educationRefs: ["education-1"], certificationRefs: ["certification-1"], awardRefs: ["award-1"], recognitionRefs: ["recognition-1"], milestoneRefs: ["milestone-1"], relationshipRefs: ["relationship-1"], sourceRefs: ["research-source-1"], evidenceRefs: ["evidence-1"], provenance: { createdBy: "researcher", createdAt: "2024-01-01", updatedBy: "reviewer", updatedAt: "2024-01-02" }, versioning: { profileVersion: 1 }, notes: "Factual Scout Profile", ...overrides }); }
function created(input) { return fidApi.createScoutProfile(input); }

function identityFactoryChecks() {
  const minimal = created(base()); const complete = created(full()); assert(minimal.validation.valid && complete.validation.valid && fidApi.isScoutProfile(minimal), "Valid Scout Profile fixture rejected.");
  assert(minimal.contract === fidApi.SCOUT_PROFILE_CONTRACT_NAME && minimal.contractVersion === fidApi.SCOUT_PROFILE_CONTRACT_VERSION && minimal.schemaVersion === fidApi.SCOUT_PROFILE_SCHEMA_VERSION, "Contract identity or versions invalid.");
  assert(Object.values(scoutConstants).filter((value) => value && typeof value === "object").every(Object.isFrozen), "Scout constants are not frozen.");
  [null, [], "scout", 7].forEach((value) => { assert(created(value).validation.valid === false && fidApi.validateScoutProfile(value).valid === false, "Factory or validator unsafe for invalid input."); });
  const input = full(); const snapshot = JSON.stringify(input); const first = created(input); assert(JSON.stringify(input) === snapshot, "Factory mutated input."); fidApi.validateScoutProfile(first); assert(JSON.stringify(input) === snapshot && JSON.stringify(first) === JSON.stringify(created(input)), "Validator mutated input or normalization is unstable.");
  const empty = fidApi.createUnavailableScoutProfile(); assert(empty.scoutId === null && empty.personRef === null && empty.scoutRoles.length === 0 && empty.scoutAssignments.length === 0 && empty.coverageHistory.length === 0 && empty.responsibilityHistory.length === 0 && empty.scoutingReportRefs.length === 0 && empty.verification.state === null && !empty.validation.valid, "Unavailable factory invented facts.");
}
function personIdentityChecks() {
  const result = created(full()); const keys = keysDeep(result); assert(result.personRef === "person-profile-1" && typeof result.personRef === "string" && created(base({ personRef: "not-loaded" })).validation.valid, "Person reference was resolved.");
  ["personProfile", "legalName", "canonicalName", "canonicalFullName", "birthDate", "birthPlace", "nationality", "citizenship", "biography", "canonicalAliases", "canonicalIdentifiers", "canonicalEducation", "canonicalCareerHistory", "hydratedPerson", "synchronizedPerson", "createdPersonProfile", "identityMerge", "authoritativeName"].forEach((key) => assert(!keys.has(key), `Person ownership duplicated: ${key}.`));
  assert(result.identity.displayLabel === "Scout Display" && result.identity.knownProfessionalName === "Scout Professional Name" && result.identity.externalScoutIdentifiers[0].value === "scout-provider-1", "Scout-local identity lost.");
  assert(!created(base({ scoutId: null })).validation.valid && !created(base({ personRef: null })).validation.valid, "Required Scout identity not enforced.");
}
function roleAssignmentChecks() {
  Object.values(fidApi.SCOUT_STATUSES).forEach((scoutStatus) => assert(created(base({ scoutStatus })).validation.valid, `Scout status rejected: ${scoutStatus}.`));
  Object.values(fidApi.SCOUT_ROLE_TYPES).forEach((roleType) => assert(created(base({ scoutRoles: [role({ roleType })] })).validation.valid, `Scout role rejected: ${roleType}.`));
  assert(created(base({ scoutStatus: null, scoutAssignments: [assignment({ status: "CURRENT" })] })).scoutStatus === null, "Assignment inferred status.");
  const overlap = created(base({ scoutAssignments: [assignment(), assignment({ assignmentId: "assignment-2", teamRef: "team-2", status: "DISPUTED" })] })); assert(overlap.validation.valid && overlap.scoutAssignments.length === 2, "Conflicting assignments rejected.");
  ["legalEmployment", "payrollStatus", "contractTerms", "staffMembership", "reportingHierarchy", "currentEmployer", "currentRole", "tenure", "continuity", "promotion", "demotion", "createdOrganizationProfile", "createdTeamProfile", "createdRelationship", "authoritativeAssignment", "responsibility", "decisionAuthority", "reportAuthorship"].forEach((key) => assert(!keysDeep(overlap).has(key), `Role or assignment inferred ${key}.`));
  assert(!created(base({ scoutAssignments: [assignment({ period: period({ startedAt: "2025-01-01", endedAt: "2024-01-01" }) })] })).validation.valid, "Invalid assignment dates accepted.");
}
function coverageChecks() {
  Object.values(fidApi.SCOUT_COVERAGE_TYPES).forEach((coverageType) => assert(created(base({ coverageHistory: [coverage({ coverageType })] })).validation.valid, `Coverage type rejected: ${coverageType}.`));
  Object.values(fidApi.SCOUT_REGION_TYPES).forEach((regionType) => assert(created(base({ regionHistory: [coverage({ regionType })] })).validation.valid, `Region type rejected: ${regionType}.`));
  Object.values(fidApi.SCOUT_POSITION_GROUPS).forEach((positionGroup) => assert(created(base({ positionCoverageHistory: [coverage({ positionGroup })] })).validation.valid, `Position coverage rejected: ${positionGroup}.`));
  Object.values(fidApi.SCOUT_FOOTBALL_LEVELS).forEach((level) => assert(created(base({ levelHistory: [history({ level })] })).validation.valid, `Scout level rejected: ${level}.`));
  const result = created(full()); const item = result.coverageHistory[0]; assert(item.scope === "Declared coverage scope" && item.uncertainty === "Source-limited" && item.schoolRef === "school-1" && item.assignmentRef === "assignment-1", "Coverage context lost.");
  ["completedEvaluation", "personalEvaluation", "reportAuthorship", "playerRecommendation", "finalResponsibility", "exclusiveResponsibility", "evaluationQuality", "accuracy", "influence", "decisionAuthority", "coverageCompleteness", "workload", "territoryQuality", "regionalExpertise", "prospectDensity", "scoutEffectiveness", "positionExpertise", "positionModelOwnership"].forEach((key) => assert(!keysDeep(result).has(key), `Coverage inferred ${key}.`));
  assert(!created(base({ coverageHistory: [coverage({ period: period({ startedAt: "2025-01-01", endedAt: "2024-01-01" }) })] })).validation.valid, "Invalid coverage dates accepted.");
}
function responsibilityResearchChecks() {
  Object.values(fidApi.SCOUT_RESPONSIBILITY_TYPES).forEach((responsibilityType) => assert(created(base({ responsibilityHistory: [responsibility({ responsibilityType })] })).validation.valid, `Responsibility rejected: ${responsibilityType}.`));
  const result = created(full()); assert(result.responsibilityHistory[0].uncertainty === "Source-limited" && result.responsibilityHistory[0].qualifiers[0] === "reported", "Responsibility qualifiers lost.");
  ["finalReportAuthorship", "finalAuthority", "disagreementResolution", "finalDraftAuthority", "analyticsOwnership", "decisionAuthority", "researchSource", "researchSession", "recordedObservation", "analyticalObservation", "evidenceArtifact", "scoutingReport", "createdObservation", "createdEvidenceArtifact", "createdScoutingReport", "promotedObservation", "verifiedObservation", "combinedEvidence", "evaluatorReliability", "evaluatorAccuracy", "winningReport"].forEach((key) => assert(!keysDeep(result).has(key), `Responsibility or Research boundary inferred ${key}.`));
  assert(result.sourceRefs[0] === "research-source-1" && result.observationRefs[0] === "observation-1" && result.evidenceArtifactRefs[0] === "evidence-artifact-1", "Research references did not remain unresolved.");
}
function referenceBoundaryChecks() {
  const result = created(full()); assert(result.evaluationAssignmentRefs[0] === "evaluation-assignment-1" && result.scoutingReportRefs[0] === "scouting-report-1" && result.prospectCoverageRefs[0] === "prospect-profile-1" && result.playerCoverageRefs[0] === "player-profile-1", "Evaluation or coverage references lost.");
  ["evaluationAssignment", "reportContent", "reportSummary", "reportText", "traits", "playerGrade", "prospectGrade", "ranking", "consensus", "recommendation", "projection", "reliability", "accuracy", "hitRate", "successRate", "evaluatorComparison", "playerProfile", "prospectProfile", "teamFit", "completedEvaluation", "reportCompletion", "authorship", "agreement", "disagreement"].forEach((key) => assert(!keysDeep(result).has(key), `Reference boundary produced ${key}.`));
  assert(!/ResearchSourceContract|ResearchSessionContract|ObservationContract|EvidenceArtifactContract|PlayerProfileContract|ProspectProfileContract/.test(result.contract), "External contract embedded.");
}
function coexistEventRelationshipChecks() {
  const scout = created(full({ scoutStatus: "UNKNOWN", scoutAssignments: [], coverageHistory: [], eventHistory: [event({ eventType: "APPOINTED" }), event({ eventId: "event-2", eventType: "DISMISSED" })] }));
  const coach = fidApi.createCoachProfile({ coachId: "coach-1", personRef: "person-profile-1", coachingStatus: "UNKNOWN", verification: verification(), lifecycle: { status: "CANDIDATE" } });
  const executive = fidApi.createExecutiveProfile({ executiveId: "executive-1", personRef: "person-profile-1", executiveStatus: "UNKNOWN", verification: verification(), lifecycle: { status: "CANDIDATE" } }); const keys = keysDeep({ scout, coach, executive });
  assert(scout.validation.valid && coach.validation.valid && executive.validation.valid, "Scout, Coach, and Executive cannot coexist.");
  assert(scout.scoutStatus === "UNKNOWN" && scout.scoutAssignments.length === 0 && scout.coverageHistory.length === 0 && scout.lifecycle.status === "CANDIDATE", "Event altered Scout state.");
  ["careerTransition", "promotion", "demotion", "combinedRole", "primaryProfessionalIdentity", "unifiedTimeline", "unifiedCurrentStatus", "executiveAuthority", "coachingExpertise", "scoutingAccuracy", "leadership", "suitability", "closedAssignment", "closedCoverage", "createdRelationship", "createdResearchRecord", "employment", "cause", "fault", "authoritativeEvent", "footballRelationship", "hydratedRelationship", "inverseRelationship"].forEach((key) => assert(!keys.has(key), `Coexistence, event, or Relationship boundary inferred ${key}.`));
  Object.values(fidApi.SCOUT_EVENT_TYPES).forEach((eventType) => assert(created(base({ eventHistory: [event({ eventType })] })).validation.valid, `Scout event rejected: ${eventType}.`));
}
function verificationExtensionChecks() {
  const verified = created(full({ verification: { state: "VERIFIED", confidence: "HIGH", verifiedBy: "reviewer", verifiedAt: "2024-01-02" } })); assert(fidApi.isVerifiedScoutProfile(verified) && fidApi.isActiveScoutProfile(verified), "Scout type guard failed.");
  const disputed = created(base({ verification: { state: "DISPUTED", confidence: "LOW", disputes: ["dispute-1"] }, lifecycle: { status: "DISPUTED", notes: "Disputed" } })); assert(disputed.validation.valid && fidApi.isDisputedScoutProfile(disputed), "Disputed Scout invalid.");
  assert(!created(base({ versioning: { supersedesScoutProfileRef: "scout-1" } })).validation.valid && !created(base({ lifecycle: { status: "SUPERSEDED" } })).validation.valid, "Version or lifecycle rules not enforced.");
  ["combinedConfidence", "autoVerified", "promotedEvidence", "automaticArchive", "automaticSupersession", "mergedProfile", "closedAssignment", "authoritySelection"].forEach((key) => assert(!keysDeep(verified).has(key), `Verification or lifecycle inferred ${key}.`));
  const prohibited = ["score", "grade", "rating", "ranking", "evaluation", "recommendation", "prediction", "probability", "reliability", "accuracy", "hitRate", "successRate", "evaluatorQuality", "scoutQuality", "reportQuality", "decisionQuality", "influenceScore", "performanceScore", "fit", "projection", "consensus", "confidenceScore"];
  prohibited.forEach((key) => { const result = created(base({ extensions: { namespace: { [key]: 90, factualLabel: "Allowed" } } })); assert(!result.validation.valid && !keysDeep(result.extensions).has(key), `Extension retained ${key}.`); });
  assert(created(base({ extensions: { research: { factualLabel: "Allowed", reported: true } } })).validation.valid, "Safe factual extension rejected.");
}
async function integrationChecks(context) {
  const expected = { footballEntity: 120, personProfile: 148, playerProfile: 209, prospectProfile: 230, personPlayerProspectFoundation: 130, coachProfile: 280, personCoachFoundation: 254, executiveProfile: 391, executiveProfileFoundation: 352, organizationProfile: 218, teamProfile: 270, organizationTeamFoundation: 156, footballRelationship: 300, relationshipProfileBoundary: 240, researchRepository: 616 };
  Object.entries(expected).forEach(([name, total]) => assert(context.suiteSummaries[name].total === total && context.suiteSummaries[name].failed === 0, `${name} diagnostics failed.`));
  const named = Object.keys(namedApi).filter((name) => name !== "default"); const defaults = Object.keys(fidApi); const protectedNames = Object.keys(PROTECTED_API);
  assert(protectedNames.length === 205 && protectedNames.every((name) => Object.hasOwn(namedApi, name) && Object.hasOwn(fidApi, name) && namedApi[name] === PROTECTED_API[name] && fidApi[name] === PROTECTED_API[name]), "Protected pre-Scout export missing or replaced.");
  assert(SCOUT_EXPORTS.length === 24 && SCOUT_EXPORTS.every((name) => Object.hasOwn(namedApi, name) && Object.hasOwn(fidApi, name) && namedApi[name] === fidApi[name]), "Scout export missing or inconsistent.");
  assert(named.length >= 229 && defaults.length >= 229 && new Set(named).size === named.length && new Set(defaults).size === defaults.length && named.length === defaults.length && named.every((name) => Object.hasOwn(fidApi, name) && namedApi[name] === fidApi[name]), "FID export surface invalid.");
  assert(!defaults.some((name) => /^run.*Diagnostics$/.test(name)), "Diagnostic runner exported.");
  assert(context.scoutImports.length === 1 && /scoutProfileConstants\.js$/i.test(context.scoutImports[0]), "Scout contract has prohibited dependency.");
  assert(context.otherContractImports.every((entry) => !/ScoutProfileContract|scoutProfileConstants/.test(entry)), "Approved production contract imports Scout Profile.");
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
  const prohibitedScoutDependency = /FidPersistenceArchitectureSpecification|FidPersistenceRepositoryContract|InMemoryFidPersistenceRepository|persistence[/\\](?:index|repository|adapter|service|manager|client)|researchRepository|repository|adapter|supabase|\bsql\b|migrations?|filesystem\s+storage|browser\s+storage|localStorage|IndexedDB|network\s+persistence|hydration|synchronization|registry|resolver|identity\s+resolution|profile\s+resolution|runtime\s+(?:persistence|database)\s+integration/i;
  const prohibitedRuntime = /(?:Supabase|Database|Sql|Network|FileSystem|BrowserStorage|LocalStorage|IndexedDb)FidPersistenceRepository|ScoutRepository|PersistenceService|PersistenceManager|PersistenceAdapter|SupabaseAdapter|DatabaseAdapter|StorageClient|DatabaseClient|createClient|sql\s+runtime|migration\s+runtime|application\s+persistence\s+singleton|runtime\s+hydration|runtime\s+synchronization|identity\s+resolution|profile\s+resolution|runtime\s+database\s+integration/i;
  const prohibited = /researchRepository|registry|resolver|service|manager|hydration|synchronization|knowledge[-_]?graph|graph[-_]?traversal|supabase|engines?|quarterback|draftv3|components?|pages?|router|routes?|apiClient/i;
  assert(persistenceImports.every((entry) => approvedArchitectureImports.has(entry)) && !prohibitedScoutDependency.test(context.scoutSource) && !prohibitedRuntime.test(context.productionSource) && context.productionImports.every((entry) => !prohibited.test(entry)), "Prohibited production dependency found.");
}

const CASE_GROUPS = Object.freeze([[36, "contract-factory-identity"], [28, "person-specialization-identity"], [40, "role-assignment-boundary"], [52, "coverage-region-position"], [40, "responsibility-research-boundary"], [40, "evaluation-report-player-prospect"], [32, "coexistence-event-relationship"], [32, "verification-lifecycle-extension"], [20, "exports-dependencies-integration"]]);
const CASE_NAMES = Object.freeze(CASE_GROUPS.flatMap(([count, group]) => Array.from({ length: count }, (_, index) => `${group}-${String(index + 1).padStart(3, "0")}`)));
async function checkForIndex(index, context) { if (index < 36) return identityFactoryChecks(); if (index < 64) return personIdentityChecks(); if (index < 104) return roleAssignmentChecks(); if (index < 156) return coverageChecks(); if (index < 196) return responsibilityResearchChecks(); if (index < 236) return referenceBoundaryChecks(); if (index < 268) return coexistEventRelationshipChecks(); if (index < 300) return verificationExtensionChecks(); return integrationChecks(context); }
async function buildContext() {
  const sources = Object.fromEntries(PRODUCTION_FILES.map((file) => [file, readFileSync(file, "utf8")])); const executiveProfileFoundation = await runFidExecutiveProfileFoundationDiagnostics();
  const scoutSource = sources[resolve(ROOT, "contracts/ScoutProfileContract.js")]; const otherContractSources = Object.entries(sources).filter(([file]) => /contracts[/\\].+Contract\.js$/.test(file) && !/ScoutProfileContract\.js$/.test(file)).map(([, source]) => source);
  return { scoutSource, scoutImports: imports(scoutSource), otherContractImports: otherContractSources.flatMap(imports), productionImports: Object.values(sources).flatMap(imports), productionSource: Object.values(sources).join("\n"), dependencyGraph: graph(sources), suiteSummaries: { ...executiveProfileFoundation.suiteSummaries, executiveProfileFoundation } };
}

export async function runScoutProfileContractDiagnostics({ throwOnFailure = false } = {}) {
  const context = await buildContext(); const cases = [];
  for (let index = 0; index < CASE_NAMES.length; index += 1) { const id = CASE_NAMES[index]; try { await checkForIndex(index, context); cases.push({ id, passed: true, message: `${id} passed.`, details: null }); } catch (failure) { cases.push({ id, passed: false, message: typeof failure?.message === "string" ? failure.message : `${id} failed.`, details: failure?.details ?? null }); } }
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const summary = { suite: SUITE, contractVersion: fidApi.SCOUT_PROFILE_CONTRACT_VERSION, schemaVersion: fidApi.SCOUT_PROFILE_SCHEMA_VERSION, total: cases.length, passed, failed, cases, suiteSummaries: context.suiteSummaries };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runScoutProfileContractDiagnostics });
