import {
  TEAM_BRANDING_ASSET_TYPES, TEAM_COMPETITION_LEVELS, TEAM_COMPETITIVE_STATES,
  TEAM_PARTICIPATION_STATUSES, TEAM_PROFILE_CONFIDENCE_LEVELS, TEAM_PROFILE_CONTRACT_NAME,
  TEAM_PROFILE_CONTRACT_VERSION, TEAM_PROFILE_SCHEMA_VERSION, TEAM_PROFILE_STATUSES,
  TEAM_PROFILE_VERIFICATION_STATES, TEAM_TIMELINE_EVENT_TYPES, TEAM_TYPES, TEAM_VENUE_USAGE_TYPES,
} from "../constants/teamProfileConstants.js";

const REFERENCE_FIELDS = [
  "researchSourceRefs", "researchSessionRefs", "recordedObservationRefs", "analyticalObservationRefs",
  "evidenceArtifactRefs", "relationshipRefs", "organizationProfileRefs", "leagueRefs", "conferenceRefs",
  "divisionRefs", "competitionRefs", "seasonRefs", "venueRefs", "locationRefs", "rosterRefs",
  "rosterSnapshotRefs", "depthChartRefs", "staffRefs", "staffSnapshotRefs", "scheduleRefs",
  "standingsRefs", "recordRefs", "transactionRefs", "injuryReportRefs", "salaryCapRefs",
  "draftCapitalRefs", "teamContextRefs", "teamIdentityRefs", "schemeProfileRefs", "brandingAssetRefs",
  "documentRefs", "datasetRefs", "otherRefs",
];
function isObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function optionalString(value) { return typeof value === "string" && value.trim() ? value.trim() : null; }
function validationShape(checkedAt = null) { return { valid: true, errors: [], warnings: [], checkedAt: optionalString(checkedAt), contractVersion: TEAM_PROFILE_CONTRACT_VERSION, schemaVersion: TEAM_PROFILE_SCHEMA_VERSION }; }
function add(validation, field, code, path, message) { if (!validation[field].some((item) => item.code === code && item.path === path && item.message === message)) validation[field].push({ code, path, message }); validation.valid = validation.errors.length === 0; }
function error(validation, code, path, message) { add(validation, "errors", code, path, message); }
function warning(validation, code, path, message) { add(validation, "warnings", code, path, message); }
function string(value, path, validation, required = false) {
  if (value == null) { if (required) error(validation, "MISSING_REQUIRED_FIELD", path, `${path} is required.`); return null; }
  if (typeof value !== "string" || !value.trim()) { error(validation, "INVALID_STRING", path, `${path} must be a non-empty string or null.`); return null; }
  return value.trim();
}
function enumValue(value, allowed, path, validation, required = false, warnUnknown = false) {
  if (value == null || value === "") { if (required) error(validation, "MISSING_REQUIRED_FIELD", path, `${path} is required.`); return null; }
  if (!Object.values(allowed).includes(value)) { error(validation, "UNRECOGNIZED_ENUM_VALUE", path, `${path} is not recognized.`); return null; }
  if (warnUnknown && value === "UNKNOWN") warning(validation, "EXPLICIT_UNKNOWN_VALUE", path, `${path} is explicitly UNKNOWN.`);
  return value;
}
function date(value, path, validation) { const result = string(value, path, validation); if (result && Number.isNaN(Date.parse(result))) { error(validation, "INVALID_DATE", path, `${path} must be a recognizable date string or null.`); return null; } return result; }
function order(start, end, path, validation) { if (start && end && Date.parse(start) > Date.parse(end)) error(validation, "INVALID_DATE_ORDER", path, `${path} dates are not logically ordered.`); }
function version(value, validation) { if (value == null) return null; if ((typeof value === "string" && value.trim()) || (Number.isInteger(value) && value >= 0)) return typeof value === "string" ? value.trim() : value; error(validation, "INVALID_PROFILE_VERSION", "versioning.profileVersion", "profileVersion must be a non-empty string, non-negative integer, or null."); return null; }
function nested(value, path, validation, normalize) { if (value == null) return normalize({}); if (!isObject(value)) { error(validation, "INVALID_NESTED_STRUCTURE", path, `${path} must be an object or null.`); return normalize({}); } return normalize(value); }
function refs(value, path, validation) {
  if (value == null) return [];
  if (!Array.isArray(value)) { error(validation, "INVALID_ARRAY", path, `${path} must be an array.`); return []; }
  const result = []; const seen = new Set();
  value.forEach((entry, index) => { if (typeof entry !== "string" || !entry.trim()) { error(validation, "INVALID_REFERENCE", `${path}[${index}]`, `${path} values must be non-empty strings.`); return; } const item = entry.trim(); if (seen.has(item)) { warning(validation, "DUPLICATE_NORMALIZED_VALUE", path, `Duplicate value removed from ${path}: ${item}.`); return; } seen.add(item); result.push(item); });
  return result;
}
function records(value, path, validation, idField, normalize) {
  if (value == null) return [];
  if (!Array.isArray(value)) { error(validation, "INVALID_ARRAY", path, `${path} must be an array.`); return []; }
  const result = []; const exact = new Set(); const ids = new Map();
  value.forEach((entry, index) => { if (!isObject(entry)) { error(validation, "INVALID_RECORD_STRUCTURE", `${path}[${index}]`, `${path} entries must be objects.`); return; } const item = normalize(entry, index); const identity = JSON.stringify(item); if (item[idField] && ids.has(item[idField]) && ids.get(item[idField]) !== identity) error(validation, "DUPLICATE_RECORD_ID", `${path}[${index}].${idField}`, `${idField} must be unique within ${path}.`); if (item[idField]) ids.set(item[idField], identity); if (exact.has(identity)) { warning(validation, "DUPLICATE_NORMALIZED_OBJECT", path, `Exact duplicate removed from ${path}.`); return; } exact.add(identity); result.push(item); });
  return result;
}
function mergeValidation(base, extra) { const result = { ...base, errors: [...base.errors], warnings: [...base.warnings] }; extra.errors.forEach((item) => error(result, item.code, item.path, item.message)); extra.warnings.forEach((item) => warning(result, item.code, item.path, item.message)); result.valid = result.errors.length === 0; return result; }

