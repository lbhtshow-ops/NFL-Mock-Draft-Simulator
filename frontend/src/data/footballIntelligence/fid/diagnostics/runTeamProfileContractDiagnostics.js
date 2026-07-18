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
import { runPersonProfileContractDiagnostics } from "./runPersonProfileContractDiagnostics.js";
import { runPlayerProfileContractDiagnostics } from "./runPlayerProfileContractDiagnostics.js";
import { runProspectProfileContractDiagnostics } from "./runProspectProfileContractDiagnostics.js";
import { runFidPersonPlayerProspectFoundationDiagnostics } from "./runFidPersonPlayerProspectFoundationDiagnostics.js";
import { runOrganizationProfileContractDiagnostics } from "./runOrganizationProfileContractDiagnostics.js";

const SUITE = "TeamProfileContractDiagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTION_FILES = ["constants/footballEntityConstants.js", "contracts/FootballEntityContract.js", "constants/personProfileConstants.js", "contracts/PersonProfileContract.js", "constants/playerProfileConstants.js", "contracts/PlayerProfileContract.js", "constants/prospectProfileConstants.js", "contracts/ProspectProfileContract.js", "constants/organizationProfileConstants.js", "contracts/OrganizationProfileContract.js", "constants/teamProfileConstants.js", "contracts/TeamProfileContract.js", "index.js"].map((file) => resolve(ROOT, file));
const TEAM_EXPORTS = Object.freeze(["TEAM_PROFILE_CONTRACT_NAME", "TEAM_PROFILE_CONTRACT_VERSION", "TEAM_PROFILE_SCHEMA_VERSION", "TEAM_PROFILE_STATUSES", "TEAM_PROFILE_VERIFICATION_STATES", "TEAM_PROFILE_CONFIDENCE_LEVELS", "TEAM_TYPES", "TEAM_COMPETITION_LEVELS", "TEAM_COMPETITIVE_STATES", "TEAM_PARTICIPATION_STATUSES", "TEAM_VENUE_USAGE_TYPES", "TEAM_BRANDING_ASSET_TYPES", "TEAM_TIMELINE_EVENT_TYPES", "createTeamProfile", "createUnavailableTeamProfile", "validateTeamProfile", "isTeamProfile", "isVerifiedTeamProfile", "isActiveTeamProfile", "isCompetingTeamProfile", "isDisbandedTeamProfile", "isDisputedTeamProfile", "getTeamProfileEntityRef", "getTeamProfileOrganizationRef"]);
const APPROVED_FID_API = Object.freeze({ ...footballEntityConstants, ...footballEntityContract, ...personProfileConstants, ...personProfileContract, ...playerProfileConstants, ...playerProfileContract, ...prospectProfileConstants, ...prospectProfileContract, ...organizationProfileConstants, ...organizationProfileContract, ...teamProfileConstants, ...teamProfileContract });
const APPROVED_EXPORTS = Object.freeze(Object.keys(APPROVED_FID_API));

