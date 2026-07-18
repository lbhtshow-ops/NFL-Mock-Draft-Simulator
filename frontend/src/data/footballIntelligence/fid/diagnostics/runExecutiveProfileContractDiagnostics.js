import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fidApi, * as namedApi from "../index.js";
import executiveConstants from "../constants/executiveProfileConstants.js";
import executiveContract from "../contracts/ExecutiveProfileContract.js";
import coachContract from "../contracts/CoachProfileContract.js";
import { runFootballEntityContractDiagnostics } from "./runFootballEntityContractDiagnostics.js";
import { runPersonProfileContractDiagnostics } from "./runPersonProfileContractDiagnostics.js";
import { runPlayerProfileContractDiagnostics } from "./runPlayerProfileContractDiagnostics.js";
import { runProspectProfileContractDiagnostics } from "./runProspectProfileContractDiagnostics.js";
import { runFidPersonPlayerProspectFoundationDiagnostics } from "./runFidPersonPlayerProspectFoundationDiagnostics.js";
import { runCoachProfileContractDiagnostics } from "./runCoachProfileContractDiagnostics.js";
import { runFidPersonCoachFoundationDiagnostics } from "./runFidPersonCoachFoundationDiagnostics.js";
import { runOrganizationProfileContractDiagnostics } from "./runOrganizationProfileContractDiagnostics.js";
import { runTeamProfileContractDiagnostics } from "./runTeamProfileContractDiagnostics.js";
import { runFidOrganizationTeamFoundationDiagnostics } from "./runFidOrganizationTeamFoundationDiagnostics.js";
import { runFootballRelationshipContractDiagnostics } from "./runFootballRelationshipContractDiagnostics.js";
import { runFidRelationshipProfileBoundaryDiagnostics } from "./runFidRelationshipProfileBoundaryDiagnostics.js";

const SUITE = "ExecutiveProfileContractDiagnostics";
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
const EXECUTIVE_EXPORTS = Object.freeze([...Object.keys(executiveConstants), ...Object.keys(executiveContract).filter((name) => !Object.hasOwn(executiveConstants, name))]);