function normalizeTeamProfile(input, checkedAt = null) {
  const validation = validationShape(checkedAt); const profile = isObject(input) ? input : {};
  if (!isObject(input)) error(validation, "INVALID_TEAM_PROFILE_INPUT", "", "Team Profile input must be an object.");
  const profileId = string(profile.profileId, "profileId", validation, true);
  const entityRef = string(profile.entityRef, "entityRef", validation, true);
  const organizationProfileRef = string(profile.organizationProfileRef, "organizationProfileRef", validation);
  const organizationEntityRef = string(profile.organizationEntityRef, "organizationEntityRef", validation);
  const status = enumValue(profile.status, TEAM_PROFILE_STATUSES, "status", validation, true);
  const teamType = enumValue(profile.teamType, TEAM_TYPES, "teamType", validation, true, true);
  const competitionLevel = enumValue(profile.competitionLevel, TEAM_COMPETITION_LEVELS, "competitionLevel", validation, true, true);
  const competitiveState = enumValue(profile.competitiveState, TEAM_COMPETITIVE_STATES, "competitiveState", validation, true, true);
  const teamDetails = nested(profile.teamDetails, "teamDetails", validation, (value) => {
    const result = { establishedAt: date(value.establishedAt, "teamDetails.establishedAt", validation), firstCompetitionAt: date(value.firstCompetitionAt, "teamDetails.firstCompetitionAt", validation), disbandedAt: date(value.disbandedAt, "teamDetails.disbandedAt", validation), abbreviation: string(value.abbreviation, "teamDetails.abbreviation", validation), publicDescription: string(value.publicDescription, "teamDetails.publicDescription", validation), primaryLocationRef: string(value.primaryLocationRef, "teamDetails.primaryLocationRef", validation), primaryLocationLabel: string(value.primaryLocationLabel, "teamDetails.primaryLocationLabel", validation), websiteRef: string(value.websiteRef, "teamDetails.websiteRef", validation), notes: string(value.notes, "teamDetails.notes", validation) };
    order(result.establishedAt, result.firstCompetitionAt, "teamDetails.establishedAt", validation); order(result.establishedAt, result.disbandedAt, "teamDetails.establishedAt", validation); order(result.firstCompetitionAt, result.disbandedAt, "teamDetails.firstCompetitionAt", validation); return result;
  });
  const competitionMemberships = records(profile.competitionMemberships, "competitionMemberships", validation, "membershipId", (value, index) => {
    const item = { membershipId: string(value.membershipId, `competitionMemberships[${index}].membershipId`, validation, true), competitionRef: string(value.competitionRef, `competitionMemberships[${index}].competitionRef`, validation), leagueRef: string(value.leagueRef, `competitionMemberships[${index}].leagueRef`, validation), conferenceRef: string(value.conferenceRef, `competitionMemberships[${index}].conferenceRef`, validation), divisionRef: string(value.divisionRef, `competitionMemberships[${index}].divisionRef`, validation), organizationRef: string(value.organizationRef, `competitionMemberships[${index}].organizationRef`, validation), status: enumValue(value.status, TEAM_PARTICIPATION_STATUSES, `competitionMemberships[${index}].status`, validation, true, true), validFrom: date(value.validFrom, `competitionMemberships[${index}].validFrom`, validation), validTo: date(value.validTo, `competitionMemberships[${index}].validTo`, validation), sourceRefs: refs(value.sourceRefs, `competitionMemberships[${index}].sourceRefs`, validation), evidenceArtifactRefs: refs(value.evidenceArtifactRefs, `competitionMemberships[${index}].evidenceArtifactRefs`, validation), notes: string(value.notes, `competitionMemberships[${index}].notes`, validation) };
    if (![item.competitionRef, item.leagueRef, item.conferenceRef, item.divisionRef, item.organizationRef].some(Boolean)) error(validation, "COMPETITION_REFERENCE_REQUIRED", `competitionMemberships[${index}]`, "Membership requires a competition-related reference."); order(item.validFrom, item.validTo, `competitionMemberships[${index}]`, validation); return item;
  });
  const seasonParticipation = records(profile.seasonParticipation, "seasonParticipation", validation, "participationId", (value, index) => {
    const item = { participationId: string(value.participationId, `seasonParticipation[${index}].participationId`, validation, true), seasonRef: string(value.seasonRef, `seasonParticipation[${index}].seasonRef`, validation, true), competitionRef: string(value.competitionRef, `seasonParticipation[${index}].competitionRef`, validation), leagueRef: string(value.leagueRef, `seasonParticipation[${index}].leagueRef`, validation), conferenceRef: string(value.conferenceRef, `seasonParticipation[${index}].conferenceRef`, validation), divisionRef: string(value.divisionRef, `seasonParticipation[${index}].divisionRef`, validation), status: enumValue(value.status, TEAM_PARTICIPATION_STATUSES, `seasonParticipation[${index}].status`, validation, true, true), startedAt: date(value.startedAt, `seasonParticipation[${index}].startedAt`, validation), endedAt: date(value.endedAt, `seasonParticipation[${index}].endedAt`, validation), scheduleRef: string(value.scheduleRef, `seasonParticipation[${index}].scheduleRef`, validation), standingsRef: string(value.standingsRef, `seasonParticipation[${index}].standingsRef`, validation), recordRef: string(value.recordRef, `seasonParticipation[${index}].recordRef`, validation), rosterSnapshotRef: string(value.rosterSnapshotRef, `seasonParticipation[${index}].rosterSnapshotRef`, validation), staffSnapshotRef: string(value.staffSnapshotRef, `seasonParticipation[${index}].staffSnapshotRef`, validation), sourceRefs: refs(value.sourceRefs, `seasonParticipation[${index}].sourceRefs`, validation), evidenceArtifactRefs: refs(value.evidenceArtifactRefs, `seasonParticipation[${index}].evidenceArtifactRefs`, validation), notes: string(value.notes, `seasonParticipation[${index}].notes`, validation) };
    order(item.startedAt, item.endedAt, `seasonParticipation[${index}]`, validation); return item;
  });
  const venues = records(profile.venues, "venues", validation, "venueUsageId", (value, index) => {
    const item = { venueUsageId: string(value.venueUsageId, `venues[${index}].venueUsageId`, validation, true), venueRef: string(value.venueRef, `venues[${index}].venueRef`, validation), venueLabel: string(value.venueLabel, `venues[${index}].venueLabel`, validation), usageType: enumValue(value.usageType, TEAM_VENUE_USAGE_TYPES, `venues[${index}].usageType`, validation, true, true), validFrom: date(value.validFrom, `venues[${index}].validFrom`, validation), validTo: date(value.validTo, `venues[${index}].validTo`, validation), sourceRefs: refs(value.sourceRefs, `venues[${index}].sourceRefs`, validation), evidenceArtifactRefs: refs(value.evidenceArtifactRefs, `venues[${index}].evidenceArtifactRefs`, validation), notes: string(value.notes, `venues[${index}].notes`, validation) };
    if (!item.venueRef && !item.venueLabel && !item.notes) error(validation, "VENUE_IDENTITY_REQUIRED", `venues[${index}]`, "Venue requires venueRef, venueLabel, or notes."); order(item.validFrom, item.validTo, `venues[${index}]`, validation); return item;
  });
  const branding = records(profile.branding, "branding", validation, "brandingId", (value, index) => {
    const item = { brandingId: string(value.brandingId, `branding[${index}].brandingId`, validation, true), assetType: enumValue(value.assetType, TEAM_BRANDING_ASSET_TYPES, `branding[${index}].assetType`, validation, true, true), assetRef: string(value.assetRef, `branding[${index}].assetRef`, validation), label: string(value.label, `branding[${index}].label`, validation), validFrom: date(value.validFrom, `branding[${index}].validFrom`, validation), validTo: date(value.validTo, `branding[${index}].validTo`, validation), sourceRefs: refs(value.sourceRefs, `branding[${index}].sourceRefs`, validation), notes: string(value.notes, `branding[${index}].notes`, validation) };
    if (!item.assetRef && !item.label) error(validation, "BRANDING_IDENTITY_REQUIRED", `branding[${index}]`, "Branding requires assetRef or label."); order(item.validFrom, item.validTo, `branding[${index}]`, validation); return item;
  });
  const teamTimeline = records(profile.teamTimeline, "teamTimeline", validation, "eventId", (value, index) => {
    const item = { eventId: string(value.eventId, `teamTimeline[${index}].eventId`, validation, true), eventType: enumValue(value.eventType, TEAM_TIMELINE_EVENT_TYPES, `teamTimeline[${index}].eventType`, validation, true, true), title: string(value.title, `teamTimeline[${index}].title`, validation), description: string(value.description, `teamTimeline[${index}].description`, validation), occurredAt: date(value.occurredAt, `teamTimeline[${index}].occurredAt`, validation), startedAt: date(value.startedAt, `teamTimeline[${index}].startedAt`, validation), endedAt: date(value.endedAt, `teamTimeline[${index}].endedAt`, validation), organizationRef: string(value.organizationRef, `teamTimeline[${index}].organizationRef`, validation), competitionRef: string(value.competitionRef, `teamTimeline[${index}].competitionRef`, validation), leagueRef: string(value.leagueRef, `teamTimeline[${index}].leagueRef`, validation), conferenceRef: string(value.conferenceRef, `teamTimeline[${index}].conferenceRef`, validation), divisionRef: string(value.divisionRef, `teamTimeline[${index}].divisionRef`, validation), locationRef: string(value.locationRef, `teamTimeline[${index}].locationRef`, validation), sourceRefs: refs(value.sourceRefs, `teamTimeline[${index}].sourceRefs`, validation), evidenceArtifactRefs: refs(value.evidenceArtifactRefs, `teamTimeline[${index}].evidenceArtifactRefs`, validation), notes: string(value.notes, `teamTimeline[${index}].notes`, validation) };
    if (!item.title && !item.description) error(validation, "TIMELINE_CONTEXT_REQUIRED", `teamTimeline[${index}]`, "Timeline event requires title or description."); order(item.startedAt, item.endedAt, `teamTimeline[${index}]`, validation); return item;
  });
  const references = nested(profile.references, "references", validation, (value) => Object.fromEntries(REFERENCE_FIELDS.map((field) => [field, refs(value[field], `references.${field}`, validation)])));
  const verification = nested(profile.verification, "verification", validation, (value) => ({ state: enumValue(value.state, TEAM_PROFILE_VERIFICATION_STATES, "verification.state", validation, true), confidence: enumValue(value.confidence, TEAM_PROFILE_CONFIDENCE_LEVELS, "verification.confidence", validation, true), verifiedBy: string(value.verifiedBy, "verification.verifiedBy", validation), verifiedAt: date(value.verifiedAt, "verification.verifiedAt", validation), limitations: string(value.limitations, "verification.limitations", validation), disputes: refs(value.disputes, "verification.disputes", validation), notes: string(value.notes, "verification.notes", validation) }));
  const provenance = nested(profile.provenance, "provenance", validation, (value) => ({ createdBy: string(value.createdBy, "provenance.createdBy", validation), createdAt: date(value.createdAt, "provenance.createdAt", validation), updatedBy: string(value.updatedBy, "provenance.updatedBy", validation), updatedAt: date(value.updatedAt, "provenance.updatedAt", validation), originSystem: string(value.originSystem, "provenance.originSystem", validation), originRecordRef: string(value.originRecordRef, "provenance.originRecordRef", validation), notes: string(value.notes, "provenance.notes", validation) })); order(provenance.createdAt, provenance.updatedAt, "provenance", validation);
  const versioning = nested(profile.versioning, "versioning", validation, (value) => ({ profileVersion: version(value.profileVersion, validation), supersedesProfileRef: string(value.supersedesProfileRef, "versioning.supersedesProfileRef", validation), supersededByProfileRef: string(value.supersededByProfileRef, "versioning.supersededByProfileRef", validation), changeReason: string(value.changeReason, "versioning.changeReason", validation), notes: string(value.notes, "versioning.notes", validation) }));
  const metadata = nested(profile.metadata, "metadata", validation, (value) => ({ tags: refs(value.tags, "metadata.tags", validation), domains: refs(value.domains, "metadata.domains", validation), visibility: string(value.visibility, "metadata.visibility", validation), restrictions: refs(value.restrictions, "metadata.restrictions", validation), notes: string(value.notes, "metadata.notes", validation) }));
  if ([TEAM_PROFILE_VERIFICATION_STATES.VERIFIED, TEAM_PROFILE_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS].includes(verification.state)) { if (!verification.verifiedBy) error(validation, "VERIFIER_REQUIRED", "verification.verifiedBy", "Verified profiles require verifiedBy."); if (!verification.verifiedAt) error(validation, "VERIFICATION_DATE_REQUIRED", "verification.verifiedAt", "Verified profiles require verifiedAt."); }
  if (verification.state === TEAM_PROFILE_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS && !verification.limitations && !verification.notes) error(validation, "LIMITATION_CONTEXT_REQUIRED", "verification", "VERIFIED_WITH_LIMITATIONS requires context.");
  if (verification.state === TEAM_PROFILE_VERIFICATION_STATES.DISPUTED && !verification.disputes.length && !verification.limitations && !verification.notes) error(validation, "DISPUTE_CONTEXT_REQUIRED", "verification", "DISPUTED requires context.");
  if (status === TEAM_PROFILE_STATUSES.ACTIVE && verification.state === TEAM_PROFILE_VERIFICATION_STATES.UNVERIFIED) warning(validation, "ACTIVE_PROFILE_UNVERIFIED", "verification.state", "ACTIVE profile remains unverified.");
  if (status === TEAM_PROFILE_STATUSES.ARCHIVED && !provenance.updatedAt && !versioning.changeReason && !metadata.notes) error(validation, "ARCHIVE_CONTEXT_REQUIRED", "status", "ARCHIVED requires update, change, or metadata context.");
  if (teamDetails.disbandedAt && competitiveState !== TEAM_COMPETITIVE_STATES.DISBANDED) warning(validation, "DISBANDED_DATE_STATE_MISMATCH", "teamDetails.disbandedAt", "disbandedAt is supplied while competitiveState is not DISBANDED.");
  if (profileId && versioning.supersedesProfileRef === profileId) error(validation, "SELF_REFERENCE", "versioning.supersedesProfileRef", "Profile cannot supersede itself.");
  if (profileId && versioning.supersededByProfileRef === profileId) error(validation, "SELF_REFERENCE", "versioning.supersededByProfileRef", "Profile cannot be superseded by itself.");
  if (versioning.supersedesProfileRef && versioning.supersedesProfileRef === versioning.supersededByProfileRef) error(validation, "CONFLICTING_VERSION_REFERENCES", "versioning", "Version references must identify different profiles.");
  validation.valid = validation.errors.length === 0;
  return { contract: TEAM_PROFILE_CONTRACT_NAME, contractVersion: TEAM_PROFILE_CONTRACT_VERSION, schemaVersion: TEAM_PROFILE_SCHEMA_VERSION, profileId, entityRef, organizationProfileRef, organizationEntityRef, status, teamType, competitionLevel, competitiveState, teamDetails, competitionMemberships, seasonParticipation, venues, branding, teamTimeline, references, verification, provenance, versioning, metadata, validation };
}