function assert(condition, message) { if (!condition) throw new Error(message); }
function hasCode(value, code, field = "errors") { return (value?.validation?.[field] || value?.[field] || []).some((entry) => entry.code === code); }
function base(overrides = {}) { return { profileId: "team-profile-1", entityRef: "team-entity-1", organizationProfileRef: null, organizationEntityRef: null, status: "CANDIDATE", teamType: "UNKNOWN", competitionLevel: "UNKNOWN", competitiveState: "UNKNOWN", verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" }, ...overrides }; }
function verified(overrides = {}) { return base({ organizationProfileRef: "organization-profile-1", organizationEntityRef: "organization-entity-1", status: "ACTIVE", teamType: "PROFESSIONAL", competitionLevel: "PROFESSIONAL", competitiveState: "COMPETING", verification: { state: "VERIFIED", confidence: "HIGH", verifiedBy: "reviewer", verifiedAt: "2027-01-01" }, ...overrides }); }
function membership(overrides = {}) { return { membershipId: "membership-1", leagueRef: "league-1", status: "REPORTED", ...overrides }; }
function participation(overrides = {}) { return { participationId: "participation-1", seasonRef: "season-1", status: "REPORTED", ...overrides }; }
function venue(overrides = {}) { return { venueUsageId: "venue-1", venueLabel: "Declared venue", usageType: "HOME", ...overrides }; }
function brand(overrides = {}) { return { brandingId: "branding-1", assetType: "PRIMARY_LOGO", assetRef: "asset-1", ...overrides }; }
function timeline(overrides = {}) { return { eventId: "event-1", eventType: "MILESTONE", title: "Documented event", ...overrides }; }
function created(input) { return fidApi.createTeamProfile(input); }
function keysDeep(value, keys = new Set()) { if (Array.isArray(value)) value.forEach((entry) => keysDeep(entry, keys)); else if (value && typeof value === "object") Object.entries(value).forEach(([key, entry]) => { keys.add(key); keysDeep(entry, keys); }); return keys; }
function imports(source) { return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]); }
function isCanonicalFootballRelationshipModule(entry) { return /(?:^|\/)(?:footballRelationshipConstants|FootballRelationshipContract)\.js$/i.test(entry.replaceAll("\\", "/")); }
function isProhibitedRelationshipInfrastructure(entry) { if (isCanonicalFootballRelationshipModule(entry)) return false; return /relationships?|graph[-_]?traversal|knowledge[-_]?graph|inverse[-_]?relationship/i.test(entry); }
function graph(sources) { const files = new Set(PRODUCTION_FILES); return Object.fromEntries(PRODUCTION_FILES.map((file) => [file, imports(sources[file]).filter((entry) => entry.startsWith(".")).map((entry) => resolve(dirname(file), entry)).filter((entry) => files.has(entry))])); }
function hasCycle(value) { const visiting = new Set(); const visited = new Set(); function visit(node) { if (visiting.has(node)) return true; if (visited.has(node)) return false; visiting.add(node); if ((value[node] || []).some(visit)) return true; visiting.delete(node); visited.add(node); return false; } return Object.keys(value).some(visit); }

