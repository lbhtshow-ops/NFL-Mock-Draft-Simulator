import {
  PROSPECT_CYCLE_STATES, PROSPECT_CYCLE_TYPES, PROSPECT_DECLARATION_STATES,
  PROSPECT_ELIGIBILITY_BASIS_TYPES, PROSPECT_ELIGIBILITY_STATES, PROSPECT_ENTRY_PATHWAY_TYPES,
  PROSPECT_EVENT_TYPES, PROSPECT_INVITATION_STATES, PROSPECT_PROFILE_CONFIDENCE_LEVELS,
  PROSPECT_PROFILE_CONTRACT_NAME, PROSPECT_PROFILE_CONTRACT_VERSION, PROSPECT_PROFILE_SCHEMA_VERSION,
  PROSPECT_PROFILE_STATUSES, PROSPECT_PROFILE_VERIFICATION_STATES, PROSPECT_TIMELINE_EVENT_TYPES,
} from "../constants/prospectProfileConstants.js";

const REFERENCE_FIELDS = [
  "researchSourceRefs", "researchSessionRefs", "recordedObservationRefs", "analyticalObservationRefs",
  "evidenceArtifactRefs", "relationshipRefs", "draftClassRefs", "consensusRecordRefs", "scoutingReportRefs",
  "measurementProfileRefs", "athleticProfileRefs", "productionProfileRefs", "statisticsDatasetRefs",
  "medicalRecordRefs", "injuryRecordRefs", "interviewRecordRefs", "recognitionRecordRefs", "selectionRefs",
  "transactionRefs", "documentRefs", "datasetRefs", "otherRefs",
];

function isObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function optionalString(value) { return typeof value === "string" && value.trim() ? value.trim() : null; }
function createValidation(checkedAt = null) {
  return { valid: true, errors: [], warnings: [], checkedAt: optionalString(checkedAt),
    contractVersion: PROSPECT_PROFILE_CONTRACT_VERSION, schemaVersion: PROSPECT_PROFILE_SCHEMA_VERSION };
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
function normalizeEnum(value, allowed, path, validation, { required = false, warnUnknown = false } = {}) {
  if (value == null || value === "") { if (required) addError(validation, "MISSING_REQUIRED_FIELD", path, `${path} is required.`); return null; }
  if (!Object.values(allowed).includes(value)) { addError(validation, "UNRECOGNIZED_ENUM_VALUE", path, `${path} is not recognized.`); return null; }
  if (warnUnknown && value === "UNKNOWN") addWarning(validation, "EXPLICIT_UNKNOWN_VALUE", path, `${path} is explicitly UNKNOWN.`);
  return value;
}
function normalizeDate(value, path, validation) {
  const result = normalizeString(value, path, validation); if (result === null) return null;
  if (Number.isNaN(Date.parse(result))) { addError(validation, "INVALID_DATE", path, `${path} must be a recognizable date string or null.`); return null; }
  return result;
}
function normalizeClassYear(value, validation) {
  if (value == null) return null;
  if ((typeof value === "string" && value.trim()) || Number.isInteger(value)) return typeof value === "string" ? value.trim() : value;
  addError(validation, "INVALID_CLASS_YEAR", "cycle.classYear", "cycle.classYear must be a non-empty string, integer, or null."); return null;
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
  if (start && end && Date.parse(start) > Date.parse(end)) addError(validation, "INVALID_DATE_ORDER", path, `${path} dates are not logically ordered.`);
}
function normalizeObjectArray(value, path, validation, normalizer) {
  if (value == null) return [];
  if (!Array.isArray(value)) { addError(validation, "INVALID_ARRAY", path, `${path} must be an array.`); return []; }
  const result = []; const exact = new Set(); const ids = new Map();
  value.forEach((entry, index) => {
    if (!isObject(entry)) { addError(validation, "INVALID_RECORD_STRUCTURE", `${path}[${index}]`, `${path} entries must be objects.`); return; }
    const item = normalizer(entry, index); const identity = JSON.stringify(item);
    if (item.eventId && ids.has(item.eventId) && ids.get(item.eventId) !== identity) addError(validation, "DUPLICATE_RECORD_ID", `${path}[${index}].eventId`, `eventId must be unique within ${path}.`);
    if (item.eventId) ids.set(item.eventId, identity);
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

function normalizeProspectProfile(input, checkedAt = null) {
  const validation = createValidation(checkedAt); const profile = isObject(input) ? input : {};
  if (!isObject(input)) addError(validation, "INVALID_PROSPECT_PROFILE_INPUT", "", "Prospect Profile input must be an object.");
  const profileId = normalizeString(profile.profileId, "profileId", validation, { required: true });
  const entityRef = normalizeString(profile.entityRef, "entityRef", validation, { required: true });
  const personProfileRef = normalizeString(profile.personProfileRef, "personProfileRef", validation);
  const playerProfileRef = normalizeString(profile.playerProfileRef, "playerProfileRef", validation, { required: true });
  const prospectCycleRef = normalizeString(profile.prospectCycleRef, "prospectCycleRef", validation);
  const status = normalizeEnum(profile.status, PROSPECT_PROFILE_STATUSES, "status", validation, { required: true });

  const cycle = normalizeNested(profile.cycle, "cycle", validation, (value) => {
    const result = {
      cycleType: normalizeEnum(value.cycleType, PROSPECT_CYCLE_TYPES, "cycle.cycleType", validation, { required: true, warnUnknown: true }),
      cycleLabel: normalizeString(value.cycleLabel, "cycle.cycleLabel", validation), classYear: normalizeClassYear(value.classYear, validation),
      leagueRef: normalizeString(value.leagueRef, "cycle.leagueRef", validation), competitionRef: normalizeString(value.competitionRef, "cycle.competitionRef", validation),
      seasonRef: normalizeString(value.seasonRef, "cycle.seasonRef", validation), draftClassRef: normalizeString(value.draftClassRef, "cycle.draftClassRef", validation),
      status: normalizeEnum(value.status, PROSPECT_CYCLE_STATES, "cycle.status", validation, { required: true, warnUnknown: true }),
      startedAt: normalizeDate(value.startedAt, "cycle.startedAt", validation), endedAt: normalizeDate(value.endedAt, "cycle.endedAt", validation),
      notes: normalizeString(value.notes, "cycle.notes", validation),
    };
    validateDateOrder(result.startedAt, result.endedAt, "cycle", validation); return result;
  });

  const eligibility = normalizeNested(profile.eligibility, "eligibility", validation, (value) => {
    const result = {
      state: normalizeEnum(value.state, PROSPECT_ELIGIBILITY_STATES, "eligibility.state", validation, { required: true, warnUnknown: true }),
      basisType: normalizeEnum(value.basisType, PROSPECT_ELIGIBILITY_BASIS_TYPES, "eligibility.basisType", validation, { required: true, warnUnknown: true }),
      effectiveAt: normalizeDate(value.effectiveAt, "eligibility.effectiveAt", validation), confirmedAt: normalizeDate(value.confirmedAt, "eligibility.confirmedAt", validation),
      confirmedByRef: normalizeString(value.confirmedByRef, "eligibility.confirmedByRef", validation), rulingRef: normalizeString(value.rulingRef, "eligibility.rulingRef", validation),
      sourceRefs: normalizeStringArray(value.sourceRefs, "eligibility.sourceRefs", validation), evidenceArtifactRefs: normalizeStringArray(value.evidenceArtifactRefs, "eligibility.evidenceArtifactRefs", validation),
      limitations: normalizeString(value.limitations, "eligibility.limitations", validation), notes: normalizeString(value.notes, "eligibility.notes", validation),
    };
    validateDateOrder(result.effectiveAt, result.confirmedAt, "eligibility", validation); return result;
  });

  const declaration = normalizeNested(profile.declaration, "declaration", validation, (value) => {
    const result = {
      state: normalizeEnum(value.state, PROSPECT_DECLARATION_STATES, "declaration.state", validation, { required: true, warnUnknown: true }),
      declaredAt: normalizeDate(value.declaredAt, "declaration.declaredAt", validation), withdrawalDeadline: normalizeDate(value.withdrawalDeadline, "declaration.withdrawalDeadline", validation),
      withdrawnAt: normalizeDate(value.withdrawnAt, "declaration.withdrawnAt", validation), announcementSourceRef: normalizeString(value.announcementSourceRef, "declaration.announcementSourceRef", validation),
      sourceRefs: normalizeStringArray(value.sourceRefs, "declaration.sourceRefs", validation), evidenceArtifactRefs: normalizeStringArray(value.evidenceArtifactRefs, "declaration.evidenceArtifactRefs", validation),
      notes: normalizeString(value.notes, "declaration.notes", validation),
    };
    validateDateOrder(result.declaredAt, result.withdrawalDeadline, "declaration.declaredAt", validation);
    validateDateOrder(result.declaredAt, result.withdrawnAt, "declaration.withdrawnAt", validation);
    if (result.state === PROSPECT_DECLARATION_STATES.DECLARED && !result.declaredAt && !result.announcementSourceRef && !result.sourceRefs.length && !result.notes) addWarning(validation, "DECLARATION_CONTEXT_MISSING", "declaration", "DECLARED should include a date or source context.");
    if (result.state === PROSPECT_DECLARATION_STATES.WITHDRAWN && !result.withdrawnAt && !result.sourceRefs.length && !result.notes) addWarning(validation, "WITHDRAWAL_CONTEXT_MISSING", "declaration", "WITHDRAWN should include a date or source context.");
    return result;
  });

  const entry = normalizeNested(profile.entry, "entry", validation, (value) => {
    const result = {
      pathwayType: normalizeEnum(value.pathwayType, PROSPECT_ENTRY_PATHWAY_TYPES, "entry.pathwayType", validation, { required: true, warnUnknown: true }),
      entrySubmittedAt: normalizeDate(value.entrySubmittedAt, "entry.entrySubmittedAt", validation), entryAcceptedAt: normalizeDate(value.entryAcceptedAt, "entry.entryAcceptedAt", validation),
      entryRejectedAt: normalizeDate(value.entryRejectedAt, "entry.entryRejectedAt", validation), selectionRef: normalizeString(value.selectionRef, "entry.selectionRef", validation),
      signingRef: normalizeString(value.signingRef, "entry.signingRef", validation), sourceRefs: normalizeStringArray(value.sourceRefs, "entry.sourceRefs", validation),
      evidenceArtifactRefs: normalizeStringArray(value.evidenceArtifactRefs, "entry.evidenceArtifactRefs", validation), notes: normalizeString(value.notes, "entry.notes", validation),
    };
    validateDateOrder(result.entrySubmittedAt, result.entryAcceptedAt, "entry.entryAcceptedAt", validation);
    validateDateOrder(result.entrySubmittedAt, result.entryRejectedAt, "entry.entryRejectedAt", validation); return result;
  });

  const eventHistory = normalizeObjectArray(profile.eventHistory, "eventHistory", validation, (value, index) => {
    const item = {
      eventId: normalizeString(value.eventId, `eventHistory[${index}].eventId`, validation, { required: true }),
      eventType: normalizeEnum(value.eventType, PROSPECT_EVENT_TYPES, `eventHistory[${index}].eventType`, validation, { required: true, warnUnknown: true }),
      eventRef: normalizeString(value.eventRef, `eventHistory[${index}].eventRef`, validation), eventLabel: normalizeString(value.eventLabel, `eventHistory[${index}].eventLabel`, validation),
      invitationState: normalizeEnum(value.invitationState, PROSPECT_INVITATION_STATES, `eventHistory[${index}].invitationState`, validation, { required: true, warnUnknown: true }),
      organizationRef: normalizeString(value.organizationRef, `eventHistory[${index}].organizationRef`, validation), teamRef: normalizeString(value.teamRef, `eventHistory[${index}].teamRef`, validation),
      locationRef: normalizeString(value.locationRef, `eventHistory[${index}].locationRef`, validation), scheduledAt: normalizeDate(value.scheduledAt, `eventHistory[${index}].scheduledAt`, validation),
      startedAt: normalizeDate(value.startedAt, `eventHistory[${index}].startedAt`, validation), endedAt: normalizeDate(value.endedAt, `eventHistory[${index}].endedAt`, validation),
      sourceRefs: normalizeStringArray(value.sourceRefs, `eventHistory[${index}].sourceRefs`, validation), evidenceArtifactRefs: normalizeStringArray(value.evidenceArtifactRefs, `eventHistory[${index}].evidenceArtifactRefs`, validation),
      measurementProfileRefs: normalizeStringArray(value.measurementProfileRefs, `eventHistory[${index}].measurementProfileRefs`, validation), medicalRecordRefs: normalizeStringArray(value.medicalRecordRefs, `eventHistory[${index}].medicalRecordRefs`, validation),
      interviewRecordRefs: normalizeStringArray(value.interviewRecordRefs, `eventHistory[${index}].interviewRecordRefs`, validation), notes: normalizeString(value.notes, `eventHistory[${index}].notes`, validation),
    };
    if (!item.eventRef && !item.eventLabel && !item.notes) addError(validation, "EVENT_IDENTITY_REQUIRED", `eventHistory[${index}]`, "Event requires eventRef, eventLabel, or notes.");
    validateDateOrder(item.startedAt, item.endedAt, `eventHistory[${index}]`, validation); return item;
  });

  const prospectTimeline = normalizeObjectArray(profile.prospectTimeline, "prospectTimeline", validation, (value, index) => {
    const item = {
      eventId: normalizeString(value.eventId, `prospectTimeline[${index}].eventId`, validation, { required: true }),
      eventType: normalizeEnum(value.eventType, PROSPECT_TIMELINE_EVENT_TYPES, `prospectTimeline[${index}].eventType`, validation, { required: true, warnUnknown: true }),
      title: normalizeString(value.title, `prospectTimeline[${index}].title`, validation), description: normalizeString(value.description, `prospectTimeline[${index}].description`, validation),
      occurredAt: normalizeDate(value.occurredAt, `prospectTimeline[${index}].occurredAt`, validation), startedAt: normalizeDate(value.startedAt, `prospectTimeline[${index}].startedAt`, validation),
      endedAt: normalizeDate(value.endedAt, `prospectTimeline[${index}].endedAt`, validation), organizationRef: normalizeString(value.organizationRef, `prospectTimeline[${index}].organizationRef`, validation),
      teamRef: normalizeString(value.teamRef, `prospectTimeline[${index}].teamRef`, validation), eventRef: normalizeString(value.eventRef, `prospectTimeline[${index}].eventRef`, validation),
      sourceRefs: normalizeStringArray(value.sourceRefs, `prospectTimeline[${index}].sourceRefs`, validation), evidenceArtifactRefs: normalizeStringArray(value.evidenceArtifactRefs, `prospectTimeline[${index}].evidenceArtifactRefs`, validation),
      notes: normalizeString(value.notes, `prospectTimeline[${index}].notes`, validation),
    };
    if (!item.title && !item.description) addError(validation, "TIMELINE_CONTEXT_REQUIRED", `prospectTimeline[${index}]`, "Timeline event requires title or description.");
    validateDateOrder(item.startedAt, item.endedAt, `prospectTimeline[${index}]`, validation); return item;
  });

  const references = normalizeNested(profile.references, "references", validation, (value) => Object.fromEntries(REFERENCE_FIELDS.map((field) => [field, normalizeStringArray(value[field], `references.${field}`, validation)])));
  const verification = normalizeNested(profile.verification, "verification", validation, (value) => ({
    state: normalizeEnum(value.state, PROSPECT_PROFILE_VERIFICATION_STATES, "verification.state", validation, { required: true }),
    confidence: normalizeEnum(value.confidence, PROSPECT_PROFILE_CONFIDENCE_LEVELS, "verification.confidence", validation, { required: true }),
    verifiedBy: normalizeString(value.verifiedBy, "verification.verifiedBy", validation), verifiedAt: normalizeDate(value.verifiedAt, "verification.verifiedAt", validation),
    limitations: normalizeString(value.limitations, "verification.limitations", validation), disputes: normalizeStringArray(value.disputes, "verification.disputes", validation), notes: normalizeString(value.notes, "verification.notes", validation),
  }));
  const provenance = normalizeNested(profile.provenance, "provenance", validation, (value) => ({
    createdBy: normalizeString(value.createdBy, "provenance.createdBy", validation), createdAt: normalizeDate(value.createdAt, "provenance.createdAt", validation),
    updatedBy: normalizeString(value.updatedBy, "provenance.updatedBy", validation), updatedAt: normalizeDate(value.updatedAt, "provenance.updatedAt", validation),
    originSystem: normalizeString(value.originSystem, "provenance.originSystem", validation), originRecordRef: normalizeString(value.originRecordRef, "provenance.originRecordRef", validation), notes: normalizeString(value.notes, "provenance.notes", validation),
  }));
  validateDateOrder(provenance.createdAt, provenance.updatedAt, "provenance", validation);
  const versioning = normalizeNested(profile.versioning, "versioning", validation, (value) => ({
    profileVersion: normalizeVersion(value.profileVersion, validation), supersedesProfileRef: normalizeString(value.supersedesProfileRef, "versioning.supersedesProfileRef", validation),
    supersededByProfileRef: normalizeString(value.supersededByProfileRef, "versioning.supersededByProfileRef", validation), changeReason: normalizeString(value.changeReason, "versioning.changeReason", validation), notes: normalizeString(value.notes, "versioning.notes", validation),
  }));
  const metadata = normalizeNested(profile.metadata, "metadata", validation, (value) => ({
    tags: normalizeStringArray(value.tags, "metadata.tags", validation), domains: normalizeStringArray(value.domains, "metadata.domains", validation),
    visibility: normalizeString(value.visibility, "metadata.visibility", validation), restrictions: normalizeStringArray(value.restrictions, "metadata.restrictions", validation), notes: normalizeString(value.notes, "metadata.notes", validation),
  }));

  if ([PROSPECT_PROFILE_VERIFICATION_STATES.VERIFIED, PROSPECT_PROFILE_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS].includes(verification.state)) {
    if (!verification.verifiedBy) addError(validation, "VERIFIER_REQUIRED", "verification.verifiedBy", "Verified profiles require verifiedBy.");
    if (!verification.verifiedAt) addError(validation, "VERIFICATION_DATE_REQUIRED", "verification.verifiedAt", "Verified profiles require verifiedAt.");
  }
  if (verification.state === PROSPECT_PROFILE_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS && !verification.limitations && !verification.notes) addError(validation, "LIMITATION_CONTEXT_REQUIRED", "verification", "VERIFIED_WITH_LIMITATIONS requires context.");
  if (verification.state === PROSPECT_PROFILE_VERIFICATION_STATES.DISPUTED && !verification.disputes.length && !verification.limitations && !verification.notes) addError(validation, "DISPUTE_CONTEXT_REQUIRED", "verification", "DISPUTED requires context.");
  if (eligibility.state === PROSPECT_ELIGIBILITY_STATES.DISPUTED && !eligibility.limitations && !eligibility.notes && verification.state !== PROSPECT_PROFILE_VERIFICATION_STATES.DISPUTED) addError(validation, "ELIGIBILITY_DISPUTE_CONTEXT_REQUIRED", "eligibility", "Disputed eligibility requires context.");
  const entryDisputeContext = entry.notes || verification.disputes.length || verification.limitations || verification.state === PROSPECT_PROFILE_VERIFICATION_STATES.DISPUTED;
  if (entry.entryAcceptedAt && entry.entryRejectedAt && !entryDisputeContext) addError(validation, "CONFLICTING_ENTRY_OUTCOMES", "entry", "Accepted and rejected entry dates require dispute context.");
  if (status === PROSPECT_PROFILE_STATUSES.ACTIVE && verification.state === PROSPECT_PROFILE_VERIFICATION_STATES.UNVERIFIED) addWarning(validation, "ACTIVE_PROFILE_UNVERIFIED", "verification.state", "ACTIVE profile remains unverified.");
  if (status === PROSPECT_PROFILE_STATUSES.ARCHIVED && !provenance.updatedAt && !versioning.changeReason && !metadata.notes) addError(validation, "ARCHIVE_CONTEXT_REQUIRED", "status", "ARCHIVED requires update, change, or metadata context.");
  if (cycle.status === PROSPECT_CYCLE_STATES.SELECTED && !entry.selectionRef && !references.selectionRefs.length) addWarning(validation, "SELECTION_REFERENCE_MISSING", "entry.selectionRef", "SELECTED cycle has no selection reference.");
  if (profileId && versioning.supersedesProfileRef === profileId) addError(validation, "SELF_REFERENCE", "versioning.supersedesProfileRef", "Profile cannot supersede itself.");
  if (profileId && versioning.supersededByProfileRef === profileId) addError(validation, "SELF_REFERENCE", "versioning.supersededByProfileRef", "Profile cannot be superseded by itself.");
  if (versioning.supersedesProfileRef && versioning.supersedesProfileRef === versioning.supersededByProfileRef) addError(validation, "CONFLICTING_VERSION_REFERENCES", "versioning", "Version references must identify different profiles.");
  validation.valid = validation.errors.length === 0;
  return { contract: PROSPECT_PROFILE_CONTRACT_NAME, contractVersion: PROSPECT_PROFILE_CONTRACT_VERSION,
    schemaVersion: PROSPECT_PROFILE_SCHEMA_VERSION, profileId, entityRef, personProfileRef, playerProfileRef,
    prospectCycleRef, status, cycle, eligibility, declaration, entry, eventHistory, prospectTimeline,
    references, verification, provenance, versioning, metadata, validation };
}

export function createProspectProfile(input = {}, { checkedAt = null } = {}) { return normalizeProspectProfile(input, checkedAt); }
export function createUnavailableProspectProfile(input = {}, { checkedAt = null } = {}) {
  const supplied = isObject(input) ? input : {}; const reason = optionalString(supplied.reason); const metadata = isObject(supplied.metadata) ? supplied.metadata : {};
  const result = normalizeProspectProfile({ ...supplied,
    cycle: supplied.cycle ?? { cycleType: PROSPECT_CYCLE_TYPES.UNKNOWN, status: PROSPECT_CYCLE_STATES.UNKNOWN },
    eligibility: supplied.eligibility ?? { state: PROSPECT_ELIGIBILITY_STATES.UNKNOWN, basisType: PROSPECT_ELIGIBILITY_BASIS_TYPES.UNKNOWN },
    declaration: supplied.declaration ?? { state: PROSPECT_DECLARATION_STATES.UNKNOWN },
    entry: supplied.entry ?? { pathwayType: PROSPECT_ENTRY_PATHWAY_TYPES.UNKNOWN },
    verification: supplied.verification ?? { state: PROSPECT_PROFILE_VERIFICATION_STATES.UNVERIFIED, confidence: PROSPECT_PROFILE_CONFIDENCE_LEVELS.UNSPECIFIED },
    metadata: { ...metadata, notes: metadata.notes ?? reason },
  }, checkedAt);
  const unavailable = createValidation(checkedAt); addError(unavailable, "PROSPECT_PROFILE_UNAVAILABLE", "", reason || "No usable Prospect Profile is available.");
  return { ...result, validation: mergeValidation(result.validation, unavailable) };
}
export function validateProspectProfile(value, { checkedAt = value?.validation?.checkedAt ?? null } = {}) { return normalizeProspectProfile(value, checkedAt).validation; }
export function isProspectProfile(value) { return Boolean(isObject(value) && value.contract === PROSPECT_PROFILE_CONTRACT_NAME && value.contractVersion === PROSPECT_PROFILE_CONTRACT_VERSION && value.schemaVersion === PROSPECT_PROFILE_SCHEMA_VERSION && validateProspectProfile(value).valid); }
export function isVerifiedProspectProfile(value) { return Boolean(isProspectProfile(value) && [PROSPECT_PROFILE_VERIFICATION_STATES.VERIFIED, PROSPECT_PROFILE_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS].includes(value.verification.state)); }
export function isActiveProspectProfile(value) { return Boolean(isProspectProfile(value) && value.status === PROSPECT_PROFILE_STATUSES.ACTIVE); }
export function isDeclaredProspectProfile(value) { return Boolean(isProspectProfile(value) && value.declaration.state === PROSPECT_DECLARATION_STATES.DECLARED); }
export function isEligibleProspectProfile(value) { return Boolean(isProspectProfile(value) && value.eligibility.state === PROSPECT_ELIGIBILITY_STATES.ELIGIBLE); }
export function isSelectedProspectProfile(value) { return Boolean(isProspectProfile(value) && value.cycle.status === PROSPECT_CYCLE_STATES.SELECTED); }
export function isDisputedProspectProfile(value) { return Boolean(isProspectProfile(value) && value.verification.state === PROSPECT_PROFILE_VERIFICATION_STATES.DISPUTED); }
export function getProspectProfileEntityRef(value) { return isProspectProfile(value) ? value.entityRef : null; }
export function getProspectProfilePlayerRef(value) { return isProspectProfile(value) ? value.playerProfileRef : null; }
export function getProspectProfileCycleRef(value) { return isProspectProfile(value) ? value.prospectCycleRef : null; }

export default Object.freeze({
  PROSPECT_PROFILE_CONTRACT_NAME, PROSPECT_PROFILE_CONTRACT_VERSION, PROSPECT_PROFILE_SCHEMA_VERSION,
  createProspectProfile, createUnavailableProspectProfile, validateProspectProfile, isProspectProfile,
  isVerifiedProspectProfile, isActiveProspectProfile, isDeclaredProspectProfile, isEligibleProspectProfile,
  isSelectedProspectProfile, isDisputedProspectProfile, getProspectProfileEntityRef,
  getProspectProfilePlayerRef, getProspectProfileCycleRef,
});
