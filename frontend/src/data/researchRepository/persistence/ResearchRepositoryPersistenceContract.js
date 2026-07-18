import { validateResearchSource } from "../contracts/ResearchSourceContract.js";
import { validateResearchSession } from "../contracts/ResearchSessionContract.js";
import { validateRecordedObservation } from "../contracts/RecordedObservationContract.js";
import { validateAnalyticalObservation } from "../contracts/AnalyticalObservationContract.js";
import { validateEvidenceArtifact } from "../contracts/EvidenceArtifactContract.js";
import {
  PERSISTENCE_ADAPTER_REQUIRED_METHODS,
  PERSISTENCE_CONSISTENCY_MODES,
  PERSISTENCE_DELETE_MODES,
  PERSISTENCE_LIFECYCLE_ACTIONS,
  PERSISTENCE_OPERATION_POLICIES,
  PERSISTENCE_OPERATION_STATUSES,
  PERSISTENCE_OPERATION_TYPES,
  PERSISTENCE_RECORD_TYPES,
  PERSISTENCE_SORT_DIRECTIONS,
  PERSISTENCE_WRITE_MODES,
  RESEARCH_REPOSITORY_PERSISTENCE_CONTRACT_NAME,
  RESEARCH_REPOSITORY_PERSISTENCE_CONTRACT_VERSION,
  RESEARCH_REPOSITORY_PERSISTENCE_SCHEMA_VERSION,
} from "./researchRepositoryPersistenceConstants.js";

const RECORD_ID_FIELDS = Object.freeze({
  [PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE]: "sourceId",
  [PERSISTENCE_RECORD_TYPES.RESEARCH_SESSION]: "sessionId",
  [PERSISTENCE_RECORD_TYPES.RECORDED_OBSERVATION]: "observationId",
  [PERSISTENCE_RECORD_TYPES.ANALYTICAL_OBSERVATION]: "analysisId",
  [PERSISTENCE_RECORD_TYPES.EVIDENCE_ARTIFACT]: "evidenceId",
});

const RECORD_VALIDATORS = Object.freeze({
  [PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE]: validateResearchSource,
  [PERSISTENCE_RECORD_TYPES.RESEARCH_SESSION]: validateResearchSession,
  [PERSISTENCE_RECORD_TYPES.RECORDED_OBSERVATION]: validateRecordedObservation,
  [PERSISTENCE_RECORD_TYPES.ANALYTICAL_OBSERVATION]: validateAnalyticalObservation,
  [PERSISTENCE_RECORD_TYPES.EVIDENCE_ARTIFACT]: validateEvidenceArtifact,
});

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
  return value;
}

function optionalString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function createValidation(checkedAt = null) {
  return {
    valid: true, errors: [], warnings: [], checkedAt: optionalString(checkedAt),
    contractVersion: RESEARCH_REPOSITORY_PERSISTENCE_CONTRACT_VERSION,
    schemaVersion: RESEARCH_REPOSITORY_PERSISTENCE_SCHEMA_VERSION,
  };
}

function addValidation(validation, field, code, path, message) {
  const entry = { code, path, message };
  if (!validation[field].some((item) => item.code === code && item.path === path && item.message === message)) validation[field].push(entry);
  validation.valid = validation.errors.length === 0;
}

function addError(validation, code, path, message) {
  addValidation(validation, "errors", code, path, message);
}

function addWarning(validation, code, path, message) {
  addValidation(validation, "warnings", code, path, message);
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

function normalizeReference(value, path, validation) {
  if (value == null) return null;
  if (typeof value !== "string" || !value.trim()) {
    addError(validation, "INVALID_REFERENCE", path, `${path} must be a non-empty identifier or null.`);
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

function normalizeBoolean(value, path, validation) {
  if (value == null) return null;
  if (typeof value !== "boolean") {
    addError(validation, "INVALID_BOOLEAN", path, `${path} must be a boolean or null.`);
    return null;
  }
  return value;
}

function normalizeNonNegativeInteger(value, path, validation) {
  if (value == null) return null;
  if (!Number.isInteger(value) || value < 0) {
    addError(validation, "INVALID_NON_NEGATIVE_INTEGER", path, `${path} must be a non-negative integer or null.`);
    return null;
  }
  return value;
}

function normalizeDeclaredValue(value, path, validation) {
  if (value == null) return null;
  if (!["string", "number", "boolean"].includes(typeof value) || (typeof value === "number" && !Number.isFinite(value))) {
    addError(validation, "INVALID_DECLARED_VALUE", path, `${path} must be a scalar value or null.`);
    return null;
  }
  return typeof value === "string" ? value.trim() || null : value;
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
      addError(validation, "INVALID_ARRAY_ENTRY", `${path}[${index}]`, `${path} values must be non-empty strings.`);
      return;
    }
    const item = entry.trim();
    if (seen.has(item)) {
      addWarning(validation, "DUPLICATE_NORMALIZED_VALUE", path, `Duplicate value removed from ${path}: ${item}.`);
      return;
    }
    seen.add(item);
    result.push(item);
  });
  return result;
}

