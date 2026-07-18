import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import researchRepository, * as namedRepository from "../index.js";
import supabaseApi from "../persistence/supabase/index.js";
import { createMockSupabaseResearchClient } from "./adapters/createMockSupabaseResearchClient.js";
import { runResearchSourceContractDiagnostics } from "./runResearchSourceContractDiagnostics.js";
import { runResearchSessionContractDiagnostics } from "./runResearchSessionContractDiagnostics.js";
import { runRecordedObservationContractDiagnostics } from "./runRecordedObservationContractDiagnostics.js";
import { runAnalyticalObservationContractDiagnostics } from "./runAnalyticalObservationContractDiagnostics.js";
import { runEvidenceArtifactContractDiagnostics } from "./runEvidenceArtifactContractDiagnostics.js";
import { runResearchRepositoryFoundationDiagnostics } from "./runResearchRepositoryFoundationDiagnostics.js";
import { runResearchRepositoryPersistenceDiagnostics } from "./runResearchRepositoryPersistenceDiagnostics.js";

const SUITE = "SupabaseResearchRepositoryAdapterDiagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATION_PATH = resolve(ROOT, "../../../supabase/migrations/20260714_create_research_repository_tables.sql");
const SUPABASE_EXPORTS = Object.freeze([
  "SUPABASE_RESEARCH_REPOSITORY_ADAPTER_NAME", "SUPABASE_RESEARCH_REPOSITORY_ADAPTER_VERSION",
  "SUPABASE_RESEARCH_TABLES", "SUPABASE_RESEARCH_ID_COLUMNS", "SUPABASE_RESEARCH_SUPPORTED_OPERATIONS",
  "SUPABASE_RESEARCH_RESTRICTED_OPERATIONS", "SUPABASE_RESEARCH_DEFAULT_SELECT_COLUMNS",
  "cloneSupabaseResearchValue", "getSupabaseResearchTable", "getSupabaseResearchIdColumn",
  "mapResearchRecordToSupabaseRow", "mapSupabaseRowToResearchRecord", "mapSupabaseRowToStorageMetadata",
  "getSupabasePersistenceErrorStatus", "mapSupabaseResponseToPersistenceResult",
  "createSupabaseResearchRepositoryAdapter", "validateSupabaseResearchRepositoryConfiguration",
  "isSupabaseResearchRepositoryAdapter",
]);

function assert(condition, message, details = null) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

function clone(value) {
  return structuredClone(value);
}

function request(operation, recordType, overrides = {}) {
  return { requestId: `supabase-${operation.toLowerCase()}`, operation, recordType, ...overrides };
}

function createRequest(recordType, record, overrides = {}) {
  return request(researchRepository.PERSISTENCE_OPERATION_TYPES.CREATE, recordType, {
    record,
    write: { mode: researchRepository.PERSISTENCE_WRITE_MODES.CREATE_ONLY, validateBeforeWrite: true },
    ...overrides,
  });
}

function updateRequest(recordType, recordId, record, overrides = {}) {
  return request(researchRepository.PERSISTENCE_OPERATION_TYPES.UPDATE, recordType, {
    recordId, record,
    write: { mode: researchRepository.PERSISTENCE_WRITE_MODES.UPDATE_ONLY, validateBeforeWrite: true },
    ...overrides,
  });
}

function records() {
  const source = researchRepository.createResearchSource({
    sourceId: "supabase-source", name: "Supabase Source",
    sourceClass: researchRepository.RESEARCH_SOURCE_CLASSES.OFFICIAL,
    status: researchRepository.RESEARCH_SOURCE_STATUSES.CANDIDATE,
    access: { type: researchRepository.RESEARCH_SOURCE_ACCESS_TYPES.PUBLIC },
  });
  const session = researchRepository.createResearchSession({
    sessionId: "supabase-session", title: "Supabase Session",
    sessionType: researchRepository.RESEARCH_SESSION_TYPES.OTHER,
    status: researchRepository.RESEARCH_SESSION_STATUSES.PLANNED,
    sourceRefs: [source.sourceId], scope: { state: researchRepository.RESEARCH_SESSION_SCOPE_STATES.UNDEFINED },
    verification: { state: researchRepository.RESEARCH_SESSION_VERIFICATION_STATES.NOT_STARTED },
    review: { required: false },
  });
  const recorded = researchRepository.createRecordedObservation({
    observationId: "supabase-recorded", sessionRef: session.sessionId, sourceRefs: [source.sourceId],
    observationType: researchRepository.RECORDED_OBSERVATION_TYPES.OTHER,
    origin: researchRepository.RECORDED_OBSERVATION_ORIGINS.RESEARCHER_RECORDED,
    description: "A record was documented.",
    temporal: { type: researchRepository.RECORDED_OBSERVATION_TEMPORAL_TYPES.TIME_UNKNOWN },
    spatial: { type: researchRepository.RECORDED_OBSERVATION_SPATIAL_TYPES.NOT_APPLICABLE },
    verification: { state: researchRepository.RECORDED_OBSERVATION_VERIFICATION_STATES.UNVERIFIED },
    provenance: { recordedBy: "supabase-researcher" },
  });
  const analytical = researchRepository.createAnalyticalObservation({
    analysisId: "supabase-analysis", recordedObservationRefs: [recorded.observationId],
    analysisType: researchRepository.ANALYTICAL_OBSERVATION_TYPES.OTHER,
    scope: researchRepository.ANALYTICAL_OBSERVATION_SCOPES.SINGLE_OBSERVATION,
    statement: { text: "The record supports an interpretation." },
    evaluator: { evaluatorRef: "supabase-evaluator" },
    confidence: { level: researchRepository.ANALYTICAL_CONFIDENCE_LEVELS.UNSPECIFIED },
    verification: { state: researchRepository.ANALYTICAL_VERIFICATION_STATES.UNVERIFIED },
    review: { required: false },
  });
  const evidence = researchRepository.createEvidenceArtifact({
    evidenceId: "supabase-evidence", analyticalObservationRefs: [analytical.analysisId],
    state: researchRepository.EVIDENCE_ARTIFACT_STATES.DRAFT,
    summary: "The analysis supports an artifact.",
    classification: {
      role: researchRepository.EVIDENCE_ROLES.OTHER,
      direction: researchRepository.EVIDENCE_DIRECTIONS.NEUTRAL,
      strength: researchRepository.EVIDENCE_STRENGTHS.UNSPECIFIED,
      applicability: researchRepository.EVIDENCE_APPLICABILITY_STATES.UNKNOWN,
    },
    conflicts: { state: researchRepository.EVIDENCE_CONFLICT_STATES.NONE },
    verification: { state: researchRepository.EVIDENCE_VERIFICATION_STATES.UNVERIFIED },
    review: { required: false },
  });
  return {
    [researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE]: source,
    [researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SESSION]: session,
    [researchRepository.PERSISTENCE_RECORD_TYPES.RECORDED_OBSERVATION]: recorded,
    [researchRepository.PERSISTENCE_RECORD_TYPES.ANALYTICAL_OBSERVATION]: analytical,
    [researchRepository.PERSISTENCE_RECORD_TYPES.EVIDENCE_ARTIFACT]: evidence,
  };
}

