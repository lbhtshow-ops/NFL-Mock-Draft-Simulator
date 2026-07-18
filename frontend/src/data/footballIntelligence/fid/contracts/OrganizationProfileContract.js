import {
  ORGANIZATION_AFFILIATION_STATUSES, ORGANIZATION_AFFILIATION_TYPES,
  ORGANIZATION_LOCATION_USAGE_TYPES, ORGANIZATION_OPERATING_STATES,
  ORGANIZATION_PROFILE_CONFIDENCE_LEVELS, ORGANIZATION_PROFILE_CONTRACT_NAME,
  ORGANIZATION_PROFILE_CONTRACT_VERSION, ORGANIZATION_PROFILE_SCHEMA_VERSION,
  ORGANIZATION_PROFILE_STATUSES, ORGANIZATION_PROFILE_VERIFICATION_STATES,
  ORGANIZATION_TIMELINE_EVENT_TYPES, ORGANIZATION_TYPES,
} from "../constants/organizationProfileConstants.js";

const REFERENCE_FIELDS = [
  "researchSourceRefs", "researchSessionRefs", "recordedObservationRefs", "analyticalObservationRefs",
  "evidenceArtifactRefs", "relationshipRefs", "teamProfileRefs", "leagueRefs", "conferenceRefs",
  "divisionRefs", "schoolRefs", "locationRefs", "ownershipRecordRefs", "governanceRecordRefs",
  "staffRecordRefs", "documentRefs", "datasetRefs", "otherRefs",
];

function isObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function optionalString(value) { return typeof value === "string" && value.trim() ? value.trim() : null; }
function createValidation(checkedAt = null) {
  return { valid: true, errors: [], warnings: [], checkedAt: optionalString(checkedAt),
    contractVersion: ORGANIZATION_PROFILE_CONTRACT_VERSION, schemaVersion: ORGANIZATION_PROFILE_SCHEMA_VERSION };
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
function normalizeRecordArray(value, path, validation, idField, normalizer) {
  if (value == null) return [];
  if (!Array.isArray(value)) { addError(validation, "INVALID_ARRAY", path, `${path} must be an array.`); return []; }
  const result = []; const exact = new Set(); const ids = new Map();
  value.forEach((entry, index) => {
    if (!isObject(entry)) { addError(validation, "INVALID_RECORD_STRUCTURE", `${path}[${index}]`, `${path} entries must be objects.`); return; }
    const item = normalizer(entry, index); const identity = JSON.stringify(item);
    if (item[idField] && ids.has(item[idField]) && ids.get(item[idField]) !== identity) addError(validation, "DUPLICATE_RECORD_ID", `${path}[${index}].${idField}`, `${idField} must be unique within ${path}.`);
    if (item[idField]) ids.set(item[idField], identity);
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

function normalizeOrganizationProfile(input, checkedAt = null) {
  const validation = createValidation(checkedAt); const profile = isObject(input) ? input : {};
  if (!isObject(input)) addError(validation, "INVALID_ORGANIZATION_PROFILE_INPUT", "", "Organization Profile input must be an object.");
  const profileId = normalizeString(profile.profileId, "profileId", validation, { required: true });
  const entityRef = normalizeString(profile.entityRef, "entityRef", validation, { required: true });
  const status = normalizeEnum(profile.status, ORGANIZATION_PROFILE_STATUSES, "status", validation, { required: true });
  const organizationType = normalizeEnum(profile.organizationType, ORGANIZATION_TYPES, "organizationType", validation, { required: true, warnUnknown: true });
  const operatingState = normalizeEnum(profile.operatingState, ORGANIZATION_OPERATING_STATES, "operatingState", validation, { required: true, warnUnknown: true });

  const organizationDetails = normalizeNested(profile.organizationDetails, "organizationDetails", validation, (value) => {
    const result = {
      foundedAt: normalizeDate(value.foundedAt, "organizationDetails.foundedAt", validation),
      establishedAt: normalizeDate(value.establishedAt, "organizationDetails.establishedAt", validation),
      dissolvedAt: normalizeDate(value.dissolvedAt, "organizationDetails.dissolvedAt", validation),
      legalForm: normalizeString(value.legalForm, "organizationDetails.legalForm", validation),
      jurisdictionRef: normalizeString(value.jurisdictionRef, "organizationDetails.jurisdictionRef", validation),
      jurisdictionLabel: normalizeString(value.jurisdictionLabel, "organizationDetails.jurisdictionLabel", validation),
      publicDescription: normalizeString(value.publicDescription, "organizationDetails.publicDescription", validation),
      websiteRef: normalizeString(value.websiteRef, "organizationDetails.websiteRef", validation),
      notes: normalizeString(value.notes, "organizationDetails.notes", validation),
    };
    validateDateOrder(result.foundedAt, result.dissolvedAt, "organizationDetails.foundedAt", validation);
    validateDateOrder(result.establishedAt, result.dissolvedAt, "organizationDetails.establishedAt", validation);
    return result;
  });

  const locations = normalizeRecordArray(profile.locations, "locations", validation, "locationId", (value, index) => {
    const item = {
      locationId: normalizeString(value.locationId, `locations[${index}].locationId`, validation, { required: true }),
      locationType: normalizeEnum(value.locationType, ORGANIZATION_LOCATION_USAGE_TYPES, `locations[${index}].locationType`, validation, { required: true, warnUnknown: true }),
      locationRef: normalizeString(value.locationRef, `locations[${index}].locationRef`, validation),
      label: normalizeString(value.label, `locations[${index}].label`, validation),
      validFrom: normalizeDate(value.validFrom, `locations[${index}].validFrom`, validation),
      validTo: normalizeDate(value.validTo, `locations[${index}].validTo`, validation),
      sourceRefs: normalizeStringArray(value.sourceRefs, `locations[${index}].sourceRefs`, validation),
      evidenceArtifactRefs: normalizeStringArray(value.evidenceArtifactRefs, `locations[${index}].evidenceArtifactRefs`, validation),
      notes: normalizeString(value.notes, `locations[${index}].notes`, validation),
    };
    if (!item.locationRef && !item.label && !item.notes) addError(validation, "LOCATION_IDENTITY_REQUIRED", `locations[${index}]`, "Location requires locationRef, label, or notes.");
    validateDateOrder(item.validFrom, item.validTo, `locations[${index}]`, validation); return item;
  });

  const affiliations = normalizeRecordArray(profile.affiliations, "affiliations", validation, "affiliationId", (value, index) => {
    const item = {
      affiliationId: normalizeString(value.affiliationId, `affiliations[${index}].affiliationId`, validation, { required: true }),
      affiliationType: normalizeEnum(value.affiliationType, ORGANIZATION_AFFILIATION_TYPES, `affiliations[${index}].affiliationType`, validation, { required: true, warnUnknown: true }),
      organizationRef: normalizeString(value.organizationRef, `affiliations[${index}].organizationRef`, validation),
      relatedEntityRef: normalizeString(value.relatedEntityRef, `affiliations[${index}].relatedEntityRef`, validation),
      status: normalizeEnum(value.status, ORGANIZATION_AFFILIATION_STATUSES, `affiliations[${index}].status`, validation, { required: true, warnUnknown: true }),
      validFrom: normalizeDate(value.validFrom, `affiliations[${index}].validFrom`, validation),
      validTo: normalizeDate(value.validTo, `affiliations[${index}].validTo`, validation),
      sourceRefs: normalizeStringArray(value.sourceRefs, `affiliations[${index}].sourceRefs`, validation),
      evidenceArtifactRefs: normalizeStringArray(value.evidenceArtifactRefs, `affiliations[${index}].evidenceArtifactRefs`, validation),
      notes: normalizeString(value.notes, `affiliations[${index}].notes`, validation),
    };
    if (!item.organizationRef && !item.relatedEntityRef) addError(validation, "AFFILIATION_REFERENCE_REQUIRED", `affiliations[${index}]`, "Affiliation requires organizationRef or relatedEntityRef.");
    validateDateOrder(item.validFrom, item.validTo, `affiliations[${index}]`, validation); return item;
  });

  const organizationalTimeline = normalizeRecordArray(profile.organizationalTimeline, "organizationalTimeline", validation, "eventId", (value, index) => {
    const item = {
      eventId: normalizeString(value.eventId, `organizationalTimeline[${index}].eventId`, validation, { required: true }),
      eventType: normalizeEnum(value.eventType, ORGANIZATION_TIMELINE_EVENT_TYPES, `organizationalTimeline[${index}].eventType`, validation, { required: true, warnUnknown: true }),
      title: normalizeString(value.title, `organizationalTimeline[${index}].title`, validation),
      description: normalizeString(value.description, `organizationalTimeline[${index}].description`, validation),
      occurredAt: normalizeDate(value.occurredAt, `organizationalTimeline[${index}].occurredAt`, validation),
      startedAt: normalizeDate(value.startedAt, `organizationalTimeline[${index}].startedAt`, validation),
      endedAt: normalizeDate(value.endedAt, `organizationalTimeline[${index}].endedAt`, validation),
      organizationRef: normalizeString(value.organizationRef, `organizationalTimeline[${index}].organizationRef`, validation),
      relatedEntityRef: normalizeString(value.relatedEntityRef, `organizationalTimeline[${index}].relatedEntityRef`, validation),
      locationRef: normalizeString(value.locationRef, `organizationalTimeline[${index}].locationRef`, validation),
      sourceRefs: normalizeStringArray(value.sourceRefs, `organizationalTimeline[${index}].sourceRefs`, validation),
      evidenceArtifactRefs: normalizeStringArray(value.evidenceArtifactRefs, `organizationalTimeline[${index}].evidenceArtifactRefs`, validation),
      notes: normalizeString(value.notes, `organizationalTimeline[${index}].notes`, validation),
    };
    if (!item.title && !item.description) addError(validation, "TIMELINE_CONTEXT_REQUIRED", `organizationalTimeline[${index}]`, "Timeline event requires title or description.");
    validateDateOrder(item.startedAt, item.endedAt, `organizationalTimeline[${index}]`, validation); return item;
  });

  const references = normalizeNested(profile.references, "references", validation, (value) => Object.fromEntries(REFERENCE_FIELDS.map((field) => [field, normalizeStringArray(value[field], `references.${field}`, validation)])));
  const verification = normalizeNested(profile.verification, "verification", validation, (value) => ({
    state: normalizeEnum(value.state, ORGANIZATION_PROFILE_VERIFICATION_STATES, "verification.state", validation, { required: true }),
    confidence: normalizeEnum(value.confidence, ORGANIZATION_PROFILE_CONFIDENCE_LEVELS, "verification.confidence", validation, { required: true }),
    verifiedBy: normalizeString(value.verifiedBy, "verification.verifiedBy", validation),
    verifiedAt: normalizeDate(value.verifiedAt, "verification.verifiedAt", validation),
    limitations: normalizeString(value.limitations, "verification.limitations", validation),
    disputes: normalizeStringArray(value.disputes, "verification.disputes", validation),
    notes: normalizeString(value.notes, "verification.notes", validation),
  }));
  const provenance = normalizeNested(profile.provenance, "provenance", validation, (value) => ({
    createdBy: normalizeString(value.createdBy, "provenance.createdBy", validation),
    createdAt: normalizeDate(value.createdAt, "provenance.createdAt", validation),
    updatedBy: normalizeString(value.updatedBy, "provenance.updatedBy", validation),
    updatedAt: normalizeDate(value.updatedAt, "provenance.updatedAt", validation),
    originSystem: normalizeString(value.originSystem, "provenance.originSystem", validation),
    originRecordRef: normalizeString(value.originRecordRef, "provenance.originRecordRef", validation),
    notes: normalizeString(value.notes, "provenance.notes", validation),
  }));
  validateDateOrder(provenance.createdAt, provenance.updatedAt, "provenance", validation);
  const versioning = normalizeNested(profile.versioning, "versioning", validation, (value) => ({
    profileVersion: normalizeVersion(value.profileVersion, validation),
    supersedesProfileRef: normalizeString(value.supersedesProfileRef, "versioning.supersedesProfileRef", validation),
    supersededByProfileRef: normalizeString(value.supersededByProfileRef, "versioning.supersededByProfileRef", validation),
    changeReason: normalizeString(value.changeReason, "versioning.changeReason", validation),
    notes: normalizeString(value.notes, "versioning.notes", validation),
  }));
  const metadata = normalizeNested(profile.metadata, "metadata", validation, (value) => ({
    tags: normalizeStringArray(value.tags, "metadata.tags", validation),
    domains: normalizeStringArray(value.domains, "metadata.domains", validation),
    visibility: normalizeString(value.visibility, "metadata.visibility", validation),
    restrictions: normalizeStringArray(value.restrictions, "metadata.restrictions", validation),
    notes: normalizeString(value.notes, "metadata.notes", validation),
  }));

  if ([ORGANIZATION_PROFILE_VERIFICATION_STATES.VERIFIED, ORGANIZATION_PROFILE_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS].includes(verification.state)) {
    if (!verification.verifiedBy) addError(validation, "VERIFIER_REQUIRED", "verification.verifiedBy", "Verified profiles require verifiedBy.");
    if (!verification.verifiedAt) addError(validation, "VERIFICATION_DATE_REQUIRED", "verification.verifiedAt", "Verified profiles require verifiedAt.");
  }
  if (verification.state === ORGANIZATION_PROFILE_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS && !verification.limitations && !verification.notes) addError(validation, "LIMITATION_CONTEXT_REQUIRED", "verification", "VERIFIED_WITH_LIMITATIONS requires context.");
  if (verification.state === ORGANIZATION_PROFILE_VERIFICATION_STATES.DISPUTED && !verification.disputes.length && !verification.limitations && !verification.notes) addError(validation, "DISPUTE_CONTEXT_REQUIRED", "verification", "DISPUTED requires context.");
  if (status === ORGANIZATION_PROFILE_STATUSES.ACTIVE && verification.state === ORGANIZATION_PROFILE_VERIFICATION_STATES.UNVERIFIED) addWarning(validation, "ACTIVE_PROFILE_UNVERIFIED", "verification.state", "ACTIVE profile remains unverified.");
  if (status === ORGANIZATION_PROFILE_STATUSES.ARCHIVED && !provenance.updatedAt && !versioning.changeReason && !metadata.notes) addError(validation, "ARCHIVE_CONTEXT_REQUIRED", "status", "ARCHIVED requires update, change, or metadata context.");
  if (organizationDetails.dissolvedAt && operatingState !== ORGANIZATION_OPERATING_STATES.DISSOLVED) addWarning(validation, "DISSOLVED_DATE_STATE_MISMATCH", "organizationDetails.dissolvedAt", "dissolvedAt is supplied while operatingState is not DISSOLVED.");
  if (profileId && versioning.supersedesProfileRef === profileId) addError(validation, "SELF_REFERENCE", "versioning.supersedesProfileRef", "Profile cannot supersede itself.");
  if (profileId && versioning.supersededByProfileRef === profileId) addError(validation, "SELF_REFERENCE", "versioning.supersededByProfileRef", "Profile cannot be superseded by itself.");
  if (versioning.supersedesProfileRef && versioning.supersedesProfileRef === versioning.supersededByProfileRef) addError(validation, "CONFLICTING_VERSION_REFERENCES", "versioning", "Version references must identify different profiles.");
  validation.valid = validation.errors.length === 0;
  return { contract: ORGANIZATION_PROFILE_CONTRACT_NAME, contractVersion: ORGANIZATION_PROFILE_CONTRACT_VERSION,
    schemaVersion: ORGANIZATION_PROFILE_SCHEMA_VERSION, profileId, entityRef, status, organizationType,
    operatingState, organizationDetails, locations, affiliations, organizationalTimeline, references,
    verification, provenance, versioning, metadata, validation };
}

export function createOrganizationProfile(input = {}, { checkedAt = null } = {}) { return normalizeOrganizationProfile(input, checkedAt); }
export function createUnavailableOrganizationProfile(input = {}, { checkedAt = null } = {}) {
  const supplied = isObject(input) ? input : {}; const reason = optionalString(supplied.reason); const metadata = isObject(supplied.metadata) ? supplied.metadata : {};
  const result = normalizeOrganizationProfile({ ...supplied,
    organizationType: supplied.organizationType ?? ORGANIZATION_TYPES.UNKNOWN,
    operatingState: supplied.operatingState ?? ORGANIZATION_OPERATING_STATES.UNKNOWN,
    verification: supplied.verification ?? { state: ORGANIZATION_PROFILE_VERIFICATION_STATES.UNVERIFIED, confidence: ORGANIZATION_PROFILE_CONFIDENCE_LEVELS.UNSPECIFIED },
    metadata: { ...metadata, notes: metadata.notes ?? reason },
  }, checkedAt);
  const unavailable = createValidation(checkedAt); addError(unavailable, "ORGANIZATION_PROFILE_UNAVAILABLE", "", reason || "No usable Organization Profile is available.");
  return { ...result, validation: mergeValidation(result.validation, unavailable) };
}
export function validateOrganizationProfile(value, { checkedAt = value?.validation?.checkedAt ?? null } = {}) { return normalizeOrganizationProfile(value, checkedAt).validation; }
export function isOrganizationProfile(value) { return Boolean(isObject(value) && value.contract === ORGANIZATION_PROFILE_CONTRACT_NAME && value.contractVersion === ORGANIZATION_PROFILE_CONTRACT_VERSION && value.schemaVersion === ORGANIZATION_PROFILE_SCHEMA_VERSION && validateOrganizationProfile(value).valid); }
export function isVerifiedOrganizationProfile(value) { return Boolean(isOrganizationProfile(value) && [ORGANIZATION_PROFILE_VERIFICATION_STATES.VERIFIED, ORGANIZATION_PROFILE_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS].includes(value.verification.state)); }
export function isActiveOrganizationProfile(value) { return Boolean(isOrganizationProfile(value) && value.status === ORGANIZATION_PROFILE_STATUSES.ACTIVE); }
export function isOperatingOrganizationProfile(value) { return Boolean(isOrganizationProfile(value) && value.operatingState === ORGANIZATION_OPERATING_STATES.OPERATING); }
export function isDissolvedOrganizationProfile(value) { return Boolean(isOrganizationProfile(value) && value.operatingState === ORGANIZATION_OPERATING_STATES.DISSOLVED); }
export function isDisputedOrganizationProfile(value) { return Boolean(isOrganizationProfile(value) && value.verification.state === ORGANIZATION_PROFILE_VERIFICATION_STATES.DISPUTED); }
export function getOrganizationProfileEntityRef(value) { return isOrganizationProfile(value) ? value.entityRef : null; }

export default Object.freeze({
  ORGANIZATION_PROFILE_CONTRACT_NAME, ORGANIZATION_PROFILE_CONTRACT_VERSION, ORGANIZATION_PROFILE_SCHEMA_VERSION,
  createOrganizationProfile, createUnavailableOrganizationProfile, validateOrganizationProfile,
  isOrganizationProfile, isVerifiedOrganizationProfile, isActiveOrganizationProfile,
  isOperatingOrganizationProfile, isDissolvedOrganizationProfile, isDisputedOrganizationProfile,
  getOrganizationProfileEntityRef,
});
