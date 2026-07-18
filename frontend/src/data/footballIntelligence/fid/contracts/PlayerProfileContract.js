import {
  PLAYER_ASSIGNMENT_STATUSES,
  PLAYER_CAREER_EVENT_TYPES,
  PLAYER_COMPETITION_LEVELS,
  PLAYER_ELIGIBILITY_STATES,
  PLAYER_PARTICIPATION_STATES,
  PLAYER_POSITION_ASSIGNMENT_TYPES,
  PLAYER_PROFILE_CONFIDENCE_LEVELS,
  PLAYER_PROFILE_CONTRACT_NAME,
  PLAYER_PROFILE_CONTRACT_VERSION,
  PLAYER_PROFILE_SCHEMA_VERSION,
  PLAYER_PROFILE_STATUSES,
  PLAYER_PROFILE_VERIFICATION_STATES,
  PLAYER_ROSTER_DESIGNATIONS,
} from "../constants/playerProfileConstants.js";

function isObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function optionalString(value) { return typeof value === "string" && value.trim() ? value.trim() : null; }
function createValidation(checkedAt = null) {
  return { valid: true, errors: [], warnings: [], checkedAt: optionalString(checkedAt),
    contractVersion: PLAYER_PROFILE_CONTRACT_VERSION, schemaVersion: PLAYER_PROFILE_SCHEMA_VERSION };
}
function addEntry(validation, field, code, path, message) {
  if (!validation[field].some((entry) => entry.code === code && entry.path === path && entry.message === message)) validation[field].push({ code, path, message });
  validation.valid = validation.errors.length === 0;
}
function addError(validation, code, path, message) { addEntry(validation, "errors", code, path, message); }
function addWarning(validation, code, path, message) { addEntry(validation, "warnings", code, path, message); }
function normalizeString(value, path, validation, { required = false } = {}) {
  if (value == null) { if (required) addError(validation, "MISSING_REQUIRED_FIELD", path, `${path} is required.`); return null; }
  if (typeof value !== "string" || !value.trim()) { addError(validation, "INVALID_STRING", path, `${path} must be a non-empty string or null.`); return null; }
  return value.trim();
}
function normalizeEnum(value, allowed, path, validation, { required = false } = {}) {
  if (value == null || value === "") { if (required) addError(validation, "MISSING_REQUIRED_FIELD", path, `${path} is required.`); return null; }
  if (!Object.values(allowed).includes(value)) { addError(validation, "UNRECOGNIZED_ENUM_VALUE", path, `${path} is not recognized.`); return null; }
  return value;
}
function normalizeDate(value, path, validation) {
  const normalized = normalizeString(value, path, validation);
  if (normalized === null) return null;
  if (Number.isNaN(Date.parse(normalized))) { addError(validation, "INVALID_DATE", path, `${path} must be a recognizable date string or null.`); return null; }
  return normalized;
}
function normalizeVersion(value, validation) {
  if (value == null) return null;
  if ((typeof value === "string" && value.trim()) || (Number.isInteger(value) && value >= 0)) return typeof value === "string" ? value.trim() : value;
  addError(validation, "INVALID_PROFILE_VERSION", "versioning.profileVersion", "profileVersion must be a non-empty string, non-negative integer, or null."); return null;
}
function normalizeNested(value, path, validation, normalizer) {
  if (value == null) return normalizer({});
  if (!isObject(value)) { addError(validation, "INVALID_NESTED_STRUCTURE", path, `${path} must be an object or null.`); return normalizer({}); }
  return normalizer(value);
}
function normalizeStringArray(value, path, validation) {
  if (value == null) return [];
  if (!Array.isArray(value)) { addError(validation, "INVALID_ARRAY", path, `${path} must be an array.`); return []; }
  const result = []; const seen = new Set();
  value.forEach((entry, index) => {
    if (typeof entry !== "string" || !entry.trim()) { addError(validation, "INVALID_REFERENCE", `${path}[${index}]`, `${path} values must be non-empty strings.`); return; }
    const item = entry.trim();
    if (seen.has(item)) { addWarning(validation, "DUPLICATE_NORMALIZED_VALUE", path, `Duplicate value removed from ${path}: ${item}.`); return; }
    seen.add(item); result.push(item);
  });
  return result;
}
function validateDateOrder(start, end, path, validation) {
  if (start && end && Date.parse(start) > Date.parse(end)) addError(validation, "INVALID_DATE_ORDER", path, `${path} start date must not be after end date.`);
}
function normalizeObjectArray(value, path, validation, structureCode, normalizer, idField = null) {
  if (value == null) return [];
  if (!Array.isArray(value)) { addError(validation, "INVALID_ARRAY", path, `${path} must be an array.`); return []; }
  const result = []; const exact = new Set(); const ids = new Map();
  value.forEach((entry, index) => {
    if (!isObject(entry)) { addError(validation, structureCode, `${path}[${index}]`, `${path} entries must be objects.`); return; }
    const item = normalizer(entry, index); const identity = JSON.stringify(item);
    if (idField && item[idField]) {
      if (ids.has(item[idField]) && ids.get(item[idField]) !== identity) addError(validation, "DUPLICATE_RECORD_ID", `${path}[${index}].${idField}`, `${idField} must be unique within ${path}.`);
      ids.set(item[idField], identity);
    }
    if (exact.has(identity)) { addWarning(validation, "DUPLICATE_NORMALIZED_OBJECT", path, `Exact duplicate removed from ${path}.`); return; }
    exact.add(identity); result.push(item);
  });
  return result;
}
function mergeValidation(base, addition) {
  const result = { ...base, errors: [...base.errors], warnings: [...base.warnings] };
  addition.errors.forEach((entry) => addError(result, entry.code, entry.path, entry.message));
  addition.warnings.forEach((entry) => addWarning(result, entry.code, entry.path, entry.message));
  result.valid = result.errors.length === 0; return result;
}

