import {
  PERSON_CAREER_EVENT_TYPES,
  PERSON_EDUCATION_TYPES,
  PERSON_NAME_USAGE_CATEGORIES,
  PERSON_PROFILE_CONFIDENCE_LEVELS,
  PERSON_PROFILE_CONTRACT_NAME,
  PERSON_PROFILE_CONTRACT_VERSION,
  PERSON_PROFILE_SCHEMA_VERSION,
  PERSON_PROFILE_STATUSES,
  PERSON_PROFILE_VERIFICATION_STATES,
  PERSON_STATES,
} from "../constants/personProfileConstants.js";

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function optionalString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function createValidation(checkedAt = null) {
  return {
    valid: true,
    errors: [],
    warnings: [],
    checkedAt: optionalString(checkedAt),
    contractVersion: PERSON_PROFILE_CONTRACT_VERSION,
    schemaVersion: PERSON_PROFILE_SCHEMA_VERSION,
  };
}

function addEntry(validation, field, code, path, message) {
  if (!validation[field].some((entry) => entry.code === code && entry.path === path && entry.message === message)) {
    validation[field].push({ code, path, message });
  }
  validation.valid = validation.errors.length === 0;
}

function addError(validation, code, path, message) {
  addEntry(validation, "errors", code, path, message);
}

function addWarning(validation, code, path, message) {
  addEntry(validation, "warnings", code, path, message);
}

function normalizeString(value, path, validation, { required = false } = {}) {
  if (value == null) {
    if (required) addError(validation, "MISSING_REQUIRED_FIELD", path, `${path} is required.`);
    return null;
  }
  if (typeof value !== "string" || !value.trim()) {
    addError(validation, "INVALID_STRING", path, `${path} must be a non-empty string or null.`);
    return null;
  }
  return value.trim();
}

function normalizeEnum(value, allowed, path, validation, { required = false } = {}) {
  if (value == null || value === "") {
    if (required) addError(validation, "MISSING_REQUIRED_FIELD", path, `${path} is required.`);
    return null;
  }
  if (!Object.values(allowed).includes(value)) {
    addError(validation, "UNRECOGNIZED_ENUM_VALUE", path, `${path} is not recognized.`);
    return null;
  }
  return value;
}

function normalizeDate(value, path, validation) {
  const normalized = normalizeString(value, path, validation);
  if (normalized === null) return null;
  if (Number.isNaN(Date.parse(normalized))) {
    addError(validation, "INVALID_DATE", path, `${path} must be a recognizable date string or null.`);
    return null;
  }
  return normalized;
}

function normalizeBoolean(value, path, validation) {
  if (value == null) return null;
  if (typeof value !== "boolean") {
    addError(validation, "INVALID_BOOLEAN", path, `${path} must be a boolean or null.`);
    return null;
  }
  return value;
}

function normalizeVersion(value, validation) {
  if (value == null) return null;
  if ((typeof value === "string" && value.trim()) || (Number.isInteger(value) && value >= 0)) {
    return typeof value === "string" ? value.trim() : value;
  }
  addError(validation, "INVALID_PROFILE_VERSION", "versioning.profileVersion", "profileVersion must be a non-empty string, non-negative integer, or null.");
  return null;
}

function normalizeNested(value, path, validation, normalizer) {
  if (value == null) return normalizer({});
  if (!isObject(value)) {
    addError(validation, "INVALID_NESTED_STRUCTURE", path, `${path} must be an object or null.`);
    return normalizer({});
  }
  return normalizer(value);
}

function normalizeStringArray(value, path, validation) {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    addError(validation, "INVALID_ARRAY", path, `${path} must be an array.`);
    return [];
  }
  const result = [];
  const seen = new Set();
  value.forEach((entry, index) => {
    if (typeof entry !== "string" || !entry.trim()) {
      addError(validation, "INVALID_REFERENCE", `${path}[${index}]`, `${path} values must be non-empty strings.`);
      return;
    }
    const normalized = entry.trim();
    if (seen.has(normalized)) {
      addWarning(validation, "DUPLICATE_NORMALIZED_VALUE", path, `Duplicate value removed from ${path}: ${normalized}.`);
      return;
    }
    seen.add(normalized);
    result.push(normalized);
  });
  return result;
}

function validateDateOrder(start, end, path, validation) {
  if (start && end && Date.parse(start) > Date.parse(end)) {
    addError(validation, "INVALID_DATE_ORDER", path, `${path} start date must not be after end date.`);
  }
}