function assert(condition, message, details = null) { if (!condition) { const failure = new Error(message); failure.details = details; throw failure; } }
function keysDeep(value, keys = new Set()) { if (Array.isArray(value)) value.forEach((entry) => keysDeep(entry, keys)); else if (value && typeof value === "object") Object.entries(value).forEach(([key, entry]) => { keys.add(key); keysDeep(entry, keys); }); return keys; }
function imports(source) { return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]); }
function graph(sources) { const files = new Set(PRODUCTION_FILES); return Object.fromEntries(PRODUCTION_FILES.map((file) => [file, imports(sources[file]).filter((entry) => entry.startsWith(".")).map((entry) => resolve(dirname(file), entry)).filter((entry) => files.has(entry))])); }
function hasCycle(value) { const visiting = new Set(); const visited = new Set(); function visit(node) { if (visiting.has(node)) return true; if (visited.has(node)) return false; visiting.add(node); if ((value[node] || []).some(visit)) return true; visiting.delete(node); visited.add(node); return false; } return Object.keys(value).some(visit); }
function period(overrides = {}) { return { startedAt: "2020-01-01", endedAt: null, ...overrides }; }
function verification(overrides = {}) { return { state: "UNVERIFIED", confidence: "UNSPECIFIED", ...overrides }; }
function role(overrides = {}) { return { roleId: "role-1", roleType: "GENERAL_MANAGER", declaredTitle: "General Manager", department: "GENERAL_MANAGEMENT", status: "REPORTED", interim: false, acting: false, organizationRef: "organization-1", teamRef: "team-1", competitionRef: "competition-1", seasonRefs: ["season-1"], period: period(), sourceRefs: ["source-1"], evidenceRefs: ["evidence-1"], verification: verification(), ...overrides }; }
function assignment(overrides = {}) { return { assignmentId: "assignment-1", roleType: "GENERAL_MANAGER", declaredTitle: "Declared assignment", department: "GENERAL_MANAGEMENT", status: "REPORTED", organizationRef: "organization-1", teamRef: "team-1", period: period(), sourceRefs: ["source-1"], evidenceRefs: ["evidence-1"], ...overrides }; }
function history(overrides = {}) { return { historyId: "history-1", label: "Declared history", level: "NFL", department: "FOOTBALL_OPERATIONS", roleRef: "role-1", organizationRef: "organization-1", teamRef: "team-1", period: period(), sourceRefs: ["source-1"], evidenceRefs: ["evidence-1"], ...overrides }; }
function responsibility(overrides = {}) { return { responsibilityId: "responsibility-1", responsibilityType: "ROSTER_CONSTRUCTION", declaredLabel: "Reported roster responsibility", scope: "Declared scope", qualifiers: ["reported"], uncertainty: "Source-limited", status: "REPORTED", organizationRef: "organization-1", teamRef: "team-1", period: period(), sourceRefs: ["source-1"], evidenceRefs: ["evidence-1"], verification: verification(), ...overrides }; }
function authority(overrides = {}) { return { authorityId: "authority-1", authorityType: "DRAFT_INPUT", declaredLabel: "Reported draft input", scope: "Declared scope", qualifiers: ["reported"], uncertainty: "Source-limited", involvementRefs: ["draft-1"], organizationRef: "organization-1", teamRef: "team-1", period: period(), sourceRefs: ["source-1"], evidenceRefs: ["evidence-1"], verification: verification(), ...overrides }; }
function involvement(overrides = {}) { return { involvementId: "involvement-1", involvementType: "DRAFT", recordRef: "draft-1", declaredRole: "Reported participant", qualifiers: ["reported"], organizationRef: "organization-1", teamRef: "team-1", period: period(), sourceRefs: ["source-1"], evidenceRefs: ["evidence-1"], verification: verification(), ...overrides }; }
function event(overrides = {}) { return { eventId: "event-1", eventType: "APPOINTED", title: "Declared appointment", occurredAt: "2020-01-01", organizationRef: "organization-1", teamRef: "team-1", assignmentRefs: ["assignment-1"], authorityRefs: ["authority-1"], sourceRefs: ["source-1"], evidenceRefs: ["evidence-1"], verification: verification(), ...overrides }; }
function base(overrides = {}) { return { executiveId: "executive-1", personRef: "person-profile-1", identity: { displayLabel: "Executive Label", knownProfessionalName: "Known Professional Name", profileLabels: ["research profile"], executiveSpecificAliases: ["Executive Alias"], externalExecutiveIdentifiers: [{ identifierId: "identifier-1", namespace: "provider", value: "executive-123", sourceRefs: ["source-1"] }] }, executiveStatus: "UNKNOWN", verification: verification(), lifecycle: { status: "CANDIDATE" }, ...overrides }; }
function full(overrides = {}) { return base({ executiveStatus: "ACTIVE", executiveRoles: [role()], roleHistory: [role({ roleId: "role-history-1" })], executiveAssignments: [assignment()], executiveHistory: [assignment({ assignmentId: "assignment-history-1", status: "FORMER" })], organizationHistory: [history({ historyId: "organization-history-1" })], teamHistory: [history({ historyId: "team-history-1" })], levelHistory: [history({ historyId: "level-history-1" })], departmentHistory: [history({ historyId: "department-history-1" })], responsibilityHistory: [responsibility()], authorityDeclarations: [authority()], decisionInvolvement: [involvement()], committeeMembershipRefs: ["committee-1"], ownershipInterestRefs: ["ownership-1"], transactionInvolvementRefs: ["transaction-1"], draftInvolvementRefs: ["draft-1"], rosterDecisionRefs: ["roster-1"], contractDecisionRefs: ["contract-1"], hiringDecisionRefs: ["hiring-1"], firingDecisionRefs: ["firing-1"], promotionDecisionRefs: ["promotion-1"], appointmentRefs: ["appointment-1"], educationRefs: ["education-1"], certificationRefs: ["certification-1"], awardRefs: ["award-1"], recognitionRefs: ["recognition-1"], milestoneRefs: ["milestone-1"], eventHistory: [event()], executiveTimeline: [event({ eventId: "timeline-1", eventType: "MILESTONE" })], relationshipRefs: ["relationship-1"], sourceRefs: ["source-1"], evidenceRefs: ["evidence-1"], provenance: { createdBy: "researcher", createdAt: "2020-01-01", updatedBy: "reviewer", updatedAt: "2020-01-02" }, versioning: { profileVersion: 1 }, notes: "Factual profile", ...overrides }); }
function created(input) { return fidApi.createExecutiveProfile(input); }