function canonicalId(type, record) {
  return record[researchRepository.getRecordIdField(type)];
}

function setup(options = {}) {
  const client = createMockSupabaseResearchClient();
  const adapter = researchRepository.createSupabaseResearchRepositoryAdapter({ supabase: client, options });
  return { client, adapter };
}

async function seedSources(names = ["Charlie", "Alpha", "Bravo"]) {
  const state = setup();
  for (let index = 0; index < names.length; index += 1) {
    const record = researchRepository.createResearchSource({
      sourceId: `list-source-${index + 1}`, name: names[index],
      sourceClass: researchRepository.RESEARCH_SOURCE_CLASSES.OFFICIAL,
      status: researchRepository.RESEARCH_SOURCE_STATUSES.CANDIDATE,
      access: { type: researchRepository.RESEARCH_SOURCE_ACCESS_TYPES.PUBLIC },
      domains: [index % 2 === 0 ? "domain-a" : "domain-b"],
    });
    await state.adapter.create(createRequest(researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, record));
  }
  return state;
}

function existingSummaries() {
  return {
    researchSource: runResearchSourceContractDiagnostics(),
    researchSession: runResearchSessionContractDiagnostics(),
    recordedObservation: runRecordedObservationContractDiagnostics(),
    analyticalObservation: runAnalyticalObservationContractDiagnostics(),
    evidenceArtifact: runEvidenceArtifactContractDiagnostics(),
    foundation: runResearchRepositoryFoundationDiagnostics(),
    persistence: runResearchRepositoryPersistenceDiagnostics(),
  };
}

function productionFiles() {
  const supabaseRoot = resolve(ROOT, "persistence/supabase");
  return [resolve(ROOT, "index.js"), resolve(ROOT, "persistence/index.js"),
    ...readdirSync(supabaseRoot).filter((name) => name.endsWith(".js")).map((name) => resolve(supabaseRoot, name))];
}

function imports(source) {
  return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);
}

function graph(files) {
  const nodes = new Set(files);
  return Object.fromEntries(files.map((file) => [file,
    imports(readFileSync(file, "utf8")).filter((entry) => entry.startsWith("."))
      .map((entry) => resolve(dirname(file), entry)).filter((entry) => nodes.has(entry))]));
}

function hasCycle(value) {
  const visiting = new Set();
  const visited = new Set();
  function visit(node) {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    if ((value[node] || []).some(visit)) return true;
    visiting.delete(node);
    visited.add(node);
    return false;
  }
  return Object.keys(value).some(visit);
}