function normalizeObjectArray(value, path, validation, structureCode, normalizer, identityKey = JSON.stringify) {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    addError(validation, "INVALID_ARRAY", path, `${path} must be an array.`);
    return [];
  }
  const result = [];
  const seen = new Set();
  value.forEach((entry, index) => {
    if (!isObject(entry)) {
      addError(validation, structureCode, `${path}[${index}]`, `${path} entries must be objects.`);
      return;
    }
    const normalized = normalizer(entry, index);
    const identity = identityKey(normalized);
    if (seen.has(identity)) {
      addWarning(validation, "DUPLICATE_NORMALIZED_OBJECT", path, `Exact duplicate removed from ${path}.`);
      return;
    }
    seen.add(identity);
    result.push(normalized);
  });
  return result;
}

function mergeValidation(base, addition) {
  const result = { ...base, errors: [...base.errors], warnings: [...base.warnings] };
  addition.errors.forEach((entry) => addError(result, entry.code, entry.path, entry.message));
  addition.warnings.forEach((entry) => addWarning(result, entry.code, entry.path, entry.message));
  result.valid = result.errors.length === 0;
  return result;
}

function normalizePersonProfile(input, checkedAt = null) {
  const validation = createValidation(checkedAt);
  const profile = isObject(input) ? input : {};
  if (!isObject(input)) addError(validation, "INVALID_PERSON_PROFILE_INPUT", "", "Person Profile input must be an object.");
  const profileId = normalizeString(profile.profileId, "profileId", validation, { required: true });
  const entityRef = normalizeString(profile.entityRef, "entityRef", validation, { required: true });
  const status = normalizeEnum(profile.status, PERSON_PROFILE_STATUSES, "status", validation, { required: true });
  const personState = normalizeEnum(profile.personState, PERSON_STATES, "personState", validation, { required: true });
  const biography = normalizeNested(profile.biography, "biography", validation, (value) => ({
    dateOfBirth: normalizeDate(value.dateOfBirth, "biography.dateOfBirth", validation),
    placeOfBirthRef: normalizeString(value.placeOfBirthRef, "biography.placeOfBirthRef", validation),
    placeOfBirthLabel: normalizeString(value.placeOfBirthLabel, "biography.placeOfBirthLabel", validation),
    dateOfDeath: normalizeDate(value.dateOfDeath, "biography.dateOfDeath", validation),
    placeOfDeathRef: normalizeString(value.placeOfDeathRef, "biography.placeOfDeathRef", validation),
    placeOfDeathLabel: normalizeString(value.placeOfDeathLabel, "biography.placeOfDeathLabel", validation),
    publicBiography: normalizeString(value.publicBiography, "biography.publicBiography", validation),
    notes: normalizeString(value.notes, "biography.notes", validation),
  }));
  validateDateOrder(biography.dateOfBirth, biography.dateOfDeath, "biography", validation);
  const nameUsage = normalizeObjectArray(profile.nameUsage, "nameUsage", validation, "INVALID_NAME_USAGE_STRUCTURE", (value, index) => {
    const normalized = {
      name: normalizeString(value.name, `nameUsage[${index}].name`, validation, { required: true }),
      usageCategory: normalizeEnum(value.usageCategory, PERSON_NAME_USAGE_CATEGORIES, `nameUsage[${index}].usageCategory`, validation, { required: true }),
      validFrom: normalizeDate(value.validFrom, `nameUsage[${index}].validFrom`, validation),
      validTo: normalizeDate(value.validTo, `nameUsage[${index}].validTo`, validation),
      sourceRef: normalizeString(value.sourceRef, `nameUsage[${index}].sourceRef`, validation),
      notes: normalizeString(value.notes, `nameUsage[${index}].notes`, validation),
    };
    validateDateOrder(normalized.validFrom, normalized.validTo, `nameUsage[${index}]`, validation);
    return normalized;
  });
  const citizenship = normalizeObjectArray(profile.citizenship, "citizenship", validation, "INVALID_CITIZENSHIP_STRUCTURE", (value, index) => {
    const normalized = {
      countryRef: normalizeString(value.countryRef, `citizenship[${index}].countryRef`, validation),
      countryCode: normalizeString(value.countryCode, `citizenship[${index}].countryCode`, validation),
      label: normalizeString(value.label, `citizenship[${index}].label`, validation),
      validFrom: normalizeDate(value.validFrom, `citizenship[${index}].validFrom`, validation),
      validTo: normalizeDate(value.validTo, `citizenship[${index}].validTo`, validation),
      sourceRef: normalizeString(value.sourceRef, `citizenship[${index}].sourceRef`, validation),
      notes: normalizeString(value.notes, `citizenship[${index}].notes`, validation),
    };
    if (!normalized.countryRef && !normalized.countryCode && !normalized.label) {
      addError(validation, "CITIZENSHIP_COUNTRY_REQUIRED", `citizenship[${index}]`, "Citizenship requires countryRef, countryCode, or label.");
    }
    validateDateOrder(normalized.validFrom, normalized.validTo, `citizenship[${index}]`, validation);
    return normalized;
  });
  const languages = normalizeObjectArray(profile.languages, "languages", validation, "INVALID_LANGUAGE_STRUCTURE", (value, index) => {
    const normalized = {
      languageCode: normalizeString(value.languageCode, `languages[${index}].languageCode`, validation),
      language: normalizeString(value.language, `languages[${index}].language`, validation),
      proficiency: normalizeString(value.proficiency, `languages[${index}].proficiency`, validation),
      sourceRef: normalizeString(value.sourceRef, `languages[${index}].sourceRef`, validation),
      notes: normalizeString(value.notes, `languages[${index}].notes`, validation),
    };
    if (!normalized.languageCode && !normalized.language) {
      addError(validation, "LANGUAGE_IDENTIFIER_REQUIRED", `languages[${index}]`, "Language requires languageCode or language.");
    }
    return normalized;
  });
  const education = normalizeObjectArray(profile.education, "education", validation, "INVALID_EDUCATION_STRUCTURE", (value, index) => {
    const normalized = {
      educationType: normalizeEnum(value.educationType, PERSON_EDUCATION_TYPES, `education[${index}].educationType`, validation, { required: true }),
      organizationRef: normalizeString(value.organizationRef, `education[${index}].organizationRef`, validation),
      organizationLabel: normalizeString(value.organizationLabel, `education[${index}].organizationLabel`, validation),
      fieldOfStudy: normalizeString(value.fieldOfStudy, `education[${index}].fieldOfStudy`, validation),
      credential: normalizeString(value.credential, `education[${index}].credential`, validation),
      startedAt: normalizeDate(value.startedAt, `education[${index}].startedAt`, validation),
      endedAt: normalizeDate(value.endedAt, `education[${index}].endedAt`, validation),
      completed: normalizeBoolean(value.completed, `education[${index}].completed`, validation),
      sourceRefs: normalizeStringArray(value.sourceRefs, `education[${index}].sourceRefs`, validation),
      notes: normalizeString(value.notes, `education[${index}].notes`, validation),
    };
    if (!normalized.organizationRef && !normalized.organizationLabel) {
      addError(validation, "EDUCATION_ORGANIZATION_REQUIRED", `education[${index}]`, "Education requires organizationRef or organizationLabel.");
    }
    validateDateOrder(normalized.startedAt, normalized.endedAt, `education[${index}]`, validation);
    return normalized;
  });
  const eventIds = new Map();
  const careerTimeline = normalizeObjectArray(profile.careerTimeline, "careerTimeline", validation, "INVALID_CAREER_EVENT_STRUCTURE", (value, index) => {
    const normalized = {
      eventId: normalizeString(value.eventId, `careerTimeline[${index}].eventId`, validation, { required: true }),
      eventType: normalizeEnum(value.eventType, PERSON_CAREER_EVENT_TYPES, `careerTimeline[${index}].eventType`, validation, { required: true }),
      title: normalizeString(value.title, `careerTimeline[${index}].title`, validation),
      description: normalizeString(value.description, `careerTimeline[${index}].description`, validation),
      organizationRef: normalizeString(value.organizationRef, `careerTimeline[${index}].organizationRef`, validation),
      roleRef: normalizeString(value.roleRef, `careerTimeline[${index}].roleRef`, validation),
      occurredAt: normalizeDate(value.occurredAt, `careerTimeline[${index}].occurredAt`, validation),
      startedAt: normalizeDate(value.startedAt, `careerTimeline[${index}].startedAt`, validation),
      endedAt: normalizeDate(value.endedAt, `careerTimeline[${index}].endedAt`, validation),
      sourceRefs: normalizeStringArray(value.sourceRefs, `careerTimeline[${index}].sourceRefs`, validation),
      evidenceArtifactRefs: normalizeStringArray(value.evidenceArtifactRefs, `careerTimeline[${index}].evidenceArtifactRefs`, validation),
      notes: normalizeString(value.notes, `careerTimeline[${index}].notes`, validation),
    };
    if (!normalized.title && !normalized.description) {
      addError(validation, "CAREER_EVENT_CONTEXT_REQUIRED", `careerTimeline[${index}]`, "Career event requires title or description.");
    }
    validateDateOrder(normalized.startedAt, normalized.endedAt, `careerTimeline[${index}]`, validation);
    if (normalized.eventId) {
      const identity = JSON.stringify(normalized);
      if (eventIds.has(normalized.eventId) && eventIds.get(normalized.eventId) !== identity) {
        addError(validation, "DUPLICATE_EVENT_ID", `careerTimeline[${index}].eventId`, "eventId must be unique within careerTimeline.");
      }
      eventIds.set(normalized.eventId, identity);
    }
    return normalized;
  });
  const references = normalizeNested(profile.references, "references", validation, (value) => ({
    researchSourceRefs: normalizeStringArray(value.researchSourceRefs, "references.researchSourceRefs", validation),
    researchSessionRefs: normalizeStringArray(value.researchSessionRefs, "references.researchSessionRefs", validation),
    recordedObservationRefs: normalizeStringArray(value.recordedObservationRefs, "references.recordedObservationRefs", validation),
    analyticalObservationRefs: normalizeStringArray(value.analyticalObservationRefs, "references.analyticalObservationRefs", validation),
    evidenceArtifactRefs: normalizeStringArray(value.evidenceArtifactRefs, "references.evidenceArtifactRefs", validation),
    relationshipRefs: normalizeStringArray(value.relationshipRefs, "references.relationshipRefs", validation),
    documentRefs: normalizeStringArray(value.documentRefs, "references.documentRefs", validation),
    datasetRefs: normalizeStringArray(value.datasetRefs, "references.datasetRefs", validation),
    otherRefs: normalizeStringArray(value.otherRefs, "references.otherRefs", validation),
  }));
  const verification = normalizeNested(profile.verification, "verification", validation, (value) => ({
    state: normalizeEnum(value.state, PERSON_PROFILE_VERIFICATION_STATES, "verification.state", validation, { required: true }),
    confidence: normalizeEnum(value.confidence, PERSON_PROFILE_CONFIDENCE_LEVELS, "verification.confidence", validation, { required: true }),
    verifiedBy: normalizeString(value.verifiedBy, "verification.verifiedBy", validation),
    verifiedAt: normalizeDate(value.verifiedAt, "verification.verifiedAt", validation),
    limitations: normalizeStringArray(value.limitations, "verification.limitations", validation),
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
    restrictions: normalizeString(value.restrictions, "metadata.restrictions", validation),
    notes: normalizeString(value.notes, "metadata.notes", validation),
  }));

  if (status === PERSON_PROFILE_STATUSES.ACTIVE &&
      ![PERSON_PROFILE_VERIFICATION_STATES.VERIFIED, PERSON_PROFILE_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS].includes(verification.state)) {
    addWarning(validation, "ACTIVE_PROFILE_UNVERIFIED", "verification.state", "ACTIVE describes only the Person Profile record lifecycle.");
  }
  if ([PERSON_PROFILE_VERIFICATION_STATES.VERIFIED, PERSON_PROFILE_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS].includes(verification.state)) {
    if (!verification.verifiedBy) addError(validation, "VERIFIER_REQUIRED", "verification.verifiedBy", "Verified profile requires verifiedBy.");
    if (!verification.verifiedAt) addError(validation, "VERIFICATION_DATE_REQUIRED", "verification.verifiedAt", "Verified profile requires verifiedAt.");
  }
  if (verification.state === PERSON_PROFILE_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS &&
      verification.limitations.length === 0 && !verification.notes) {
    addError(validation, "VERIFICATION_LIMITATION_REQUIRED", "verification.limitations", "VERIFIED_WITH_LIMITATIONS requires a limitation or note.");
  }
  if (verification.state === PERSON_PROFILE_VERIFICATION_STATES.DISPUTED &&
      verification.disputes.length === 0 && verification.limitations.length === 0 && !verification.notes) {
    addError(validation, "DISPUTE_CONTEXT_REQUIRED", "verification.disputes", "DISPUTED profile requires dispute context.");
  }
  if (personState === PERSON_STATES.DECEASED && !biography.dateOfDeath) {
    addWarning(validation, "DEATH_DATE_UNKNOWN", "biography.dateOfDeath", "DECEASED profile has no documented death date.");
  }
  if (biography.dateOfDeath && personState !== PERSON_STATES.DECEASED) {
    addWarning(validation, "DEATH_DATE_STATE_MISMATCH", "personState", "A death date is supplied while personState is not DECEASED.");
  }
  ["supersedesProfileRef", "supersededByProfileRef"].forEach((field) => {
    if (profileId && versioning[field] === profileId) addError(validation, "SELF_REFERENCE", `versioning.${field}`, `${field} must not equal profileId.`);
  });
  if (versioning.supersedesProfileRef && versioning.supersededByProfileRef &&
      versioning.supersedesProfileRef === versioning.supersededByProfileRef) {
    addError(validation, "CONFLICTING_VERSION_REFERENCES", "versioning", "supersedesProfileRef and supersededByProfileRef must not reference the same profile.");
  }
  if (status === PERSON_PROFILE_STATUSES.ARCHIVED && !provenance.updatedAt && !versioning.changeReason && !metadata.notes) {
    addError(validation, "ARCHIVE_CONTEXT_REQUIRED", "provenance.updatedAt", "ARCHIVED status requires provenance, versioning, or metadata context.");
  }
  validation.valid = validation.errors.length === 0;
  return {
    contract: PERSON_PROFILE_CONTRACT_NAME,
    contractVersion: PERSON_PROFILE_CONTRACT_VERSION,
    schemaVersion: PERSON_PROFILE_SCHEMA_VERSION,
    profileId,
    entityRef,
    status,
    personState,
    biography,
    nameUsage,
    citizenship,
    languages,
    education,
    careerTimeline,
    references,
    verification,
    provenance,
    versioning,
    metadata,
    validation,
  };
}

