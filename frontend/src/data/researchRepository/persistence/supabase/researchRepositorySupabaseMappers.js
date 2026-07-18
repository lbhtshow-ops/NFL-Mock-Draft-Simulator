import {
  PERSISTENCE_OPERATION_STATUSES,
} from "../researchRepositoryPersistenceConstants.js";
import {
  createPersistenceResult,
  getRecordIdField,
} from "../ResearchRepositoryPersistenceContract.js";
import {
  SUPABASE_RESEARCH_ID_COLUMNS,
  SUPABASE_RESEARCH_REPOSITORY_ADAPTER_NAME,
  SUPABASE_RESEARCH_TABLES,
} from "./researchRepositorySupabaseConstants.js";

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function cloneSupabaseResearchValue(value) {
  if (Array.isArray(value)) return value.map(cloneSupabaseResearchValue);
  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, cloneSupabaseResearchValue(entry)])
    );
  }
  return value;
}

export function getSupabaseResearchTable(recordType) {
  return SUPABASE_RESEARCH_TABLES[recordType] ?? null;
}

export function getSupabaseResearchIdColumn(recordType) {
  return SUPABASE_RESEARCH_ID_COLUMNS[recordType] ?? null;
}

export function mapResearchRecordToSupabaseRow(recordType, record) {
  const idField = getRecordIdField(recordType);
  const idColumn = getSupabaseResearchIdColumn(recordType);
  if (!idField || !idColumn || !isObject(record)) return null;
  const canonicalId = typeof record[idField] === "string" ? record[idField].trim() : "";
  if (!canonicalId) return null;
  return {
    [idColumn]: canonicalId,
    contract_name: record.contract ?? null,
    contract_version: record.contractVersion ?? null,
    schema_version: record.schemaVersion ?? null,
    payload: cloneSupabaseResearchValue(record),
  };
}

export function mapSupabaseRowToResearchRecord(row) {
  return isObject(row?.payload) ? cloneSupabaseResearchValue(row.payload) : null;
}

export function mapSupabaseRowToStorageMetadata(row) {
  if (!isObject(row)) return null;
  return {
    recordVersion: row.record_version ?? null,
    isArchived: row.is_archived ?? null,
    isDeleted: row.is_deleted ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

function safeDetails(error) {
  if (!error) return null;
  const details = {};
  ["code", "details", "hint"].forEach((key) => {
    if (["string", "number", "boolean"].includes(typeof error[key])) details[key] = error[key];
  });
  return Object.keys(details).length ? details : null;
}

export function getSupabasePersistenceErrorStatus(error) {
  const code = String(error?.code || "").toUpperCase();
  const message = String(error?.message || "").toLowerCase();
  if (code === "23505" || message.includes("duplicate key")) return PERSISTENCE_OPERATION_STATUSES.CONFLICT;
  if (code === "PGRST116" || message.includes("no rows") || message.includes("not found")) return PERSISTENCE_OPERATION_STATUSES.NOT_FOUND;
  if (["42501", "PGRST301"].includes(code) || message.includes("permission denied") || message.includes("restricted")) return PERSISTENCE_OPERATION_STATUSES.RESTRICTED;
  if (["PGRST000", "PGRST001", "PGRST002"].includes(code) || message.includes("unavailable") || message.includes("network")) return PERSISTENCE_OPERATION_STATUSES.UNAVAILABLE;
  if (["22P02", "PGRST100"].includes(code) || message.includes("malformed")) return PERSISTENCE_OPERATION_STATUSES.INVALID_REQUEST;
  return PERSISTENCE_OPERATION_STATUSES.FAILED;
}

export function mapSupabaseResponseToPersistenceResult({
  request,
  response = null,
  status = null,
  record = null,
  records = null,
  page = null,
  metadata = null,
  conflict = null,
  failure = null,
  adapterName = SUPABASE_RESEARCH_REPOSITORY_ADAPTER_NAME,
} = {}) {
  const error = response?.error ?? null;
  const resolvedStatus = status ?? (error
    ? getSupabasePersistenceErrorStatus(error)
    : PERSISTENCE_OPERATION_STATUSES.SUCCESS);
  const row = response?.data && !Array.isArray(response.data) ? response.data : null;
  const rowList = Array.isArray(response?.data) ? response.data : null;
  const resolvedRecord = record ?? mapSupabaseRowToResearchRecord(row);
  const resolvedRecords = records ?? (rowList ? rowList.map(mapSupabaseRowToResearchRecord).filter(Boolean) : []);
  const storage = mapSupabaseRowToStorageMetadata(row);
  const result = createPersistenceResult({
    requestId: request?.requestId ?? null,
    operation: request?.operation ?? null,
    recordType: request?.recordType ?? null,
    recordId: request?.recordId ?? null,
    status: resolvedStatus,
    record: resolvedRecord,
    records: resolvedRecords,
    page: page ?? {
      count: resolvedRecords.length,
      total: Number.isInteger(response?.count) ? response.count : null,
      limit: request?.query?.limit ?? null,
      offset: request?.query?.offset ?? null,
      hasMore: Number.isInteger(response?.count) && Number.isInteger(request?.query?.limit)
        ? (request.query.offset ?? 0) + resolvedRecords.length < response.count
        : null,
    },
    conflict: conflict ?? (resolvedStatus === PERSISTENCE_OPERATION_STATUSES.CONFLICT ? {
      type: "STORAGE_CONFLICT",
      expectedVersion: request?.write?.expectedVersion ?? null,
      actualVersion: storage?.recordVersion ?? null,
      existingRecordRef: request?.recordId ?? null,
    } : null),
    failure: failure ?? (error ? {
      code: typeof error.code === "string" ? error.code : "SUPABASE_STORAGE_ERROR",
      message: typeof error.message === "string" ? error.message : "Supabase storage operation failed.",
      retryable: typeof error.retryable === "boolean" ? error.retryable : null,
      details: safeDetails(error),
    } : null),
    audit: {
      storageAdapter: adapterName,
      storageVersion: storage?.recordVersion ?? null,
    },
    metadata: {
      warnings: metadata?.warnings ?? [],
      tags: metadata?.tags ?? [],
      notes: metadata?.notes ?? null,
    },
  });
  if (metadata && Object.hasOwn(metadata, "exists")) {
    return { ...result, metadata: { ...result.metadata, exists: metadata.exists === true } };
  }
  if (storage) return { ...result, metadata: { ...result.metadata, storage } };
  return result;
}

export default Object.freeze({
  cloneSupabaseResearchValue,
  getSupabaseResearchTable,
  getSupabaseResearchIdColumn,
  mapResearchRecordToSupabaseRow,
  mapSupabaseRowToResearchRecord,
  mapSupabaseRowToStorageMetadata,
  getSupabasePersistenceErrorStatus,
  mapSupabaseResponseToPersistenceResult,
});