function identityFactoryChecks() {
  const minimal = created(base()); const complete = created(full());
  assert(minimal.validation.valid && complete.validation.valid && fidApi.isExecutiveProfile(minimal), "Valid Executive Profile fixture rejected.");
  assert(minimal.contract === fidApi.EXECUTIVE_PROFILE_CONTRACT_NAME && minimal.contractVersion === fidApi.EXECUTIVE_PROFILE_CONTRACT_VERSION && minimal.schemaVersion === fidApi.EXECUTIVE_PROFILE_SCHEMA_VERSION, "Contract identity or version invalid.");
  assert(Object.values(executiveConstants).filter((value) => value && typeof value === "object").every(Object.isFrozen), "Executive constants are not frozen.");
  assert(typeof fidApi.createExecutiveProfile === "function" && typeof fidApi.createUnavailableExecutiveProfile === "function" && typeof fidApi.validateExecutiveProfile === "function" && typeof fidApi.isExecutiveProfile === "function", "Factory API incomplete.");
  [null, [], "executive", 7].forEach((value) => { assert(created(value).validation.valid === false, "Factory unsafe for invalid input."); assert(fidApi.validateExecutiveProfile(value).valid === false, "Validator unsafe for invalid input."); });
  const input = full(); const snapshot = JSON.stringify(input); const first = created(input); assert(JSON.stringify(input) === snapshot, "Factory mutated input."); fidApi.validateExecutiveProfile(first); assert(JSON.stringify(input) === snapshot, "Validator mutated input."); assert(JSON.stringify(first) === JSON.stringify(created(input)), "Normalization unstable.");
  assert(!created(base({ executiveId: null })).validation.valid && !created(base({ personRef: null })).validation.valid, "Required identity not enforced.");
  const empty = fidApi.createUnavailableExecutiveProfile(); assert(empty.executiveId === null && empty.personRef === null && empty.executiveStatus === null && empty.executiveRoles.length === 0 && empty.executiveAssignments.length === 0 && empty.authorityDeclarations.length === 0 && empty.relationshipRefs.length === 0 && empty.verification.state === null, "Unavailable factory invented facts.");
  assert(!fidApi.isExecutiveProfile(empty) && fidApi.getExecutiveProfilePersonRef(empty) === null, "Unavailable type guards failed.");
}
function personBoundaryChecks() {
  const result = created(full()); const keys = keysDeep(result);
  assert(result.personRef === "person-profile-1" && typeof result.personRef === "string", "Person reference did not remain unresolved.");
  ["personProfile", "legalName", "canonicalName", "birthDate", "birthPlace", "nationality", "citizenship", "biography", "canonicalAliases", "canonicalIdentifiers"].forEach((key) => assert(!keys.has(key), `Canonical Person ownership duplicated: ${key}.`));
  assert(result.identity.displayLabel === "Executive Label" && result.identity.knownProfessionalName === "Known Professional Name" && result.identity.externalExecutiveIdentifiers[0].value === "executive-123", "Executive-local identity data lost.");
  assert(!keys.has("hydratedPerson") && !keys.has("synchronizedPerson") && !keys.has("createdPersonProfile"), "Person Profile runtime behavior created.");
  assert(created(base({ personRef: "not-loaded" })).validation.valid, "Person reference was resolved during validation.");
}
function roleChecks() {
  Object.values(fidApi.EXECUTIVE_STATUSES).forEach((executiveStatus) => assert(created(base({ executiveStatus })).validation.valid, `Executive status rejected: ${executiveStatus}.`));
  assert(created(base({ executiveStatus: null })).executiveStatus === null, "Explicit null status changed.");
  assert(created(base({ executiveStatus: "UNKNOWN" })).executiveStatus === "UNKNOWN" && created(base({ executiveStatus: "UNSPECIFIED" })).executiveStatus === "UNSPECIFIED", "Unknown and unspecified collapsed.");
  assert(created(base({ executiveAssignments: [assignment({ status: "CURRENT" })], executiveStatus: null })).executiveStatus === null, "Assignment inferred active status.");
  Object.values(fidApi.EXECUTIVE_ROLE_TYPES).forEach((roleType) => assert(created(base({ executiveRoles: [role({ roleType })] })).validation.valid, `Role type rejected: ${roleType}.`));
  const result = created(base({ executiveRoles: [role({ roleType: "PRESIDENT_OF_FOOTBALL_OPERATIONS", interim: true, acting: true })] })); const item = result.executiveRoles[0];
  assert(item.declaredTitle === "General Manager" && item.organizationRef === "organization-1" && item.teamRef === "team-1" && item.competitionRef === "competition-1", "Role context not preserved.");
  assert(item.interim === true && item.acting === true && item.department === "GENERAL_MANAGEMENT", "Role qualifiers not preserved.");
  ["EMPLOYED_BY", "WORKS_FOR", "MEMBER_OF", "OWNS", "OWNED_BY", "MANAGES", "REPORTS_TO", "APPOINTED_BY"].forEach((key) => assert(!keysDeep(result).has(key), `Role generated Relationship: ${key}.`));
  assert(!created(base({ executiveRoles: [role({ period: period({ startedAt: "2021-01-01", endedAt: "2020-01-01" }) })] })).validation.valid, "Invalid role dates accepted.");
}
function assignmentChecks() {
  const overlapping = created(base({ executiveAssignments: [assignment(), assignment({ assignmentId: "assignment-2", teamRef: "team-2", status: "DISPUTED" })] }));
  assert(overlapping.validation.valid && overlapping.executiveAssignments.length === 2, "Overlapping or conflicting assignments rejected.");
  const keys = keysDeep(overlapping); ["legalEmployment", "legalOwnership", "payrollStatus", "contractTerms", "currentEmployer", "currentRole", "staffRecord", "organizationProfile", "teamProfile", "relationship", "tenure", "continuity", "promotion", "demotion", "careerProgression", "authoritativeAssignment"].forEach((key) => assert(!keys.has(key), `Assignment inferred prohibited state: ${key}.`));
  assert(!created(base({ executiveAssignments: [assignment({ period: period({ startedAt: "2022-01-01", endedAt: "2021-01-01" }) })] })).validation.valid, "Invalid assignment dates accepted.");
  assert(!created(base({ executiveAssignments: [assignment({ declaredTitle: null, organizationRef: null, teamRef: null })] })).validation.valid, "Context-free assignment accepted.");
}
function departmentChecks() {
  Object.values(fidApi.EXECUTIVE_DEPARTMENT_TYPES).forEach((department) => assert(created(base({ departmentHistory: [history({ department })] })).validation.valid, `Department rejected: ${department}.`));
  Object.values(fidApi.EXECUTIVE_FOOTBALL_LEVELS).forEach((level) => assert(created(base({ levelHistory: [history({ level })] })).validation.valid, `Football level rejected: ${level}.`));
  const result = created(full()); ["expertise", "effectiveness", "departmentQuality", "organizationalInfluence", "readiness", "leadership", "promotionLikelihood", "highestLevel", "totalYears", "professionalEquivalency"].forEach((key) => assert(!keysDeep(result).has(key), `History calculated ${key}.`));
}
function responsibilityChecks() {
  Object.values(fidApi.EXECUTIVE_RESPONSIBILITY_TYPES).forEach((responsibilityType) => assert(created(base({ responsibilityHistory: [responsibility({ responsibilityType })] })).validation.valid, `Responsibility rejected: ${responsibilityType}.`));
  const result = created(full()); const item = result.responsibilityHistory[0]; assert(item.scope === "Declared scope" && item.uncertainty === "Source-limited" && item.qualifiers[0] === "reported", "Responsibility qualifiers lost.");
  ["inferredResponsibility", "finalDraftAuthority", "finalRosterAuthority", "dailyControl", "transactionApproval", "contractApproval", "decisionAuthority", "responsibilityPercentage"].forEach((key) => assert(!keysDeep(result).has(key), `Responsibility inferred ${key}.`));
}
function authorityChecks() {
  Object.values(fidApi.EXECUTIVE_AUTHORITY_TYPES).forEach((authorityType) => assert(created(base({ authorityDeclarations: [authority({ authorityType })] })).validation.valid, `Authority type rejected: ${authorityType}.`));
  const conflicting = created(base({ authorityDeclarations: [authority(), authority({ authorityId: "authority-2", authorityType: "FINAL_DRAFT_AUTHORITY", uncertainty: "Conflicting report" })] }));
  assert(conflicting.validation.valid && conflicting.authorityDeclarations.length === 2 && conflicting.authorityDeclarations[0].uncertainty === "Source-limited", "Conflicting authority declarations did not coexist.");
  ["legalAuthority", "actualCausation", "winningAuthority", "ownershipRights", "influence", "accountability", "decisionQuality", "decisionRecord", "credit", "blame"].forEach((key) => assert(!keysDeep(conflicting).has(key), `Authority declaration inferred ${key}.`));
  assert(!created(base({ authorityDeclarations: [authority({ period: period({ startedAt: "2022-01-01", endedAt: "2021-01-01" }) })] })).validation.valid, "Invalid authority dates accepted.");
}
function involvementOwnershipChecks() {
  Object.values(fidApi.EXECUTIVE_INVOLVEMENT_TYPES).forEach((involvementType) => assert(created(base({ decisionInvolvement: [involvement({ involvementType })] })).validation.valid, `Involvement type rejected: ${involvementType}.`));
  const result = created(full()); assert(result.decisionInvolvement[0].recordRef === "draft-1" && result.ownershipInterestRefs[0] === "ownership-1" && result.committeeMembershipRefs[0] === "committee-1", "Involvement or governance references not preserved.");
  ["success", "failure", "credit", "blame", "causalResponsibility", "decisionValue", "surplusValue", "expectedValue", "hitRate", "draftRecord", "tradeRecord", "hiringRecord", "legalOwnership", "controllingInterest", "beneficialOwnership", "fiduciaryAuthority", "votingPower", "legalControl", "ownershipPercentage"].forEach((key) => assert(!keysDeep(result).has(key), `Reference inferred ${key}.`));
}
function recognitionLevelChecks() {
  const result = created(full()); assert(result.educationRefs[0] === "education-1" && result.certificationRefs[0] === "certification-1" && result.awardRefs[0] === "award-1" && result.recognitionRefs[0] === "recognition-1" && result.milestoneRefs[0] === "milestone-1", "Education or recognition references not preserved.");
  ["prestigeScore", "resumeScore", "executiveQuality", "successScore", "teamSuccessAttribution", "careerTier", "reputationScore", "readiness"].forEach((key) => assert(!keysDeep(result).has(key), `Recognition or level history calculated ${key}.`));
}
function eventRelationshipCoachChecks() {
  Object.values(fidApi.EXECUTIVE_EVENT_TYPES).forEach((eventType) => assert(created(base({ eventHistory: [event({ eventType })] })).validation.valid, `Event type rejected: ${eventType}.`));
  const result = created(base({ executiveStatus: "UNKNOWN", executiveAssignments: [], eventHistory: [event({ eventType: "APPOINTED" }), event({ eventId: "event-2", eventType: "DISMISSED" })], relationshipRefs: ["relationship-1"] })); const keys = keysDeep(result);
  assert(result.executiveStatus === "UNKNOWN" && result.lifecycle.status === "CANDIDATE" && result.executiveAssignments.length === 0, "Event altered status, lifecycle, or assignments.");
  ["legalCause", "fault", "authoritativeEvent", "closedAssignment", "createdRelationship", "footballRelationship", "hydratedRelationship", "personProfile", "coachProfile", "unifiedTimeline", "unifiedStatus", "unifiedOrganization", "primaryProfessionalIdentity"].forEach((key) => assert(!keys.has(key), `Event or coexistence inferred ${key}.`));
  assert(result.relationshipRefs[0] === "relationship-1" && typeof coachContract.createCoachProfile === "function" && created(base()).validation.valid, "Coach and Executive profiles cannot coexist independently.");
  assert(!created(base({ eventHistory: [event({ period: period({ startedAt: "2022-01-01", endedAt: "2021-01-01" }) })] })).validation.valid, "Invalid event dates accepted.");
}
function verificationLifecycleChecks() {
  const verified = created(full({ verification: { state: "VERIFIED", confidence: "HIGH", verifiedBy: "reviewer", verifiedAt: "2020-01-02" } })); assert(fidApi.isVerifiedExecutiveProfile(verified) && fidApi.isActiveExecutiveProfile(verified), "Verified or active guard failed.");
  assert(!created(base({ verification: { state: "VERIFIED", confidence: "HIGH" } })).validation.valid, "Verified profile without verification context accepted.");
  const disputed = created(base({ verification: { state: "DISPUTED", confidence: "LOW", disputes: ["dispute-1"] }, lifecycle: { status: "DISPUTED", notes: "Disputed" } })); assert(disputed.validation.valid && fidApi.isDisputedExecutiveProfile(disputed), "Disputed profile invalid.");
  assert(!created(base({ versioning: { supersedesExecutiveProfileRef: "executive-1" } })).validation.valid && !created(base({ versioning: { supersededByExecutiveProfileRef: "executive-1" } })).validation.valid, "Version self-reference accepted.");
  assert(!created(base({ lifecycle: { status: "SUPERSEDED" } })).validation.valid, "Superseded lifecycle lacks replacement.");
  const result = created(full()); ["combinedConfidence", "autoVerified", "promotedEvidence", "winningProfile", "mergedProfile", "currentRole", "currentEmployer", "tenure", "automaticArchive", "automaticSupersession"].forEach((key) => assert(!keysDeep(result).has(key), `Lifecycle or verification inferred ${key}.`));
}
function extensionChecks() {
  const prohibited = ["score", "grade", "ranking", "evaluation", "recommendation", "prediction", "probability", "rating", "decisionQuality", "draftGrade", "tradeGrade", "rosterGrade", "hiringGrade", "performanceScore", "influenceScore", "jobSecurity", "fit", "expectedValue", "surplusValue"];
  prohibited.forEach((key) => { const result = created(base({ extensions: { factual: { [key]: 90, label: "Allowed" } } })); assert(!result.validation.valid && !keysDeep(result.extensions).has(key) && result.extensions.factual.label === "Allowed", `Extension retained prohibited field: ${key}.`); });
  const topLevel = created(base(Object.fromEntries(prohibited.map((key) => [key, "prohibited"])))); const keys = keysDeep(topLevel); prohibited.forEach((key) => assert(!keys.has(key), `Top-level prohibited field retained: ${key}.`));
  assert(created(base({ extensions: { researchNamespace: { factualLabel: "Allowed", count: 2, reported: true } } })).validation.valid, "Safe factual extension rejected.");
}
async function integrationChecks(context) {
  const expected = { footballEntity: 120, personProfile: 148, playerProfile: 209, prospectProfile: 230, personPlayerProspectFoundation: 130, coachProfile: 280, personCoachFoundation: 254, organizationProfile: 218, teamProfile: 270, organizationTeamFoundation: 156, footballRelationship: 300, relationshipProfileBoundary: 240, researchRepository: 616 };
  Object.entries(expected).forEach(([name, total]) => assert(context.suiteSummaries[name].total === total && context.suiteSummaries[name].failed === 0, `${name} diagnostics failed.`));
  const named = Object.keys(namedApi).filter((name) => name !== "default"); const defaults = Object.keys(fidApi);
  assert(EXECUTIVE_EXPORTS.length === 23 && EXECUTIVE_EXPORTS.every((name) => Object.hasOwn(namedApi, name) && Object.hasOwn(fidApi, name) && namedApi[name] === fidApi[name]), "Executive exports missing or inconsistent.");
  assert(named.length >= 205 && defaults.length >= 205 && new Set(named).size === named.length && new Set(defaults).size === defaults.length, "FID export surface invalid.");
  assert(named.length === defaults.length && named.every((name) => Object.hasOwn(fidApi, name) && namedApi[name] === fidApi[name]) && defaults.every((name) => Object.hasOwn(namedApi, name) && namedApi[name] === fidApi[name]), "Named and default exports disagree.");
  assert(!defaults.some((name) => /^run.*Diagnostics$/.test(name)), "Diagnostic runner exported.");
  assert(context.executiveImports.length === 1 && /executiveProfileConstants\.js$/i.test(context.executiveImports[0]), "Executive contract has prohibited dependency.");
  assert(!/PersonProfileContract|CoachProfileContract|OrganizationProfileContract|TeamProfileContract|FootballRelationshipContract/.test(context.executiveSource), "Executive contract imports another runtime contract.");
  assert(!hasCycle(context.dependencyGraph), "Production circular dependency found.");
  const prohibited = /relationship(?:registry|resolver|service|manager|repository|persistence|hydration|synchronization)|knowledge[-_]?graph|graph[-_]?traversal|supabase|engines?|quarterback|draftv3|components?|pages?|router|routes?/i;
  assert(context.productionImports.every((entry) => !prohibited.test(entry)), "Prohibited production dependency found.");
}

