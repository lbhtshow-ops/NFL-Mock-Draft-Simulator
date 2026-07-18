import {
  PERSISTENCE_DELETE_MODES,
  PERSISTENCE_LIFECYCLE_ACTIONS,
  PERSISTENCE_OPERATION_STATUSES,
  PERSISTENCE_OPERATION_TYPES,
} from "../researchRepositoryPersistenceConstants.js";
import {
  createPersistenceRequest,
  createPersistenceResult,
  getRecordContractValidator,
  validatePersistenceAdapter,
} from "../ResearchRepositoryPersistenceContract.js";
import {
  SUPABASE_RESEARCH_DEFAULT_SELECT_COLUMNS,
  SUPABASE_RESEARCH_REPOSITORY_ADAPTER_NAME,
  SUPABASE_RESEARCH_REPOSITORY_ADAPTER_VERSION,
} from "./researchRepositorySupabaseConstants.js";
import {
  getSupabaseResearchIdColumn,
  getSupabaseResearchTable,
  mapResearchRecordToSupabaseRow,
  mapSupabaseResponseToPersistenceResult,
} from "./researchRepositorySupabaseMappers.js";

const ADAPTERS = new WeakSet();
const SAFE_FIELD = /^[A-Za-z][A-Za-z0-9_.]*$/;
const COLUMN_FIELDS = Object.freeze({
  contract: "contract_name",
  contractVersion: "contract_version",
  schemaVersion: "schema_version",
  recordVersion: "record_version",
  isArchived: "is_archived",
  isDeleted: "is_deleted",
  createdAt: "created_at",
  updatedAt: "updated_at",
});

function validationResult() {
  return {
    valid: true,
    errors: [],
    warnings: [],
    checkedAt: null,
    adapterVersion: SUPABASE_RESEARCH_REPOSITORY_ADAPTER_VERSION,
  };
}

function addError(validation, code, path, message) {
  validation.errors.push({ code, path, message });
  validation.valid = false;
}

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function validateSupabaseResearchRepositoryConfiguration(input = {}) {
  const validation = validationResult();
  const config = isObject(input) ? input : {};
  if (!isObject(input)) addError(validation, "INVALID_CONFIGURATION", "", "Configuration must be an object.");
  if (!isObject(config.supabase)) {
    addError(validation, "SUPABASE_CLIENT_REQUIRED", "supabase", "A Supabase-compatible client is required.");
  } else if (typeof config.supabase.from !== "function") {
    addError(validation, "INVALID_SUPABASE_CLIENT", "supabase.from", "The Supabase client must expose from(table)." );
  }
  if (config.options != null && !isObject(config.options)) {
    addError(validation, "INVALID_OPTIONS", "options", "options must be an object or null.");
  }
  const options = isObject(config.options) ? config.options : {};
  ["allowSoftDelete", "allowArchive", "allowHardDelete"].forEach((field) => {
    if (options[field] != null && typeof options[field] !== "boolean") {
      addError(validation, "INVALID_CAPABILITY", `options.${field}`, `${field} must be a boolean or null.`);
    }
  });
  if (options.selectColumns != null &&
      (!Array.isArray(options.selectColumns) || options.selectColumns.some((entry) => typeof entry !== "string" || !entry.trim()))) {
    addError(validation, "INVALID_SELECT_COLUMNS", "options.selectColumns", "selectColumns must be an array of non-empty strings.");
  }
  return validation;
}

function failureResult(request, status, code, message, details = null, adapterName) {
  return createPersistenceResult({
    requestId: request?.requestId ?? null,
    operation: request?.operation ?? null,
    recordType: request?.recordType ?? null,
    recordId: request?.recordId ?? null,
    status,
    failure: { code, message, retryable: null, details },
    audit: { storageAdapter: adapterName },
  });
}

function invalidRequestResult(request, adapterName) {
  const recordFailure = request?.validation?.errors?.some(
    (error) => error.code === "RECORD_VALIDATION_FAILED"
  );
  return failureResult(
    request,
    recordFailure ? PERSISTENCE_OPERATION_STATUSES.VALIDATION_FAILED : PERSISTENCE_OPERATION_STATUSES.INVALID_REQUEST,
    recordFailure ? "RECORD_VALIDATION_FAILED" : "INVALID_PERSISTENCE_REQUEST",
    recordFailure ? "The approved record contract rejected the supplied record." : "The persistence request is invalid.",
    { validation: request?.validation ?? null },
    adapterName
  );
}

