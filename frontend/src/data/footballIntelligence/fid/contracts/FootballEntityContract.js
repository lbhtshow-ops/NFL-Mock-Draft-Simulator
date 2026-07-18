import {
  FOOTBALL_ENTITY_ALIAS_TYPES,
  FOOTBALL_ENTITY_CONTRACT_NAME,
  FOOTBALL_ENTITY_CONTRACT_VERSION,
  FOOTBALL_ENTITY_EXTERNAL_IDENTIFIER_TYPES,
  FOOTBALL_ENTITY_IDENTITY_CONFIDENCE_LEVELS,
  FOOTBALL_ENTITY_SCHEMA_VERSION,
  FOOTBALL_ENTITY_STATUSES,
  FOOTBALL_ENTITY_TYPES,
  FOOTBALL_ENTITY_VERIFICATION_STATES,
} from "../constants/footballEntityConstants.js";

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
    contractVersion: FOOTBALL_ENTITY_CONTRACT_VERSION,
    schemaVersion: FOOTBALL_ENTITY_SCHEMA_VERSION,
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

function normalizeVersion(value, validation) {
  if (value == null) return null;
  if ((typeof value === "string" && value.trim()) || (Number.isInteger(value) && value >= 0)) {
    return typeof value === "string" ? value.trim() : value;
  }
  addError(validation, "INVALID_ENTITY_VERSION", "versioning.entityVersion", "entityVersion must be a non-empty string, non-negative integer, or null.");
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
  const seen = new Set();
  const result = [];
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

function validateDateOrder(value, path, validation) {
  if (value.validFrom && value.validTo && Date.parse(value.validFrom) > Date.parse(value.validTo)) {
    addError(validation, "INVALID_DATE_ORDER", path, `${path}.validFrom must not be after validTo.`);
  }
}

function normalizeAliases(value, validation) {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    addError(validation, "INVALID_ARRAY", "aliases", "aliases must be an array.");
    return [];
  }
  const result = [];
  const seen = new Set();
  value.forEach((entry, index) => {
    if (!isObject(entry)) {
      addError(validation, "INVALID_ALIAS_STRUCTURE", `aliases[${index}]`, "Alias entries must be objects.");
      return;
    }
    const normalized = {
      alias: normalizeString(entry.alias, `aliases[${index}].alias`, validation, { required: true }),
      aliasType: normalizeEnum(entry.aliasType, FOOTBALL_ENTITY_ALIAS_TYPES, `aliases[${index}].aliasType`, validation, { required: true }),
      language: normalizeString(entry.language, `aliases[${index}].language`, validation),
      validFrom: normalizeDate(entry.validFrom, `aliases[${index}].validFrom`, validation),
      validTo: normalizeDate(entry.validTo, `aliases[${index}].validTo`, validation),
      sourceRef: normalizeString(entry.sourceRef, `aliases[${index}].sourceRef`, validation),
      notes: normalizeString(entry.notes, `aliases[${index}].notes`, validation),
    };
    validateDateOrder(normalized, `aliases[${index}]`, validation);
    const identity = JSON.stringify(normalized);
    if (seen.has(identity)) {
      addWarning(validation, "DUPLICATE_NORMALIZED_OBJECT", "aliases", "Exact duplicate alias removed.");
      return;
    }
    seen.add(identity);
    result.push(normalized);
  });
  return result;
}

function normalizeExternalIdentifiers(value, validation) {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    addError(validation, "INVALID_ARRAY", "externalIdentifiers", "externalIdentifiers must be an array.");
    return [];
  }
  const result = [];
  const exact = new Set();
  const pairs = new Map();
  value.forEach((entry, index) => {
    if (!isObject(entry)) {
      addError(validation, "INVALID_EXTERNAL_IDENTIFIER_STRUCTURE", `externalIdentifiers[${index}]`, "External identifier entries must be objects.");
      return;
    }
    const normalized = {
      identifierType: normalizeEnum(entry.identifierType, FOOTBALL_ENTITY_EXTERNAL_IDENTIFIER_TYPES, `externalIdentifiers[${index}].identifierType`, validation, { required: true }),
      provider: normalizeString(entry.provider, `externalIdentifiers[${index}].provider`, validation, { required: true }),
      value: normalizeString(entry.value, `externalIdentifiers[${index}].value`, validation, { required: true }),
      validFrom: normalizeDate(entry.validFrom, `externalIdentifiers[${index}].validFrom`, validation),
      validTo: normalizeDate(entry.validTo, `externalIdentifiers[${index}].validTo`, validation),
      sourceRef: normalizeString(entry.sourceRef, `externalIdentifiers[${index}].sourceRef`, validation),
      notes: normalizeString(entry.notes, `externalIdentifiers[${index}].notes`, validation),
    };
    validateDateOrder(normalized, `externalIdentifiers[${index}]`, validation);
    const identity = JSON.stringify(normalized);
    if (exact.has(identity)) {
      addWarning(validation, "DUPLICATE_NORMALIZED_OBJECT", "externalIdentifiers", "Exact duplicate external identifier removed.");
      return;
    }
    exact.add(identity);
    const pair = `${normalized.provider}\u0000${normalized.value}`;
    if (pairs.has(pair) && pairs.get(pair) !== identity) {
      addWarning(validation, "EXTERNAL_IDENTIFIER_METADATA_VARIATION", `externalIdentifiers[${index}]`, "The same provider and value appear with different metadata.");
    }
    pairs.set(pair, identity);
    result.push(normalized);
  });
  return result;
}

