const MOCK_TIMESTAMP = "2026-07-14T00:00:00.000Z";

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, clone(entry)]));
  return value;
}

function valueAt(row, field) {
  if (field.startsWith("payload->>")) {
    return field.slice("payload->>".length).split("->>").reduce((value, key) => value?.[key], row.payload);
  }
  return row[field];
}

class MockSupabaseQuery {
  constructor(client, table) {
    this.client = client;
    this.table = table;
    this.operation = "select";
    this.payload = null;
    this.filters = [];
    this.orders = [];
    this.start = null;
    this.end = null;
    this.maximum = null;
    this.countRequested = false;
    this.returning = false;
  }

  insert(value) { this.operation = "insert"; this.payload = clone(value); return this; }
  update(value) { this.operation = "update"; this.payload = clone(value); return this; }
  upsert(value, options = {}) { this.operation = "upsert"; this.payload = clone(value); this.upsertOptions = clone(options); return this; }
  delete() { this.operation = "delete"; return this; }
  select(_columns, options = {}) { this.returning = true; this.countRequested = options.count === "exact"; return this; }
  eq(field, value) { this.filters.push({ type: "eq", field, value: clone(value) }); return this; }
  in(field, values) { this.filters.push({ type: "in", field, values: clone(values) }); return this; }
  order(field, options = {}) { this.orders.push({ field, ascending: options.ascending !== false }); return this; }
  range(start, end) { this.start = start; this.end = end; return this; }
  limit(value) { this.maximum = value; return this; }

  matching(rows) {
    let result = rows.filter((row) => this.filters.every((filter) => {
      const value = valueAt(row, filter.field);
      return filter.type === "in" ? filter.values.includes(value) : value === filter.value;
    }));
    this.orders.slice().reverse().forEach((order) => {
      result.sort((left, right) => {
        const a = valueAt(left, order.field);
        const b = valueAt(right, order.field);
        const comparison = a === b ? 0 : a == null ? 1 : b == null ? -1 : a < b ? -1 : 1;
        return order.ascending ? comparison : -comparison;
      });
    });
    return result;
  }

  async execute(mode = "many") {
    const injected = this.client.takeError(this.table, this.operation);
    if (injected) return { data: null, error: clone(injected), count: null };
    const store = this.client.getTable(this.table);
    let rows = [...store.values()];
    let affected = [];
    if (this.operation === "insert") {
      const row = this.client.normalizeStoredRow(this.payload);
      const id = this.client.canonicalId(this.table, row);
      if (store.has(id)) return { data: null, error: { code: "23505", message: "duplicate key value violates unique constraint" }, count: null };
      store.set(id, clone(row));
      affected = [row];
    } else if (this.operation === "upsert") {
      const incoming = this.payload;
      const id = this.client.canonicalId(this.table, incoming);
      const existing = store.get(id);
      const row = this.client.normalizeStoredRow({ ...existing, ...incoming }, existing);
      store.set(id, clone(row));
      affected = [row];
    } else if (this.operation === "update") {
      const matches = this.matching(rows);
      affected = matches.map((row) => {
        const id = this.client.canonicalId(this.table, row);
        const updated = this.client.normalizeStoredRow({ ...row, ...this.payload }, row);
        store.set(id, clone(updated));
        return updated;
      });
    } else if (this.operation === "delete") {
      affected = this.matching(rows);
      affected.forEach((row) => store.delete(this.client.canonicalId(this.table, row)));
    } else {
      affected = this.matching(rows);
    }
    const count = affected.length;
    if (this.start != null) affected = affected.slice(this.start, this.end == null ? undefined : this.end + 1);
    if (this.maximum != null) affected = affected.slice(0, this.maximum);
    const output = affected.map(clone);
    if (mode === "single") {
      if (output.length !== 1) return { data: null, error: { code: "PGRST116", message: "Expected one row." }, count: this.countRequested ? count : null };
      return { data: output[0], error: null, count: this.countRequested ? count : null };
    }
    if (mode === "maybeSingle") {
      if (output.length > 1) return { data: null, error: { code: "PGRST116", message: "Expected zero or one row." }, count: this.countRequested ? count : null };
      return { data: output[0] ?? null, error: null, count: this.countRequested ? count : null };
    }
    return { data: output, error: null, count: this.countRequested ? count : null };
  }

  single() { return this.execute("single"); }
  maybeSingle() { return this.execute("maybeSingle"); }
  then(resolve, reject) { return this.execute("many").then(resolve, reject); }
}

export function createMockSupabaseResearchClient({ errors = [] } = {}) {
  const tables = new Map();
  const queuedErrors = errors.map(clone);
  const idColumns = {
    research_sources: "source_id",
    research_sessions: "session_id",
    recorded_observations: "observation_id",
    analytical_observations: "analysis_id",
    evidence_artifacts: "evidence_id",
  };
  const client = {
    from(table) { return new MockSupabaseQuery(client, table); },
    getTable(table) {
      if (!tables.has(table)) tables.set(table, new Map());
      return tables.get(table);
    },
    canonicalId(table, row) { return row?.[idColumns[table]] ?? null; },
    normalizeStoredRow(row, existing = null) {
      return {
        ...clone(row),
        record_version: row.record_version ?? existing?.record_version ?? 1,
        is_archived: row.is_archived ?? existing?.is_archived ?? false,
        is_deleted: row.is_deleted ?? existing?.is_deleted ?? false,
        created_at: existing?.created_at ?? row.created_at ?? MOCK_TIMESTAMP,
        updated_at: row.updated_at ?? MOCK_TIMESTAMP,
      };
    },
    takeError(table, operation) {
      const index = queuedErrors.findIndex((entry) =>
        (entry.table == null || entry.table === table) && (entry.operation == null || entry.operation === operation));
      return index < 0 ? null : queuedErrors.splice(index, 1)[0].error;
    },
    injectError(error) { queuedErrors.push(clone(error)); },
    inspectTable(table) { return [...client.getTable(table).values()].map(clone); },
  };
  return Object.freeze(client);
}

export default Object.freeze({ createMockSupabaseResearchClient });
