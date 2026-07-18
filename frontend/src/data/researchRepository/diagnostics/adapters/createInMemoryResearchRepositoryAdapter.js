import {
  PERSISTENCE_DELETE_MODES,
  PERSISTENCE_OPERATION_STATUSES,
  PERSISTENCE_OPERATION_TYPES,
  PERSISTENCE_RECORD_TYPES,
  PERSISTENCE_SORT_DIRECTIONS,
  createPersistenceRequest,
  createPersistenceResult,
} from "../../persistence/index.js";

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
  return value;
}

function fieldValue(record, field) {
  return field.split(".").reduce(
    (value, key) => value && typeof value === "object" ? value[key] : undefined,
    record
  );
}

function matchesFilters(record, filters) {
  return filters.every((filter) => {
    if (!["=", "EQ", "EQUALS"].includes(filter.operator.toUpperCase())) return false;
    const actual = fieldValue(record, filter.field);
    if (filter.values.length > 0) return filter.values.some((value) => Object.is(actual, value));
    return Object.is(actual, filter.value);
  });
}

function compareValues(left, right) {
  if (Object.is(left, right)) return 0;
  if (left == null) return -1;
  if (right == null) return 1;
  return left < right ? -1 : 1;
}

export function createInMemoryResearchRepositoryAdapter() {
  const stores = new Map(
    Object.values(PERSISTENCE_RECORD_TYPES).map((recordType) => [recordType, new Map()])
  );

  function result(request, status, extra = {}) {
    return createPersistenceResult({
      requestId: request.requestId,
      operation: request.operation,
      recordType: request.recordType,
      recordId: request.recordId,
      status,
      audit: {
        actorRef: request.actor.actorRef,
        storageAdapter: "IN_MEMORY_RESEARCH_REPOSITORY_DIAGNOSTIC",
        correlationId: request.context.correlationId,
      },
      ...extra,
    });
  }

  function normalizedRequest(input) {
    return createPersistenceRequest(input);
  }

  function invalidRequest(request) {
    const recordFailure = request.validation.errors.some(
      (entry) => entry.code === "RECORD_VALIDATION_FAILED" || entry.code.startsWith("RECORD_")
    );
    return result(
      request,
      recordFailure
        ? PERSISTENCE_OPERATION_STATUSES.VALIDATION_FAILED
        : PERSISTENCE_OPERATION_STATUSES.INVALID_REQUEST,
      {
        failure: {
          code: recordFailure ? "RECORD_VALIDATION_FAILED" : "INVALID_REQUEST",
          message: "The persistence request is invalid.",
          retryable: false,
          details: cloneValue(request.validation.errors),
        },
      }
    );
  }

  function storeFor(recordType) {
    return stores.get(recordType);
  }

  function activeEntry(request) {
    const entry = storeFor(request.recordType)?.get(request.recordId);
    return entry && !entry.deleted ? entry : null;
  }

  const adapter = {
    create(input) {
      const request = normalizedRequest(input);
      if (!request.validation.valid) return invalidRequest(request);
      const store = storeFor(request.recordType);
      if (store.has(request.recordId) && !store.get(request.recordId).deleted) {
        return result(request, PERSISTENCE_OPERATION_STATUSES.CONFLICT, {
          conflict: { type: "RECORD_EXISTS", existingRecordRef: request.recordId },
        });
      }
      const stored = cloneValue(request.record);
      store.set(request.recordId, { record: stored, archived: false, deleted: false });
      return result(request, PERSISTENCE_OPERATION_STATUSES.SUCCESS, { record: cloneValue(stored) });
    },

    read(input) {
      const request = normalizedRequest(input);
      if (!request.validation.valid) return invalidRequest(request);
      const entry = activeEntry(request);
      return entry
        ? result(request, PERSISTENCE_OPERATION_STATUSES.SUCCESS, { record: cloneValue(entry.record) })
        : result(request, PERSISTENCE_OPERATION_STATUSES.NOT_FOUND);
    },

    update(input) {
      const request = normalizedRequest(input);
      if (!request.validation.valid) return invalidRequest(request);
      const entry = activeEntry(request);
      if (!entry) return result(request, PERSISTENCE_OPERATION_STATUSES.NOT_FOUND);
      entry.record = cloneValue(request.record);
      return result(request, PERSISTENCE_OPERATION_STATUSES.SUCCESS, { record: cloneValue(entry.record) });
    },

    upsert(input) {
      const request = normalizedRequest(input);
      if (!request.validation.valid) return invalidRequest(request);
      const store = storeFor(request.recordType);
      const stored = cloneValue(request.record);
      store.set(request.recordId, { record: stored, archived: false, deleted: false });
      return result(request, PERSISTENCE_OPERATION_STATUSES.SUCCESS, { record: cloneValue(stored) });
    },

    list(input) {
      const request = normalizedRequest(input);
      if (!request.validation.valid) return invalidRequest(request);
      let entries = [...storeFor(request.recordType).values()].filter(
        (entry) => (request.query.includeDeleted === true || !entry.deleted) &&
          (request.query.includeArchived === true || !entry.archived)
      );
      entries = entries.filter((entry) => matchesFilters(entry.record, request.query.filters));
      if (request.query.sort.length > 0) {
        entries.sort((left, right) => {
          for (const sort of request.query.sort) {
            const comparison = compareValues(
              fieldValue(left.record, sort.field),
              fieldValue(right.record, sort.field)
            );
            if (comparison !== 0) {
              return sort.direction === PERSISTENCE_SORT_DIRECTIONS.DESC
                ? -comparison
                : comparison;
            }
          }
          return 0;
        });
      }
      const total = entries.length;
      const offset = request.query.offset ?? 0;
      const end = request.query.limit == null ? undefined : offset + request.query.limit;
      const records = entries.slice(offset, end).map((entry) => cloneValue(entry.record));
      return result(request, PERSISTENCE_OPERATION_STATUSES.SUCCESS, {
        records,
        page: {
          count: records.length,
          total,
          limit: request.query.limit,
          offset: request.query.offset,
          hasMore: end !== undefined ? end < total : false,
        },
      });
    },

    exists(input) {
      const request = normalizedRequest(input);
      if (!request.validation.valid) return invalidRequest(request);
      const entry = activeEntry(request);
      return entry
        ? result(request, PERSISTENCE_OPERATION_STATUSES.SUCCESS, { record: cloneValue(entry.record) })
        : result(request, PERSISTENCE_OPERATION_STATUSES.NOT_FOUND);
    },

    archive(input) {
      const request = normalizedRequest(input);
      if (!request.validation.valid) return invalidRequest(request);
      const entry = activeEntry(request);
      if (!entry) return result(request, PERSISTENCE_OPERATION_STATUSES.NOT_FOUND);
      entry.archived = true;
      return result(request, PERSISTENCE_OPERATION_STATUSES.SUCCESS, { record: cloneValue(entry.record) });
    },

    delete(input) {
      const request = normalizedRequest(input);
      if (!request.validation.valid) return invalidRequest(request);
      if (request.lifecycle.deleteMode === PERSISTENCE_DELETE_MODES.HARD_DELETE) {
        return result(request, PERSISTENCE_OPERATION_STATUSES.RESTRICTED, {
          failure: {
            code: "HARD_DELETE_RESTRICTED",
            message: "Hard delete is restricted by declared persistence policy.",
            retryable: false,
          },
        });
      }
      const entry = activeEntry(request);
      if (!entry) return result(request, PERSISTENCE_OPERATION_STATUSES.NOT_FOUND);
      entry.deleted = true;
      return result(request, PERSISTENCE_OPERATION_STATUSES.SUCCESS, { record: cloneValue(entry.record) });
    },
  };

  return Object.freeze(adapter);
}

export default Object.freeze({ createInMemoryResearchRepositoryAdapter });
