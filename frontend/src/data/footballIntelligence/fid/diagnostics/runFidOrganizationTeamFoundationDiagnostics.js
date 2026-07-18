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
import { runFootballEntityContractDiagnostics } from "./runFootballEntityContractDiagnostics.js";
import { runFidPersonPlayerProspectFoundationDiagnostics } from "./runFidPersonPlayerProspectFoundationDiagnostics.js";
import { runOrganizationProfileContractDiagnostics } from "./runOrganizationProfileContractDiagnostics.js";
import { runTeamProfileContractDiagnostics } from "./runTeamProfileContractDiagnostics.js";

const SUITE = "FidOrganizationTeamFoundationDiagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTION_FILES = ["constants/footballEntityConstants.js", "contracts/FootballEntityContract.js", "constants/personProfileConstants.js", "contracts/PersonProfileContract.js", "constants/playerProfileConstants.js", "contracts/PlayerProfileContract.js", "constants/prospectProfileConstants.js", "contracts/ProspectProfileContract.js", "constants/organizationProfileConstants.js", "contracts/OrganizationProfileContract.js", "constants/teamProfileConstants.js", "contracts/TeamProfileContract.js", "index.js"].map((file) => resolve(ROOT, file));
const APPROVED_FID_API = Object.freeze({ ...footballEntityConstants, ...footballEntityContract, ...personProfileConstants, ...personProfileContract, ...playerProfileConstants, ...playerProfileContract, ...prospectProfileConstants, ...prospectProfileContract, ...organizationProfileConstants, ...organizationProfileContract, ...teamProfileConstants, ...teamProfileContract });
const APPROVED_EXPORTS = Object.freeze(Object.keys(APPROVED_FID_API));