export function createTeamProfile(input = {}, { checkedAt = null } = {}) { return normalizeTeamProfile(input, checkedAt); }
export function createUnavailableTeamProfile(input = {}, { checkedAt = null } = {}) {
  const supplied = isObject(input) ? input : {}; const reason = optionalString(supplied.reason); const metadata = isObject(supplied.metadata) ? supplied.metadata : {};
  const result = normalizeTeamProfile({ ...supplied, teamType: supplied.teamType ?? TEAM_TYPES.UNKNOWN, competitionLevel: supplied.competitionLevel ?? TEAM_COMPETITION_LEVELS.UNKNOWN, competitiveState: supplied.competitiveState ?? TEAM_COMPETITIVE_STATES.UNKNOWN, verification: supplied.verification ?? { state: TEAM_PROFILE_VERIFICATION_STATES.UNVERIFIED, confidence: TEAM_PROFILE_CONFIDENCE_LEVELS.UNSPECIFIED }, metadata: { ...metadata, notes: metadata.notes ?? reason } }, checkedAt);
  const unavailable = validationShape(checkedAt); error(unavailable, "TEAM_PROFILE_UNAVAILABLE", "", reason || "No usable Team Profile is available."); return { ...result, validation: mergeValidation(result.validation, unavailable) };
}
export function validateTeamProfile(value, { checkedAt = value?.validation?.checkedAt ?? null } = {}) { return normalizeTeamProfile(value, checkedAt).validation; }
export function isTeamProfile(value) { return Boolean(isObject(value) && value.contract === TEAM_PROFILE_CONTRACT_NAME && value.contractVersion === TEAM_PROFILE_CONTRACT_VERSION && value.schemaVersion === TEAM_PROFILE_SCHEMA_VERSION && validateTeamProfile(value).valid); }
export function isVerifiedTeamProfile(value) { return Boolean(isTeamProfile(value) && [TEAM_PROFILE_VERIFICATION_STATES.VERIFIED, TEAM_PROFILE_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS].includes(value.verification.state)); }
export function isActiveTeamProfile(value) { return Boolean(isTeamProfile(value) && value.status === TEAM_PROFILE_STATUSES.ACTIVE); }
export function isCompetingTeamProfile(value) { return Boolean(isTeamProfile(value) && value.competitiveState === TEAM_COMPETITIVE_STATES.COMPETING); }
export function isDisbandedTeamProfile(value) { return Boolean(isTeamProfile(value) && value.competitiveState === TEAM_COMPETITIVE_STATES.DISBANDED); }
export function isDisputedTeamProfile(value) { return Boolean(isTeamProfile(value) && value.verification.state === TEAM_PROFILE_VERIFICATION_STATES.DISPUTED); }
export function getTeamProfileEntityRef(value) { return isTeamProfile(value) ? value.entityRef : null; }
export function getTeamProfileOrganizationRef(value) { return isTeamProfile(value) ? value.organizationProfileRef ?? value.organizationEntityRef : null; }

export default Object.freeze({ TEAM_PROFILE_CONTRACT_NAME, TEAM_PROFILE_CONTRACT_VERSION, TEAM_PROFILE_SCHEMA_VERSION,
  createTeamProfile, createUnavailableTeamProfile, validateTeamProfile, isTeamProfile, isVerifiedTeamProfile,
  isActiveTeamProfile, isCompetingTeamProfile, isDisbandedTeamProfile, isDisputedTeamProfile,
  getTeamProfileEntityRef, getTeamProfileOrganizationRef });