function normalizePlayerProfile(input, checkedAt = null) {
  const validation = createValidation(checkedAt); const profile = isObject(input) ? input : {};
  if (!isObject(input)) addError(validation, "INVALID_PLAYER_PROFILE_INPUT", "", "Player Profile input must be an object.");
  const profileId = normalizeString(profile.profileId, "profileId", validation, { required: true });
  const entityRef = normalizeString(profile.entityRef, "entityRef", validation, { required: true });
  const personProfileRef = normalizeString(profile.personProfileRef, "personProfileRef", validation);
  const status = normalizeEnum(profile.status, PLAYER_PROFILE_STATUSES, "status", validation, { required: true });
  const participationState = normalizeEnum(profile.participationState, PLAYER_PARTICIPATION_STATES, "participationState", validation, { required: true });
  const playingIdentity = normalizeNested(profile.playingIdentity, "playingIdentity", validation, (value) => ({
    preferredPositionRef: normalizeString(value.preferredPositionRef, "playingIdentity.preferredPositionRef", validation),
    preferredPositionCode: normalizeString(value.preferredPositionCode, "playingIdentity.preferredPositionCode", validation),
    throws: normalizeString(value.throws, "playingIdentity.throws", validation),
    kicks: normalizeString(value.kicks, "playingIdentity.kicks", validation),
    uniformNumber: normalizeString(value.uniformNumber, "playingIdentity.uniformNumber", validation),
    competitionLevel: normalizeEnum(value.competitionLevel, PLAYER_COMPETITION_LEVELS, "playingIdentity.competitionLevel", validation, { required: true }),
    experienceLabel: normalizeString(value.experienceLabel, "playingIdentity.experienceLabel", validation),
    notes: normalizeString(value.notes, "playingIdentity.notes", validation),
  }));
  if (playingIdentity.competitionLevel === PLAYER_COMPETITION_LEVELS.UNKNOWN) addWarning(validation, "UNKNOWN_COMPETITION_LEVEL", "playingIdentity.competitionLevel", "Competition level is explicitly UNKNOWN.");
  const positionHistory = normalizeObjectArray(profile.positionHistory, "positionHistory", validation, "INVALID_POSITION_RECORD_STRUCTURE", (value, index) => {
    const item = {
      positionRef: normalizeString(value.positionRef, `positionHistory[${index}].positionRef`, validation),
      positionCode: normalizeString(value.positionCode, `positionHistory[${index}].positionCode`, validation),
      assignmentType: normalizeEnum(value.assignmentType, PLAYER_POSITION_ASSIGNMENT_TYPES, `positionHistory[${index}].assignmentType`, validation, { required: true }),
      status: normalizeEnum(value.status, PLAYER_ASSIGNMENT_STATUSES, `positionHistory[${index}].status`, validation, { required: true }),
      competitionLevel: normalizeEnum(value.competitionLevel, PLAYER_COMPETITION_LEVELS, `positionHistory[${index}].competitionLevel`, validation, { required: true }),
      organizationRef: normalizeString(value.organizationRef, `positionHistory[${index}].organizationRef`, validation),
      startedAt: normalizeDate(value.startedAt, `positionHistory[${index}].startedAt`, validation),
      endedAt: normalizeDate(value.endedAt, `positionHistory[${index}].endedAt`, validation),
      sourceRefs: normalizeStringArray(value.sourceRefs, `positionHistory[${index}].sourceRefs`, validation),
      evidenceArtifactRefs: normalizeStringArray(value.evidenceArtifactRefs, `positionHistory[${index}].evidenceArtifactRefs`, validation),
      notes: normalizeString(value.notes, `positionHistory[${index}].notes`, validation),
    };
    if (!item.positionRef && !item.positionCode) addError(validation, "POSITION_IDENTIFIER_REQUIRED", `positionHistory[${index}]`, "Position history requires positionRef or positionCode.");
    validateDateOrder(item.startedAt, item.endedAt, `positionHistory[${index}]`, validation); return item;
  });
  const teamAssignments = normalizeObjectArray(profile.teamAssignments, "teamAssignments", validation, "INVALID_TEAM_ASSIGNMENT_STRUCTURE", (value, index) => {
    const item = {
      assignmentId: normalizeString(value.assignmentId, `teamAssignments[${index}].assignmentId`, validation, { required: true }),
      organizationRef: normalizeString(value.organizationRef, `teamAssignments[${index}].organizationRef`, validation),
      teamRef: normalizeString(value.teamRef, `teamAssignments[${index}].teamRef`, validation),
      competitionRef: normalizeString(value.competitionRef, `teamAssignments[${index}].competitionRef`, validation),
      seasonRef: normalizeString(value.seasonRef, `teamAssignments[${index}].seasonRef`, validation),
      competitionLevel: normalizeEnum(value.competitionLevel, PLAYER_COMPETITION_LEVELS, `teamAssignments[${index}].competitionLevel`, validation, { required: true }),
      status: normalizeEnum(value.status, PLAYER_ASSIGNMENT_STATUSES, `teamAssignments[${index}].status`, validation, { required: true }),
      roleRef: normalizeString(value.roleRef, `teamAssignments[${index}].roleRef`, validation),
      positionRefs: normalizeStringArray(value.positionRefs, `teamAssignments[${index}].positionRefs`, validation),
      positionCodes: normalizeStringArray(value.positionCodes, `teamAssignments[${index}].positionCodes`, validation),
      uniformNumber: normalizeString(value.uniformNumber, `teamAssignments[${index}].uniformNumber`, validation),
      startedAt: normalizeDate(value.startedAt, `teamAssignments[${index}].startedAt`, validation),
      endedAt: normalizeDate(value.endedAt, `teamAssignments[${index}].endedAt`, validation),
      sourceRefs: normalizeStringArray(value.sourceRefs, `teamAssignments[${index}].sourceRefs`, validation),
      evidenceArtifactRefs: normalizeStringArray(value.evidenceArtifactRefs, `teamAssignments[${index}].evidenceArtifactRefs`, validation),
      notes: normalizeString(value.notes, `teamAssignments[${index}].notes`, validation),
    };
    if (!item.teamRef && !item.organizationRef) addError(validation, "ASSIGNMENT_ORGANIZATION_REQUIRED", `teamAssignments[${index}]`, "Assignment requires teamRef or organizationRef.");
    validateDateOrder(item.startedAt, item.endedAt, `teamAssignments[${index}]`, validation); return item;
  }, "assignmentId");
  const rosterHistory = normalizeObjectArray(profile.rosterHistory, "rosterHistory", validation, "INVALID_ROSTER_EVENT_STRUCTURE", (value, index) => {
    const item = {
      rosterEventId: normalizeString(value.rosterEventId, `rosterHistory[${index}].rosterEventId`, validation, { required: true }),
      teamRef: normalizeString(value.teamRef, `rosterHistory[${index}].teamRef`, validation),
      organizationRef: normalizeString(value.organizationRef, `rosterHistory[${index}].organizationRef`, validation),
      designation: normalizeEnum(value.designation, PLAYER_ROSTER_DESIGNATIONS, `rosterHistory[${index}].designation`, validation, { required: true }),
      effectiveAt: normalizeDate(value.effectiveAt, `rosterHistory[${index}].effectiveAt`, validation),
      endedAt: normalizeDate(value.endedAt, `rosterHistory[${index}].endedAt`, validation),
      sourceRefs: normalizeStringArray(value.sourceRefs, `rosterHistory[${index}].sourceRefs`, validation),
      evidenceArtifactRefs: normalizeStringArray(value.evidenceArtifactRefs, `rosterHistory[${index}].evidenceArtifactRefs`, validation),
      notes: normalizeString(value.notes, `rosterHistory[${index}].notes`, validation),
    };
    if (!item.teamRef && !item.organizationRef) addError(validation, "ROSTER_ORGANIZATION_REQUIRED", `rosterHistory[${index}]`, "Roster event requires teamRef or organizationRef.");
    if (!item.effectiveAt && !item.notes) addError(validation, "ROSTER_DATE_OR_CONTEXT_REQUIRED", `rosterHistory[${index}].effectiveAt`, "Roster event requires effectiveAt or explanatory notes.");
    validateDateOrder(item.effectiveAt, item.endedAt, `rosterHistory[${index}]`, validation); return item;
  }, "rosterEventId");
  const eligibilityHistory = normalizeObjectArray(profile.eligibilityHistory, "eligibilityHistory", validation, "INVALID_ELIGIBILITY_EVENT_STRUCTURE", (value, index) => {
    const item = {
      eligibilityEventId: normalizeString(value.eligibilityEventId, `eligibilityHistory[${index}].eligibilityEventId`, validation, { required: true }),
      state: normalizeEnum(value.state, PLAYER_ELIGIBILITY_STATES, `eligibilityHistory[${index}].state`, validation, { required: true }),
      competitionRef: normalizeString(value.competitionRef, `eligibilityHistory[${index}].competitionRef`, validation),
      seasonRef: normalizeString(value.seasonRef, `eligibilityHistory[${index}].seasonRef`, validation),
      effectiveAt: normalizeDate(value.effectiveAt, `eligibilityHistory[${index}].effectiveAt`, validation),
      endedAt: normalizeDate(value.endedAt, `eligibilityHistory[${index}].endedAt`, validation),
      reason: normalizeString(value.reason, `eligibilityHistory[${index}].reason`, validation),
      sourceRefs: normalizeStringArray(value.sourceRefs, `eligibilityHistory[${index}].sourceRefs`, validation),
      evidenceArtifactRefs: normalizeStringArray(value.evidenceArtifactRefs, `eligibilityHistory[${index}].evidenceArtifactRefs`, validation),
      notes: normalizeString(value.notes, `eligibilityHistory[${index}].notes`, validation),
    };
    if (!item.competitionRef && !item.seasonRef && !item.notes) addError(validation, "ELIGIBILITY_CONTEXT_REQUIRED", `eligibilityHistory[${index}]`, "Eligibility event requires competitionRef, seasonRef, or explanatory notes.");
    validateDateOrder(item.effectiveAt, item.endedAt, `eligibilityHistory[${index}]`, validation); return item;
  }, "eligibilityEventId");
  const careerTimeline = normalizeObjectArray(profile.careerTimeline, "careerTimeline", validation, "INVALID_CAREER_EVENT_STRUCTURE", (value, index) => {
    const item = {
      eventId: normalizeString(value.eventId, `careerTimeline[${index}].eventId`, validation, { required: true }),
      eventType: normalizeEnum(value.eventType, PLAYER_CAREER_EVENT_TYPES, `careerTimeline[${index}].eventType`, validation, { required: true }),
      title: normalizeString(value.title, `careerTimeline[${index}].title`, validation),
      description: normalizeString(value.description, `careerTimeline[${index}].description`, validation),
      organizationRef: normalizeString(value.organizationRef, `careerTimeline[${index}].organizationRef`, validation),
      teamRef: normalizeString(value.teamRef, `careerTimeline[${index}].teamRef`, validation),
      competitionRef: normalizeString(value.competitionRef, `careerTimeline[${index}].competitionRef`, validation),
      seasonRef: normalizeString(value.seasonRef, `careerTimeline[${index}].seasonRef`, validation),
      occurredAt: normalizeDate(value.occurredAt, `careerTimeline[${index}].occurredAt`, validation),
      startedAt: normalizeDate(value.startedAt, `careerTimeline[${index}].startedAt`, validation),
      endedAt: normalizeDate(value.endedAt, `careerTimeline[${index}].endedAt`, validation),
      sourceRefs: normalizeStringArray(value.sourceRefs, `careerTimeline[${index}].sourceRefs`, validation),
      evidenceArtifactRefs: normalizeStringArray(value.evidenceArtifactRefs, `careerTimeline[${index}].evidenceArtifactRefs`, validation),
      notes: normalizeString(value.notes, `careerTimeline[${index}].notes`, validation),
    };
    if (!item.title && !item.description) addError(validation, "CAREER_EVENT_CONTEXT_REQUIRED", `careerTimeline[${index}]`, "Career event requires title or description.");
    validateDateOrder(item.startedAt, item.endedAt, `careerTimeline[${index}]`, validation); return item;
  }, "eventId");
  const referenceFields = ["researchSourceRefs", "researchSessionRefs", "recordedObservationRefs", "analyticalObservationRefs",
    "evidenceArtifactRefs", "relationshipRefs", "measurementProfileRefs", "athleticProfileRefs", "productionProfileRefs",
    "statisticsDatasetRefs", "injuryRecordRefs", "medicalRecordRefs", "recognitionRecordRefs", "transactionRefs", "snapshotRefs",
    "documentRefs", "datasetRefs", "otherRefs"];
  const references = normalizeNested(profile.references, "references", validation, (value) => Object.fromEntries(
    referenceFields.map((field) => [field, normalizeStringArray(value[field], `references.${field}`, validation)])));
  const verification = normalizeNested(profile.verification, "verification", validation, (value) => ({
    state: normalizeEnum(value.state, PLAYER_PROFILE_VERIFICATION_STATES, "verification.state", validation, { required: true }),
    confidence: normalizeEnum(value.confidence, PLAYER_PROFILE_CONFIDENCE_LEVELS, "verification.confidence", validation, { required: true }),
    verifiedBy: normalizeString(value.verifiedBy, "verification.verifiedBy", validation),
    verifiedAt: normalizeDate(value.verifiedAt, "verification.verifiedAt", validation),
    limitations: normalizeStringArray(value.limitations, "verification.limitations", validation),
    disputes: normalizeStringArray(value.disputes, "verification.disputes", validation),
    notes: normalizeString(value.notes, "verification.notes", validation),
  }));
  const provenance = normalizeNested(profile.provenance, "provenance", validation, (value) => ({
    createdBy: normalizeString(value.createdBy, "provenance.createdBy", validation), createdAt: normalizeDate(value.createdAt, "provenance.createdAt", validation),
    updatedBy: normalizeString(value.updatedBy, "provenance.updatedBy", validation), updatedAt: normalizeDate(value.updatedAt, "provenance.updatedAt", validation),
    originSystem: normalizeString(value.originSystem, "provenance.originSystem", validation), originRecordRef: normalizeString(value.originRecordRef, "provenance.originRecordRef", validation),
    notes: normalizeString(value.notes, "provenance.notes", validation),
  }));
  const versioning = normalizeNested(profile.versioning, "versioning", validation, (value) => ({
    profileVersion: normalizeVersion(value.profileVersion, validation), supersedesProfileRef: normalizeString(value.supersedesProfileRef, "versioning.supersedesProfileRef", validation),
    supersededByProfileRef: normalizeString(value.supersededByProfileRef, "versioning.supersededByProfileRef", validation), changeReason: normalizeString(value.changeReason, "versioning.changeReason", validation),
    notes: normalizeString(value.notes, "versioning.notes", validation),
  }));
  const metadata = normalizeNested(profile.metadata, "metadata", validation, (value) => ({
    tags: normalizeStringArray(value.tags, "metadata.tags", validation), domains: normalizeStringArray(value.domains, "metadata.domains", validation),
    visibility: normalizeString(value.visibility, "metadata.visibility", validation), restrictions: normalizeString(value.restrictions, "metadata.restrictions", validation),
    notes: normalizeString(value.notes, "metadata.notes", validation),
  }));
  if (status === PLAYER_PROFILE_STATUSES.ACTIVE && ![PLAYER_PROFILE_VERIFICATION_STATES.VERIFIED, PLAYER_PROFILE_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS].includes(verification.state)) addWarning(validation, "ACTIVE_PROFILE_UNVERIFIED", "verification.state", "ACTIVE describes only the Player Profile lifecycle.");
  if ([PLAYER_PROFILE_VERIFICATION_STATES.VERIFIED, PLAYER_PROFILE_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS].includes(verification.state)) {
    if (!verification.verifiedBy) addError(validation, "VERIFIER_REQUIRED", "verification.verifiedBy", "Verified profile requires verifiedBy.");
    if (!verification.verifiedAt) addError(validation, "VERIFICATION_DATE_REQUIRED", "verification.verifiedAt", "Verified profile requires verifiedAt.");
  }
  if (verification.state === PLAYER_PROFILE_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS && verification.limitations.length === 0 && !verification.notes) addError(validation, "VERIFICATION_LIMITATION_REQUIRED", "verification.limitations", "VERIFIED_WITH_LIMITATIONS requires a limitation or note.");
  if (verification.state === PLAYER_PROFILE_VERIFICATION_STATES.DISPUTED && verification.disputes.length === 0 && verification.limitations.length === 0 && !verification.notes) addError(validation, "DISPUTE_CONTEXT_REQUIRED", "verification.disputes", "DISPUTED profile requires context.");
  ["supersedesProfileRef", "supersededByProfileRef"].forEach((field) => { if (profileId && versioning[field] === profileId) addError(validation, "SELF_REFERENCE", `versioning.${field}`, `${field} must not equal profileId.`); });
  if (versioning.supersedesProfileRef && versioning.supersededByProfileRef && versioning.supersedesProfileRef === versioning.supersededByProfileRef) addError(validation, "CONFLICTING_VERSION_REFERENCES", "versioning", "Version references must not point to the same profile.");
  if (status === PLAYER_PROFILE_STATUSES.ARCHIVED && !provenance.updatedAt && !versioning.changeReason && !metadata.notes) addError(validation, "ARCHIVE_CONTEXT_REQUIRED", "provenance.updatedAt", "ARCHIVED status requires archival context.");
  validation.valid = validation.errors.length === 0;
  return { contract: PLAYER_PROFILE_CONTRACT_NAME, contractVersion: PLAYER_PROFILE_CONTRACT_VERSION, schemaVersion: PLAYER_PROFILE_SCHEMA_VERSION,
    profileId, entityRef, personProfileRef, status, participationState, playingIdentity, positionHistory, teamAssignments, rosterHistory,
    eligibilityHistory, careerTimeline, references, verification, provenance, versioning, metadata, validation };
}