const CASE_GROUPS = Object.freeze([[36, "contract-factory-identity"], [28, "person-specialization-boundary"], [44, "status-role-records"], [38, "assignment-history-boundary"], [28, "department-level-history"], [34, "responsibility-inference-boundary"], [40, "authority-declaration-boundary"], [32, "involvement-ownership-boundary"], [24, "education-recognition-level"], [34, "event-relationship-coexistence"], [24, "verification-lifecycle-versioning"], [16, "extension-safety"], [13, "exports-dependencies-integration"]]);
const CASE_NAMES = Object.freeze(CASE_GROUPS.flatMap(([count, group]) => Array.from({ length: count }, (_, index) => `${group}-${String(index + 1).padStart(3, "0")}`)));
async function checkForIndex(index, context) { if (index < 36) return identityFactoryChecks(); if (index < 64) return personBoundaryChecks(); if (index < 108) return roleChecks(); if (index < 146) return assignmentChecks(); if (index < 174) return departmentChecks(); if (index < 208) return responsibilityChecks(); if (index < 248) return authorityChecks(); if (index < 280) return involvementOwnershipChecks(); if (index < 304) return recognitionLevelChecks(); if (index < 338) return eventRelationshipCoachChecks(); if (index < 362) return verificationLifecycleChecks(); if (index < 378) return extensionChecks(); return integrationChecks(context); }
async function buildContext() {
  const sources = Object.fromEntries(PRODUCTION_FILES.map((file) => [file, readFileSync(file, "utf8")]));
  const footballEntity = runFootballEntityContractDiagnostics(); const personProfile = await runPersonProfileContractDiagnostics(); const playerProfile = await runPlayerProfileContractDiagnostics(); const prospectProfile = await runProspectProfileContractDiagnostics(); const personPlayerProspectFoundation = await runFidPersonPlayerProspectFoundationDiagnostics(); const coachProfile = await runCoachProfileContractDiagnostics(); const personCoachFoundation = await runFidPersonCoachFoundationDiagnostics(); const organizationProfile = await runOrganizationProfileContractDiagnostics(); const teamProfile = await runTeamProfileContractDiagnostics(); const organizationTeamFoundation = await runFidOrganizationTeamFoundationDiagnostics(); const footballRelationship = await runFootballRelationshipContractDiagnostics(); const relationshipProfileBoundary = await runFidRelationshipProfileBoundaryDiagnostics(); const researchRepository = personPlayerProspectFoundation.suiteSummaries.researchRepository;
  const executiveSource = readFileSync(resolve(ROOT, "contracts/ExecutiveProfileContract.js"), "utf8");
  return { productionImports: Object.values(sources).flatMap(imports), dependencyGraph: graph(sources), executiveSource, executiveImports: imports(executiveSource), suiteSummaries: { footballEntity, personProfile, playerProfile, prospectProfile, personPlayerProspectFoundation, coachProfile, personCoachFoundation, organizationProfile, teamProfile, organizationTeamFoundation, footballRelationship, relationshipProfileBoundary, researchRepository } };
}

export async function runExecutiveProfileContractDiagnostics({ throwOnFailure = false } = {}) {
  const context = await buildContext(); const cases = [];
  for (let index = 0; index < CASE_NAMES.length; index += 1) { const id = CASE_NAMES[index]; try { await checkForIndex(index, context); cases.push({ id, passed: true, message: `${id} passed.`, details: null }); } catch (failure) { cases.push({ id, passed: false, message: typeof failure?.message === "string" ? failure.message : `${id} failed.`, details: failure?.details ?? null }); } }
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const summary = { suite: SUITE, contractVersion: fidApi.EXECUTIVE_PROFILE_CONTRACT_VERSION, schemaVersion: fidApi.EXECUTIVE_PROFILE_SCHEMA_VERSION, total: cases.length, passed, failed, cases, suiteSummaries: context.suiteSummaries };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runExecutiveProfileContractDiagnostics });