function normalizeNested(value, path, validation, normalizer) {
  if (value == null) return normalizer({});
  if (!isObject(value)) {
    addError(validation, "INVALID_NESTED_STRUCTURE", path, `${path} must be an object or null.`);
    return normalizer({});
  }
  return normalizer(value);
}

function normalizeStructuredArray(value, path, validation, normalizer) {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    addError(validation, "INVALID_ARRAY", path, `${path} must be an array.`);
    return [];
  }
  const result = [];
  const seen = new Set();
  value.forEach((entry, index) => {
    if (!isObject(entry)) {
      addError(validation, "INVALID_NESTED_STRUCTURE", `${path}[${index}]`, `${path} entries must be objects.`);
      return;
    }
    const item = normalizer(entry, index);
    const identity = JSON.stringify(item);
    if (seen.has(identity)) {
      addWarning(validation, "DUPLICATE_NORMALIZED_OBJECT", path, `Exact duplicate removed from ${path}.`);
      return;
    }
    seen.add(identity);
    result.push(item);
  });
  return result;
}

export function getRecordIdField(recordType) {
  return RECORD_ID_FIELDS[recordType] ?? null;
}

export function getRecordContractValidator(recordType) {
  return RECORD_VALIDATORS[recordType] ?? null;
}

function normalizeRequest(input, checkedAt = null) {
  const validation = createValidation(checkedAt);
  const request = isObject(input) ? input : {};
  if (!isObject(input)) addError(validation, "INVALID_PERSISTENCE_REQUEST_INPUT", "", "Persistence request input must be an object.");
  const operation = normalizeEnum(request.operation, PERSISTENCE_OPERATION_TYPES, "operation", validation, { required: true });
  const recordType = normalizeEnum(request.recordType, PERSISTENCE_RECORD_TYPES, "recordType", validation, { required: true });
  const record = request.record == null
    ? null
    : isObject(request.record)
      ? cloneValue(request.record)
      : (addError(validation, "INVALID_RECORD", "record", "record must be an object or null."), null);
  let recordId = normalizeReference(request.recordId, "recordId", validation);
  const idField = getRecordIdField(recordType);
  const rawCanonicalId = record && idField ? record[idField] : null;
  const canonicalId = rawCanonicalId == null
    ? null
    : typeof rawCanonicalId === "string" && rawCanonicalId.trim()
      ? rawCanonicalId.trim()
      : (addError(validation, "INVALID_CANONICAL_RECORD_ID", `record.${idField}`, "Canonical record ID must be a non-empty string."), null);
  if ([PERSISTENCE_OPERATION_TYPES.CREATE, PERSISTENCE_OPERATION_TYPES.UPSERT].includes(operation) && !recordId && canonicalId) recordId = canonicalId;
  if (recordId && canonicalId && recordId !== canonicalId) addError(validation, "RECORD_ID_MISMATCH", "recordId", "recordId must match the record canonical ID.");

  const normalized = {
    contract: RESEARCH_REPOSITORY_PERSISTENCE_CONTRACT_NAME,
    contractVersion: RESEARCH_REPOSITORY_PERSISTENCE_CONTRACT_VERSION,
    schemaVersion: RESEARCH_REPOSITORY_PERSISTENCE_SCHEMA_VERSION,
    requestId: normalizeReference(request.requestId, "requestId", validation),
    operation,
    recordType,
    recordId,
    record,
    query: normalizeNested(request.query, "query", validation, (query) => ({
      filters: normalizeStructuredArray(query.filters, "query.filters", validation, (filter, index) => ({
        field: normalizeString(filter.field, `query.filters[${index}].field`, validation, { required: true }),
        operator: normalizeString(filter.operator, `query.filters[${index}].operator`, validation, { required: true }),
        value: normalizeDeclaredValue(filter.value, `query.filters[${index}].value`, validation),
        values: filter.values == null
          ? []
          : Array.isArray(filter.values)
            ? filter.values.map((value, valueIndex) => normalizeDeclaredValue(value, `query.filters[${index}].values[${valueIndex}]`, validation))
            : (addError(validation, "INVALID_ARRAY", `query.filters[${index}].values`, "Filter values must be an array."), []),
        notes: normalizeString(filter.notes, `query.filters[${index}].notes`, validation),
      })),
      sort: normalizeStructuredArray(query.sort, "query.sort", validation, (sort, index) => ({
        field: normalizeString(sort.field, `query.sort[${index}].field`, validation, { required: true }),
        direction: normalizeEnum(sort.direction, PERSISTENCE_SORT_DIRECTIONS, `query.sort[${index}].direction`, validation, { required: true }),
      })),
      limit: normalizeNonNegativeInteger(query.limit, "query.limit", validation),
      offset: normalizeNonNegativeInteger(query.offset, "query.offset", validation),
      cursor: normalizeString(query.cursor, "query.cursor", validation),
      includeArchived: normalizeBoolean(query.includeArchived, "query.includeArchived", validation),
      includeDeleted: normalizeBoolean(query.includeDeleted, "query.includeDeleted", validation),
      notes: normalizeString(query.notes, "query.notes", validation),
    })),
    write: normalizeNested(request.write, "write", validation, (write) => ({
      mode: normalizeEnum(write.mode, PERSISTENCE_WRITE_MODES, "write.mode", validation),
      expectedVersion: normalizeDeclaredValue(write.expectedVersion, "write.expectedVersion", validation),
      preserveCreatedMetadata: normalizeBoolean(write.preserveCreatedMetadata, "write.preserveCreatedMetadata", validation),
      validateBeforeWrite: normalizeBoolean(write.validateBeforeWrite, "write.validateBeforeWrite", validation),
      notes: normalizeString(write.notes, "write.notes", validation),
    })),
    lifecycle: normalizeNested(request.lifecycle, "lifecycle", validation, (lifecycle) => ({
      action: normalizeEnum(lifecycle.action, PERSISTENCE_LIFECYCLE_ACTIONS, "lifecycle.action", validation),
      deleteMode: normalizeEnum(lifecycle.deleteMode, PERSISTENCE_DELETE_MODES, "lifecycle.deleteMode", validation),
      reason: normalizeString(lifecycle.reason, "lifecycle.reason", validation),
      notes: normalizeString(lifecycle.notes, "lifecycle.notes", validation),
    })),
    consistency: normalizeEnum(request.consistency, PERSISTENCE_CONSISTENCY_MODES, "consistency", validation),
    actor: normalizeNested(request.actor, "actor", validation, (actor) => ({
      actorRef: normalizeReference(actor.actorRef, "actor.actorRef", validation),
      actorLabel: normalizeString(actor.actorLabel, "actor.actorLabel", validation),
      role: normalizeString(actor.role, "actor.role", validation),
      authorizationContext: actor.authorizationContext == null ? null : cloneValue(actor.authorizationContext),
      notes: normalizeString(actor.notes, "actor.notes", validation),
    })),
    context: normalizeNested(request.context, "context", validation, (context) => ({
      correlationId: normalizeReference(context.correlationId, "context.correlationId", validation),
      causationId: normalizeReference(context.causationId, "context.causationId", validation),
      sessionRef: normalizeReference(context.sessionRef, "context.sessionRef", validation),
      source: normalizeString(context.source, "context.source", validation),
      notes: normalizeString(context.notes, "context.notes", validation),
    })),
    metadata: normalizeNested(request.metadata, "metadata", validation, (metadata) => ({
      tags: normalizeStringArray(metadata.tags, "metadata.tags", validation),
      externalRefs: normalizeStringArray(metadata.externalRefs, "metadata.externalRefs", validation),
      notes: normalizeString(metadata.notes, "metadata.notes", validation),
    })),
    validation: null,
  };

  if ([PERSISTENCE_OPERATION_TYPES.CREATE, PERSISTENCE_OPERATION_TYPES.UPSERT].includes(operation)) {
    if (!record) addError(validation, `${operation}_RECORD_REQUIRED`, "record", `${operation} requires a record.`);
    else if (!canonicalId) addError(validation, "CANONICAL_RECORD_ID_REQUIRED", `record.${idField}`, `${operation} requires the canonical record ID.`);
  }
  if (operation === PERSISTENCE_OPERATION_TYPES.READ && !recordId) addError(validation, "READ_RECORD_ID_REQUIRED", "recordId", "READ requires recordId.");
  if (operation === PERSISTENCE_OPERATION_TYPES.UPDATE) {
    if (!recordId) addError(validation, "UPDATE_RECORD_ID_REQUIRED", "recordId", "UPDATE requires recordId.");
    if (!record) addError(validation, "UPDATE_RECORD_REQUIRED", "record", "UPDATE requires a record.");
  }
  if (operation === PERSISTENCE_OPERATION_TYPES.EXISTS && !recordId) addError(validation, "EXISTS_RECORD_ID_REQUIRED", "recordId", "EXISTS requires recordId.");
  if (operation === PERSISTENCE_OPERATION_TYPES.ARCHIVE) {
    if (!recordId) addError(validation, "ARCHIVE_RECORD_ID_REQUIRED", "recordId", "ARCHIVE requires recordId.");
    if (normalized.lifecycle.action !== PERSISTENCE_LIFECYCLE_ACTIONS.ARCHIVE) addError(validation, "ARCHIVE_ACTION_REQUIRED", "lifecycle.action", "ARCHIVE requires lifecycle action ARCHIVE.");
  }
  if (operation === PERSISTENCE_OPERATION_TYPES.DELETE) {
    if (!recordId) addError(validation, "DELETE_RECORD_ID_REQUIRED", "recordId", "DELETE requires recordId.");
    if (normalized.lifecycle.action !== PERSISTENCE_LIFECYCLE_ACTIONS.DELETE) addError(validation, "DELETE_ACTION_REQUIRED", "lifecycle.action", "DELETE requires lifecycle action DELETE.");
    addWarning(validation, "RESTRICTED_DELETE_OPERATION", "operation", "DELETE is a restricted persistence operation.");
    if (normalized.lifecycle.deleteMode === PERSISTENCE_DELETE_MODES.HARD_DELETE && PERSISTENCE_OPERATION_POLICIES.DELETE.hardDeleteRestrictedByDefault) {
      addWarning(validation, "HARD_DELETE_RESTRICTED_BY_DEFAULT", "lifecycle.deleteMode", "HARD_DELETE is restricted by declared policy and is not automatically authorized.");
    }
  }

  if (normalized.write.validateBeforeWrite === true && record && recordType) {
    const validator = getRecordContractValidator(recordType);
    const recordValidation = validator ? validator(record) : null;
    if (!recordValidation?.valid) {
      addError(validation, "RECORD_VALIDATION_FAILED", "record", "The approved record contract rejected the supplied record.");
      (recordValidation?.errors || []).forEach((entry) => addError(validation, `RECORD_${entry.code}`, `record.${entry.path || ""}`, entry.message));
    }
  }
  validation.valid = validation.errors.length === 0;
  normalized.validation = validation;
  return normalized;
}