function selectColumns(idColumn, configured) {
  return [...new Set([idColumn, ...configured])].join(",");
}

function safeQueryField(field, idColumn) {
  if (field === idColumn) return idColumn;
  if (Object.hasOwn(COLUMN_FIELDS, field)) return COLUMN_FIELDS[field];
  if (!SAFE_FIELD.test(field)) return null;
  return `payload->>${field.split(".").join("->>")}`;
}

function validateQuery(request) {
  for (const filter of request.query.filters) {
    const operator = filter.operator?.toUpperCase();
    if (!["=", "EQ", "EQUALS", "IN", "INCLUDES"].includes(operator)) {
      return { code: "UNSUPPORTED_FILTER_OPERATOR", message: "Only exact equality and inclusion filters are supported." };
    }
    if (!SAFE_FIELD.test(filter.field || "")) {
      return { code: "INVALID_FILTER_FIELD", message: "Filter fields must be safe dot-delimited identifiers." };
    }
    if (["IN", "INCLUDES"].includes(operator) && filter.values.length === 0) {
      return { code: "FILTER_VALUES_REQUIRED", message: "Inclusion filters require values." };
    }
  }
  for (const sort of request.query.sort) {
    if (!SAFE_FIELD.test(sort.field || "")) {
      return { code: "INVALID_SORT_FIELD", message: "Sort fields must be safe dot-delimited identifiers." };
    }
  }
  return null;
}

function applyVisibility(query, request) {
  let result = query;
  if (request.query.includeDeleted !== true) result = result.eq("is_deleted", false);
  if (request.query.includeArchived === false) result = result.eq("is_archived", false);
  return result;
}

function applyListQuery(query, request, idColumn) {
  let result = applyVisibility(query, request);
  request.query.filters.forEach((filter) => {
    const field = safeQueryField(filter.field, idColumn);
    const operator = filter.operator.toUpperCase();
    result = ["IN", "INCLUDES"].includes(operator)
      ? result.in(field, filter.values)
      : result.eq(field, filter.value);
  });
  request.query.sort.forEach((sort) => {
    result = result.order(safeQueryField(sort.field, idColumn), { ascending: sort.direction === "ASC" });
  });
  if (request.query.offset != null && request.query.limit != null) {
    result = result.range(request.query.offset, request.query.offset + request.query.limit - 1);
  } else if (request.query.offset != null) {
    result = result.range(request.query.offset, request.query.offset + 999999);
  } else if (request.query.limit != null) {
    result = result.limit(request.query.limit);
  }
  return result;
}