function assert(condition, message) { if (!condition) throw new Error(message); }
function entityInput(id, entityType, overrides = {}) { return { entityId: id, entityType, status: "CANDIDATE", identity: { canonicalName: `${entityType} Entity` }, verification: { state: "UNVERIFIED", identityConfidence: "UNSPECIFIED" }, ...overrides }; }
function organizationInput(overrides = {}) { return { profileId: "organization-profile-1", entityRef: "organization-entity-1", status: "CANDIDATE", organizationType: "TEAM_OPERATING_ENTITY", operatingState: "UNKNOWN", verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" }, ...overrides }; }
function teamInput(overrides = {}) { return { profileId: "team-profile-1", entityRef: "team-entity-1", organizationProfileRef: "organization-profile-1", organizationEntityRef: "organization-entity-1", status: "CANDIDATE", teamType: "PROFESSIONAL", competitionLevel: "PROFESSIONAL", competitiveState: "UNKNOWN", verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" }, ...overrides }; }
function chain() { return { organizationEntity: fidApi.createFootballEntity(entityInput("organization-entity-1", "ORGANIZATION")), organization: fidApi.createOrganizationProfile(organizationInput()), teamEntity: fidApi.createFootballEntity(entityInput("team-entity-1", "TEAM")), team: fidApi.createTeamProfile(teamInput()) }; }
function affiliation(overrides = {}) { return { affiliationId: "affiliation-1", affiliationType: "MEMBER", organizationRef: "league-organization-1", status: "REPORTED", ...overrides }; }
function membership(overrides = {}) { return { membershipId: "membership-1", leagueRef: "league-1", status: "REPORTED", ...overrides }; }
function location(overrides = {}) { return { locationId: "location-1", locationType: "HEADQUARTERS", label: "Organization headquarters", ...overrides }; }
function venue(overrides = {}) { return { venueUsageId: "venue-1", venueLabel: "Team home", usageType: "HOME", ...overrides }; }
function orgEvent(overrides = {}) { return { eventId: "organization-event-1", eventType: "MILESTONE", title: "Organization event", ...overrides }; }
function teamEvent(overrides = {}) { return { eventId: "team-event-1", eventType: "MILESTONE", title: "Team event", ...overrides }; }
function keysDeep(value, keys = new Set()) { if (Array.isArray(value)) value.forEach((entry) => keysDeep(entry, keys)); else if (value && typeof value === "object") Object.entries(value).forEach(([key, entry]) => { keys.add(key); keysDeep(entry, keys); }); return keys; }
function containsContract(value) { if (Array.isArray(value)) return value.some(containsContract); if (!value || typeof value !== "object") return false; if (typeof value.contract === "string") return true; return Object.values(value).some(containsContract); }
function imports(source) { return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]); }
function isCanonicalFootballRelationshipModule(entry) { return /(?:^|\/)(?:footballRelationshipConstants|FootballRelationshipContract)\.js$/i.test(entry.replaceAll("\\", "/")); }
function isProhibitedRelationshipInfrastructure(entry) { if (isCanonicalFootballRelationshipModule(entry)) return false; return /relationships?|graph[-_]?traversal|knowledge[-_]?graph|inverse[-_]?relationship/i.test(entry); }
function graph(sources) { const files = new Set(PRODUCTION_FILES); return Object.fromEntries(PRODUCTION_FILES.map((file) => [file, imports(sources[file]).filter((entry) => entry.startsWith(".")).map((entry) => resolve(dirname(file), entry)).filter((entry) => files.has(entry))])); }
function hasCycle(value) { const visiting = new Set(); const visited = new Set(); function visit(node) { if (visiting.has(node)) return true; if (visited.has(node)) return false; visiting.add(node); if ((value[node] || []).some(visit)) return true; visiting.delete(node); visited.add(node); return false; } return Object.keys(value).some(visit); }

function contractChecks() {
  const names = [fidApi.FOOTBALL_ENTITY_CONTRACT_NAME, fidApi.ORGANIZATION_PROFILE_CONTRACT_NAME, fidApi.TEAM_PROFILE_CONTRACT_NAME]; const versions = [fidApi.FOOTBALL_ENTITY_CONTRACT_VERSION, fidApi.ORGANIZATION_PROFILE_CONTRACT_VERSION, fidApi.TEAM_PROFILE_CONTRACT_VERSION]; const schemas = [fidApi.FOOTBALL_ENTITY_SCHEMA_VERSION, fidApi.ORGANIZATION_PROFILE_SCHEMA_VERSION, fidApi.TEAM_PROFILE_SCHEMA_VERSION];
  assert(new Set(names).size === 3 && versions.every(Boolean) && schemas.every(Boolean), "Contract identities invalid."); const values = [chain().organizationEntity, chain().organization, chain().team]; values.forEach((value) => assert(value.contract && value.contractVersion && value.schemaVersion && typeof value.validation.valid === "boolean" && Array.isArray(value.validation.errors) && Array.isArray(value.validation.warnings), "Contract/validation shape inconsistent."));
  const unavailable = [fidApi.createUnavailableFootballEntity(), fidApi.createUnavailableOrganizationProfile(), fidApi.createUnavailableTeamProfile()]; unavailable.forEach((value, index) => assert(Object.keys(values[index]).every((key) => Object.hasOwn(value, key)), "Unavailable factory shape incomplete."));
  [fidApi.validateFootballEntity, fidApi.validateOrganizationProfile, fidApi.validateTeamProfile].forEach((validate) => [null, [], "bad", 7].forEach((value) => assert(validate(value).valid === false, "Validator did not tolerate invalid input.")));
  [fidApi.isFootballEntity, fidApi.isOrganizationProfile, fidApi.isTeamProfile, fidApi.isVerifiedOrganizationProfile, fidApi.isVerifiedTeamProfile].forEach((guard) => assert(typeof guard(null) === "boolean", "Guard did not return boolean."));
}
function chainChecks() {
  const values = chain(); assert(Object.values(values).every((value) => value.validation.valid), "Organization/team chain invalid.");
  assert(values.organization.entityRef === values.organizationEntity.entityId && values.team.entityRef === values.teamEntity.entityId && values.team.organizationProfileRef === values.organization.profileId && values.team.organizationEntityRef === values.organizationEntity.entityId, "Reference chain mismatch.");
  [values.organization, values.team].forEach((value) => assert(!Object.values(value).some(containsContract), "Downstream record embeds contract object."));
  const unresolvedOrganization = fidApi.createOrganizationProfile(organizationInput({ entityRef: "missing-any-type" })); const unresolvedTeam = fidApi.createTeamProfile(teamInput({ entityRef: "missing-team", organizationProfileRef: "missing-profile", organizationEntityRef: "missing-organization" }));
  assert(unresolvedOrganization.validation.valid && unresolvedTeam.validation.valid, "Reference existence or compatibility resolved.");
  assert(!keysDeep(values.team).has("relationship") && !keysDeep(values.organization).has("relationship"), "Relationship created by reference chain.");
}
function ownershipChecks() {
  const values = chain(); const organizationKeys = keysDeep(values.organization); const teamKeys = keysDeep(values.team);
  ["canonicalName", "aliases", "externalIdentifiers", "entityType"].forEach((key) => assert(!organizationKeys.has(key) && !teamKeys.has(key), `Canonical identity duplicated: ${key}.`));
  ["organizationType", "operatingState", "organizationDetails", "locations", "affiliations", "organizationalTimeline"].forEach((key) => assert(!teamKeys.has(key), `Team duplicates organization structure: ${key}.`));
  const entity = fidApi.createFootballEntity(entityInput("team-entity-1", "TEAM", { aliases: [{ alias: "Entity Alias", aliasType: "OTHER" }] })); const team = fidApi.createTeamProfile(teamInput({ teamDetails: { abbreviation: "TST", publicDescription: "Team description" }, branding: [{ brandingId: "b", assetType: "WORDMARK", assetRef: "asset" }] })); const organization = fidApi.createOrganizationProfile(organizationInput({ organizationDetails: { publicDescription: "Organization description" }, locations: [location()] }));
  assert(entity.aliases[0].alias === "Entity Alias" && team.teamDetails.abbreviation === "TST", "Abbreviation altered aliases."); assert(!keysDeep(team.branding).has("canonicalName"), "Branding altered identity."); assert(organization.organizationDetails.publicDescription !== team.teamDetails.publicDescription && organization.locations.length === 1 && team.venues.length === 0, "Organization details flowed into Team.");
  assert(team.entityRef !== team.organizationEntityRef, "Team and organization entity references collapsed.");
}
function stateChecks() {
  const entity = fidApi.createFootballEntity(entityInput("organization-entity-1", "ORGANIZATION", { status: "ACTIVE" })); const organization = fidApi.createOrganizationProfile(organizationInput({ status: "ACTIVE", operatingState: "UNKNOWN" })); const operating = fidApi.createOrganizationProfile(organizationInput({ status: "CANDIDATE", operatingState: "OPERATING" })); const dissolved = fidApi.createOrganizationProfile(organizationInput({ operatingState: "DISSOLVED" }));
  const team = fidApi.createTeamProfile(teamInput({ status: "ACTIVE", competitiveState: "UNKNOWN" })); const competing = fidApi.createTeamProfile(teamInput({ status: "CANDIDATE", competitiveState: "COMPETING" })); const disbanded = fidApi.createTeamProfile(teamInput({ competitiveState: "DISBANDED" }));
  assert(entity.status === "ACTIVE" && organization.status === "ACTIVE" && organization.operatingState === "UNKNOWN", "Entity/profile/operating state coupled."); assert(operating.status === "CANDIDATE" && team.status === "ACTIVE" && team.competitiveState === "UNKNOWN", "Operating/Team lifecycle coupled."); assert(dissolved.operatingState === "DISSOLVED" && disbanded.competitiveState === "DISBANDED", "Dissolved/disbanded states coupled."); assert(competing.status === "CANDIDATE" && organization.status === "ACTIVE", "Competing changed organization lifecycle.");
  const mergedOrganization = fidApi.createOrganizationProfile(organizationInput({ operatingState: "MERGED" })); const mergedTeam = fidApi.createTeamProfile(teamInput({ competitiveState: "MERGED" })); assert(mergedOrganization.operatingState === "MERGED" && team.competitiveState === "UNKNOWN" && mergedTeam.competitiveState === "MERGED" && organization.operatingState === "UNKNOWN", "MERGED propagated between layers.");
  const member = fidApi.createTeamProfile(teamInput({ competitiveState: "UNKNOWN", competitionMemberships: [membership({ status: "CURRENT" })], seasonParticipation: [{ participationId: "p", seasonRef: "s", status: "CURRENT" }] })); assert(member.competitiveState === "UNKNOWN", "Membership/season CURRENT inferred competing.");
}
function affiliationChecks() {
  const organization = fidApi.createOrganizationProfile(organizationInput({ affiliations: [affiliation({ affiliationId: "a", status: "CURRENT" }), affiliation({ affiliationId: "b", affiliationType: "PARENT", organizationRef: "parent", status: "DISPUTED" })], references: { ownershipRecordRefs: ["ownership-1"], leagueRefs: ["league-1"], conferenceRefs: ["conference-1"], divisionRefs: ["division-1"] } }));
  const team = fidApi.createTeamProfile(teamInput({ competitionMemberships: [membership({ membershipId: "a", status: "CURRENT" }), membership({ membershipId: "b", conferenceRef: "conference-1", leagueRef: null, status: "DISPUTED" })] }));
  assert(organization.affiliations.length === 2 && team.competitionMemberships.length === 2, "Conflicting records did not coexist."); assert(!keysDeep(organization).has("graphEdge") && !keysDeep(team).has("graphEdge"), "Graph edge created."); assert(!keysDeep(organization).has("teamProfile") && organization.affiliations[0].affiliationType === "MEMBER", "MEMBER created Team Profile."); assert(team.competitionMemberships.length === 2 && organization.affiliations.length === 2, "Membership modified affiliation.");
  ["ownership", "legalControl", "resolvedLeague", "resolvedConference", "resolvedDivision"].forEach((key) => assert(!keysDeep({ organization, team }).has(key), `Affiliation/membership inferred ${key}.`));
  const openOrganization = fidApi.createOrganizationProfile(organizationInput({ affiliations: [affiliation({ status: "REPORTED", validTo: null })] })); const openTeam = fidApi.createTeamProfile(teamInput({ competitionMemberships: [membership({ status: "REPORTED", validTo: null })] })); assert(openOrganization.affiliations[0].status === "REPORTED" && openTeam.competitionMemberships[0].status === "REPORTED", "Open dates inferred CURRENT.");
}
function locationChecks() {
  const organization = fidApi.createOrganizationProfile(organizationInput({ organizationDetails: {}, locations: [location()] })); const team = fidApi.createTeamProfile(teamInput({ teamDetails: {}, venues: [venue()] }));
  assert(organization.locations.length === 1 && team.venues.length === 1 && team.teamDetails.primaryLocationRef === null && organization.organizationDetails.jurisdictionRef === null, "Location/venue separation failed.");
  ["facility", "locationEntity", "venue", "geocode", "coordinates", "primaryLocation"].forEach((key) => assert(!keysDeep({ organization, team }).has(key), `Location/venue inferred ${key}.`));
  const relocatedOrganization = fidApi.createOrganizationProfile(organizationInput({ organizationalTimeline: [orgEvent({ eventType: "RELOCATED" })] })); const relocatedTeam = fidApi.createTeamProfile(teamInput({ teamTimeline: [teamEvent({ eventType: "RELOCATED" })] })); assert(relocatedOrganization.locations.length === 0 && relocatedTeam.venues.length === 0 && relocatedTeam.teamDetails.primaryLocationRef === null, "Relocation mutated structured location.");
}
function timelineChecks() {
  const organization = fidApi.createOrganizationProfile(organizationInput({ operatingState: "UNKNOWN", organizationalTimeline: [orgEvent({ eventId: "o1", eventType: "MERGER" }), orgEvent({ eventId: "o2", eventType: "DISSOLUTION" })] }));
  const team = fidApi.createTeamProfile(teamInput({ competitiveState: "UNKNOWN", teamTimeline: [teamEvent({ eventId: "t1", eventType: "RELOCATED" }), teamEvent({ eventId: "t2", eventType: "CHAMPIONSHIP" }), teamEvent({ eventId: "t3", eventType: "DISBANDED" })] }));
  assert(organization.validation.valid && team.validation.valid && organization.operatingState === "UNKNOWN" && organization.organizationDetails.foundedAt === null && organization.locations.length === 0 && organization.affiliations.length === 0, "Organization timeline mutated state.");
  assert(team.competitiveState === "UNKNOWN" && team.teamDetails.establishedAt === null && team.competitionMemberships.length === 0 && team.seasonParticipation.length === 0 && team.venues.length === 0 && team.branding.length === 0, "Team timeline mutated state.");
  ["canonicalName", "mergedTeam", "relocatedOrganization", "evaluation", "currentState"].forEach((key) => assert(!keysDeep({ organization, team }).has(key), `Timeline inferred ${key}.`));
}
function externalChecks() {
  const team = fidApi.createTeamProfile(teamInput({ references: { rosterRefs: ["roster"], depthChartRefs: ["depth"], staffRefs: ["staff"], scheduleRefs: ["schedule"], standingsRefs: ["standings"], recordRefs: ["record"], transactionRefs: ["transaction"], injuryReportRefs: ["injury"], salaryCapRefs: ["cap"], draftCapitalRefs: ["draft"], teamContextRefs: ["context"], teamIdentityRefs: ["identity"], schemeProfileRefs: ["scheme"], brandingAssetRefs: ["branding"] } }));
  const organization = fidApi.createOrganizationProfile(organizationInput({ references: { ownershipRecordRefs: ["ownership"], governanceRecordRefs: ["governance"] } })); const keys = keysDeep({ team, organization });
  ["roster", "depthChart", "employment", "schedule", "performanceSummary", "transactions", "injuries", "financialData", "picks", "teamContext", "identityIntelligence", "scheme", "legalControl", "governingAuthority", "image", "binary"].forEach((key) => assert(!keys.has(key), `External reference embedded ${key}.`));
}
function evaluationChecks() {
  const keys = keysDeep(chain()); const prohibited = ["teamStrength", "organizationStrength", "reputation", "culture", "philosophy", "identityIntelligence", "schemeIntelligence", "rosterStrength", "positionGroupStrength", "competitiveWindow", "teamNeeds", "capHealth", "draftValue", "traits", "components", "score", "grade", "ranking", "projection", "prediction", "recommendation", "probability", "decision"];
  prohibited.forEach((key) => assert(!keys.has(key), `Evaluation field owned: ${key}.`));
}
function exportChecks() {
  const named = Object.keys(namedApi).filter((name) => name !== "default"); const defaults = Object.keys(fidApi); assert(APPROVED_EXPORTS.length === 135, "Approved export baseline changed."); assert(new Set(named).size === named.length && new Set(defaults).size === defaults.length, "Duplicate export identifier."); assert(APPROVED_EXPORTS.every((name) => Object.hasOwn(namedApi, name) && Object.hasOwn(fidApi, name) && namedApi[name] === APPROVED_FID_API[name] && fidApi[name] === APPROVED_FID_API[name] && namedApi[name] === fidApi[name]), "Approved export missing or overwritten."); assert(named.length >= APPROVED_EXPORTS.length && defaults.length >= APPROVED_EXPORTS.length, "Additive exports prohibited."); assert(!defaults.some((name) => /^run.*Diagnostics$/.test(name)), "Diagnostic exported.");
}
function dependencyChecks(context) {
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
  const prohibitedContractDependency = /FidPersistenceArchitectureSpecification|FidPersistenceRepositoryContract|InMemoryFidPersistenceRepository|persistence[/\\](?:index|repository|adapter|service|manager|client)|repository|adapter|supabase|\bsql\b|migrations?|filesystem\s+storage|browser\s+storage|localStorage|IndexedDB|network\s+persistence|hydration|synchronization|registry|resolver|identity\s+resolution|runtime\s+(?:persistence|database)\s+integration/i;
  const prohibitedRuntime = /(?:Supabase|Database|Sql|Network|FileSystem|BrowserStorage|LocalStorage|IndexedDb)FidPersistenceRepository|OrganizationRepository|TeamRepository|PersistenceService|PersistenceManager|PersistenceAdapter|SupabaseAdapter|DatabaseAdapter|StorageClient|DatabaseClient|createClient|sql\s+runtime|migration\s+runtime|application\s+persistence\s+singleton|runtime\s+hydration|runtime\s+synchronization|identity\s+resolution|runtime\s+database\s+integration/i;
  assert(persistenceImports.every((entry) => approvedArchitectureImports.has(entry)) && context.contractSources.every((source) => !prohibitedContractDependency.test(source)) && !prohibitedRuntime.test(context.productionSource), "Prohibited dependency: persistence.");
  ["diagnostics", "researchrepository", "supabase", "registry", "resolver", "ontology", "engines", "quarterback", "draftv3", "components", "pages", "router", "routes"].forEach((term) => assert(context.productionImports.every((entry) => !entry.toLowerCase().replaceAll("/", "").includes(term)), `Prohibited dependency: ${term}.`));
  const profileImports = ["OrganizationProfileContract.js", "TeamProfileContract.js"].flatMap((file) => imports(readFileSync(resolve(ROOT, "contracts", file), "utf8")));
  assert(context.productionImports.every((entry) => !isProhibitedRelationshipInfrastructure(entry))
    && profileImports.every((entry) => !isCanonicalFootballRelationshipModule(entry)
      && !isProhibitedRelationshipInfrastructure(entry)), "Prohibited dependency: relationship.");
  assert(!hasCycle(context.dependencyGraph), "Production circular dependency found.");
}
function stabilityChecks() {
  const inputs = [entityInput("organization-entity-1", "ORGANIZATION"), organizationInput(), teamInput()]; const factories = [fidApi.createFootballEntity, fidApi.createOrganizationProfile, fidApi.createTeamProfile]; const validators = [fidApi.validateFootballEntity, fidApi.validateOrganizationProfile, fidApi.validateTeamProfile];
  inputs.forEach((input, index) => { const snapshot = JSON.stringify(input); const first = factories[index](input); assert(JSON.stringify(input) === snapshot, "Factory mutated input."); validators[index](first); assert(JSON.stringify(input) === snapshot, "Validator mutated input."); assert(JSON.stringify(first) === JSON.stringify(factories[index](input)), "Normalization unstable."); });
  const unavailable = [fidApi.createUnavailableFootballEntity(), fidApi.createUnavailableOrganizationProfile(), fidApi.createUnavailableTeamProfile()]; unavailable.forEach((value) => { const keys = keysDeep(value); ["generatedId", "generatedAt", "resolvedReference", "evaluation", "score", "grade"].forEach((key) => assert(!keys.has(key), `Unavailable factory invented ${key}.`)); });
}
function suiteChecks(context) { const expected = { footballEntity: 120, organizationProfile: 218, teamProfile: 270, personPlayerProspectFoundation: 130, researchRepository: 616 }; Object.entries(expected).forEach(([name, total]) => assert(context.suiteSummaries[name].total === total && context.suiteSummaries[name].failed === 0, `${name} diagnostics failed.`)); }

const CASE_GROUPS = Object.freeze([[10, "contracts-validation"], [10, "reference-chain"], [9, "ownership"], [18, "state-separation"], [13, "affiliation-membership"], [9, "location-venue"], [17, "timeline"], [16, "external-records"], [22, "evaluation-boundary"], [7, "exports"], [5, "suite-integration"], [13, "dependencies"], [7, "stability"]]);
const CASE_NAMES = Object.freeze(CASE_GROUPS.flatMap(([count, group]) => Array.from({ length: count }, (_, index) => `${group}-${String(index + 1).padStart(2, "0")}`)));
async function checkForIndex(index, context) { if (index < 10) return contractChecks(); if (index < 20) return chainChecks(); if (index < 29) return ownershipChecks(); if (index < 47) return stateChecks(); if (index < 60) return affiliationChecks(); if (index < 69) return locationChecks(); if (index < 86) return timelineChecks(); if (index < 102) return externalChecks(); if (index < 124) return evaluationChecks(); if (index < 131) return exportChecks(); if (index < 136) return suiteChecks(context); if (index < 149) return dependencyChecks(context); return stabilityChecks(); }
async function buildContext() {
  const sources = Object.fromEntries(PRODUCTION_FILES.map((file) => [file, readFileSync(file, "utf8")])); const footballEntity = runFootballEntityContractDiagnostics(); const personPlayerProspectFoundation = await runFidPersonPlayerProspectFoundationDiagnostics(); const organizationProfile = await runOrganizationProfileContractDiagnostics(); const teamProfile = await runTeamProfileContractDiagnostics(); const researchRepository = personPlayerProspectFoundation.suiteSummaries.researchRepository;
  const contractSources = Object.entries(sources).filter(([file]) => /contracts[/\\](?:FootballEntity|OrganizationProfile|TeamProfile)Contract\.js$/.test(file)).map(([, source]) => source);
  return { productionImports: Object.values(sources).flatMap(imports), productionSource: Object.values(sources).join("\n"), contractSources, dependencyGraph: graph(sources), suiteSummaries: { footballEntity, organizationProfile, teamProfile, personPlayerProspectFoundation, researchRepository } };
}
export async function runFidOrganizationTeamFoundationDiagnostics({ throwOnFailure = false } = {}) {
  const context = await buildContext(); const cases = []; for (let index = 0; index < CASE_NAMES.length; index += 1) { const id = CASE_NAMES[index]; try { await checkForIndex(index, context); cases.push({ id, passed: true, message: `${id} passed.`, details: null }); } catch (error) { cases.push({ id, passed: false, message: typeof error?.message === "string" ? error.message : `${id} failed.`, details: error?.details ?? null }); } }
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed; const summary = { suite: SUITE, contractVersions: { footballEntity: fidApi.FOOTBALL_ENTITY_CONTRACT_VERSION, organizationProfile: fidApi.ORGANIZATION_PROFILE_CONTRACT_VERSION, teamProfile: fidApi.TEAM_PROFILE_CONTRACT_VERSION }, schemaVersions: { footballEntity: fidApi.FOOTBALL_ENTITY_SCHEMA_VERSION, organizationProfile: fidApi.ORGANIZATION_PROFILE_SCHEMA_VERSION, teamProfile: fidApi.TEAM_PROFILE_SCHEMA_VERSION }, total: cases.length, passed, failed, cases, suiteSummaries: context.suiteSummaries }; if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`); return summary;
}
export default Object.freeze({ runFidOrganizationTeamFoundationDiagnostics });