function identityChecks() {
  assert(fidApi.isVerifiedTeamProfile(created(verified())), "Verified Team Profile invalid."); assert(created(base()).validation.valid, "Minimal candidate invalid.");
  Object.values(fidApi.TEAM_PROFILE_STATUSES).forEach((status) => { const input = base({ status }); if (status === "ARCHIVED") input.metadata = { notes: "Archive context" }; assert(created(input).validation.valid, `Status rejected: ${status}.`); });
  Object.values(fidApi.TEAM_TYPES).forEach((teamType) => assert(created(base({ teamType })).validation.valid, `Team type rejected: ${teamType}.`));
  Object.values(fidApi.TEAM_COMPETITION_LEVELS).forEach((competitionLevel) => assert(created(base({ competitionLevel })).validation.valid, `Competition level rejected: ${competitionLevel}.`));
  Object.values(fidApi.TEAM_COMPETITIVE_STATES).forEach((competitiveState) => assert(created(base({ competitiveState })).validation.valid, `Competitive state rejected: ${competitiveState}.`));
  Object.values(fidApi.TEAM_PROFILE_VERIFICATION_STATES).forEach((state) => { const verification = { state, confidence: "MODERATE" }; if (["VERIFIED", "VERIFIED_WITH_LIMITATIONS"].includes(state)) Object.assign(verification, { verifiedBy: "reviewer", verifiedAt: "2027-01-01" }); if (state === "VERIFIED_WITH_LIMITATIONS") verification.limitations = "Limited"; if (state === "DISPUTED") verification.disputes = ["Disputed"]; assert(created(base({ verification })).validation.valid, `Verification rejected: ${state}.`); });
  Object.values(fidApi.TEAM_PROFILE_CONFIDENCE_LEVELS).forEach((confidence) => assert(created(base({ verification: { state: "UNVERIFIED", confidence } })).validation.valid, `Confidence rejected: ${confidence}.`));
  assert(!created(base({ status: "BAD" })).validation.valid && !created(base({ teamType: "BAD" })).validation.valid && !created(base({ competitionLevel: "BAD" })).validation.valid && !created(base({ competitiveState: "BAD" })).validation.valid, "Invalid core enum accepted.");
  assert(!created(base({ verification: { state: "BAD", confidence: "HIGH" } })).validation.valid && !created(base({ verification: { state: "UNVERIFIED", confidence: "BAD" } })).validation.valid, "Invalid verification enum accepted.");
  assert(!created(base({ profileId: null })).validation.valid && !created(base({ entityRef: null })).validation.valid && !created(base({ organizationProfileRef: 4 })).validation.valid && !created(base({ organizationEntityRef: {} })).validation.valid, "Invalid identity accepted.");
  const result = created(base()); assert(result.profileId === "team-profile-1" && result.entityRef === "team-entity-1" && result.organizationProfileRef === null && result.organizationEntityRef === null, "Identifiers inferred.");
  ["footballEntity", "organizationProfile", "canonicalName", "aliases", "externalIdentifiers", "organizationDetails", "affiliations"].forEach((key) => assert(!keysDeep(result).has(key), `Upstream ownership embedded: ${key}.`));
  assert(created(base({ entityRef: "unresolved", organizationProfileRef: "missing", organizationEntityRef: "any-type" })).validation.valid, "Compatibility or references resolved.");
}
function detailChecks() {
  const details = { establishedAt: "1960-01-01", firstCompetitionAt: "1961-01-01", disbandedAt: "2020-01-01", abbreviation: "ABC", publicDescription: "Factual description", primaryLocationRef: "location-1", primaryLocationLabel: "Declared place", websiteRef: "https://example.test" };
  const result = created(base({ competitiveState: "DISBANDED", teamDetails: details })); assert(result.validation.valid && result.teamDetails.establishedAt !== result.teamDetails.firstCompetitionAt && result.teamDetails.abbreviation === "ABC", "Team details invalid.");
  const empty = created(base()); assert(empty.teamDetails.establishedAt === null && empty.teamDetails.firstCompetitionAt === null && empty.teamDetails.disbandedAt === null && empty.teamDetails.primaryLocationRef === null, "Details inferred.");
  assert(!created(base({ teamDetails: { establishedAt: "2020-01-01", firstCompetitionAt: "2019-01-01" } })).validation.valid, "Invalid date order accepted.");
  const mismatch = created(base({ competitiveState: "COMPETING", teamDetails: { disbandedAt: "2020-01-01" } })); assert(mismatch.competitiveState === "COMPETING" && hasCode(mismatch, "DISBANDED_DATE_STATE_MISMATCH", "warnings"), "Disbanded date inferred state or warning missing.");
  ["aliases", "websiteContent", "teamStrength", "evaluation"].forEach((key) => assert(!keysDeep(result).has(key), `Details created prohibited data: ${key}.`));
}
function membershipChecks() {
  assert(created(base({ competitionMemberships: [membership()] })).validation.valid, "Valid membership rejected."); Object.values(fidApi.TEAM_PARTICIPATION_STATUSES).forEach((status) => assert(created(base({ competitionMemberships: [membership({ status })] })).validation.valid, `Membership status rejected: ${status}.`));
  assert(!created(base({ competitionMemberships: [membership({ membershipId: null })] })).validation.valid && !created(base({ competitionMemberships: [membership({ status: "BAD" })] })).validation.valid, "Invalid membership accepted.");
  assert(!created(base({ competitionMemberships: [membership({ leagueRef: null })] })).validation.valid, "Membership without competition reference accepted.");
  assert(!created(base({ competitionMemberships: [membership({ validFrom: "2027-02-01", validTo: "2027-01-01" })] })).validation.valid, "Membership date order accepted.");
  assert(created(base({ competitionMemberships: [membership(), membership()] })).competitionMemberships.length === 1, "Membership duplicate not normalized.");
  assert(!created(base({ competitionMemberships: [membership(), membership({ leagueRef: "other" })] })).validation.valid, "Membership ID conflict accepted.");
  const result = created(base({ competitionMemberships: [membership({ membershipId: "a", status: "REPORTED" }), membership({ membershipId: "b", conferenceRef: "conference-1", leagueRef: null, status: "DISPUTED" })] })); assert(result.competitionMemberships.length === 2 && result.competitionMemberships[0].status === "REPORTED", "Membership conflict/current state mishandled.");
  ["relationship", "organizationAffiliation", "currentCompetition", "currentLeague", "currentConference", "currentDivision"].forEach((key) => assert(!keysDeep(result).has(key), `Membership inferred state: ${key}.`));
}
function seasonChecks() {
  assert(created(base({ seasonParticipation: [participation()] })).validation.valid, "Valid season participation rejected.");
  assert(!created(base({ seasonParticipation: [participation({ participationId: null })] })).validation.valid && !created(base({ seasonParticipation: [participation({ seasonRef: null })] })).validation.valid && !created(base({ seasonParticipation: [participation({ status: "BAD" })] })).validation.valid, "Invalid participation accepted.");
  assert(!created(base({ seasonParticipation: [participation({ startedAt: "2027-02-01", endedAt: "2027-01-01" })] })).validation.valid, "Participation date order accepted.");
  assert(created(base({ seasonParticipation: [participation(), participation()] })).seasonParticipation.length === 1, "Participation duplicate not normalized.");
  assert(!created(base({ seasonParticipation: [participation(), participation({ seasonRef: "other" })] })).validation.valid, "Participation ID conflict accepted.");
  const result = created(base({ competitiveState: "UNKNOWN", seasonParticipation: [participation({ participationId: "a", scheduleRef: "schedule-1", standingsRef: "standings-1", recordRef: "record-1", rosterSnapshotRef: "roster-1", staffSnapshotRef: "staff-1" }), participation({ participationId: "b", seasonRef: "season-2", status: "DISPUTED" })] }));
  assert(result.seasonParticipation.length === 2 && result.competitiveState === "UNKNOWN", "Participation inferred current state.");
  ["schedule", "standings", "record", "roster", "staff", "statistics", "performance", "currentSeason"].forEach((key) => assert(!keysDeep(result).has(key), `Season participation embedded data: ${key}.`));
}
function venueChecks() {
  assert(created(base({ venues: [venue()] })).validation.valid, "Valid venue rejected."); Object.values(fidApi.TEAM_VENUE_USAGE_TYPES).forEach((usageType) => assert(created(base({ venues: [venue({ usageType })] })).validation.valid, `Venue usage rejected: ${usageType}.`));
  assert(!created(base({ venues: [venue({ venueUsageId: null })] })).validation.valid && !created(base({ venues: [venue({ usageType: "BAD" })] })).validation.valid && !created(base({ venues: [venue({ venueRef: null, venueLabel: null, notes: null })] })).validation.valid, "Invalid venue accepted.");
  assert(!created(base({ venues: [venue({ validFrom: "2027-02-01", validTo: "2027-01-01" })] })).validation.valid, "Venue date order accepted.");
  assert(created(base({ venues: [venue(), venue()] })).venues.length === 1 && !created(base({ venues: [venue(), venue({ venueLabel: "Other" })] })).validation.valid, "Venue duplicate handling invalid.");
  const result = created(base({ venues: [venue({ venueUsageId: "a", usageType: "FORMER_HOME" }), venue({ venueUsageId: "b", venueLabel: "Other", usageType: "HOME" })] })); assert(result.venues.length === 2 && result.teamDetails.primaryLocationRef === null, "Venue inferred primary location.");
  ["currentVenue", "location", "organization"].forEach((key) => assert(!keysDeep(result).has(key), `Venue created external state: ${key}.`));
}
function brandingChecks() {
  assert(created(base({ branding: [brand()] })).validation.valid, "Valid branding rejected."); Object.values(fidApi.TEAM_BRANDING_ASSET_TYPES).forEach((assetType) => assert(created(base({ branding: [brand({ assetType })] })).validation.valid, `Asset type rejected: ${assetType}.`));
  assert(!created(base({ branding: [brand({ brandingId: null })] })).validation.valid && !created(base({ branding: [brand({ assetType: "BAD" })] })).validation.valid && !created(base({ branding: [brand({ assetRef: null, label: null })] })).validation.valid, "Invalid branding accepted.");
  assert(!created(base({ branding: [brand({ validFrom: "2027-02-01", validTo: "2027-01-01" })] })).validation.valid, "Branding date order accepted.");
  assert(created(base({ branding: [brand(), brand()] })).branding.length === 1 && !created(base({ branding: [brand(), brand({ assetRef: "other" })] })).validation.valid, "Branding duplicate handling invalid.");
  const result = created(base({ branding: [brand({ assetType: "HISTORICAL_LOGO" })] })); assert(result.branding[0].assetType === "HISTORICAL_LOGO", "Historical branding not preserved.");
  ["canonicalName", "image", "binary", "colors", "calculatedColors", "assetContent"].forEach((key) => assert(!keysDeep(result).has(key), `Branding embedded or inferred data: ${key}.`));
}
function timelineChecks() {
  assert(created(base({ teamTimeline: [timeline()] })).validation.valid, "Valid timeline rejected."); Object.values(fidApi.TEAM_TIMELINE_EVENT_TYPES).forEach((eventType) => assert(created(base({ teamTimeline: [timeline({ eventType })] })).validation.valid, `Timeline type rejected: ${eventType}.`));
  assert(!created(base({ teamTimeline: [timeline({ eventId: null })] })).validation.valid && !created(base({ teamTimeline: [timeline({ eventType: "BAD" })] })).validation.valid && !created(base({ teamTimeline: [timeline({ title: null, description: null })] })).validation.valid, "Invalid timeline accepted.");
  assert(!created(base({ teamTimeline: [timeline({ startedAt: "2027-02-01", endedAt: "2027-01-01" })] })).validation.valid, "Timeline date order accepted.");
  assert(created(base({ teamTimeline: [timeline(), timeline()] })).teamTimeline.length === 1 && !created(base({ teamTimeline: [timeline(), timeline({ title: "Other" })] })).validation.valid, "Timeline duplicate handling invalid.");
  const events = ["FOUNDED", "ESTABLISHED", "RENAMED", "REBRANDED", "RELOCATED", "LEAGUE_JOINED", "LEAGUE_LEFT", "CONFERENCE_JOINED", "CONFERENCE_LEFT", "DIVISION_CHANGED", "SUSPENDED", "REINSTATED", "MERGED", "DISBANDED", "CHAMPIONSHIP"];
  const result = created(base({ competitiveState: "UNKNOWN", teamTimeline: events.map((eventType, index) => timeline({ eventId: `e-${index}`, eventType })) }));
  assert(result.validation.valid && result.teamDetails.establishedAt === null && result.competitionMemberships.length === 0 && result.venues.length === 0 && result.branding.length === 0 && result.competitiveState === "UNKNOWN" && result.versioning.profileVersion === null, "Timeline mutated structured state.");
  ["canonicalName", "performanceEvaluation", "currentState"].forEach((key) => assert(!keysDeep(result).has(key), `Timeline inferred data: ${key}.`));
}
function referenceChecks() {
  const names = ["researchSourceRefs", "researchSessionRefs", "recordedObservationRefs", "analyticalObservationRefs", "evidenceArtifactRefs", "relationshipRefs", "organizationProfileRefs", "leagueRefs", "conferenceRefs", "divisionRefs", "competitionRefs", "seasonRefs", "venueRefs", "locationRefs", "rosterRefs", "rosterSnapshotRefs", "depthChartRefs", "staffRefs", "staffSnapshotRefs", "scheduleRefs", "standingsRefs", "recordRefs", "transactionRefs", "injuryReportRefs", "salaryCapRefs", "draftCapitalRefs", "teamContextRefs", "teamIdentityRefs", "schemeProfileRefs", "brandingAssetRefs", "documentRefs", "datasetRefs", "otherRefs"];
  const references = Object.fromEntries(names.map((name) => [name, [`${name}-1`, `${name}-1`]])); const result = created(base({ references })); assert(result.validation.valid && names.every((name) => result.references[name].length === 1), "References invalid.");
  names.forEach((name) => assert(!created(base({ references: { [name]: [4] } })).validation.valid, `Invalid reference accepted: ${name}.`)); assert(result.verification.state === "UNVERIFIED", "References implied verification.");
  ["resolved", "hydrated", "relationship", "roster", "employment", "performance", "teamIdentity", "scheme"].forEach((key) => assert(!keysDeep(result.references).has(key), `Reference hydrated data: ${key}.`));
}
function verificationChecks() {
  assert(!created(base({ verification: { state: "VERIFIED", confidence: "HIGH", verifiedAt: "2027-01-01" } })).validation.valid && !created(base({ verification: { state: "VERIFIED", confidence: "HIGH", verifiedBy: "reviewer" } })).validation.valid, "Verified requirements missing.");
  assert(!created(base({ verification: { state: "VERIFIED_WITH_LIMITATIONS", confidence: "HIGH", verifiedBy: "reviewer", verifiedAt: "2027-01-01" } })).validation.valid && !created(base({ verification: { state: "DISPUTED", confidence: "LOW" } })).validation.valid, "Verification context missing.");
  assert(created(base({ status: "REJECTED" })).status === "REJECTED" && hasCode(created(base({ status: "ACTIVE" })), "ACTIVE_PROFILE_UNVERIFIED", "warnings"), "Lifecycle preservation/warning failed.");
  assert(created(base({ status: "ACTIVE", competitiveState: "UNKNOWN" })).competitiveState === "UNKNOWN" && created(base({ status: "CANDIDATE", competitiveState: "COMPETING" })).status === "CANDIDATE", "Profile and competitive state coupled.");
  assert(created(base({ status: "CANDIDATE", competitiveState: "DISBANDED" })).status === "CANDIDATE" && created(base({ competitiveState: "MERGED" })).competitiveState === "MERGED", "Disbanded/merged altered lifecycle.");
  assert(hasCode(created(base({ competitiveState: "COMPETING", teamDetails: { disbandedAt: "2020-01-01" } })), "DISBANDED_DATE_STATE_MISMATCH", "warnings"), "Disbanded mismatch warning absent.");
}
function provenanceChecks() {
  assert(created(base({ provenance: { createdAt: "2027-01-01", updatedAt: "2027-01-02" } })).validation.valid && !created(base({ provenance: { createdAt: "bad" } })).validation.valid, "Provenance validation failed.");
  const result = created(base({ versioning: { profileVersion: "v1", supersedesProfileRef: "old" }, metadata: { tags: ["tag", "tag"], domains: ["domain", "domain"] } })); assert(result.provenance.createdAt === null && result.versioning.profileVersion === "v1" && result.metadata.tags.length === 1, "Version/metadata normalization failed.");
  assert(created(base()).versioning.profileVersion === null && !created(base({ versioning: { supersedesProfileRef: "team-profile-1" } })).validation.valid && !created(base({ versioning: { supersededByProfileRef: "team-profile-1" } })).validation.valid && !created(base({ versioning: { supersedesProfileRef: "same", supersededByProfileRef: "same" } })).validation.valid, "Versioning rules failed.");
  assert(result.metadata.visibility === null && result.metadata.restrictions.length === 0, "Metadata inferred.");
}
function prohibitedChecks() {
  const prohibited = ["rosterContents", "depthChart", "playerMembership", "coachingStaffMembership", "executiveStaffMembership", "employment", "transactionData", "injuryData", "medicalData", "salaryCap", "contracts", "draftCapital", "teamNeeds", "teamContext", "competitiveWindow", "teamIdentity", "footballIdentity", "scheme", "tendencies", "organizationalPhilosophy", "standings", "wins", "losses", "winPercentage", "statistics", "performanceScore", "powerRanking", "traits", "components", "scores", "grades", "rankings", "projections", "recommendations", "predictions", "decisions"];
  const result = created(base(Object.fromEntries(prohibited.map((key) => [key, "prohibited"])))); const keys = keysDeep(result); prohibited.forEach((key) => assert(!keys.has(key), `Prohibited field retained: ${key}.`));
}
function stabilityChecks() {
  const input = verified({ competitionMemberships: [membership()], seasonParticipation: [participation()], venues: [venue()], branding: [brand()], teamTimeline: [timeline()] }); const snapshot = JSON.stringify(input); const first = created(input); assert(JSON.stringify(input) === snapshot, "Factory mutated input."); fidApi.validateTeamProfile(first); assert(JSON.stringify(input) === snapshot, "Validator mutated input."); assert(JSON.stringify(first) === JSON.stringify(created(input)), "Normalization unstable.");
  [null, [], "value", 7].forEach((value) => assert(fidApi.validateTeamProfile(value).valid === false, "Invalid input unsafe.")); assert(typeof first.validation.valid === "boolean" && Array.isArray(first.validation.errors) && Array.isArray(first.validation.warnings), "Validation shape invalid.");
  ["isTeamProfile", "isVerifiedTeamProfile", "isActiveTeamProfile", "isCompetingTeamProfile", "isDisbandedTeamProfile", "isDisputedTeamProfile"].forEach((name) => assert(typeof fidApi[name](first) === "boolean", `${name} did not return boolean.`));
  assert(fidApi.getTeamProfileEntityRef(first) === "team-entity-1" && fidApi.getTeamProfileOrganizationRef(first) === "organization-profile-1", "Reference helpers invalid.");
  const unavailable = fidApi.createUnavailableTeamProfile({ profileId: "p", entityRef: "e", organizationProfileRef: "op", organizationEntityRef: "oe", status: "CANDIDATE", teamType: "OTHER", competitionLevel: "AMATEUR", competitiveState: "INACTIVE", reason: "Unavailable" });
  assert(Object.keys(first).every((key) => Object.hasOwn(unavailable, key)) && unavailable.profileId === "p" && unavailable.entityRef === "e" && unavailable.organizationProfileRef === "op" && unavailable.competitiveState === "INACTIVE" && hasCode(unavailable, "TEAM_PROFILE_UNAVAILABLE"), "Unavailable factory incomplete.");
  assert(unavailable.competitionMemberships.length === 0 && unavailable.seasonParticipation.length === 0 && unavailable.venues.length === 0 && unavailable.branding.length === 0 && unavailable.teamTimeline.length === 0 && unavailable.versioning.profileVersion === null, "Unavailable factory invented facts.");
}
async function integrationChecks(context) {
  const expected = { footballEntity: 120, personProfile: 148, playerProfile: 209, prospectProfile: 230, foundation: 130, organizationProfile: 218, researchRepository: 616 }; Object.entries(expected).forEach(([name, total]) => assert(context.existing[name].total === total && context.existing[name].failed === 0, `${name} diagnostics failed.`));
  const named = Object.keys(namedApi).filter((name) => name !== "default"); const defaults = Object.keys(fidApi); assert(APPROVED_EXPORTS.length === 135 && new Set(named).size === named.length && new Set(defaults).size === defaults.length && APPROVED_EXPORTS.every((name) => Object.hasOwn(namedApi, name) && Object.hasOwn(fidApi, name) && namedApi[name] === APPROVED_FID_API[name] && fidApi[name] === APPROVED_FID_API[name] && namedApi[name] === fidApi[name]), "FID exports invalid.");
  assert(named.length >= APPROVED_EXPORTS.length && defaults.length >= APPROVED_EXPORTS.length && TEAM_EXPORTS.every((name) => fidApi[name] != null && fidApi[name] === namedApi[name]), "Additive or Team exports invalid."); assert(!defaults.some((name) => /^run.*Diagnostics$/.test(name)), "Diagnostic exported.");
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
  const prohibitedTeamDependency = /FidPersistenceArchitectureSpecification|FidPersistenceRepositoryContract|InMemoryFidPersistenceRepository|persistence[/\\](?:index|repository|adapter|service|manager|client)|repository|adapter|supabase|\bsql\b|migrations?|filesystem\s+storage|browser\s+storage|localStorage|IndexedDB|network\s+persistence|hydration|synchronization|registry|resolver|identity\s+resolution|runtime\s+(?:persistence|database)\s+integration/i;
  const prohibitedRuntime = /(?:Supabase|Database|Sql|Network|FileSystem|BrowserStorage|LocalStorage|IndexedDb)FidPersistenceRepository|TeamRepository|PersistenceService|PersistenceManager|PersistenceAdapter|SupabaseAdapter|DatabaseAdapter|StorageClient|DatabaseClient|createClient|sql\s+runtime|migration\s+runtime|application\s+persistence\s+singleton|runtime\s+hydration|runtime\s+synchronization|identity\s+resolution|runtime\s+database\s+integration/i;
  assert(persistenceImports.every((entry) => approvedArchitectureImports.has(entry)) && !prohibitedTeamDependency.test(context.teamProfileSource) && !prohibitedRuntime.test(context.productionSource), "Prohibited dependency: persistence.");
  ["diagnostics", "researchrepository", "supabase", "registry", "resolver", "ontology", "engines", "quarterback", "draftv3", "components", "pages", "router", "routes"].forEach((term) => assert(context.productionImports.every((entry) => !entry.toLowerCase().replaceAll("/", "").includes(term)), `Prohibited dependency: ${term}.`));
  const teamProfileImports = imports(readFileSync(resolve(ROOT, "contracts/TeamProfileContract.js"), "utf8"));
  assert(context.productionImports.every((entry) => !isProhibitedRelationshipInfrastructure(entry))
    && teamProfileImports.every((entry) => !isCanonicalFootballRelationshipModule(entry)
      && !isProhibitedRelationshipInfrastructure(entry)), "Prohibited dependency: relationship.");
  assert(!hasCycle(context.dependencyGraph), "Circular production dependency found."); assert(fidApi.isTeamProfile(created(base())), "Production module integrity failed.");
}