function mergeValidation(base, addition) {
  const result = {
    ...base,
    errors: [...base.errors],
    warnings: [...base.warnings],
  };
  addition.errors.forEach((entry) => addError(result, entry.code, entry.path, entry.message));
  addition.warnings.forEach((entry) => addWarning(result, entry.code, entry.path, entry.message));
  result.valid = result.errors.length === 0;
  return result;
}

function normalizeFootballEntity(input, checkedAt = null) {
  const validation = createValidation(checkedAt);
  const entity = isObject(input) ? input : {};
  if (!isObject(input)) addError(validation, "INVALID_FOOTBALL_ENTITY_INPUT", "", "Football Entity input must be an object.");
  const entityId = normalizeString(entity.entityId, "entityId", validation, { required: true });
  const entityType = normalizeEnum(entity.entityType, FOOTBALL_ENTITY_TYPES, "entityType", validation, { required: true });
  const status = normalizeEnum(entity.status, FOOTBALL_ENTITY_STATUSES, "status", validation, { required: true });
  const identity = normalizeNested(entity.identity, "identity", validation, (value) => ({
    canonicalName: normalizeString(value.canonicalName, "identity.canonicalName", validation, { required: true }),
    displayName: normalizeString(value.displayName, "identity.displayName", validation),
    shortName: normalizeString(value.shortName, "identity.shortName", validation),
    description: normalizeString(value.description, "identity.description", validation),
    language: normalizeString(value.language, "identity.language", validation),
    countryCode: normalizeString(value.countryCode, "identity.countryCode", validation),
    disambiguation: normalizeString(value.disambiguation, "identity.disambiguation", validation),
    notes: normalizeString(value.notes, "identity.notes", validation),
  }));
  const aliases = normalizeAliases(entity.aliases, validation);
  const externalIdentifiers = normalizeExternalIdentifiers(entity.externalIdentifiers, validation);
  const references = normalizeNested(entity.references, "references", validation, (value) => ({
    researchSourceRefs: normalizeStringArray(value.researchSourceRefs, "references.researchSourceRefs", validation),
    researchSessionRefs: normalizeStringArray(value.researchSessionRefs, "references.researchSessionRefs", validation),
    recordedObservationRefs: normalizeStringArray(value.recordedObservationRefs, "references.recordedObservationRefs", validation),
    analyticalObservationRefs: normalizeStringArray(value.analyticalObservationRefs, "references.analyticalObservationRefs", validation),
    evidenceArtifactRefs: normalizeStringArray(value.evidenceArtifactRefs, "references.evidenceArtifactRefs", validation),
    relationshipRefs: normalizeStringArray(value.relationshipRefs, "references.relationshipRefs", validation),
    snapshotRefs: normalizeStringArray(value.snapshotRefs, "references.snapshotRefs", validation),
    documentRefs: normalizeStringArray(value.documentRefs, "references.documentRefs", validation),
    datasetRefs: normalizeStringArray(value.datasetRefs, "references.datasetRefs", validation),
    otherRefs: normalizeStringArray(value.otherRefs, "references.otherRefs", validation),
  }));
  const verification = normalizeNested(entity.verification, "verification", validation, (value) => ({
    state: normalizeEnum(value.state, FOOTBALL_ENTITY_VERIFICATION_STATES, "verification.state", validation, { required: true }),
    identityConfidence: normalizeEnum(value.identityConfidence, FOOTBALL_ENTITY_IDENTITY_CONFIDENCE_LEVELS, "verification.identityConfidence", validation, { required: true }),
    verifiedBy: normalizeString(value.verifiedBy, "verification.verifiedBy", validation),
    verifiedAt: normalizeDate(value.verifiedAt, "verification.verifiedAt", validation),
    limitations: normalizeStringArray(value.limitations, "verification.limitations", validation),
    disputes: normalizeStringArray(value.disputes, "verification.disputes", validation),
    notes: normalizeString(value.notes, "verification.notes", validation),
  }));
  const provenance = normalizeNested(entity.provenance, "provenance", validation, (value) => ({
    createdBy: normalizeString(value.createdBy, "provenance.createdBy", validation),
    createdAt: normalizeDate(value.createdAt, "provenance.createdAt", validation),
    updatedBy: normalizeString(value.updatedBy, "provenance.updatedBy", validation),
    updatedAt: normalizeDate(value.updatedAt, "provenance.updatedAt", validation),
    originSystem: normalizeString(value.originSystem, "provenance.originSystem", validation),
    originRecordRef: normalizeString(value.originRecordRef, "provenance.originRecordRef", validation),
    notes: normalizeString(value.notes, "provenance.notes", validation),
  }));
  const versioning = normalizeNested(entity.versioning, "versioning", validation, (value) => ({
    entityVersion: normalizeVersion(value.entityVersion, validation),
    supersedesEntityRef: normalizeString(value.supersedesEntityRef, "versioning.supersedesEntityRef", validation),
    supersededByEntityRef: normalizeString(value.supersededByEntityRef, "versioning.supersededByEntityRef", validation),
    mergedIntoEntityRef: normalizeString(value.mergedIntoEntityRef, "versioning.mergedIntoEntityRef", validation),
    changeReason: normalizeString(value.changeReason, "versioning.changeReason", validation),
    notes: normalizeString(value.notes, "versioning.notes", validation),
  }));
  const metadata = normalizeNested(entity.metadata, "metadata", validation, (value) => ({
    tags: normalizeStringArray(value.tags, "metadata.tags", validation),
    domains: normalizeStringArray(value.domains, "metadata.domains", validation),
    visibility: normalizeString(value.visibility, "metadata.visibility", validation),
    restrictions: normalizeString(value.restrictions, "metadata.restrictions", validation),
    notes: normalizeString(value.notes, "metadata.notes", validation),
  }));

  if (status === FOOTBALL_ENTITY_STATUSES.ACTIVE &&
      ![FOOTBALL_ENTITY_VERIFICATION_STATES.VERIFIED, FOOTBALL_ENTITY_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS].includes(verification.state)) {
    addWarning(validation, "ACTIVE_IDENTITY_UNVERIFIED", "verification.state", "ACTIVE describes the FID lifecycle and does not verify identity.");
  }
  if ([FOOTBALL_ENTITY_VERIFICATION_STATES.VERIFIED, FOOTBALL_ENTITY_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS].includes(verification.state)) {
    if (!verification.verifiedBy) addError(validation, "VERIFIER_REQUIRED", "verification.verifiedBy", "Verified identity requires verifiedBy.");
    if (!verification.verifiedAt) addError(validation, "VERIFICATION_DATE_REQUIRED", "verification.verifiedAt", "Verified identity requires verifiedAt.");
  }
  if (verification.state === FOOTBALL_ENTITY_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS &&
      verification.limitations.length === 0 && !verification.notes) {
    addError(validation, "VERIFICATION_LIMITATION_REQUIRED", "verification.limitations", "VERIFIED_WITH_LIMITATIONS requires a limitation or note.");
  }
  if (verification.state === FOOTBALL_ENTITY_VERIFICATION_STATES.DISPUTED &&
      verification.disputes.length === 0 && verification.limitations.length === 0 && !verification.notes) {
    addError(validation, "DISPUTE_CONTEXT_REQUIRED", "verification.disputes", "DISPUTED identity requires dispute context.");
  }
  ["supersedesEntityRef", "supersededByEntityRef", "mergedIntoEntityRef"].forEach((field) => {
    if (entityId && versioning[field] === entityId) addError(validation, "SELF_REFERENCE", `versioning.${field}`, `${field} must not equal entityId.`);
  });
  if (versioning.supersedesEntityRef && versioning.supersededByEntityRef &&
      versioning.supersedesEntityRef === versioning.supersededByEntityRef) {
    addError(validation, "CONFLICTING_VERSION_REFERENCES", "versioning", "supersedesEntityRef and supersededByEntityRef must not reference the same entity.");
  }
  if (versioning.mergedIntoEntityRef && versioning.supersededByEntityRef &&
      versioning.mergedIntoEntityRef !== versioning.supersededByEntityRef) {
    addError(validation, "CONFLICTING_DESTINATION_REFERENCES", "versioning", "mergedIntoEntityRef and supersededByEntityRef cannot declare different destinations.");
  }
  if (status === FOOTBALL_ENTITY_STATUSES.MERGED && !versioning.mergedIntoEntityRef) {
    addError(validation, "MERGED_DESTINATION_REQUIRED", "versioning.mergedIntoEntityRef", "MERGED status requires mergedIntoEntityRef.");
  }
  if (status === FOOTBALL_ENTITY_STATUSES.ARCHIVED && !provenance.updatedAt && !versioning.changeReason) {
    addError(validation, "ARCHIVE_CONTEXT_REQUIRED", "provenance.updatedAt", "ARCHIVED status requires provenance.updatedAt or versioning.changeReason.");
  }
  validation.valid = validation.errors.length === 0;
  return {
    contract: FOOTBALL_ENTITY_CONTRACT_NAME,
    contractVersion: FOOTBALL_ENTITY_CONTRACT_VERSION,
    schemaVersion: FOOTBALL_ENTITY_SCHEMA_VERSION,
    entityId,
    entityType,
    status,
    identity,
    aliases,
    externalIdentifiers,
    references,
    verification,
    provenance,
    versioning,
    metadata,
    validation,
  };
}