export function createPersonProfile(input = {}, { checkedAt = null } = {}) {
  return normalizePersonProfile(input, checkedAt);
}

export function createUnavailablePersonProfile(input = {}, { checkedAt = null } = {}) {
  const supplied = isObject(input) ? input : {};
  const reason = optionalString(supplied.reason);
  const metadata = isObject(supplied.metadata) ? supplied.metadata : {};
  const result = normalizePersonProfile({ ...supplied, metadata: { ...metadata, notes: metadata.notes ?? reason } }, checkedAt);
  const unavailable = createValidation(checkedAt);
  addError(unavailable, "PERSON_PROFILE_UNAVAILABLE", "", reason || "No usable Person Profile is available.");
  return { ...result, validation: mergeValidation(result.validation, unavailable) };
}

export function validatePersonProfile(value, { checkedAt = value?.validation?.checkedAt ?? null } = {}) {
  return normalizePersonProfile(value, checkedAt).validation;
}

export function isPersonProfile(value) {
  return Boolean(isObject(value) && value.contract === PERSON_PROFILE_CONTRACT_NAME &&
    value.contractVersion === PERSON_PROFILE_CONTRACT_VERSION &&
    value.schemaVersion === PERSON_PROFILE_SCHEMA_VERSION && validatePersonProfile(value).valid);
}

