import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import researchRepository, * as namedRepository from "../index.js";
import { createInMemoryResearchRepositoryAdapter } from "./adapters/createInMemoryResearchRepositoryAdapter.js";
import { runResearchSourceContractDiagnostics } from "./runResearchSourceContractDiagnostics.js";
import { runResearchSessionContractDiagnostics } from "./runResearchSessionContractDiagnostics.js";
import { runRecordedObservationContractDiagnostics } from "./runRecordedObservationContractDiagnostics.js";
import { runAnalyticalObservationContractDiagnostics } from "./runAnalyticalObservationContractDiagnostics.js";
import { runEvidenceArtifactContractDiagnostics } from "./runEvidenceArtifactContractDiagnostics.js";
import { runResearchRepositoryFoundationDiagnostics } from "./runResearchRepositoryFoundationDiagnostics.js";

const SUITE = "ResearchRepositoryPersistenceDiagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PERSISTENCE_EXPORTS = [
  "RESEARCH_REPOSITORY_PERSISTENCE_CONTRACT_NAME",
  "RESEARCH_REPOSITORY_PERSISTENCE_CONTRACT_VERSION",
  "RESEARCH_REPOSITORY_PERSISTENCE_SCHEMA_VERSION",
  "PERSISTENCE_RECORD_TYPES", "PERSISTENCE_OPERATION_TYPES", "PERSISTENCE_OPERATION_STATUSES",
  "PERSISTENCE_CONSISTENCY_MODES", "PERSISTENCE_WRITE_MODES", "PERSISTENCE_LIFECYCLE_ACTIONS",
  "PERSISTENCE_DELETE_MODES", "PERSISTENCE_SORT_DIRECTIONS", "PERSISTENCE_ADAPTER_REQUIRED_METHODS",
  "PERSISTENCE_OPERATION_POLICIES", "createPersistenceRequest", "createPersistenceResult",
  "createUnavailablePersistenceResult", "validatePersistenceRequest", "validatePersistenceResult",
  "isPersistenceRequest", "isPersistenceResult", "isSuccessfulPersistenceResult",
  "isRestrictedPersistenceRequest", "getRecordIdField", "getRecordContractValidator",
  "validatePersistenceAdapter", "isPersistenceAdapter",
];

function assert(condition, message, details = null) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

function hasCode(validation, code, field = "errors") {
  return (validation?.[field] || []).some((entry) => entry.code === code);
}

function clone(value) {
  return structuredClone(value);
}