export function createPlayerProfile(input = {}, { checkedAt = null } = {}) { return normalizePlayerProfile(input, checkedAt); }
export function createUnavailablePlayerProfile(input = {}, { checkedAt = null } = {}) {
  const supplied = isObject(input) ? input : {}; const reason = optionalString(supplied.reason); const metadata = isObject(supplied.metadata) ? supplied.metadata : {};
  const result = normalizePlayerProfile({ ...supplied, metadata: { ...metadata, notes: metadata.notes ?? reason } }, checkedAt);
  const unavailable = createValidation(checkedAt); addError(unavailable, "PLAYER_PROFILE_UNAVAILABLE", "", reason || "No usable Player Profile is available.");
  return { ...result, validation: mergeValidation(result.validation, unavailable) };
}
export function validatePlayerProfile(value, { checkedAt = value?.validation?.checkedAt ?? null } = {}) { return normalizePlayerProfile(value, checkedAt).validation; }
export function isPlayerProfile(value) { return Boolean(isObject(value) && value.contract === PLAYER_PROFILE_CONTRACT_NAME && value.contractVersion === PLAYER_PROFILE_CONTRACT_VERSION && value.schemaVersion === PLAYER_PROFILE_SCHEMA_VERSION && validatePlayerProfile(value).valid); }
export function isVerifiedPlayerProfile(value) { return Boolean(isPlayerProfile(value) && [PLAYER_PROFILE_VERIFICATION_STATES.VERIFIED, PLAYER_PROFILE_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS].includes(value.verification.state)); }
export function isActivePlayerProfile(value) { return Boolean(isPlayerProfile(value) && value.status === PLAYER_PROFILE_STATUSES.ACTIVE); }
export function isRetiredPlayerProfile(value) { return Boolean(isPlayerProfile(value) && value.participationState === PLAYER_PARTICIPATION_STATES.RETIRED); }
export function isDisputedPlayerProfile(value) { return Boolean(isPlayerProfile(value) && value.verification.state === PLAYER_PROFILE_VERIFICATION_STATES.DISPUTED); }
export function getPlayerProfileEntityRef(value) { return isPlayerProfile(value) ? value.entityRef : null; }
export function getPlayerProfilePersonRef(value) { return isPlayerProfile(value) ? value.personProfileRef : null; }

export default Object.freeze({ PLAYER_PROFILE_CONTRACT_NAME, PLAYER_PROFILE_CONTRACT_VERSION, PLAYER_PROFILE_SCHEMA_VERSION,
  createPlayerProfile, createUnavailablePlayerProfile, validatePlayerProfile, isPlayerProfile, isVerifiedPlayerProfile,
  isActivePlayerProfile, isRetiredPlayerProfile, isDisputedPlayerProfile, getPlayerProfileEntityRef, getPlayerProfilePersonRef });