function normalizeResult(input, checkedAt = null, forceUnavailable = false) {
  const validation = createValidation(checkedAt);
  const result = isObject(input) ? input : {};
  if (!isObject(input)) addError(validation, "INVALID_PERSISTENCE_RESULT_INPUT", "", "Persistence result input must be an object.");
  const status = forceUnavailable
    ? PERSISTENCE_OPERATION_STATUSES.UNAVAILABLE
    : normalizeEnum(result.status, PERSISTENCE_OPERATION_STATUSES, "status", validation, { required: true });
  const record = result.record == null ? null : isObject(result.record) ? cloneValue(result.record) : (addError(validation, "INVALID_RECORD", "record", "record must be an object or null."), null);
  const records = result.records == null
    ? []
    : Array.isArray(result.records)
      ? result.records.map((entry, index) => isObject(entry) ? cloneValue(entry) : (addError(validation, "INVALID_RECORD", `records[${index}]`, "records entries must be objects."), null)).filter(Boolean)
      : (addError(validation, "INVALID_ARRAY", "records", "records must be an array."), []);
  const normalized = {
    contract: RESEARCH_REPOSITORY_PERSISTENCE_CONTRACT_NAME,
    contractVersion: RESEARCH_REPOSITORY_PERSISTENCE_CONTRACT_VERSION,
    schemaVersion: RESEARCH_REPOSITORY_PERSISTENCE_SCHEMA_VERSION,
    requestId: normalizeReference(result.requestId, "requestId", validation),
    operation: normalizeEnum(result.operation, PERSISTENCE_OPERATION_TYPES, "operation", validation, { required: true }),
    recordType: normalizeEnum(result.recordType, PERSISTENCE_RECORD_TYPES, "recordType", validation, { required: true }),
    recordId: normalizeReference(result.recordId, "recordId", validation),
    status,
    record,
    records,
    page: normalizeNested(result.page, "page", validation, (page) => ({
      count: normalizeNonNegativeInteger(page.count, "page.count", validation),
      total: normalizeNonNegativeInteger(page.total, "page.total", validation),
      limit: normalizeNonNegativeInteger(page.limit, "page.limit", validation),
      offset: normalizeNonNegativeInteger(page.offset, "page.offset", validation),
      nextCursor: normalizeString(page.nextCursor, "page.nextCursor", validation),
      previousCursor: normalizeString(page.previousCursor, "page.previousCursor", validation),
      hasMore: normalizeBoolean(page.hasMore, "page.hasMore", validation),
    })),
    conflict: normalizeNested(result.conflict, "conflict", validation, (conflict) => ({
      type: normalizeString(conflict.type, "conflict.type", validation),
      expectedVersion: normalizeDeclaredValue(conflict.expectedVersion, "conflict.expectedVersion", validation),
      actualVersion: normalizeDeclaredValue(conflict.actualVersion, "conflict.actualVersion", validation),
      existingRecordRef: normalizeReference(conflict.existingRecordRef, "conflict.existingRecordRef", validation),
      notes: normalizeString(conflict.notes, "conflict.notes", validation),
    })),
    failure: normalizeNested(result.failure, "failure", validation, (failure) => ({
      code: normalizeString(failure.code, "failure.code", validation),
      message: normalizeString(failure.message, "failure.message", validation),
      retryable: normalizeBoolean(failure.retryable, "failure.retryable", validation),
      details: failure.details == null ? null : cloneValue(failure.details),
    })),
    audit: normalizeNested(result.audit, "audit", validation, (audit) => ({
      actorRef: normalizeReference(audit.actorRef, "audit.actorRef", validation),
      operationAt: normalizeString(audit.operationAt, "audit.operationAt", validation),
      storageAdapter: normalizeString(audit.storageAdapter, "audit.storageAdapter", validation),
      storageVersion: normalizeDeclaredValue(audit.storageVersion, "audit.storageVersion", validation),
      correlationId: normalizeReference(audit.correlationId, "audit.correlationId", validation),
      notes: normalizeString(audit.notes, "audit.notes", validation),
    })),
    metadata: normalizeNested(result.metadata, "metadata", validation, (metadata) => ({
      warnings: normalizeStringArray(metadata.warnings, "metadata.warnings", validation),
      tags: normalizeStringArray(metadata.tags, "metadata.tags", validation),
      notes: normalizeString(metadata.notes, "metadata.notes", validation),
    })),
    validation: null,
  };
  if (status === PERSISTENCE_OPERATION_STATUSES.SUCCESS && normalized.operation === PERSISTENCE_OPERATION_TYPES.READ && !record) addError(validation, "READ_RESULT_RECORD_REQUIRED", "record", "Successful READ requires record.");
  if (status === PERSISTENCE_OPERATION_STATUSES.CONFLICT && !normalized.conflict.type && normalized.conflict.expectedVersion == null && normalized.conflict.actualVersion == null && !normalized.conflict.existingRecordRef && !normalized.conflict.notes) addError(validation, "CONFLICT_METADATA_REQUIRED", "conflict", "CONFLICT requires conflict metadata.");
  if (status === PERSISTENCE_OPERATION_STATUSES.VALIDATION_FAILED && !normalized.failure.message && normalized.failure.details == null) addError(validation, "VALIDATION_FAILURE_DETAILS_REQUIRED", "failure", "VALIDATION_FAILED requires failure details or a message.");
  if (status === PERSISTENCE_OPERATION_STATUSES.FAILED && !normalized.failure.message) addError(validation, "FAILURE_MESSAGE_REQUIRED", "failure.message", "FAILED requires failure.message.");
  if (forceUnavailable && !normalized.failure.message) normalized.failure.message = optionalString(result.reason) || "Persistence is unavailable.";
  validation.valid = validation.errors.length === 0;
  normalized.validation = validation;
  return normalized;
}

