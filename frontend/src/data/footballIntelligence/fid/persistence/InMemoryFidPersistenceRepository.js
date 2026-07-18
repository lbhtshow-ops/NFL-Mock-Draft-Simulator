import {
  FID_PERSISTENCE_ERROR_CODES,
  FID_PERSISTENCE_QUERY_SORT_FIELDS,
  FID_PERSISTENCE_SORT_DIRECTIONS,
  createFidPersistenceEnvelope,
  createFidPersistenceError,
  createFidPersistenceQuery,
  createFidRepositoryResult,
} from "./FidPersistenceArchitectureSpecification.js";
import {
  FID_PERSISTENCE_REFERENCE_QUERY_LOCATIONS,
  FID_PERSISTENCE_REPOSITORY_ADAPTER_TYPES,
  FID_PERSISTENCE_REPOSITORY_CONTRACT_NAME,
  FID_PERSISTENCE_REPOSITORY_CONTRACT_VERSION,
  FID_PERSISTENCE_REPOSITORY_SCHEMA_VERSION,
  createFidPersistenceRepositoryContract,
} from "./FidPersistenceRepositoryContract.js";

export const IN_MEMORY_FID_PERSISTENCE_REPOSITORY_NAME = "InMemoryFidPersistenceRepository";
export const IN_MEMORY_FID_PERSISTENCE_REPOSITORY_VERSION = "IN-MEMORY-FID-PERSISTENCE-REPOSITORY-1.0.0";
export const IN_MEMORY_FID_PERSISTENCE_CURSOR_VERSION = 1;

const QUERY_INPUT_KEYS = new Set([
  "contracts", "recordIds", "persistenceIds", "entityRefs", "subjectRefs", "lifecycleStates",
  "verificationStates", "effectiveFrom", "effectiveTo", "persistedAfter", "persistedBefore",
  "reference", "includeHistorical", "limit", "cursor", "sortField", "sortDirection", "metadata",
  "extensions", "queryContract", "queryContractVersion", "querySchemaVersion", "validation",
]);
const LIST_INPUT_KEYS = new Set(["sortDirection", "limit", "cursor"]);
const PROHIBITED_OPTION_KEYS = new Set([
  "databaseclient", "supabaseclient", "sql", "credentials", "apikey", "connectionstring",
  "executablequery", "callbackpredicate", "hydrationfunction", "synchronizationfunction",
  "graphtraversalfunction", "enginefunction", "globalstorage", "repository", "storageclient",
]);

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function clone(value) {
  return value == null ? value : structuredClone(value);
}

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach((entry) => deepFreeze(entry, seen));
  return Object.freeze(value);
}

function normalizedKey(key) {
  return key.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
}