export function isVerifiedPersonProfile(value) {
  return Boolean(isPersonProfile(value) && [PERSON_PROFILE_VERIFICATION_STATES.VERIFIED,
    PERSON_PROFILE_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS].includes(value.verification.state));
}

export function isActivePersonProfile(value) {
  return Boolean(isPersonProfile(value) && value.status === PERSON_PROFILE_STATUSES.ACTIVE);
}

export function isDisputedPersonProfile(value) {
  return Boolean(isPersonProfile(value) && value.verification.state === PERSON_PROFILE_VERIFICATION_STATES.DISPUTED);
}

export function isDeceasedPersonProfile(value) {
  return Boolean(isPersonProfile(value) && value.personState === PERSON_STATES.DECEASED);
}

export function getPersonProfileEntityRef(value) {
  return isPersonProfile(value) ? value.entityRef : null;
}

export default Object.freeze({
  PERSON_PROFILE_CONTRACT_NAME,
  PERSON_PROFILE_CONTRACT_VERSION,
  PERSON_PROFILE_SCHEMA_VERSION,
  createPersonProfile,
  createUnavailablePersonProfile,
  validatePersonProfile,
  isPersonProfile,
  isVerifiedPersonProfile,
  isActivePersonProfile,
  isDisputedPersonProfile,
  isDeceasedPersonProfile,
  getPersonProfileEntityRef,
});