export function createFootballEntity(input = {}, { checkedAt = null } = {}) {
  return normalizeFootballEntity(input, checkedAt);
}

export function createUnavailableFootballEntity(input = {}, { checkedAt = null } = {}) {
  const supplied = isObject(input) ? input : {};
  const reason = optionalString(supplied.reason);
  const metadata = isObject(supplied.metadata) ? supplied.metadata : {};
  const result = normalizeFootballEntity({
    ...supplied,
    metadata: { ...metadata, notes: metadata.notes ?? reason },
  }, checkedAt);
  const unavailable = createValidation(checkedAt);
  addError(unavailable, "FOOTBALL_ENTITY_UNAVAILABLE", "", reason || "No usable Football Entity is available.");
  return { ...result, validation: mergeValidation(result.validation, unavailable) };
}

export function validateFootballEntity(value, { checkedAt = value?.validation?.checkedAt ?? null } = {}) {
  return normalizeFootballEntity(value, checkedAt).validation;
}

export function isFootballEntity(value) {
  return Boolean(isObject(value) && value.contract === FOOTBALL_ENTITY_CONTRACT_NAME &&
    value.contractVersion === FOOTBALL_ENTITY_CONTRACT_VERSION &&
    value.schemaVersion === FOOTBALL_ENTITY_SCHEMA_VERSION && validateFootballEntity(value).valid);
}