function safeOptionValue(value, warnings, path = "options") {
  if (typeof value === "function" || typeof value === "symbol" || typeof value === "bigint") {
    warnings.push({ code: "IGNORED_EXECUTABLE_OPTION", path, message: `${path} was ignored.` });
    return undefined;
  }
  if (value == null || typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) return value;
  if (Array.isArray(value)) return value.map((entry, index) => safeOptionValue(entry, warnings, `${path}[${index}]`)).filter((entry) => entry !== undefined);
  if (!isObject(value)) return undefined;
  return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => {
    if (PROHIBITED_OPTION_KEYS.has(normalizedKey(key))) {
      warnings.push({ code: "IGNORED_PROHIBITED_OPTION", path: `${path}.${key}`, message: `${key} was ignored.` });
      return [];
    }
    const normalized = safeOptionValue(entry, warnings, `${path}.${key}`);
    return normalized === undefined ? [] : [[key, normalized]];
  }));
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (isObject(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  return value;
}

function fingerprint(query) {
  const value = { ...query };
  delete value.cursor;
  delete value.limit;
  delete value.validation;
  delete value.metadata;
  return JSON.stringify(stableValue(value));
}

function encodeCursor(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function decodeCursor(value) {
  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (!isObject(parsed) || parsed.version !== IN_MEMORY_FID_PERSISTENCE_CURSOR_VERSION || typeof parsed.fingerprint !== "string" || typeof parsed.lastPersistenceId !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

function publicError(code, operation, message, details = {}) {
  return createFidPersistenceError({
    code,
    operation,
    message,
    retryable: false,
    publicDetails: { attributes: details },
  });
}

function success(operation, data) {
  return createFidRepositoryResult({ ok: true, operation, data: clone(data) });
}

function failure(operation, code, message, details = {}) {
  return createFidRepositoryResult({ ok: false, operation, error: publicError(code, operation, message, details) });
}

function envelopeErrorCode(envelope) {
  const codes = new Set(envelope.validation.errors.map((entry) => entry.code));
  if (codes.has("UNKNOWN_CONTRACT") || codes.has("UNRECOGNIZED_ENUM_VALUE")) return FID_PERSISTENCE_ERROR_CODES.UNKNOWN_CONTRACT;
  if (codes.has("CONTRACT_MISMATCH")) return FID_PERSISTENCE_ERROR_CODES.CONTRACT_MISMATCH;
  if (codes.has("CONTRACT_VERSION_MISMATCH")) return FID_PERSISTENCE_ERROR_CODES.CONTRACT_VERSION_MISMATCH;
  if (codes.has("SCHEMA_VERSION_MISMATCH")) return FID_PERSISTENCE_ERROR_CODES.SCHEMA_VERSION_MISMATCH;
  if (codes.has("INVALID_PAYLOAD")) return FID_PERSISTENCE_ERROR_CODES.INVALID_PAYLOAD;
  if (codes.has("INVALID_DATE_RANGE")) return FID_PERSISTENCE_ERROR_CODES.INVALID_DATE_RANGE;
  if (codes.has("INVALID_REPLACEMENT_REFERENCE")) return FID_PERSISTENCE_ERROR_CODES.INVALID_REPLACEMENT_REFERENCE;
  if (codes.has("INVALID_SUPERSESSION_REFERENCE")) return FID_PERSISTENCE_ERROR_CODES.INVALID_SUPERSESSION_REFERENCE;
  if (envelope.revision == null) return FID_PERSISTENCE_ERROR_CODES.INVALID_REVISION;
  return FID_PERSISTENCE_ERROR_CODES.INVALID_ENVELOPE;
}

function valueAtPath(value, path) {
  return path.split(".").reduce((current, key) => current?.[key], value);
}

function hasReference(envelope, reference) {
  return FID_PERSISTENCE_REFERENCE_QUERY_LOCATIONS.some((path) => {
    const value = valueAtPath(envelope, path);
    return Array.isArray(value) ? value.includes(reference) : value === reference;
  });
}

function includesFilter(filter, value) {
  return filter.length === 0 || filter.includes(value);
}

function dateAtLeast(value, boundary) {
  return boundary == null || (value != null && Date.parse(value) >= Date.parse(boundary));
}

function dateAtMost(value, boundary) {
  return boundary == null || (value != null && Date.parse(value) <= Date.parse(boundary));
}

function matchesQuery(envelope, query) {
  return includesFilter(query.contracts, envelope.contract)
    && includesFilter(query.recordIds, envelope.recordId)
    && includesFilter(query.persistenceIds, envelope.persistenceId)
    && includesFilter(query.entityRefs, envelope.entityRef)
    && includesFilter(query.subjectRefs, envelope.subjectRef)
    && includesFilter(query.lifecycleStates, envelope.lifecycleState)
    && includesFilter(query.verificationStates, envelope.verificationState)
    && dateAtLeast(envelope.effectiveFrom, query.effectiveFrom)
    && dateAtMost(envelope.effectiveTo, query.effectiveTo)
    && dateAtLeast(envelope.persistedAt, query.persistedAfter)
    && dateAtMost(envelope.persistedAt, query.persistedBefore)
    && (query.reference == null || hasReference(envelope, query.reference));
}

function comparable(value, field) {
  if (["persistedAt", "recordedAt", "effectiveFrom"].includes(field)) return value == null ? null : Date.parse(value);
  return value;
}

function compareValues(left, right) {
  if (left == null && right == null) return 0;
  if (left == null) return -1;
  if (right == null) return 1;
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left).localeCompare(String(right));
}

function compareEnvelopes(left, right, sortField, sortDirection) {
  const direction = sortDirection === FID_PERSISTENCE_SORT_DIRECTIONS.DESC ? -1 : 1;
  const primary = compareValues(comparable(left[sortField], sortField), comparable(right[sortField], sortField));
  if (primary !== 0) return primary * direction;
  const record = left.recordId.localeCompare(right.recordId);
  if (record !== 0) return record;
  const revision = left.revision - right.revision;
  if (revision !== 0) return revision;
  return left.persistenceId.localeCompare(right.persistenceId);
}

function latestFromCandidates(envelopes) {
  const latest = new Map();
  envelopes.forEach((envelope) => {
    const current = latest.get(envelope.recordId);
    if (!current || envelope.revision > current.revision) latest.set(envelope.recordId, envelope);
  });
  return [...latest.values()];
}

export function createInMemoryFidPersistenceRepository(options = {}) {
  const optionWarnings = [];
  const adapterMetadata = safeOptionValue(isObject(options) ? options : {}, optionWarnings) ?? {};
  const byPersistenceId = new Map();
  const byRecordId = new Map();
  const repositoryContract = deepFreeze(createFidPersistenceRepositoryContract({ adapterType: FID_PERSISTENCE_REPOSITORY_ADAPTER_TYPES.IN_MEMORY }));

  function createVersion(candidate) {
    const operation = "createVersion";
    const envelope = createFidPersistenceEnvelope(candidate);
    if (!envelope.validation.valid) return failure(operation, envelopeErrorCode(envelope), "Persistence envelope is invalid.", { validationErrors: envelope.validation.errors.map((entry) => entry.code) });
    if (byPersistenceId.has(envelope.persistenceId)) return failure(operation, FID_PERSISTENCE_ERROR_CODES.DUPLICATE_PERSISTENCE_ID, "persistenceId already exists.", { persistenceId: envelope.persistenceId });
    const versions = byRecordId.get(envelope.recordId) ?? [];
    if (versions.some((entry) => entry.revision === envelope.revision)) return failure(operation, FID_PERSISTENCE_ERROR_CODES.DUPLICATE_REVISION, "recordId and revision already exist.", { recordId: envelope.recordId, revision: envelope.revision });
    const expectedRevision = versions.length === 0 ? 1 : versions.at(-1).revision + 1;
    if (envelope.revision !== expectedRevision) return failure(operation, FID_PERSISTENCE_ERROR_CODES.INVALID_REVISION, "Revision must follow strict sequential append ordering.", { recordId: envelope.recordId, expectedRevision, suppliedRevision: envelope.revision });
    const stored = deepFreeze(clone(envelope));
    byPersistenceId.set(stored.persistenceId, stored);
    byRecordId.set(stored.recordId, [...versions, stored]);
    return success(operation, { envelope: clone(stored) });
  }

  function getByPersistenceId(persistenceId) {
    const operation = "getByPersistenceId";
    if (typeof persistenceId !== "string" || !persistenceId.trim() || !byPersistenceId.has(persistenceId)) return failure(operation, FID_PERSISTENCE_ERROR_CODES.VERSION_NOT_FOUND, "Stored persistence version was not found.", { persistenceId: typeof persistenceId === "string" ? persistenceId : null });
    return success(operation, { envelope: clone(byPersistenceId.get(persistenceId)) });
  }

  function getLatestByRecordId(recordId) {
    const operation = "getLatestByRecordId";
    const versions = typeof recordId === "string" ? byRecordId.get(recordId) : null;
    if (!versions?.length) return failure(operation, FID_PERSISTENCE_ERROR_CODES.RECORD_NOT_FOUND, "Logical persistence record was not found.", { recordId: typeof recordId === "string" ? recordId : null });
    return success(operation, { envelope: clone(versions.at(-1)), latestBy: "HIGHEST_STORED_REVISION" });
  }

  function queryRecords(input = {}) {
    const operation = "queryRecords";
    if (!isObject(input) || Object.keys(input).some((key) => !QUERY_INPUT_KEYS.has(key)) || Object.values(input).some((value) => typeof value === "function")) return failure(operation, FID_PERSISTENCE_ERROR_CODES.UNSUPPORTED_QUERY, "Query contains unsupported fields or executable values.");
    const query = createFidPersistenceQuery(input);
    if (!query.validation.valid) {
      const codes = new Set(query.validation.errors.map((entry) => entry.code));
      const code = codes.has("INVALID_DATE_RANGE") ? FID_PERSISTENCE_ERROR_CODES.INVALID_DATE_RANGE : codes.has("UNKNOWN_CONTRACT") ? FID_PERSISTENCE_ERROR_CODES.UNKNOWN_CONTRACT : FID_PERSISTENCE_ERROR_CODES.UNSUPPORTED_QUERY;
      return failure(operation, code, "Persistence query is invalid.", { validationErrors: [...codes] });
    }
    const includeHistorical = query.includeHistorical ?? true;
    const sortField = query.sortField ?? FID_PERSISTENCE_QUERY_SORT_FIELDS.REVISION;
    const sortDirection = query.sortDirection ?? FID_PERSISTENCE_SORT_DIRECTIONS.ASC;
    let matches = [...byPersistenceId.values()].filter((envelope) => matchesQuery(envelope, query));
    if (!includeHistorical) matches = latestFromCandidates(matches);
    matches.sort((left, right) => compareEnvelopes(left, right, sortField, sortDirection));
    const queryFingerprint = fingerprint({ ...query, includeHistorical, sortField, sortDirection });
    let startIndex = 0;
    if (query.cursor != null) {
      const cursor = decodeCursor(query.cursor);
      if (!cursor || cursor.fingerprint !== queryFingerprint) return failure(operation, FID_PERSISTENCE_ERROR_CODES.INVALID_CURSOR, "Cursor is malformed or does not match the query.");
      const cursorIndex = matches.findIndex((entry) => entry.persistenceId === cursor.lastPersistenceId);
      if (cursorIndex < 0) return failure(operation, FID_PERSISTENCE_ERROR_CODES.INVALID_CURSOR, "Cursor continuation record is unavailable.");
      startIndex = cursorIndex + 1;
    }
    const limit = query.limit ?? 100;
    const page = matches.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + page.length < matches.length;
    const nextCursor = hasMore && page.length ? encodeCursor({ version: IN_MEMORY_FID_PERSISTENCE_CURSOR_VERSION, fingerprint: queryFingerprint, lastPersistenceId: page.at(-1).persistenceId }) : null;
    return success(operation, { envelopes: clone(page), page: { limit, returned: page.length, hasMore, nextCursor }, ordering: { sortField, sortDirection, tieBreakers: ["recordId", "revision", "persistenceId"] }, includeHistorical });
  }

  function listVersions(recordId, optionsInput = {}) {
    const operation = "listVersions";
    if (!byRecordId.has(recordId)) return failure(operation, FID_PERSISTENCE_ERROR_CODES.RECORD_NOT_FOUND, "Logical persistence record was not found.", { recordId: typeof recordId === "string" ? recordId : null });
    if (!isObject(optionsInput) || Object.keys(optionsInput).some((key) => !LIST_INPUT_KEYS.has(key))) return failure(operation, FID_PERSISTENCE_ERROR_CODES.UNSUPPORTED_QUERY, "Version-list options are unsupported.");
    const queried = queryRecords({ recordIds: [recordId], includeHistorical: true, sortField: FID_PERSISTENCE_QUERY_SORT_FIELDS.REVISION, sortDirection: optionsInput.sortDirection ?? FID_PERSISTENCE_SORT_DIRECTIONS.ASC, limit: optionsInput.limit, cursor: optionsInput.cursor });
    if (!queried.ok) return { ...queried, operation };
    return success(operation, queried.data);
  }

  function recordExists(recordId) {
    return success("recordExists", { recordId: typeof recordId === "string" ? recordId : null, exists: typeof recordId === "string" && byRecordId.has(recordId) });
  }

  function persistenceIdExists(persistenceId) {
    return success("persistenceIdExists", { persistenceId: typeof persistenceId === "string" ? persistenceId : null, exists: typeof persistenceId === "string" && byPersistenceId.has(persistenceId) });
  }

  function healthCheck() {
    const versionCount = byPersistenceId.size;
    const indexedVersionCount = [...byRecordId.values()].reduce((sum, versions) => sum + versions.length, 0);
    const indexConsistent = versionCount === indexedVersionCount && [...byRecordId.values()].every((versions) => versions.every((entry, index) => entry.revision === index + 1 && byPersistenceId.get(entry.persistenceId) === entry));
    return success("healthCheck", { adapterType: FID_PERSISTENCE_REPOSITORY_ADAPTER_TYPES.IN_MEMORY, available: true, runtimeImplemented: true, durable: false, crossProcessConcurrencyGuaranteed: false, recordCount: byRecordId.size, versionCount, indexConsistent });
  }

  function clear() {
    const recordCount = byRecordId.size;
    const versionCount = byPersistenceId.size;
    byPersistenceId.clear();
    byRecordId.clear();
    return success("clear", { adapterSpecific: true, clearedRecordCount: recordCount, clearedVersionCount: versionCount });
  }

  return Object.freeze({
    repositoryContract: FID_PERSISTENCE_REPOSITORY_CONTRACT_NAME,
    repositoryContractVersion: FID_PERSISTENCE_REPOSITORY_CONTRACT_VERSION,
    repositorySchemaVersion: FID_PERSISTENCE_REPOSITORY_SCHEMA_VERSION,
    adapterName: IN_MEMORY_FID_PERSISTENCE_REPOSITORY_NAME,
    adapterVersion: IN_MEMORY_FID_PERSISTENCE_REPOSITORY_VERSION,
    adapterType: FID_PERSISTENCE_REPOSITORY_ADAPTER_TYPES.IN_MEMORY,
    adapterMetadata: deepFreeze(clone(adapterMetadata)),
    optionWarnings: deepFreeze(clone(optionWarnings)),
    contract: repositoryContract,
    createVersion,
    getByPersistenceId,
    getLatestByRecordId,
    listVersions,
    queryRecords,
    recordExists,
    persistenceIdExists,
    healthCheck,
    clear,
  });
}

export function isInMemoryFidPersistenceRepository(value) {
  return Boolean(isObject(value)
    && value.repositoryContract === FID_PERSISTENCE_REPOSITORY_CONTRACT_NAME
    && value.repositoryContractVersion === FID_PERSISTENCE_REPOSITORY_CONTRACT_VERSION
    && value.adapterName === IN_MEMORY_FID_PERSISTENCE_REPOSITORY_NAME
    && value.adapterType === FID_PERSISTENCE_REPOSITORY_ADAPTER_TYPES.IN_MEMORY
    && typeof value.createVersion === "function"
    && typeof value.clear === "function");
}

export default Object.freeze({
  IN_MEMORY_FID_PERSISTENCE_REPOSITORY_NAME,
  IN_MEMORY_FID_PERSISTENCE_REPOSITORY_VERSION,
  IN_MEMORY_FID_PERSISTENCE_CURSOR_VERSION,
  createInMemoryFidPersistenceRepository,
  isInMemoryFidPersistenceRepository,
});