const CASES = [
  ["valid-adapter-configuration", () => assert(researchRepository.validateSupabaseResearchRepositoryConfiguration({ supabase: createMockSupabaseResearchClient() }).valid, "Valid configuration rejected.")],
  ["missing-supabase-client", () => assert(!researchRepository.validateSupabaseResearchRepositoryConfiguration({}).valid, "Missing client accepted.")],
  ["structurally-invalid-client", () => assert(!researchRepository.validateSupabaseResearchRepositoryConfiguration({ supabase: {} }).valid, "Invalid client accepted.")],
  ["generic-adapter-validation", () => assert(researchRepository.validatePersistenceAdapter(setup().adapter).valid, "Generic adapter validation failed.")],
  ["adapter-type-guard", () => assert(researchRepository.isSupabaseResearchRepositoryAdapter(setup().adapter) && !researchRepository.isSupabaseResearchRepositoryAdapter({}), "Adapter guard failed.")],
  ["five-table-mappings", () => assert(Object.keys(researchRepository.SUPABASE_RESEARCH_TABLES).length === 5 && new Set(Object.values(researchRepository.SUPABASE_RESEARCH_TABLES)).size === 5, "Table mappings incomplete.")],
  ["five-id-column-mappings", () => assert(Object.keys(researchRepository.SUPABASE_RESEARCH_ID_COLUMNS).length === 5 && new Set(Object.values(researchRepository.SUPABASE_RESEARCH_ID_COLUMNS)).size === 5, "ID mappings incomplete.")],
  ["unknown-record-type-mapping", () => assert(researchRepository.getSupabaseResearchTable("UNKNOWN") === null && researchRepository.getSupabaseResearchIdColumn("UNKNOWN") === null, "Unknown mapping resolved.")],
  ["create-five-record-types", async ({ recordSet }) => { const { adapter } = setup(); for (const [type, record] of Object.entries(recordSet)) assert((await adapter.create(createRequest(type, record))).status === researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS, `CREATE failed: ${type}`); }],
  ["create-normalized-payload", async ({ recordSet }) => { const { adapter, client } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; await adapter.create(createRequest(type, recordSet[type])); assert(client.inspectTable("research_sources")[0].payload.validation.valid, "Normalized payload not stored."); }],
  ["create-preserves-canonical-id", async ({ recordSet }) => { const { adapter, client } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; await adapter.create(createRequest(type, recordSet[type])); assert(client.inspectTable("research_sources")[0].source_id === recordSet[type].sourceId, "Canonical ID changed."); }],
  ["create-duplicate-conflict", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; await adapter.create(createRequest(type, recordSet[type])); assert((await adapter.create(createRequest(type, recordSet[type]))).status === researchRepository.PERSISTENCE_OPERATION_STATUSES.CONFLICT, "Duplicate not mapped to conflict."); }],
  ["read-five-record-types", async ({ recordSet }) => { const { adapter } = setup(); for (const [type, record] of Object.entries(recordSet)) { const id = canonicalId(type, record); await adapter.create(createRequest(type, record)); assert((await adapter.read(request(researchRepository.PERSISTENCE_OPERATION_TYPES.READ, type, { recordId: id }))).record[researchRepository.getRecordIdField(type)] === id, `READ failed: ${type}`); } }],
  ["read-missing-not-found", async () => { const { adapter } = setup(); const result = await adapter.read(request(researchRepository.PERSISTENCE_OPERATION_TYPES.READ, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { recordId: "missing" })); assert(result.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.NOT_FOUND, "Missing read not NOT_FOUND."); }],
  ["read-cloned-payload", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; await adapter.create(createRequest(type, recordSet[type])); const first = await adapter.read(request(researchRepository.PERSISTENCE_OPERATION_TYPES.READ, type, { recordId: recordSet[type].sourceId })); first.record.name = "mutated"; const second = await adapter.read(request(researchRepository.PERSISTENCE_OPERATION_TYPES.READ, type, { recordId: recordSet[type].sourceId })); assert(second.record.name !== "mutated", "Read leaked stored reference."); }],
  ["read-no-reference-hydration", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SESSION; await adapter.create(createRequest(type, recordSet[type])); const result = await adapter.read(request(researchRepository.PERSISTENCE_OPERATION_TYPES.READ, type, { recordId: recordSet[type].sessionId })); assert(typeof result.record.sourceRefs[0] === "string", "Reference hydrated."); }],
  ["update-existing", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; await adapter.create(createRequest(type, recordSet[type])); const updated = { ...recordSet[type], name: "Updated" }; const result = await adapter.update(updateRequest(type, updated.sourceId, updated)); assert(result.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS && result.record.name === "Updated", "Update failed."); }],
  ["update-missing-not-found", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const record = { ...recordSet[type], sourceId: "missing" }; const result = await adapter.update(updateRequest(type, "missing", record)); assert(result.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.NOT_FOUND, "Missing update not NOT_FOUND."); }],
  ["update-id-mismatch-rejected", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const result = await adapter.update(updateRequest(type, "different", recordSet[type])); assert(result.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.INVALID_REQUEST, "ID mismatch accepted."); }],
  ["update-expected-version-success", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; await adapter.create(createRequest(type, recordSet[type])); const result = await adapter.update(updateRequest(type, recordSet[type].sourceId, recordSet[type], { write: { validateBeforeWrite: true, expectedVersion: 1 } })); assert(result.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS, "Expected version update failed."); }],
  ["update-expected-version-conflict", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; await adapter.create(createRequest(type, recordSet[type])); const result = await adapter.update(updateRequest(type, recordSet[type].sourceId, recordSet[type], { write: { validateBeforeWrite: true, expectedVersion: 7 } })); assert(result.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.CONFLICT, "Version conflict not detected."); }],
  ["update-increments-storage-version", async ({ recordSet }) => { const { adapter, client } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; await adapter.create(createRequest(type, recordSet[type])); await adapter.update(updateRequest(type, recordSet[type].sourceId, recordSet[type])); assert(client.inspectTable("research_sources")[0].record_version === 2, "Storage version not incremented."); }],
  ["update-storage-metadata-outside-payload", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; await adapter.create(createRequest(type, recordSet[type])); const result = await adapter.update(updateRequest(type, recordSet[type].sourceId, recordSet[type])); assert(!Object.hasOwn(result.record, "record_version") && !Object.hasOwn(result.record, "updated_at"), "Storage metadata injected into payload."); }],
  ["upsert-creates", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const result = await adapter.upsert(request(researchRepository.PERSISTENCE_OPERATION_TYPES.UPSERT, type, { record: recordSet[type], write: { validateBeforeWrite: true } })); assert(result.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS, "Upsert create failed."); }],
  ["upsert-updates", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; await adapter.create(createRequest(type, recordSet[type])); const updated = { ...recordSet[type], name: "Upserted" }; const result = await adapter.upsert(request(researchRepository.PERSISTENCE_OPERATION_TYPES.UPSERT, type, { record: updated, write: { validateBeforeWrite: true } })); assert(result.record.name === "Upserted", "Upsert update failed."); }],
  ["upsert-preserves-canonical-id", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const result = await adapter.upsert(request(researchRepository.PERSISTENCE_OPERATION_TYPES.UPSERT, type, { record: recordSet[type] })); assert(result.record.sourceId === recordSet[type].sourceId, "Upsert changed ID."); }],
  ["list-all", async () => { const { adapter } = await seedSources(); const result = await adapter.list(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE)); assert(result.records.length === 3, "List failed."); }],
  ["list-exact-filter", async () => { const { adapter } = await seedSources(); const result = await adapter.list(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { query: { filters: [{ field: "name", operator: "EQ", value: "Alpha" }] } })); assert(result.records.length === 1 && result.records[0].name === "Alpha", "Exact filter failed."); }],
  ["list-inclusion-filter", async () => { const { adapter } = await seedSources(); const result = await adapter.list(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { query: { filters: [{ field: "name", operator: "IN", values: ["Alpha", "Bravo"] }] } })); assert(result.records.length === 2, "Inclusion filter failed."); }],
  ["list-sort-ascending", async () => { const { adapter } = await seedSources(); const result = await adapter.list(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { query: { sort: [{ field: "name", direction: "ASC" }] } })); assert(result.records.map((entry) => entry.name).join(",") === "Alpha,Bravo,Charlie", "Ascending sort failed."); }],
  ["list-sort-descending", async () => { const { adapter } = await seedSources(); const result = await adapter.list(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { query: { sort: [{ field: "name", direction: "DESC" }] } })); assert(result.records.map((entry) => entry.name).join(",") === "Charlie,Bravo,Alpha", "Descending sort failed."); }],
  ["list-limit", async () => { const { adapter } = await seedSources(); const result = await adapter.list(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { query: { limit: 2 } })); assert(result.records.length === 2, "Limit failed."); }],
  ["list-offset", async () => { const { adapter } = await seedSources(); const result = await adapter.list(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { query: { offset: 1 } })); assert(result.records.length === 2, "Offset failed."); }],
  ["list-page-metadata", async () => { const { adapter } = await seedSources(); const result = await adapter.list(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { query: { limit: 2, offset: 0 } })); assert(result.page.total === 3 && result.page.count === 2 && result.page.hasMore === true, "Page metadata failed."); }],
  ["list-no-default-limit", async () => { const { adapter } = await seedSources(); const result = await adapter.list(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE)); assert(result.page.limit === null && result.records.length === 3, "Default limit invented."); }],
  ["list-no-default-sort", async () => { const { adapter } = await seedSources(); const result = await adapter.list(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE)); assert(result.records.map((entry) => entry.name).join(",") === "Charlie,Alpha,Bravo", "Default sorting invented."); }],
  ["invalid-filter-rejected", async () => { const { adapter } = await seedSources(); const result = await adapter.list(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { query: { filters: [{ field: "name", operator: "LIKE", value: "%" }] } })); assert(result.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.INVALID_REQUEST, "Invalid filter accepted."); }],
  ["no-arbitrary-sql", async () => { const { adapter } = await seedSources(); const result = await adapter.list(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { query: { filters: [{ field: "name);drop table", operator: "EQ", value: "x" }] } })); assert(result.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.INVALID_REQUEST, "Unsafe field accepted."); }],
  ["exists-true", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; await adapter.create(createRequest(type, recordSet[type])); const result = await adapter.exists(request(researchRepository.PERSISTENCE_OPERATION_TYPES.EXISTS, type, { recordId: recordSet[type].sourceId })); assert(result.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS && result.metadata.exists === true, "EXISTS true failed."); }],
  ["exists-false", async () => { const { adapter } = setup(); const result = await adapter.exists(request(researchRepository.PERSISTENCE_OPERATION_TYPES.EXISTS, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { recordId: "missing" })); assert(result.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS && result.metadata.exists === false, "EXISTS false failed."); }],
  ["archive-adapter-metadata", async ({ recordSet }) => { const { adapter, client } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; await adapter.create(createRequest(type, recordSet[type])); await adapter.archive(request(researchRepository.PERSISTENCE_OPERATION_TYPES.ARCHIVE, type, { recordId: recordSet[type].sourceId, lifecycle: { action: researchRepository.PERSISTENCE_LIFECYCLE_ACTIONS.ARCHIVE } })); assert(client.inspectTable("research_sources")[0].is_archived === true, "Archive metadata not set."); }],
  ["archive-preserves-payload", async ({ recordSet }) => { const { adapter, client } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; await adapter.create(createRequest(type, recordSet[type])); const before = JSON.stringify(client.inspectTable("research_sources")[0].payload); await adapter.archive(request(researchRepository.PERSISTENCE_OPERATION_TYPES.ARCHIVE, type, { recordId: recordSet[type].sourceId, lifecycle: { action: researchRepository.PERSISTENCE_LIFECYCLE_ACTIONS.ARCHIVE } })); assert(JSON.stringify(client.inspectTable("research_sources")[0].payload) === before, "Archive modified payload."); }],
  ["archived-readable-by-default", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; await adapter.create(createRequest(type, recordSet[type])); await adapter.archive(request(researchRepository.PERSISTENCE_OPERATION_TYPES.ARCHIVE, type, { recordId: recordSet[type].sourceId, lifecycle: { action: researchRepository.PERSISTENCE_LIFECYCLE_ACTIONS.ARCHIVE } })); const read = await adapter.read(request(researchRepository.PERSISTENCE_OPERATION_TYPES.READ, type, { recordId: recordSet[type].sourceId })); assert(read.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS, "Archived record not readable under declared default."); }],
  ["soft-delete-tombstone", async ({ recordSet }) => { const { adapter, client } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; await adapter.create(createRequest(type, recordSet[type])); await adapter.delete(request(researchRepository.PERSISTENCE_OPERATION_TYPES.DELETE, type, { recordId: recordSet[type].sourceId, lifecycle: { action: researchRepository.PERSISTENCE_LIFECYCLE_ACTIONS.DELETE, deleteMode: researchRepository.PERSISTENCE_DELETE_MODES.SOFT_DELETE } })); assert(client.inspectTable("research_sources")[0].is_deleted === true, "Tombstone not set."); }],
  ["soft-delete-preserves-payload", async ({ recordSet }) => { const { adapter, client } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; await adapter.create(createRequest(type, recordSet[type])); const before = JSON.stringify(client.inspectTable("research_sources")[0].payload); await adapter.delete(request(researchRepository.PERSISTENCE_OPERATION_TYPES.DELETE, type, { recordId: recordSet[type].sourceId, lifecycle: { action: researchRepository.PERSISTENCE_LIFECYCLE_ACTIONS.DELETE, deleteMode: researchRepository.PERSISTENCE_DELETE_MODES.SOFT_DELETE } })); assert(JSON.stringify(client.inspectTable("research_sources")[0].payload) === before, "Soft delete modified payload."); }],
  ["soft-deleted-excluded", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; await adapter.create(createRequest(type, recordSet[type])); await adapter.delete(request(researchRepository.PERSISTENCE_OPERATION_TYPES.DELETE, type, { recordId: recordSet[type].sourceId, lifecycle: { action: researchRepository.PERSISTENCE_LIFECYCLE_ACTIONS.DELETE, deleteMode: researchRepository.PERSISTENCE_DELETE_MODES.SOFT_DELETE } })); assert((await adapter.read(request(researchRepository.PERSISTENCE_OPERATION_TYPES.READ, type, { recordId: recordSet[type].sourceId }))).status === researchRepository.PERSISTENCE_OPERATION_STATUSES.NOT_FOUND, "Deleted record visible by default."); }],
  ["include-deleted", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; await adapter.create(createRequest(type, recordSet[type])); await adapter.delete(request(researchRepository.PERSISTENCE_OPERATION_TYPES.DELETE, type, { recordId: recordSet[type].sourceId, lifecycle: { action: researchRepository.PERSISTENCE_LIFECYCLE_ACTIONS.DELETE, deleteMode: researchRepository.PERSISTENCE_DELETE_MODES.SOFT_DELETE } })); const read = await adapter.read(request(researchRepository.PERSISTENCE_OPERATION_TYPES.READ, type, { recordId: recordSet[type].sourceId, query: { includeDeleted: true } })); assert(read.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS, "includeDeleted failed."); }],
  ["hard-delete-restricted-default", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const result = await adapter.delete(request(researchRepository.PERSISTENCE_OPERATION_TYPES.DELETE, type, { recordId: recordSet[type].sourceId, lifecycle: { action: researchRepository.PERSISTENCE_LIFECYCLE_ACTIONS.DELETE, deleteMode: researchRepository.PERSISTENCE_DELETE_MODES.HARD_DELETE } })); assert(result.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.RESTRICTED, "Hard delete not restricted."); }],
  ["hard-delete-explicit-capability", async ({ recordSet }) => { const { adapter } = setup({ allowHardDelete: true }); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; await adapter.create(createRequest(type, recordSet[type])); const result = await adapter.delete(request(researchRepository.PERSISTENCE_OPERATION_TYPES.DELETE, type, { recordId: recordSet[type].sourceId, lifecycle: { action: researchRepository.PERSISTENCE_LIFECYCLE_ACTIONS.DELETE, deleteMode: researchRepository.PERSISTENCE_DELETE_MODES.HARD_DELETE } })); assert(result.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS, "Explicit hard delete capability failed."); }],
  ["hard-delete-explicit-mode", async ({ recordSet }) => { const { adapter } = setup({ allowHardDelete: true }); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const result = await adapter.delete(request(researchRepository.PERSISTENCE_OPERATION_TYPES.DELETE, type, { recordId: recordSet[type].sourceId, lifecycle: { action: researchRepository.PERSISTENCE_LIFECYCLE_ACTIONS.DELETE } })); assert(result.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.INVALID_REQUEST, "Hard delete inferred."); }],
  ["no-restore-method", () => assert(!Object.hasOwn(setup().adapter, "restore") && Object.keys(setup().adapter).length === 8, "Restore method added.")],
  ["restore-request-rejected", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const result = await adapter.archive(request(researchRepository.PERSISTENCE_OPERATION_TYPES.ARCHIVE, type, { recordId: recordSet[type].sourceId, lifecycle: { action: researchRepository.PERSISTENCE_LIFECYCLE_ACTIONS.RESTORE } })); assert(result.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.INVALID_REQUEST, "RESTORE accepted."); }],
  ["request-validation-before-storage", async () => { let calls = 0; const supabase = { from() { calls += 1; return {}; } }; const adapter = researchRepository.createSupabaseResearchRepositoryAdapter({ supabase }); const result = await adapter.create({ operation: "BAD" }); assert(result.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.INVALID_REQUEST && calls === 0, "Storage called before validation."); }],
  ["record-validation-before-write", async ({ recordSet }) => { const { adapter, client } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const invalid = { ...recordSet[type], sourceId: null }; await adapter.create(createRequest(type, invalid)); assert(client.inspectTable("research_sources").length === 0, "Invalid record stored."); }],
  ["invalid-record-validation-failed", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const result = await adapter.create(createRequest(type, { ...recordSet[type], name: null })); assert(result.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.VALIDATION_FAILED, "Invalid record status incorrect."); }],
  ["validation-no-record-mutation", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const input = clone(recordSet[type]); const before = JSON.stringify(input); await adapter.create(createRequest(type, input)); assert(JSON.stringify(input) === before, "Record mutated."); }],
  ["adapter-no-request-mutation", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const input = createRequest(type, recordSet[type]); const before = JSON.stringify(input); await adapter.create(input); assert(JSON.stringify(input) === before, "Request mutated."); }],
  ["no-ids-generated", () => assert(researchRepository.mapResearchRecordToSupabaseRow(researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { contract: "x" }) === null, "ID generated.")],
  ["no-research-timestamps-generated", ({ recordSet }) => { const row = researchRepository.mapResearchRecordToSupabaseRow(researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, recordSet[researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE]); assert(!Object.hasOwn(row.payload, "created_at") && !Object.hasOwn(row.payload, "updated_at"), "Research timestamp generated."); }],
  ["storage-timestamps-outside-payload", async ({ recordSet }) => { const { adapter, client } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; await adapter.create(createRequest(type, recordSet[type])); const row = client.inspectTable("research_sources")[0]; assert(row.created_at && !Object.hasOwn(row.payload, "created_at"), "Storage timestamp leaked into payload."); }],
  ["storage-version-outside-payload", async ({ recordSet }) => { const { adapter, client } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; await adapter.create(createRequest(type, recordSet[type])); const row = client.inspectTable("research_sources")[0]; assert(row.record_version === 1 && !Object.hasOwn(row.payload, "record_version"), "Storage version leaked."); }],
  ["archive-state-outside-payload", async ({ recordSet }) => { const { adapter, client } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; await adapter.create(createRequest(type, recordSet[type])); await adapter.archive(request(researchRepository.PERSISTENCE_OPERATION_TYPES.ARCHIVE, type, { recordId: recordSet[type].sourceId, lifecycle: { action: researchRepository.PERSISTENCE_LIFECYCLE_ACTIONS.ARCHIVE } })); const row = client.inspectTable("research_sources")[0]; assert(row.is_archived && !Object.hasOwn(row.payload, "is_archived"), "Archive state leaked."); }],
  ["delete-state-outside-payload", async ({ recordSet }) => { const { adapter, client } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; await adapter.create(createRequest(type, recordSet[type])); await adapter.delete(request(researchRepository.PERSISTENCE_OPERATION_TYPES.DELETE, type, { recordId: recordSet[type].sourceId, lifecycle: { action: researchRepository.PERSISTENCE_LIFECYCLE_ACTIONS.DELETE, deleteMode: researchRepository.PERSISTENCE_DELETE_MODES.SOFT_DELETE } })); const row = client.inspectTable("research_sources")[0]; assert(row.is_deleted && !Object.hasOwn(row.payload, "is_deleted"), "Delete state leaked."); }],
  ["success-no-verification-implication", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const result = await adapter.create(createRequest(type, recordSet[type])); assert(result.record.status === researchRepository.RESEARCH_SOURCE_STATUSES.CANDIDATE, "Storage implied approval or verification."); }],
  ["success-no-reference-integrity", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SESSION; const record = { ...recordSet[type], sourceRefs: ["unresolved-source"] }; const result = await adapter.create(createRequest(type, record)); assert(result.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS && result.record.sourceRefs[0] === "unresolved-source", "Storage implied reference integrity."); }],
  ["duplicate-error-mapping", () => assert(researchRepository.getSupabasePersistenceErrorStatus({ code: "23505" }) === researchRepository.PERSISTENCE_OPERATION_STATUSES.CONFLICT, "Duplicate mapping failed.")],
  ["not-found-mapping", () => assert(researchRepository.getSupabasePersistenceErrorStatus({ code: "PGRST116" }) === researchRepository.PERSISTENCE_OPERATION_STATUSES.NOT_FOUND, "Not-found mapping failed.")],
  ["restricted-mapping", () => assert(researchRepository.getSupabasePersistenceErrorStatus({ code: "42501" }) === researchRepository.PERSISTENCE_OPERATION_STATUSES.RESTRICTED, "Restricted mapping failed.")],
  ["unavailable-mapping", () => assert(researchRepository.getSupabasePersistenceErrorStatus({ code: "PGRST000" }) === researchRepository.PERSISTENCE_OPERATION_STATUSES.UNAVAILABLE, "Unavailable mapping failed.")],
  ["generic-failure-mapping", () => assert(researchRepository.getSupabasePersistenceErrorStatus({ code: "OTHER" }) === researchRepository.PERSISTENCE_OPERATION_STATUSES.FAILED, "Generic mapping failed.")],
  ["safe-error-details", async ({ recordSet }) => { const client = createMockSupabaseResearchClient({ errors: [{ operation: "insert", error: { code: "OTHER", message: "Safe", details: "detail", token: "secret" } }] }); const adapter = researchRepository.createSupabaseResearchRepositoryAdapter({ supabase: client }); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const result = await adapter.create(createRequest(type, recordSet[type])); assert(result.failure.details.details === "detail" && !Object.hasOwn(result.failure.details, "token"), "Unsafe error details exposed."); }],
  ["ordinary-errors-do-not-throw", async ({ recordSet }) => { const client = createMockSupabaseResearchClient({ errors: [{ operation: "insert", error: { code: "OTHER", message: "Failure" } }] }); const adapter = researchRepository.createSupabaseResearchRepositoryAdapter({ supabase: client }); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const result = await adapter.create(createRequest(type, recordSet[type])); assert(result.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.FAILED, "Ordinary error threw or mapped incorrectly."); }],
  ["mock-stores-clones", async ({ recordSet }) => { const client = createMockSupabaseResearchClient(); const row = researchRepository.mapResearchRecordToSupabaseRow(researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, recordSet[researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE]); await client.from("research_sources").insert(row).select("*").single(); row.payload.name = "mutated"; assert(client.inspectTable("research_sources")[0].payload.name !== "mutated", "Mock stored reference."); }],
  ["mock-returns-clones", async ({ recordSet }) => { const client = createMockSupabaseResearchClient(); const row = researchRepository.mapResearchRecordToSupabaseRow(researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, recordSet[researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE]); await client.from("research_sources").insert(row).select("*").single(); const first = await client.from("research_sources").select("*").maybeSingle(); first.data.payload.name = "mutated"; assert(client.inspectTable("research_sources")[0].payload.name !== "mutated", "Mock returned reference."); }],
  ["deterministic-repeated-behavior", async ({ recordSet }) => { const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const one = setup(); const two = setup(); const a = await one.adapter.create(createRequest(type, recordSet[type])); const b = await two.adapter.create(createRequest(type, recordSet[type])); assert(JSON.stringify(a) === JSON.stringify(b), "Behavior nondeterministic."); }],
  ["adapter-no-hydration", async ({ recordSet }) => { const { adapter } = setup(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.EVIDENCE_ARTIFACT; await adapter.create(createRequest(type, recordSet[type])); const read = await adapter.read(request(researchRepository.PERSISTENCE_OPERATION_TYPES.READ, type, { recordId: recordSet[type].evidenceId })); assert(read.record.analyticalObservationRefs[0] === "supabase-analysis", "Adapter hydrated reference."); }],
  ["no-ontology-dependency", ({ source }) => assert(!/ontology/i.test(source), "Ontology dependency found.")],
  ["no-fid-dependency", ({ source }) => assert(!/footballintelligencedatabase|\bfid\b/i.test(source), "FID dependency found.")],
  ["no-engine-dependency", ({ source }) => assert(!/engines/i.test(source), "Engine dependency found.")],
  ["no-ui-dependency", ({ source }) => assert(!/components|pages/i.test(source), "UI dependency found.")],
  ["no-routing-dependency", ({ source }) => assert(!/router|routes/i.test(source), "Routing dependency found.")],
  ["no-live-supabase-call", () => assert(!Object.hasOwn(researchRepository, "supabase") && researchRepository.validateSupabaseResearchRepositoryConfiguration({}).valid === false, "Live client created.")],
  ["migration-five-tables", ({ migration }) => assert(["research_sources", "research_sessions", "recorded_observations", "analytical_observations", "evidence_artifacts"].every((table) => migration.includes(`create table if not exists public.${table}`)), "Migration tables incomplete.")],
  ["migration-text-primary-keys", ({ migration }) => assert(["source_id", "session_id", "observation_id", "analysis_id", "evidence_id"].every((id) => new RegExp(`${id}\\s+text\\s+primary key`, "i").test(migration)), "Canonical text key missing.")],
  ["migration-jsonb-payload", ({ migration }) => assert((migration.match(/payload jsonb not null/g) || []).length === 5, "JSONB payload missing.")],
  ["migration-storage-metadata-separated", ({ migration }) => assert((migration.match(/record_version bigint/g) || []).length === 5 && (migration.match(/is_archived boolean/g) || []).length === 5 && (migration.match(/is_deleted boolean/g) || []).length === 5, "Storage metadata missing.")],
  ["migration-rls-five-tables", ({ migration }) => assert((migration.match(/enable row level security/g) || []).length === 5, "RLS incomplete.")],
  ["migration-no-permissive-policy", ({ migration }) => assert(!/create\s+policy|using\s*\(\s*true\s*\)|with\s+check\s*\(\s*true\s*\)/i.test(migration), "Permissive policy found.")],
  ["migration-no-domain-columns", ({ migration }) => assert(!/\b(player|team|trait|component|quarterback|football|prospect)_/i.test(migration), "Domain-specific column found.")],
  ["migration-no-cross-table-foreign-keys", ({ migration }) => assert(!/foreign\s+key|references\s+public\./i.test(migration), "Cross-table foreign key found.")],
  ["source-diagnostics-pass", ({ summaries }) => assert(summaries.researchSource.failed === 0, "Source diagnostics failed.")],
  ["session-diagnostics-pass", ({ summaries }) => assert(summaries.researchSession.failed === 0, "Session diagnostics failed.")],
  ["recorded-diagnostics-pass", ({ summaries }) => assert(summaries.recordedObservation.failed === 0, "Recorded diagnostics failed.")],
  ["analytical-diagnostics-pass", ({ summaries }) => assert(summaries.analyticalObservation.failed === 0, "Analytical diagnostics failed.")],
  ["evidence-diagnostics-pass", ({ summaries }) => assert(summaries.evidenceArtifact.failed === 0, "Evidence diagnostics failed.")],
  ["foundation-diagnostics-pass", ({ summaries }) => assert(summaries.foundation.failed === 0 && summaries.foundation.total === 60, "Foundation diagnostics failed.")],
  ["persistence-diagnostics-pass", ({ summaries }) => assert(summaries.persistence.failed === 0 && summaries.persistence.total === 100, "Persistence diagnostics failed.")],
  ["original-110-exports-intact", ({ summaries }) => assert(summaries.foundation.failed === 0 && summaries.persistence.failed === 0 && SUPABASE_EXPORTS.every((name) => Object.hasOwn(researchRepository, name)), "Original export surface regressed.")],
  ["supabase-export-surface", () => assert(SUPABASE_EXPORTS.every((name) => researchRepository[name] === supabaseApi[name]), "Supabase API incomplete.")],
  ["named-export-no-collisions", () => { const names = Object.keys(namedRepository).filter((name) => name !== "default"); assert(names.length === 128 && names.length === new Set(names).size, "Named export collision."); }],
  ["default-export-complete", () => { const names = Object.keys(researchRepository); assert(names.length === 128 && names.length === new Set(names).size && Object.keys(namedRepository).filter((name) => name !== "default").every((name) => researchRepository[name] === namedRepository[name]), "Default export incomplete."); }],
  ["mock-excluded-production", () => assert(!Object.hasOwn(researchRepository, "createMockSupabaseResearchClient"), "Mock exported.")],
  ["runner-excluded-production", () => assert(!Object.hasOwn(researchRepository, "runSupabaseResearchRepositoryAdapterDiagnostics"), "Supabase runner exported.")],
  ["all-diagnostics-excluded", () => assert(Object.keys(researchRepository).every((name) => !/^run.*Diagnostics$/.test(name)), "Diagnostic exported.")],
  ["no-circular-production-dependency", ({ dependencyGraph }) => assert(!hasCycle(dependencyGraph), "Production dependency cycle found.")],
  ["production-sport-agnostic", ({ source }) => assert(!/\b(football|quarterback|player|team|coach|scheme|draft|prospect)\b/i.test(source), "Domain-specific vocabulary found.")],
  ["no-credentials-or-env", ({ source }) => assert(!/process\.env|import\.meta\.env|VITE_|SUPABASE_URL|SUPABASE_KEY|token|credential/i.test(source), "Credential or environment handling found.")],
  ["approved-contracts-constants-unchanged", ({ summaries }) => assert(Object.values(summaries).every((summary) => summary.failed === 0), "Approved contract or constants behavior changed.")],
  ["factory-mapper-stability", ({ recordSet }) => { const client = createMockSupabaseResearchClient(); const first = researchRepository.createSupabaseResearchRepositoryAdapter({ supabase: client }); const second = researchRepository.createSupabaseResearchRepositoryAdapter({ supabase: client }); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; assert(Object.keys(first).join(",") === Object.keys(second).join(",") && JSON.stringify(researchRepository.mapResearchRecordToSupabaseRow(type, recordSet[type])) === JSON.stringify(researchRepository.mapResearchRecordToSupabaseRow(type, recordSet[type])), "Factory or mapper unstable."); }],
  ["production-build-integrity", () => assert(SUPABASE_EXPORTS.every((name) => researchRepository[name] != null) && researchRepository.isPersistenceAdapter(setup().adapter), "Production module integrity failed.")],
];