export function createSupabaseResearchRepositoryAdapter({ supabase, options = {} } = {}) {
  const configuration = validateSupabaseResearchRepositoryConfiguration({ supabase, options });
  if (!configuration.valid) return null;
  const adapterName = typeof options.adapterName === "string" && options.adapterName.trim()
    ? options.adapterName.trim()
    : SUPABASE_RESEARCH_REPOSITORY_ADAPTER_NAME;
  const configuredColumns = options.selectColumns ?? SUPABASE_RESEARCH_DEFAULT_SELECT_COLUMNS;
  const capabilities = {
    allowSoftDelete: options.allowSoftDelete ?? true,
    allowArchive: options.allowArchive ?? true,
    allowHardDelete: options.allowHardDelete ?? false,
  };

  function prepare(input, expectedOperation) {
    const request = createPersistenceRequest(input);
    if (request.operation !== expectedOperation || !request.validation.valid) {
      return { request, failure: invalidRequestResult(request, adapterName) };
    }
    if (request.write.validateBeforeWrite === true && request.record) {
      const validator = getRecordContractValidator(request.recordType);
      const validation = validator?.(request.record);
      if (!validation?.valid) {
        return { request, failure: failureResult(request, PERSISTENCE_OPERATION_STATUSES.VALIDATION_FAILED,
          "RECORD_VALIDATION_FAILED", "The approved record contract rejected the supplied record.",
          { validation }, adapterName) };
      }
    }
    return { request, failure: null };
  }

  function storage(request) {
    const table = getSupabaseResearchTable(request.recordType);
    const idColumn = getSupabaseResearchIdColumn(request.recordType);
    return { table, idColumn, columns: selectColumns(idColumn, configuredColumns) };
  }

  async function safely(input, operation, execute) {
    const prepared = prepare(input, operation);
    if (prepared.failure) return prepared.failure;
    try {
      return await execute(prepared.request, storage(prepared.request));
    } catch (error) {
      return mapSupabaseResponseToPersistenceResult({
        request: prepared.request,
        response: { error: {
          code: typeof error?.code === "string" ? error.code : "UNEXPECTED_STORAGE_FAILURE",
          message: typeof error?.message === "string" ? error.message : "Unexpected storage failure.",
          retryable: null,
        } },
        adapterName,
      });
    }
  }

  const adapter = {
    create(input) {
      return safely(input, PERSISTENCE_OPERATION_TYPES.CREATE, async (request, target) => {
        const row = mapResearchRecordToSupabaseRow(request.recordType, request.record);
        const response = await supabase.from(target.table).insert(row).select(target.columns).single();
        return mapSupabaseResponseToPersistenceResult({ request, response, adapterName });
      });
    },
    read(input) {
      return safely(input, PERSISTENCE_OPERATION_TYPES.READ, async (request, target) => {
        let query = supabase.from(target.table).select(target.columns).eq(target.idColumn, request.recordId);
        query = applyVisibility(query, request);
        const response = await query.maybeSingle();
        if (!response.error && !response.data) {
          return failureResult(request, PERSISTENCE_OPERATION_STATUSES.NOT_FOUND, "RECORD_NOT_FOUND", "The requested record was not found.", null, adapterName);
        }
        return mapSupabaseResponseToPersistenceResult({ request, response, adapterName });
      });
    },
    update(input) {
      return safely(input, PERSISTENCE_OPERATION_TYPES.UPDATE, async (request, target) => {
        const existingResponse = await supabase.from(target.table)
          .select(target.columns).eq(target.idColumn, request.recordId).maybeSingle();
        if (existingResponse.error) return mapSupabaseResponseToPersistenceResult({ request, response: existingResponse, adapterName });
        if (!existingResponse.data) return failureResult(request, PERSISTENCE_OPERATION_STATUSES.NOT_FOUND, "RECORD_NOT_FOUND", "The record to update was not found.", null, adapterName);
        const actualVersion = existingResponse.data.record_version ?? null;
        if (request.write.expectedVersion != null && request.write.expectedVersion !== actualVersion) {
          return createPersistenceResult({
            requestId: request.requestId, operation: request.operation, recordType: request.recordType,
            recordId: request.recordId, status: PERSISTENCE_OPERATION_STATUSES.CONFLICT,
            conflict: { type: "VERSION_MISMATCH", expectedVersion: request.write.expectedVersion, actualVersion, existingRecordRef: request.recordId },
            audit: { storageAdapter: adapterName, storageVersion: actualVersion },
          });
        }
        const row = mapResearchRecordToSupabaseRow(request.recordType, request.record);
        row.record_version = Number.isInteger(actualVersion) ? actualVersion + 1 : 1;
        let query = supabase.from(target.table).update(row).eq(target.idColumn, request.recordId);
        if (actualVersion != null) query = query.eq("record_version", actualVersion);
        const response = await query.select(target.columns).maybeSingle();
        if (!response.error && !response.data) {
          return createPersistenceResult({
            requestId: request.requestId, operation: request.operation, recordType: request.recordType,
            recordId: request.recordId, status: PERSISTENCE_OPERATION_STATUSES.CONFLICT,
            conflict: { type: "CONCURRENT_UPDATE", expectedVersion: actualVersion, existingRecordRef: request.recordId },
            audit: { storageAdapter: adapterName },
          });
        }
        return mapSupabaseResponseToPersistenceResult({ request, response, adapterName });
      });
    },
    upsert(input) {
      return safely(input, PERSISTENCE_OPERATION_TYPES.UPSERT, async (request, target) => {
        const row = mapResearchRecordToSupabaseRow(request.recordType, request.record);
        const response = await supabase.from(target.table).upsert(row, { onConflict: target.idColumn })
          .select(target.columns).single();
        return mapSupabaseResponseToPersistenceResult({ request, response, adapterName });
      });
    },
    list(input) {
      return safely(input, PERSISTENCE_OPERATION_TYPES.LIST, async (request, target) => {
        const invalidQuery = validateQuery(request);
        if (invalidQuery) return failureResult(request, PERSISTENCE_OPERATION_STATUSES.INVALID_REQUEST, invalidQuery.code, invalidQuery.message, null, adapterName);
        let query = supabase.from(target.table).select(target.columns, { count: "exact" });
        query = applyListQuery(query, request, target.idColumn);
        const response = await query;
        return mapSupabaseResponseToPersistenceResult({ request, response, adapterName });
      });
    },
    exists(input) {
      return safely(input, PERSISTENCE_OPERATION_TYPES.EXISTS, async (request, target) => {
        let query = supabase.from(target.table).select(target.idColumn).eq(target.idColumn, request.recordId);
        query = applyVisibility(query, request);
        const response = await query.maybeSingle();
        if (response.error) return mapSupabaseResponseToPersistenceResult({ request, response, adapterName });
        return mapSupabaseResponseToPersistenceResult({
          request, response: { data: null, error: null },
          status: PERSISTENCE_OPERATION_STATUSES.SUCCESS,
          metadata: { exists: Boolean(response.data) }, adapterName,
        });
      });
    },
    archive(input) {
      return safely(input, PERSISTENCE_OPERATION_TYPES.ARCHIVE, async (request, target) => {
        if (!capabilities.allowArchive) return failureResult(request, PERSISTENCE_OPERATION_STATUSES.RESTRICTED, "ARCHIVE_RESTRICTED", "Archive capability is disabled.", null, adapterName);
        if (request.lifecycle.action !== PERSISTENCE_LIFECYCLE_ACTIONS.ARCHIVE) return invalidRequestResult(request, adapterName);
        const response = await supabase.from(target.table).update({ is_archived: true })
          .eq(target.idColumn, request.recordId).select(target.columns).maybeSingle();
        if (!response.error && !response.data) return failureResult(request, PERSISTENCE_OPERATION_STATUSES.NOT_FOUND, "RECORD_NOT_FOUND", "The record to archive was not found.", null, adapterName);
        return mapSupabaseResponseToPersistenceResult({ request, response, adapterName });
      });
    },
    delete(input) {
      return safely(input, PERSISTENCE_OPERATION_TYPES.DELETE, async (request, target) => {
        const mode = request.lifecycle.deleteMode;
        if (request.lifecycle.action !== PERSISTENCE_LIFECYCLE_ACTIONS.DELETE || !mode) return invalidRequestResult(request, adapterName);
        if (mode === PERSISTENCE_DELETE_MODES.HARD_DELETE) {
          if (!capabilities.allowHardDelete) return failureResult(request, PERSISTENCE_OPERATION_STATUSES.RESTRICTED, "HARD_DELETE_RESTRICTED", "Hard delete capability is disabled.", null, adapterName);
          const response = await supabase.from(target.table).delete().eq(target.idColumn, request.recordId)
            .select(target.columns).maybeSingle();
          if (!response.error && !response.data) return failureResult(request, PERSISTENCE_OPERATION_STATUSES.NOT_FOUND, "RECORD_NOT_FOUND", "The record to delete was not found.", null, adapterName);
          return mapSupabaseResponseToPersistenceResult({ request, response, adapterName });
        }
        if (!capabilities.allowSoftDelete) return failureResult(request, PERSISTENCE_OPERATION_STATUSES.RESTRICTED, "SOFT_DELETE_RESTRICTED", "Soft delete capability is disabled.", null, adapterName);
        const response = await supabase.from(target.table).update({ is_deleted: true })
          .eq(target.idColumn, request.recordId).select(target.columns).maybeSingle();
        if (!response.error && !response.data) return failureResult(request, PERSISTENCE_OPERATION_STATUSES.NOT_FOUND, "RECORD_NOT_FOUND", "The record to delete was not found.", null, adapterName);
        return mapSupabaseResponseToPersistenceResult({ request, response, adapterName });
      });
    },
  };
  const frozen = Object.freeze(adapter);
  ADAPTERS.add(frozen);
  return frozen;
}

export function isSupabaseResearchRepositoryAdapter(value) {
  return Boolean(ADAPTERS.has(value) && validatePersistenceAdapter(value).valid);
}

export default Object.freeze({
  createSupabaseResearchRepositoryAdapter,
  validateSupabaseResearchRepositoryConfiguration,
  isSupabaseResearchRepositoryAdapter,
});