export function isVerifiedFootballEntity(value) {
  return Boolean(isFootballEntity(value) && [
    FOOTBALL_ENTITY_VERIFICATION_STATES.VERIFIED,
    FOOTBALL_ENTITY_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS,
  ].includes(value.verification.state));
}

export function isActiveFootballEntity(value) {
  return Boolean(isFootballEntity(value) && value.status === FOOTBALL_ENTITY_STATUSES.ACTIVE);
}

export function isMergedFootballEntity(value) {
  return Boolean(isFootballEntity(value) && value.status === FOOTBALL_ENTITY_STATUSES.MERGED);
}

export function isDisputedFootballEntity(value) {
  return Boolean(isFootballEntity(value) && value.verification.state === FOOTBALL_ENTITY_VERIFICATION_STATES.DISPUTED);
}

export function getFootballEntityCanonicalName(value) {
  return isFootballEntity(value) ? value.identity.canonicalName : null;
}

export default Object.freeze({
  FOOTBALL_ENTITY_CONTRACT_NAME,
  FOOTBALL_ENTITY_CONTRACT_VERSION,
  FOOTBALL_ENTITY_SCHEMA_VERSION,
  createFootballEntity,
  createUnavailableFootballEntity,
  validateFootballEntity,
  isFootballEntity,
  isVerifiedFootballEntity,
  isActiveFootballEntity,
  isMergedFootballEntity,
  isDisputedFootballEntity,
  getFootballEntityCanonicalName,
});