export function createPersistenceRequest(input = {}, { checkedAt = null } = {}) {
  return normalizeRequest(input, checkedAt);
}

export function createPersistenceResult(input = {}, { checkedAt = null } = {}) {
  return normalizeResult(input, checkedAt);
}

export function createUnavailablePersistenceResult(input = {}, { checkedAt = null } = {}) {
  return normalizeResult(input, checkedAt, true);
}

export function validatePersistenceRequest(value, { checkedAt = value?.validation?.checkedAt ?? null } = {}) {
  return normalizeRequest(value, checkedAt).validation;
}

export function validatePersistenceResult(value, { checkedAt = value?.validation?.checkedAt ?? null } = {}) {
  return normalizeResult(value, checkedAt).validation;
}

export function isPersistenceRequest(value) {
  return Boolean(isObject(value) && value.contract === RESEARCH_REPOSITORY_PERSISTENCE_CONTRACT_NAME &&
    value.contractVersion === RESEARCH_REPOSITORY_PERSISTENCE_CONTRACT_VERSION &&
    value.schemaVersion === RESEARCH_REPOSITORY_PERSISTENCE_SCHEMA_VERSION &&
    isObject(value.query) && isObject(value.write) && isObject(value.lifecycle) &&
    isObject(value.actor) && isObject(value.context) && isObject(value.metadata) && isObject(value.validation));
}