function buildContext() {
  const files = productionFiles();
  const source = files.map((file) => readFileSync(file, "utf8")).join("\n");
  return {
    recordSet: records(),
    migration: readFileSync(MIGRATION_PATH, "utf8"),
    summaries: existingSummaries(),
    source,
    dependencyGraph: graph(files),
  };
}

export async function runSupabaseResearchRepositoryAdapterDiagnostics({ throwOnFailure = false } = {}) {
  const context = buildContext();
  const cases = [];
  for (const [id, execute] of CASES) {
    try {
      await execute(context);
      cases.push({ id, passed: true, message: `${id} passed.`, details: null });
    } catch (error) {
      cases.push({ id, passed: false, message: typeof error?.message === "string" ? error.message : `${id} failed.`, details: error?.details ?? null });
    }
  }
  const passed = cases.filter((entry) => entry.passed).length;
  const failed = cases.length - passed;
  const summary = {
    suite: SUITE,
    adapterVersion: researchRepository.SUPABASE_RESEARCH_REPOSITORY_ADAPTER_VERSION,
    migrationPath: MIGRATION_PATH,
    total: cases.length,
    passed,
    failed,
    cases,
    existingSuiteSummaries: context.summaries,
  };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runSupabaseResearchRepositoryAdapterDiagnostics });
