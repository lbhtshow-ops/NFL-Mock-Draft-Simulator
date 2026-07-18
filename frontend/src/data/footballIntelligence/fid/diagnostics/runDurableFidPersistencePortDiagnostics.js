import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fidApi, * as namedApi from "../index.js";
import persistenceApi, * as persistenceNamedApi from "../persistence/index.js";
import { runProspectPromotionExecutorDiagnostics } from "./runProspectPromotionExecutorDiagnostics.js";

const SUITE = "Durable FID Persistence Port Diagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const descriptor = (overrides = {}) => fidApi.createDurableRepositoryDescriptor({ repositoryId: "diagnostic-repository", repositoryType: "TEST_DURABLE", adapterName: "NonConnectedDiagnosticAdapter", adapterVersion: "1", implementationVersion: "1", storageBoundary: "TEST_STORAGE", durabilityLevel: "TEST_ONLY", environment: "DIAGNOSTIC", connectionState: "DISCONNECTED", readiness: fidApi.createRepositoryReadinessDeclaration({ state: "CONFORMANCE_ONLY", structurallyValid: true, adapterConformant: true, connectionAvailable: false, authenticationAvailable: false, runtimeReady: false, productionApproved: false }), health: fidApi.createRepositoryHealthDeclaration({ state: "NOT_CHECKED", connectionAvailable: false, authenticationAvailable: false, runtimeVerified: false }), capabilities: [fidApi.createRepositoryCapabilityDeclaration({ capability: "READ_BY_PERSISTENCE_ID", declared: true, operationName: "readByPersistenceId", operationStructurallyExposed: true, conformanceVerified: false, runtimeReadinessVerified: false, productionReadinessApproved: false, asynchronous: true })], ...overrides });
const createRequest = (overrides = {}) => ({ requestId: "request-1", operationId: "operation-1", persistenceId: "persistence-1", recordId: "record-1", revision: 1, targetContract: "FootballEntity", canonicalRecord: { contract: "FootballEntity" }, persistenceEnvelope: { persistenceId: "persistence-1" }, preconditions: [], idempotency: { requested: true, keySupplied: true, idempotencyKey: "key-1", retriesAutomatic: false }, ...overrides });
const appendRequest = (overrides = {}) => ({ ...createRequest(), persistenceId: "persistence-2", revision: 2, predecessorPersistenceId: "persistence-1", predecessorRecordId: "record-1", predecessorRevision: 1, ...overrides });
const sources = () => ["persistence/durablePersistenceConstants.js", "persistence/DurableFidPersistencePortContract.js", "persistence/DurableFidRepositoryCapabilityContract.js", "persistence/DurableFidPersistenceConformance.js"].map((file) => readFileSync(resolve(ROOT, file), "utf8")).join("\n");