export function isPersistenceResult(value) {
  return Boolean(isObject(value) && value.contract === RESEARCH_REPOSITORY_PERSISTENCE_CONTRACT_NAME &&
    value.contractVersion === RESEARCH_REPOSITORY_PERSISTENCE_CONTRACT_VERSION &&
    value.schemaVersion === RESEARCH_REPOSITORY_PERSISTENCE_SCHEMA_VERSION &&
    Array.isArray(value.records) && isObject(value.page) && isObject(value.conflict) &&
    isObject(value.failure) && isObject(value.audit) && isObject(value.metadata) && isObject(value.validation));
}

export function isSuccessfulPersistenceResult(value) {
  return Boolean(isPersistenceResult(value) && validatePersistenceResult(value).valid && value.status === PERSISTENCE_OPERATION_STATUSES.SUCCESS);
}

export function isRestrictedPersistenceRequest(value) {
  return Boolean(isPersistenceRequest(value) && validatePersistenceRequest(value).valid &&
    value.operation === PERSISTENCE_OPERATION_TYPES.DELETE && PERSISTENCE_OPERATION_POLICIES.DELETE.restricted);
}

export function validatePersistenceAdapter(adapter, { checkedAt = null } = {}) {
  const validation = createValidation(checkedAt);
  if (!isObject(adapter)) addError(validation, "INVALID_ADAPTER", "", "Persistence adapter must be an object.");
  PERSISTENCE_ADAPTER_REQUIRED_METHODS.forEach((method) => {
    if (typeof adapter?.[method] !== "function") addError(validation, "MISSING_ADAPTER_METHOD", method, `Adapter method ${method} is required.`);
  });
  validation.valid = validation.errors.length === 0;
  return validation;
}

export function isPersistenceAdapter(adapter) {
  return validatePersistenceAdapter(adapter).valid;
}

export default Object.freeze({
  RESEARCH_REPOSITORY_PERSISTENCE_CONTRACT_NAME,
  RESEARCH_REPOSITORY_PERSISTENCE_CONTRACT_VERSION,
  RESEARCH_REPOSITORY_PERSISTENCE_SCHEMA_VERSION,
  createPersistenceRequest,
  createPersistenceResult,
  createUnavailablePersistenceResult,
  validatePersistenceRequest,
  validatePersistenceResult,
  isPersistenceRequest,
  isPersistenceResult,
  isSuccessfulPersistenceResult,
  isRestrictedPersistenceRequest,
  getRecordIdField,
  getRecordContractValidator,
  validatePersistenceAdapter,
  isPersistenceAdapter,
});