const CASE_GROUPS = Object.freeze([[31, "identity-lifecycle"], [14, "team-details"], [17, "competition-memberships"], [21, "season-participation"], [15, "venues"], [15, "branding"], [27, "timeline"], [26, "references"], [13, "verification-state"], [13, "provenance-versioning-metadata"], [36, "ownership-prohibitions"], [15, "stability-guards"], [27, "exports-dependencies-integrity"]]);
const CASE_NAMES = Object.freeze(CASE_GROUPS.flatMap(([count, group]) => Array.from({ length: count }, (_, index) => `${group}-${String(index + 1).padStart(2, "0")}`)));
async function checkForIndex(index, context) { if (index < 31) return identityChecks(); if (index < 45) return detailChecks(); if (index < 62) return membershipChecks(); if (index < 83) return seasonChecks(); if (index < 98) return venueChecks(); if (index < 113) return brandingChecks(); if (index < 140) return timelineChecks(); if (index < 166) return referenceChecks(); if (index < 179) return verificationChecks(); if (index < 192) return provenanceChecks(); if (index < 228) return prohibitedChecks(); if (index < 243) return stabilityChecks(); return integrationChecks(context); }
async function buildContext() {
  const sources = Object.fromEntries(PRODUCTION_FILES.map((file) => [file, readFileSync(file, "utf8")])); const footballEntity = runFootballEntityContractDiagnostics(); const personProfile = await runPersonProfileContractDiagnostics(); const playerProfile = await runPlayerProfileContractDiagnostics(); const prospectProfile = await runProspectProfileContractDiagnostics(); const foundation = await runFidPersonPlayerProspectFoundationDiagnostics(); const organizationProfile = await runOrganizationProfileContractDiagnostics();
  return { productionImports: Object.values(sources).flatMap(imports), productionSource: Object.values(sources).join("\n"), teamProfileSource: sources[resolve(ROOT, "contracts/TeamProfileContract.js")], dependencyGraph: graph(sources), existing: { footballEntity, personProfile, playerProfile, prospectProfile, foundation, organizationProfile, researchRepository: foundation.suiteSummaries.researchRepository } };
}
export async function runTeamProfileContractDiagnostics({ throwOnFailure = false } = {}) {
  const context = await buildContext(); const cases = []; for (let index = 0; index < CASE_NAMES.length; index += 1) { const id = CASE_NAMES[index]; try { await checkForIndex(index, context); cases.push({ id, passed: true, message: `${id} passed.`, details: null }); } catch (error) { cases.push({ id, passed: false, message: typeof error?.message === "string" ? error.message : `${id} failed.`, details: error?.details ?? null }); } }
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed; const summary = { suite: SUITE, contractVersion: fidApi.TEAM_PROFILE_CONTRACT_VERSION, schemaVersion: fidApi.TEAM_PROFILE_SCHEMA_VERSION, total: cases.length, passed, failed, cases, existingSuiteSummaries: context.existing }; if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`); return summary;
}
export default Object.freeze({ runTeamProfileContractDiagnostics });