function records() {
  const source = researchRepository.createResearchSource({
    sourceId: "source-persistence", name: "Persistence Source",
    sourceClass: researchRepository.RESEARCH_SOURCE_CLASSES.OFFICIAL,
    status: researchRepository.RESEARCH_SOURCE_STATUSES.CANDIDATE,
    access: { type: researchRepository.RESEARCH_SOURCE_ACCESS_TYPES.PUBLIC },
  });
  const session = researchRepository.createResearchSession({
    sessionId: "session-persistence", title: "Persistence Session",
    sessionType: researchRepository.RESEARCH_SESSION_TYPES.OTHER,
    status: researchRepository.RESEARCH_SESSION_STATUSES.PLANNED,
    sourceRefs: [source.sourceId], scope: { state: researchRepository.RESEARCH_SESSION_SCOPE_STATES.UNDEFINED },
    verification: { state: researchRepository.RESEARCH_SESSION_VERIFICATION_STATES.NOT_STARTED },
    review: { required: false },
  });
  const recorded = researchRepository.createRecordedObservation({
    observationId: "recorded-persistence", sessionRef: session.sessionId, sourceRefs: [source.sourceId],
    observationType: researchRepository.RECORDED_OBSERVATION_TYPES.OTHER,
    origin: researchRepository.RECORDED_OBSERVATION_ORIGINS.RESEARCHER_RECORDED,
    description: "A record was documented.",
    temporal: { type: researchRepository.RECORDED_OBSERVATION_TEMPORAL_TYPES.TIME_UNKNOWN },
    spatial: { type: researchRepository.RECORDED_OBSERVATION_SPATIAL_TYPES.NOT_APPLICABLE },
    verification: { state: researchRepository.RECORDED_OBSERVATION_VERIFICATION_STATES.UNVERIFIED },
    provenance: { recordedBy: "researcher-persistence" },
  });
  const analytical = researchRepository.createAnalyticalObservation({
    analysisId: "analytical-persistence", recordedObservationRefs: [recorded.observationId],
    analysisType: researchRepository.ANALYTICAL_OBSERVATION_TYPES.OTHER,
    scope: researchRepository.ANALYTICAL_OBSERVATION_SCOPES.SINGLE_OBSERVATION,
    statement: { text: "The record supports an interpretation." },
    evaluator: { evaluatorRef: "evaluator-persistence" },
    confidence: { level: researchRepository.ANALYTICAL_CONFIDENCE_LEVELS.UNSPECIFIED },
    verification: { state: researchRepository.ANALYTICAL_VERIFICATION_STATES.UNVERIFIED },
    review: { required: false },
  });
  const evidence = researchRepository.createEvidenceArtifact({
    evidenceId: "evidence-persistence", analyticalObservationRefs: [analytical.analysisId],
    state: researchRepository.EVIDENCE_ARTIFACT_STATES.DRAFT, summary: "The analysis supports an artifact.",
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

function request(operation, recordType, overrides = {}) {
  return {
    requestId: `request-${operation.toLowerCase()}`,
    operation,
    recordType,
    ...overrides,
  };
}

function createRequest(recordType, record, overrides = {}) {
  return request(researchRepository.PERSISTENCE_OPERATION_TYPES.CREATE, recordType, {
    record,
    write: { mode: researchRepository.PERSISTENCE_WRITE_MODES.CREATE_ONLY, validateBeforeWrite: true },
    ...overrides,
  });
}

function resultInput(operation, status, overrides = {}) {
  return {
    requestId: "request-result",
    operation,
    recordType: researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE,
    status,
    ...overrides,
  };
}

function existingSummaries() {
  return {
    researchSource: runResearchSourceContractDiagnostics(),
    researchSession: runResearchSessionContractDiagnostics(),
    recordedObservation: runRecordedObservationContractDiagnostics(),
    analyticalObservation: runAnalyticalObservationContractDiagnostics(),
    evidenceArtifact: runEvidenceArtifactContractDiagnostics(),
    foundation: runResearchRepositoryFoundationDiagnostics(),
  };
}

function productionFiles() {
  const directories = ["constants", "contracts", "persistence"];
  return [resolve(ROOT, "index.js"), ...directories.flatMap((directory) =>
    readdirSync(resolve(ROOT, directory))
      .filter((name) => name.endsWith(".js"))
      .map((name) => resolve(ROOT, directory, name))
  )];
}

function importSpecifiers(source) {
  return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);
}

function productionGraph() {
  const files = productionFiles();
  const nodes = new Set(files);
  return Object.fromEntries(files.map((file) => [
    file,
    importSpecifiers(readFileSync(file, "utf8"))
      .filter((specifier) => specifier.startsWith("."))
      .map((specifier) => resolve(dirname(file), specifier))
      .filter((target) => nodes.has(target)),
  ]));
}

function hasCycle(graph) {
  const visiting = new Set();
  const visited = new Set();
  function visit(node) {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    if ((graph[node] || []).some(visit)) return true;
    visiting.delete(node);
    visited.add(node);
    return false;
  }
  return Object.keys(graph).some(visit);
}

function suiteCase(summary, id) {
  return summary.cases.find((entry) => entry.id === id)?.passed === true;
}

function createAdapterWithSources(names = ["Charlie", "Alpha", "Bravo"]) {
  const adapter = createInMemoryResearchRepositoryAdapter();
  names.forEach((name, index) => {
    const source = researchRepository.createResearchSource({
      sourceId: `source-${index + 1}`, name,
      sourceClass: researchRepository.RESEARCH_SOURCE_CLASSES.OFFICIAL,
      status: researchRepository.RESEARCH_SOURCE_STATUSES.CANDIDATE,
      access: { type: researchRepository.RESEARCH_SOURCE_ACCESS_TYPES.PUBLIC },
    });
    adapter.create(createRequest(researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, source));
  });
  return adapter;
}

const CASES = [
  ["valid-create-all-record-types", ({ recordSet }) => assert(Object.entries(recordSet).every(([type, record]) => researchRepository.createPersistenceRequest(createRequest(type, record)).validation.valid), "CREATE failed for a record type.")],
  ["valid-read", () => assert(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.READ, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { recordId: "source-1" })).validation.valid, "READ invalid.")],
  ["valid-update", ({ recordSet }) => { const record = recordSet[researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE]; assert(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.UPDATE, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { recordId: record.sourceId, record })).validation.valid, "UPDATE invalid."); }],
  ["valid-upsert", ({ recordSet }) => { const record = recordSet[researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE]; assert(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.UPSERT, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { record })).validation.valid, "UPSERT invalid."); }],
  ["valid-list", () => assert(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { query: {} })).validation.valid, "LIST invalid.")],
  ["valid-exists", () => assert(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.EXISTS, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { recordId: "source-1" })).validation.valid, "EXISTS invalid.")],
  ["valid-archive", () => assert(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.ARCHIVE, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { recordId: "source-1", lifecycle: { action: researchRepository.PERSISTENCE_LIFECYCLE_ACTIONS.ARCHIVE } })).validation.valid, "ARCHIVE invalid.")],
  ["valid-soft-delete", () => assert(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.DELETE, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { recordId: "source-1", lifecycle: { action: researchRepository.PERSISTENCE_LIFECYCLE_ACTIONS.DELETE, deleteMode: researchRepository.PERSISTENCE_DELETE_MODES.SOFT_DELETE } })).validation.valid, "Soft DELETE invalid.")],
  ["restricted-hard-delete", () => { const value = researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.DELETE, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { recordId: "source-1", lifecycle: { action: researchRepository.PERSISTENCE_LIFECYCLE_ACTIONS.DELETE, deleteMode: researchRepository.PERSISTENCE_DELETE_MODES.HARD_DELETE } })); assert(value.validation.valid && researchRepository.isRestrictedPersistenceRequest(value), "Hard DELETE restriction failed."); }],
  ["unknown-record-type", () => assert(hasCode(researchRepository.createPersistenceRequest({ operation: researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, recordType: "BAD" }).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown record type accepted.")],
  ["unknown-operation", () => assert(hasCode(researchRepository.createPersistenceRequest({ operation: "BAD", recordType: researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE }).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown operation accepted.")],
  ["unknown-status", () => assert(hasCode(researchRepository.createPersistenceResult(resultInput(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, "BAD")).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown status accepted.")],
  ["unknown-consistency", () => assert(hasCode(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { consistency: "BAD" })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown consistency accepted.")],
  ["unknown-write-mode", () => assert(hasCode(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { write: { mode: "BAD" } })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown write mode accepted.")],
  ["unknown-lifecycle-action", () => assert(hasCode(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { lifecycle: { action: "BAD" } })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown lifecycle accepted.")],
  ["unknown-delete-mode", () => assert(hasCode(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { lifecycle: { deleteMode: "BAD" } })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown delete mode accepted.")],
  ["unknown-sort-direction", () => assert(hasCode(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { query: { sort: [{ field: "name", direction: "BAD" }] } })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown sort accepted.")],
  ["create-missing-record", () => assert(hasCode(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.CREATE, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE)).validation, "CREATE_RECORD_REQUIRED"), "CREATE record requirement missing.")],
  ["read-missing-id", () => assert(hasCode(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.READ, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE)).validation, "READ_RECORD_ID_REQUIRED"), "READ ID requirement missing.")],
  ["update-missing-id", ({ recordSet }) => assert(hasCode(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.UPDATE, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { record: recordSet[researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE] })).validation, "UPDATE_RECORD_ID_REQUIRED"), "UPDATE ID requirement missing.")],
  ["update-missing-record", () => assert(hasCode(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.UPDATE, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { recordId: "source-1" })).validation, "UPDATE_RECORD_REQUIRED"), "UPDATE record requirement missing.")],
  ["upsert-missing-record", () => assert(hasCode(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.UPSERT, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE)).validation, "UPSERT_RECORD_REQUIRED"), "UPSERT record requirement missing.")],
  ["exists-missing-id", () => assert(hasCode(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.EXISTS, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE)).validation, "EXISTS_RECORD_ID_REQUIRED"), "EXISTS ID requirement missing.")],
  ["archive-missing-action", () => assert(hasCode(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.ARCHIVE, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { recordId: "source-1" })).validation, "ARCHIVE_ACTION_REQUIRED"), "ARCHIVE action requirement missing.")],
  ["delete-missing-action", () => assert(hasCode(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.DELETE, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { recordId: "source-1" })).validation, "DELETE_ACTION_REQUIRED"), "DELETE action requirement missing.")],
  ["invalid-canonical-id", ({ recordSet }) => { const record = { ...recordSet[researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE], sourceId: 12 }; assert(hasCode(researchRepository.createPersistenceRequest(createRequest(researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, record)).validation, "INVALID_CANONICAL_RECORD_ID"), "Invalid canonical ID accepted."); }],
  ["record-id-mismatch", ({ recordSet }) => { const record = recordSet[researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE]; assert(hasCode(researchRepository.createPersistenceRequest(createRequest(researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, record, { recordId: "different" })).validation, "RECORD_ID_MISMATCH"), "ID mismatch accepted."); }],
  ["ids-not-generated", () => { const value = researchRepository.createPersistenceRequest({ operation: researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, recordType: researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE }); assert(value.requestId === null && value.recordId === null, "ID generated."); }],
  ["dates-not-generated", () => { const value = researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE)); assert(value.validation.checkedAt === null && !Object.hasOwn(value, "createdAt"), "Date generated."); }],
  ["versions-not-generated", () => { const value = researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE)); assert(value.write.expectedVersion === null, "Version generated."); }],
  ["actors-not-generated", () => { const value = researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE)); assert(value.actor.actorRef === null && value.actor.actorLabel === null, "Actor generated."); }],
  ["consistency-not-inferred", () => assert(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE)).consistency === null, "Consistency inferred.")],
  ["record-validation-all-contracts", ({ recordSet }) => assert(Object.entries(recordSet).every(([type, record]) => researchRepository.createPersistenceRequest(createRequest(type, record)).validation.valid), "Approved record validation failed.")],
  ["invalid-record-validation", () => { const value = researchRepository.createPersistenceRequest(createRequest(researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { sourceId: "invalid" })); assert(hasCode(value.validation, "RECORD_VALIDATION_FAILED"), "Invalid record not rejected."); }],
  ["record-validation-no-hydration", ({ recordSet }) => { const record = recordSet[researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SESSION]; const value = researchRepository.createPersistenceRequest(createRequest(researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SESSION, record)); assert(typeof value.record.sourceRefs[0] === "string", "Reference hydrated."); }],
  ["record-validation-no-mutation", ({ recordSet }) => { const input = clone(recordSet[researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE]); const before = JSON.stringify(input); researchRepository.createPersistenceRequest(createRequest(researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, input)); assert(JSON.stringify(input) === before, "Record mutated."); }],
  ["query-filters-validate", () => assert(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { query: { filters: [{ field: "name", operator: "EQ", value: "Alpha" }] } })).validation.valid, "Filter invalid.")],
  ["query-sort-validates", () => assert(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { query: { sort: [{ field: "name", direction: researchRepository.PERSISTENCE_SORT_DIRECTIONS.ASC }] } })).validation.valid, "Sort invalid.")],
  ["negative-limit-rejected", () => assert(hasCode(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { query: { limit: -1 } })).validation, "INVALID_NON_NEGATIVE_INTEGER"), "Negative limit accepted.")],
  ["negative-offset-rejected", () => assert(hasCode(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { query: { offset: -1 } })).validation, "INVALID_NON_NEGATIVE_INTEGER"), "Negative offset accepted.")],
  ["default-limit-not-inferred", () => assert(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE)).query.limit === null, "Limit inferred.")],
  ["default-sort-not-inferred", () => assert(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE)).query.sort.length === 0, "Sort inferred.")],
  ["sql-not-generated", () => assert(!Object.hasOwn(researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE)), "sql"), "SQL generated.")],
  ["successful-create-result", ({ recordSet }) => { const r = researchRepository.createPersistenceResult(resultInput(researchRepository.PERSISTENCE_OPERATION_TYPES.CREATE, researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS, { record: recordSet[researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE] })); assert(r.validation.valid, "CREATE result invalid."); }],
  ["successful-read-result", ({ recordSet }) => { const r = researchRepository.createPersistenceResult(resultInput(researchRepository.PERSISTENCE_OPERATION_TYPES.READ, researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS, { record: recordSet[researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE] })); assert(r.validation.valid, "READ result invalid."); }],
  ["successful-list-result", () => assert(researchRepository.createPersistenceResult(resultInput(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS, { records: [] })).validation.valid, "LIST result invalid.")],
  ["not-found-result", () => assert(researchRepository.createPersistenceResult(resultInput(researchRepository.PERSISTENCE_OPERATION_TYPES.READ, researchRepository.PERSISTENCE_OPERATION_STATUSES.NOT_FOUND)).validation.valid, "NOT_FOUND invalid.")],
  ["conflict-result", () => assert(researchRepository.createPersistenceResult(resultInput(researchRepository.PERSISTENCE_OPERATION_TYPES.CREATE, researchRepository.PERSISTENCE_OPERATION_STATUSES.CONFLICT, { conflict: { type: "EXISTS" } })).validation.valid, "CONFLICT invalid.")],
  ["validation-failed-result", () => assert(researchRepository.createPersistenceResult(resultInput(researchRepository.PERSISTENCE_OPERATION_TYPES.CREATE, researchRepository.PERSISTENCE_OPERATION_STATUSES.VALIDATION_FAILED, { failure: { message: "Invalid record.", details: [] } })).validation.valid, "VALIDATION_FAILED invalid.")],
  ["failed-result", () => assert(researchRepository.createPersistenceResult(resultInput(researchRepository.PERSISTENCE_OPERATION_TYPES.READ, researchRepository.PERSISTENCE_OPERATION_STATUSES.FAILED, { failure: { message: "Storage failure." } })).validation.valid, "FAILED invalid.")],
  ["ordinary-failures-no-throw", () => { try { researchRepository.createPersistenceResult(resultInput(researchRepository.PERSISTENCE_OPERATION_TYPES.READ, researchRepository.PERSISTENCE_OPERATION_STATUSES.NOT_FOUND)); } catch { assert(false, "Ordinary failure threw."); } }],
  ["result-validation-shape", () => { const r = researchRepository.createPersistenceResult(resultInput(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS)); assert(["valid", "errors", "warnings", "checkedAt", "contractVersion", "schemaVersion"].every((key) => Object.hasOwn(r.validation, key)), "Result validation shape failed."); }],
  ["success-no-reference-integrity-implication", () => { const r = researchRepository.createPersistenceResult(resultInput(researchRepository.PERSISTENCE_OPERATION_TYPES.CREATE, researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS, { record: { sourceId: "missing-reference", sourceRefs: ["does-not-exist"] } })); assert(r.validation.valid && r.record.sourceRefs[0] === "does-not-exist", "Success resolved references."); }],
  ["success-no-research-verification-implication", () => { const r = researchRepository.createPersistenceResult(resultInput(researchRepository.PERSISTENCE_OPERATION_TYPES.CREATE, researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS, { record: { sourceId: "unverified", verification: { state: "UNVERIFIED" } } })); assert(r.record.verification.state === "UNVERIFIED", "Success implied verification."); }],
  ["adapter-required-methods", () => assert(researchRepository.validatePersistenceAdapter(createInMemoryResearchRepositoryAdapter()).valid, "Adapter rejected.")],
  ["adapter-missing-method", () => { const adapter = createInMemoryResearchRepositoryAdapter(); const incomplete = { ...adapter }; delete incomplete.delete; assert(!researchRepository.validatePersistenceAdapter(incomplete).valid, "Incomplete adapter accepted."); }],
  ["type-guards", () => { const req = researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE)); const res = researchRepository.createPersistenceResult(resultInput(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS)); assert(researchRepository.isPersistenceRequest(req) && researchRepository.isPersistenceResult(res) && !researchRepository.isPersistenceRequest({}) && !researchRepository.isPersistenceResult({}), "Type guards failed."); }],
  ["restricted-request-guard", () => { const req = researchRepository.createPersistenceRequest(request(researchRepository.PERSISTENCE_OPERATION_TYPES.DELETE, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { recordId: "source-1", lifecycle: { action: researchRepository.PERSISTENCE_LIFECYCLE_ACTIONS.DELETE, deleteMode: researchRepository.PERSISTENCE_DELETE_MODES.SOFT_DELETE } })); assert(researchRepository.isRestrictedPersistenceRequest(req), "Restricted guard failed."); }],
  ["successful-result-guard", () => { const success = researchRepository.createPersistenceResult(resultInput(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS)); const missing = researchRepository.createPersistenceResult(resultInput(researchRepository.PERSISTENCE_OPERATION_TYPES.READ, researchRepository.PERSISTENCE_OPERATION_STATUSES.NOT_FOUND)); assert(researchRepository.isSuccessfulPersistenceResult(success) && !researchRepository.isSuccessfulPersistenceResult(missing), "Success guard failed."); }],
  ["unavailable-result-factory", () => { const r = researchRepository.createUnavailablePersistenceResult(resultInput(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, null, { reason: "Offline." })); assert(researchRepository.isPersistenceResult(r) && r.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.UNAVAILABLE && r.failure.message === "Offline." && r.validation.checkedAt === null, "Unavailable result failed."); }],
  ["adapter-create-read", ({ recordSet }) => { const a = createInMemoryResearchRepositoryAdapter(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const record = recordSet[type]; assert(a.create(createRequest(type, record)).status === researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS && a.read(request(researchRepository.PERSISTENCE_OPERATION_TYPES.READ, type, { recordId: record.sourceId })).record.sourceId === record.sourceId, "Adapter create/read failed."); }],
  ["adapter-update", ({ recordSet }) => { const a = createInMemoryResearchRepositoryAdapter(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const record = recordSet[type]; a.create(createRequest(type, record)); const updated = { ...record, name: "Updated" }; const r = a.update(request(researchRepository.PERSISTENCE_OPERATION_TYPES.UPDATE, type, { recordId: record.sourceId, record: updated })); assert(r.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS && r.record.name === "Updated", "Adapter update failed."); }],
  ["adapter-upsert", ({ recordSet }) => { const a = createInMemoryResearchRepositoryAdapter(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const record = { ...recordSet[type], name: "Upserted" }; const r = a.upsert(request(researchRepository.PERSISTENCE_OPERATION_TYPES.UPSERT, type, { record })); assert(r.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS && r.record.name === "Upserted", "Adapter upsert failed."); }],
  ["adapter-exists", ({ recordSet }) => { const a = createInMemoryResearchRepositoryAdapter(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const record = recordSet[type]; a.create(createRequest(type, record)); assert(a.exists(request(researchRepository.PERSISTENCE_OPERATION_TYPES.EXISTS, type, { recordId: record.sourceId })).status === researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS, "Adapter exists failed."); }],
  ["adapter-list", () => { const a = createAdapterWithSources(); const r = a.list(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE)); assert(r.records.length === 3, "Adapter list failed."); }],
  ["adapter-exact-filters", () => { const a = createAdapterWithSources(); const r = a.list(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { query: { filters: [{ field: "name", operator: "EQ", value: "Alpha" }] } })); assert(r.records.length === 1 && r.records[0].name === "Alpha", "Adapter filter failed."); }],
  ["adapter-sorting", () => { const a = createAdapterWithSources(); const r = a.list(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { query: { sort: [{ field: "name", direction: researchRepository.PERSISTENCE_SORT_DIRECTIONS.ASC }] } })); assert(r.records.map((x) => x.name).join(",") === "Alpha,Bravo,Charlie", "Adapter sorting failed."); }],
  ["adapter-pagination", () => { const a = createAdapterWithSources(); const r = a.list(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, { query: { sort: [{ field: "name", direction: researchRepository.PERSISTENCE_SORT_DIRECTIONS.ASC }], offset: 1, limit: 1 } })); assert(r.records.length === 1 && r.records[0].name === "Bravo" && r.page.total === 3 && r.page.hasMore, "Adapter pagination failed."); }],
  ["adapter-archive", ({ recordSet }) => { const a = createInMemoryResearchRepositoryAdapter(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const record = recordSet[type]; a.create(createRequest(type, record)); a.archive(request(researchRepository.PERSISTENCE_OPERATION_TYPES.ARCHIVE, type, { recordId: record.sourceId, lifecycle: { action: researchRepository.PERSISTENCE_LIFECYCLE_ACTIONS.ARCHIVE } })); const list = a.list(request(researchRepository.PERSISTENCE_OPERATION_TYPES.LIST, type)); assert(list.records.length === 0 && record.status === researchRepository.RESEARCH_SOURCE_STATUSES.CANDIDATE, "Adapter archive failed or rewrote record."); }],
  ["adapter-soft-delete", ({ recordSet }) => { const a = createInMemoryResearchRepositoryAdapter(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const record = recordSet[type]; a.create(createRequest(type, record)); const del = a.delete(request(researchRepository.PERSISTENCE_OPERATION_TYPES.DELETE, type, { recordId: record.sourceId, lifecycle: { action: researchRepository.PERSISTENCE_LIFECYCLE_ACTIONS.DELETE, deleteMode: researchRepository.PERSISTENCE_DELETE_MODES.SOFT_DELETE } })); const read = a.read(request(researchRepository.PERSISTENCE_OPERATION_TYPES.READ, type, { recordId: record.sourceId })); assert(del.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS && read.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.NOT_FOUND, "Soft delete failed."); }],
  ["adapter-hard-delete-restricted", ({ recordSet }) => { const a = createInMemoryResearchRepositoryAdapter(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const record = recordSet[type]; a.create(createRequest(type, record)); const r = a.delete(request(researchRepository.PERSISTENCE_OPERATION_TYPES.DELETE, type, { recordId: record.sourceId, lifecycle: { action: researchRepository.PERSISTENCE_LIFECYCLE_ACTIONS.DELETE, deleteMode: researchRepository.PERSISTENCE_DELETE_MODES.HARD_DELETE } })); assert(r.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.RESTRICTED, "Hard delete not restricted."); }],
  ["adapter-stores-clones", ({ recordSet }) => { const a = createInMemoryResearchRepositoryAdapter(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const input = clone(recordSet[type]); a.create(createRequest(type, input)); input.name = "Mutated"; const read = a.read(request(researchRepository.PERSISTENCE_OPERATION_TYPES.READ, type, { recordId: input.sourceId })); assert(read.record.name !== "Mutated", "Stored reference leaked."); }],
  ["adapter-returns-clones", ({ recordSet }) => { const a = createInMemoryResearchRepositoryAdapter(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const record = recordSet[type]; a.create(createRequest(type, record)); const first = a.read(request(researchRepository.PERSISTENCE_OPERATION_TYPES.READ, type, { recordId: record.sourceId })); first.record.name = "Mutated"; const second = a.read(request(researchRepository.PERSISTENCE_OPERATION_TYPES.READ, type, { recordId: record.sourceId })); assert(second.record.name !== "Mutated", "Returned reference leaked."); }],
  ["adapter-no-hydration", ({ recordSet }) => { const a = createInMemoryResearchRepositoryAdapter(); const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SESSION; const record = recordSet[type]; a.create(createRequest(type, record)); const read = a.read(request(researchRepository.PERSISTENCE_OPERATION_TYPES.READ, type, { recordId: record.sessionId })); assert(typeof read.record.sourceRefs[0] === "string", "Adapter hydrated reference."); }],
  ["adapter-deterministic", ({ recordSet }) => { const type = researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE; const record = recordSet[type]; const first = createInMemoryResearchRepositoryAdapter(); const second = createInMemoryResearchRepositoryAdapter(); const one = first.create(createRequest(type, record)); const two = second.create(createRequest(type, record)); assert(JSON.stringify(one) === JSON.stringify(two), "Adapter nondeterministic."); }],
  ["source-diagnostics-pass", ({ summaries }) => assert(summaries.researchSource.failed === 0, "Source diagnostics failed.")],
  ["session-diagnostics-pass", ({ summaries }) => assert(summaries.researchSession.failed === 0, "Session diagnostics failed.")],
  ["recorded-diagnostics-pass", ({ summaries }) => assert(summaries.recordedObservation.failed === 0, "Recorded diagnostics failed.")],
  ["analytical-diagnostics-pass", ({ summaries }) => assert(summaries.analyticalObservation.failed === 0, "Analytical diagnostics failed.")],
  ["evidence-diagnostics-pass", ({ summaries }) => assert(summaries.evidenceArtifact.failed === 0, "Evidence diagnostics failed.")],
  ["foundation-diagnostics-pass", ({ summaries }) => assert(summaries.foundation.failed === 0 && summaries.foundation.total === 60, "Foundation diagnostics failed.")],
  ["original-84-exports-intact", ({ summaries }) => assert(suiteCase(summaries.foundation, "public-named-exports-complete") && suiteCase(summaries.foundation, "default-export-complete") && suiteCase(summaries.foundation, "default-export-no-collisions"), "Original API regressed.")],
  ["persistence-export-surface", () => assert(PERSISTENCE_EXPORTS.every((name) => Object.hasOwn(researchRepository, name) && Object.hasOwn(namedRepository, name) && researchRepository[name] === namedRepository[name]), "Persistence API incomplete.")],
  ["named-export-collisions", () => { const keys = Object.keys(namedRepository).filter((key) => key !== "default"); assert(keys.length === new Set(keys).size, "Named export collision."); }],
  ["default-export-complete", () => { const named = Object.keys(namedRepository).filter((key) => key !== "default"); assert(named.every((key) => Object.hasOwn(researchRepository, key) && researchRepository[key] === namedRepository[key]), "Default API incomplete."); }],
  ["diagnostic-adapter-excluded", () => assert(!Object.hasOwn(researchRepository, "createInMemoryResearchRepositoryAdapter"), "Diagnostic adapter exported.")],
  ["persistence-runner-excluded", () => assert(!Object.hasOwn(researchRepository, "runResearchRepositoryPersistenceDiagnostics"), "Persistence runner exported.")],
  ["all-diagnostic-runners-excluded", () => assert(Object.keys(researchRepository).every((key) => !key.toLowerCase().includes("diagnostic")), "Diagnostic runner exported.")],
  ["no-circular-production-dependency", ({ graph }) => assert(!hasCycle(graph), "Production cycle found.")],
  ["persistence-sport-agnostic", ({ persistenceSource }) => assert(!/\b(football|quarterback|qb|player|team|coach|coverage|scheme|draft|prospect)\b/i.test(persistenceSource), "Sport vocabulary found.")],
  ["no-fid-dependency", ({ persistenceSource }) => assert(!/footballintelligencedatabase|\bfid\b/i.test(persistenceSource), "FID dependency found.")],
  ["no-ontology-dependency", ({ persistenceSource }) => assert(!/ontology/i.test(persistenceSource), "Ontology dependency found.")],
  ["no-engine-dependency", ({ persistenceSource }) => assert(!/engines?\//i.test(persistenceSource), "Engine dependency found.")],
  ["no-ui-dependency", ({ persistenceSource }) => assert(!/components?\/|pages?\/|routes?\//i.test(persistenceSource), "UI dependency found.")],
  ["no-storage-vendor-dependency", ({ persistenceSource }) => assert(!/supabase|postgres|indexeddb|localstorage|firebase|mongodb/i.test(persistenceSource), "Storage vendor dependency found.")],
  ["factory-no-mutation", ({ recordSet }) => { const input = createRequest(researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, clone(recordSet[researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE])); const before = JSON.stringify(input); researchRepository.createPersistenceRequest(input); assert(JSON.stringify(input) === before, "Factory mutated input."); }],
  ["validator-no-mutation", ({ recordSet }) => { const input = createRequest(researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, clone(recordSet[researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE])); const before = JSON.stringify(input); researchRepository.validatePersistenceRequest(input); assert(JSON.stringify(input) === before, "Validator mutated input."); }],
  ["stable-normalization", ({ recordSet }) => { const input = createRequest(researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE, recordSet[researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE]); assert(JSON.stringify(researchRepository.createPersistenceRequest(input)) === JSON.stringify(researchRepository.createPersistenceRequest(input)), "Normalization unstable."); }],
  ["structured-diagnostic-summary", ({ summaries }) => assert(Object.values(summaries).every((summary) => ["suite", "total", "passed", "failed", "cases"].every((key) => Object.hasOwn(summary, key))), "Existing summary unstructured.")],
  ["production-module-integrity", () => assert(PERSISTENCE_EXPORTS.every((name) => researchRepository[name] != null), "Production persistence module incomplete.")],
];

function buildContext() {
  const files = productionFiles();
  const persistenceSource = files
    .filter((file) => file.includes("persistence"))
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
  return {
    recordSet: records(),
    summaries: existingSummaries(),
    graph: productionGraph(),
    persistenceSource,
  };
}

export function runResearchRepositoryPersistenceDiagnostics({ throwOnFailure = false } = {}) {
  const context = buildContext();
  const cases = CASES.map(([id, execute]) => {
    try { execute(context); return { id, passed: true, message: `${id} passed.`, details: null }; }
    catch (error) { return { id, passed: false, message: typeof error?.message === "string" ? error.message : `${id} failed.`, details: error?.details ?? null }; }
  });
  const passed = cases.filter((entry) => entry.passed).length;
  const failed = cases.length - passed;
  const summary = {
    suite: SUITE,
    contractVersion: researchRepository.RESEARCH_REPOSITORY_PERSISTENCE_CONTRACT_VERSION,
    schemaVersion: researchRepository.RESEARCH_REPOSITORY_PERSISTENCE_SCHEMA_VERSION,
    total: cases.length,
    passed,
    failed,
    cases,
    existingSuiteSummaries: context.summaries,
  };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runResearchRepositoryPersistenceDiagnostics });