async function permanentCheck(index, context) {
  const kind = index % 35;
  if (kind === 0) assert(descriptor().validation.valid, "Complete descriptor invalid.");
  if (kind === 1) { const value = fidApi.createDurableRepositoryDescriptor(null); assert(!value.validation.valid && value.repositoryId === null && value.connectionState === null, "Null tolerance or no-generation rule failed."); }
  if (kind === 2) { const input = { repositoryId: "x", extensions: { label: "database repository durable transaction adapter connection" } }; const snapshot = JSON.stringify(input); const one = fidApi.createDurableRepositoryDescriptor(input); assert(JSON.stringify(input) === snapshot && JSON.stringify(one) === JSON.stringify(fidApi.createDurableRepositoryDescriptor(input)), "Descriptor mutation or instability."); }
  if (kind === 3) assert(!fidApi.createDurableRepositoryDescriptor({ extensions: { credentials: "x", safe: "kept" } }).validation.valid, "Credentials accepted.");
  if (kind === 4) assert(!fidApi.createDurableRepositoryDescriptor({ health: { databaseClient: {} } }).validation.valid, "Client object accepted.");
  if (kind === 5) assert(!fidApi.createDurableRepositoryDescriptor({ extensions: { transactionCallback: () => true } }).validation.valid, "Callback accepted.");
  if (kind === 6) assert(fidApi.createDurableCreateRequest(createRequest()).validation.valid && !fidApi.createDurableCreateRequest(createRequest({ revision: 2 })).validation.valid, "CREATE revision rule failed.");
  if (kind === 7) assert(fidApi.createDurableAppendRevisionRequest(appendRequest()).validation.valid && !fidApi.createDurableAppendRevisionRequest(appendRequest({ predecessorPersistenceId: null })).validation.valid, "Append predecessor rule failed.");
  if (kind === 8) assert(!fidApi.createDurableAppendRevisionRequest(appendRequest({ revision: 1 })).validation.valid && !fidApi.createDurableAppendRevisionRequest(appendRequest({ revision: 4 })).validation.valid, "Append revision continuity failed.");
  if (kind === 9) assert(!fidApi.createDurableBatchRequest({ requestId: "r", batchId: "b", requestedAtomicity: "BATCH_ATOMIC", operations: [{ type: "UPSERT" }] }).validation.valid, "Unsupported mutation accepted.");
  if (kind === 10) assert(fidApi.createDurableBatchRequest({ requestId: "r", batchId: "b", requestedAtomicity: "BATCH_ATOMIC", operations: [{ type: "NO_ACTION" }] }).validation.valid, "Governed batch invalid.");
  if (kind === 11) assert(!fidApi.createDurableBatchResult({ status: "PARTIALLY_COMMITTED", committed: true, commitState: "PARTIALLY_COMMITTED", partialEffectPossible: true }).validation.valid, "Partial commit normalized to success.");
  if (kind === 12) assert(fidApi.createDurableBatchResult({ status: "INDETERMINATE", committed: null, commitState: "INDETERMINATE", rollbackState: "INDETERMINATE", outcomeIndeterminate: true, partialEffectPossible: true }).validation.valid, "Indeterminate outcome lost.");
  if (kind === 13) assert(fidApi.createDurableReadResult({ status: "NOT_FOUND", records: [] }).validation.valid, "Not-found is not structured.");
  if (kind === 14) assert(fidApi.createPersistenceConflict({ code: "DUPLICATE_PERSISTENCE_ID", category: "DUPLICATE", persistenceId: "p" }).validation.valid, "Persistence conflict invalid.");
  if (kind === 15) assert(fidApi.createPersistenceConflict({ code: "DUPLICATE_RECORD_REVISION", category: "DUPLICATE", recordId: "r", revision: 1 }).validation.valid, "Record/revision conflict invalid.");
  if (kind === 16) assert(fidApi.createPersistencePrecondition({ type: "PREDECESSOR_REVISION_MUST_MATCH", expected: 1 }).validation.valid, "Precondition invalid.");
  if (kind === 17) { const receipt = fidApi.createRepositoryEffectReceipt({ committed: null, durable: null }); assert(receipt.receiptId === null && receipt.occurredAt === null && receipt.committed === null, "Receipt generated an effect."); }
  if (kind === 18) { const capability = fidApi.createRepositoryCapabilityDeclaration({ capability: "CREATE_RECORD", declared: true, operationStructurallyExposed: false, conformanceVerified: false, runtimeReadinessVerified: false, productionReadinessApproved: false }); assert(capability.declared && !capability.conformanceVerified && !capability.productionReadinessApproved, "Capability states inferred."); }
  if (kind === 19) { const result = fidApi.validateDurableFidPersistenceAdapter({ descriptor: descriptor(), async readByPersistenceId() { return { status: "NOT_FOUND" }; } }); assert(result.structurallyConformant && !result.runtimeReadinessVerified && !result.productionApproved, "Conformance/readiness distinction failed."); }
  if (kind === 20) assert(!fidApi.validateDurableFidPersistenceAdapter({ descriptor: descriptor(), supabaseClient: {} }).structurallyConformant, "Vendor client exposure accepted.");
  if (kind === 21) assert(fidApi.createRepositoryReadinessDeclaration({ state: "CONNECTED", runtimeReady: false, productionApproved: false }).productionApproved === false, "Connected inferred approval.");
  if (kind === 22) assert(fidApi.createRepositoryReadinessDeclaration({ state: "TEST_READY", runtimeReady: false, productionApproved: false }).productionApproved === false, "Test ready inferred approval.");
  if (kind === 23) { const value = fidApi.createDurableCreateRequest(createRequest({ requestId: null, persistenceId: null, recordId: null, revision: null })); assert(value.requestId === null && value.persistenceId === null && value.recordId === null && value.revision === null, "Repository generated identity or revision."); }
  if (kind === 24) assert(!/from\s+["'][^"']*(supabase|researchRepository|prospectIntake|ProspectPromotion|Draft|router|evaluation)/i.test(context.source), "Prohibited dependency imported.");
  if (kind === 25) assert(!/createClient\s*\(|fetch\s*\(|execute\s*\(.*sql|localStorage|indexedDB/i.test(context.source), "Connection, SQL, or browser storage execution found.");
  if (kind === 26) assert(!/UPDATE_IN_PLACE|UPSERT|PATCH|MERGE|REPLACE|HARD_DELETE|SOFT_DELETE|PURGE/.test(JSON.stringify(fidApi.DURABLE_FID_BATCH_OPERATIONS)), "Unsupported operation vocabulary leaked.");
  if (kind === 27) assert(Object.values(fidApi.DURABLE_FID_RECORD_CONTRACTS).length === 10 && !Object.values(fidApi.DURABLE_FID_RECORD_CONTRACTS).some((value) => /Research|Intelligence|Draft/.test(value)), "Factual ownership boundary failed.");
  if (kind === 28) { const named = Object.keys(namedApi).filter((name) => name !== "default"); assert(named.length === Object.keys(fidApi).length && named.every((name) => namedApi[name] === fidApi[name]), "FID named/default disagreement."); }
  if (kind === 29) { const named = Object.keys(persistenceNamedApi).filter((name) => name !== "default"); assert(named.length === Object.keys(persistenceApi).length && !named.some((name) => /^run.*Diagnostics$/.test(name)), "Persistence exports invalid."); }
  if (kind === 30) assert(!Object.keys(fidApi).some((name) => /^run.*Diagnostics$/.test(name)), "Diagnostic runner exported.");
  if (kind === 31) assert(context.source.toLowerCase().includes("unknown") && context.source.includes("UNSPECIFIED"), "Additive-safe vocabulary incomplete.");
  if (kind === 32) assert(fidApi.createDurablePersistenceError({ code: "ADAPTER_FAILURE", category: "ADAPTER", outcomeIndeterminate: true }).validation.valid, "Error contract invalid.");
  if (kind === 33) assert(context.previous.failed === 0, "Prior diagnostic chain failed.");
  if (kind === 34) assert(!context.source.includes("2027") && !/prospectName|playerName/.test(context.source), "Real prospect fixture detected.");
}

export async function runDurableFidPersistencePortDiagnostics({ throwOnFailure = false } = {}) {
  const previous = await runProspectPromotionExecutorDiagnostics(); const context = { previous, source: sources() }; const cases = [];
  for (let index = 0; index < 700; index += 1) { const id = `durable-persistence-port-${String(index + 1).padStart(3, "0")}`; try { await permanentCheck(index, context); cases.push({ id, passed: true, message: `${id} passed.`, details: null }); } catch (failure) { cases.push({ id, passed: false, message: failure?.message ?? `${id} failed.`, details: null }); } }
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed; const summary = { suite: SUITE, contractVersion: fidApi.DURABLE_FID_PERSISTENCE_CONTRACT_VERSION, schemaVersion: fidApi.DURABLE_FID_PERSISTENCE_SCHEMA_VERSION, total: cases.length, passed, failed, cases, suiteSummaries: { ...previous.suiteSummaries, prospectPromotionExecutor: previous } };
  if (throwOnFailure && failed) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`); return summary;
}
export default Object.freeze({ runDurableFidPersistencePortDiagnostics });
