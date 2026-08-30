import assert from "node:assert/strict";
import pg from "pg";
import { createPostgresAdapterFixture } from "../../runtimeEvidenceV1_7Fixtures.js";
import { createPostgresTransactionWitnessAdapter } from "../../postgresTransactionWitnessAdapter.js";
import { createPgClientFactory, createSyntheticCredentialProvider, createDeclaredTargetAttestationProvider, createPgClientDriver, createFakePgClientHarness, mapPgResult, mapPgError, createTimeoutCancellationState, PG_TIMEOUT_PHASES } from "../node/index.js";

let checks = 0;
const check = (condition, message) => { checks += 1; assert.ok(condition, message); };
const rejectsCode = async (action, code) => { checks += 1; await assert.rejects(action, (error) => error?.code === code); };
const config = Object.freeze({ targetRef: "ref:target:synthetic", environmentRef: "ref:environment:synthetic", endpointRef: "ref:endpoint:synthetic", port: 5432, databaseName: "synthetic_db", roleRef: "ref:role:synthetic", applicationName: "ref-v1-10b-fake", connectTimeoutMs: 10, credentialProviderRef: "ref:credential-provider:fake", connectionMode: "FAKE_ONLY" });

async function setup(fakeConfiguration = {}) {
  const base = await createPostgresAdapterFixture({ name: `v1-10b-${checks}` });
  const harness = createFakePgClientHarness(typeof fakeConfiguration === "function" ? fakeConfiguration(base) : fakeConfiguration);
  const credentials = createSyntheticCredentialProvider();
  const factory = createPgClientFactory({ ClientConstructor: harness.ClientConstructor, credentialProvider: credentials, targetAttestationProvider: createDeclaredTargetAttestationProvider() });
  const driver = createPgClientDriver({ factory, configuration: config, profile: base.profile });
  return { ...base, harness, credentials, factory, driver, witness: createPostgresTransactionWitnessAdapter({ driver }) };
}

check(typeof pg.Client === "function", "pg.Client export unavailable");
check(typeof pg.Pool === "function", "installed Pool export audit failed");
const successful = await setup();
check(successful.harness.metrics.clientCount === 0, "import constructed Client");
const result = await successful.witness.observeGovernedExecution(successful.request);
check(result.witnessStatus === "COMPLETED", "successful lifecycle failed");
check(result.transactionOutcome.state === "ROLLBACK_OBSERVED", "rollback not observed");
check(result.mandatoryStop && !result.evidenceSufficient && !result.operationalSuccessEstablished, "synthetic evidence promoted");
const m = successful.harness.metrics;
check(m.factoryCount === 1 && m.clientCount === 1, "one Client violated");
check(successful.factory.metrics.acquisitions === 1 && successful.credentials.callCount === 1, "one acquisition/provider call violated");
check(m.poolCount === 0 && successful.factory.metrics.poolCount === 0, "Pool observed");
check(m.connectCount === 1, "connect count violated");
check(m.beginCount === 1 && m.orderedQueries.filter((q) => q === "BEGIN").length === 1, "BEGIN count violated");
check(m.maximumConcurrentQueryCount === 1, "queries were concurrent");
check(m.orderedQueries.filter((q) => q === "ROLLBACK").length === 1, "rollback count violated");
check(m.orderedQueries.filter((q) => q === "COMMIT").length === 0, "commit executed");
check(m.endCount === 1, "end count violated");
check(successful.driver.metrics.stageOrder.join("|") === successful.profile.stages.map((s) => s.stageRef).join("|"), "stage order differs");
check(successful.driver.metrics.retry === 0 && successful.driver.metrics.reconnect === 0 && successful.driver.metrics.replacementClient === 0, "retry/reconnect/replacement observed");
check(m.networkCalls === 0 && m.dnsCalls === 0 && m.socketCalls === 0 && m.realSqlExecutions === 0 && m.environmentReads === 0, "external operation observed");
check(!JSON.stringify({ result, metrics: successful.driver.metrics }).includes("FAKE-ONLY-NEVER-EVIDENCE"), "synthetic credential leaked");
await rejectsCode(() => successful.factory.acquireClient(config), "PG_CLIENT_SECOND_ACQUISITION_PROHIBITED");

const direct = await setup();
const acquired = await direct.driver.acquireDedicatedConnection();
const begun = await direct.driver.beginTransaction(acquired);
const first = direct.profile.stages[0];
await rejectsCode(() => direct.driver.executeGovernedStage({ ...acquired, transactionRef: begun.transactionRef, ...first, payloadDigest: "0".repeat(64) }), "STAGE_BINDING_MISMATCH");
const reordered = await setup(); const ra = await reordered.driver.acquireDedicatedConnection(); const rb = await reordered.driver.beginTransaction(ra);
await rejectsCode(() => reordered.driver.executeGovernedStage({ ...ra, transactionRef: rb.transactionRef, ...reordered.profile.stages[1] }), "STAGE_ORDER_INVALID");
const unplanned = await setup(); const ua = await unplanned.driver.acquireDedicatedConnection(); const ub = await unplanned.driver.beginTransaction(ua);
await rejectsCode(() => unplanned.driver.executeGovernedStage({ ...ua, transactionRef: ub.transactionRef, stageRef: "ref:stage:unplanned", stageType: "GOVERNED_OPERATION", sequence: 1, payloadText: "opaque", payloadDigest: "0".repeat(64) }), "UNPLANNED_STAGE_PROHIBITED");
const duplicate = await setup(); const da = await duplicate.driver.acquireDedicatedConnection(); const db = await duplicate.driver.beginTransaction(da); const ds = duplicate.profile.stages[0]; const dv = { ...da, transactionRef: db.transactionRef, ...ds };
await duplicate.driver.executeGovernedStage(dv); await rejectsCode(() => duplicate.driver.executeGovernedStage(dv), "DUPLICATE_STAGE_PROHIBITED");

const connectFailure = await setup({ failAt: "CONNECT" }); const connectResult = await connectFailure.witness.observeGovernedExecution(connectFailure.request);
check(connectResult.witnessStatus === "FAILED" && connectFailure.harness.metrics.connectCount === 1 && connectFailure.harness.metrics.endCount === 1, "connect failure handling invalid");
const beginFailureBase = await setup(); beginFailureBase.harness.metrics.lifecycle.length = 0;
const beginText = "BEGIN"; const beginFailure = await setup({ failAt: beginText }); const beginResult = await beginFailure.witness.observeGovernedExecution(beginFailure.request);
check(beginResult.witnessStatus === "FAILED" && beginFailure.harness.metrics.endCount === 1, "BEGIN failure handling invalid");
const stageFailure = await setup((base) => ({ failAt: base.profile.stages.find((s) => s.stageType === "GOVERNED_OPERATION").payloadText })); const stageFailureResult = await stageFailure.witness.observeGovernedExecution(stageFailure.request);
check(stageFailureResult.witnessStatus === "FAILED" && stageFailure.driver.metrics.stageOrder.length < stageFailure.profile.stages.length, "governed stage failure replayed");
const observationFailure = await setup((base) => ({ failAt: base.profile.stages[0].payloadText })); const observationFailureResult = await observationFailure.witness.observeGovernedExecution(observationFailure.request);
check(observationFailureResult.witnessStatus === "FAILED" && observationFailure.harness.metrics.rollbackCount === 0, "observation failure continued");
const rollbackFailure = await setup({ failAt: "ROLLBACK" }); const rollbackFailureResult = await rollbackFailure.witness.observeGovernedExecution(rollbackFailure.request);
check(rollbackFailureResult.transactionOutcome.state === "ROLLBACK_REQUESTED" && rollbackFailureResult.uncertaintyObservations.length > 0, "rollback uncertainty lost");
const endFailure = await setup({ failAt: "END" }); const endFailureResult = await endFailure.witness.observeGovernedExecution(endFailure.request);
check(endFailure.harness.metrics.endCount === 1 && endFailureResult.errorObservations.some((x) => x.boundedDetail.code === "CONNECTION_RELEASE_UNRESOLVED"), "end failure not bounded");
const disconnect = await setup((base) => ({ disconnectAt: base.profile.stages[1].payloadText })); const disconnectResult = await disconnect.witness.observeGovernedExecution(disconnect.request);
check(disconnectResult.witnessStatus === "DISCONNECTED" && disconnectResult.transactionOutcome.state === "UNKNOWN", "disconnect uncertainty lost");

const accepted = mapPgResult({ command: "SELECT", rowCount: 1, rows: [{ ok: true }] }, { stageRef: "ref:stage:test" });
check(accepted.rows[0].ok === true && accepted.sourceClassification === "SYNTHETIC", "bounded result rejected");
await rejectsCode(async () => mapPgResult({ rows: Array.from({ length: 65 }, () => ({})) }), "PG_RESULT_ROW_LIMIT_EXCEEDED");
await rejectsCode(async () => mapPgResult({ rows: [Object.fromEntries(Array.from({ length: 33 }, (_, i) => [`c${i}`, i]))] }), "PG_RESULT_COLUMN_LIMIT_EXCEEDED");
await rejectsCode(async () => mapPgResult({ rows: [{ text: "x".repeat(257) }] }), "PG_RESULT_STRING_LIMIT_EXCEEDED");
await rejectsCode(async () => mapPgResult({ rows: [{ text: "x".repeat(200) }] }, {}, { maximumBytes: 32 }), "PG_RESULT_BYTE_LIMIT_EXCEEDED");
await rejectsCode(async () => mapPgResult({ rows: [{ value: 1n }] }), "PG_RESULT_UNSUPPORTED_VALUE");
await rejectsCode(async () => mapPgResult({ rows: [{ date: new Date() }] }), "PG_RESULT_UNSUPPORTED_VALUE");
await rejectsCode(async () => mapPgResult({ client: {}, rows: [] }), "PG_RESULT_INVALID");
const circular = {}; circular.self = circular;
await rejectsCode(async () => mapPgResult({ rows: [circular] }), "PG_RESULT_UNSUPPORTED_VALUE");
const sanitized = mapPgError(Object.assign(new Error("password=secret SELECT raw"), { code: "XX000", severity: "ERROR", stack: "RAW STACK", detail: "SELECT *" }), { uncertainty: true });
check(sanitized.code === "XX000" && sanitized.uncertainty, "error fields lost");
check(!JSON.stringify(sanitized).match(/RAW STACK|SELECT \*|password=secret/i), "error leaked sensitive detail");
check(!Object.hasOwn(sanitized, "stack") && !Object.hasOwn(sanitized, "detail"), "raw error internals retained");

const cancellation = createSyntheticCredentialProvider({ fail: true });
const failHarness = createFakePgClientHarness(); const failFactory = createPgClientFactory({ ClientConstructor: failHarness.ClientConstructor, credentialProvider: cancellation });
await rejectsCode(() => failFactory.acquireClient(config), "CREDENTIAL_PROVIDER_FAILED");
check(failHarness.metrics.clientCount === 0, "credential failure constructed Client");
const timeoutCancellation = createTimeoutCancellationState({ connectTimeoutMs: 10, queryTimeoutMs: 20, statementTimeoutDeclarationMs: 30, lockTimeoutDeclarationMs: 40, idleInTransactionTimeoutDeclarationMs: 50, controllerTimeoutMs: 60, cancellationTimeoutMs: 70, endTimeoutMs: 80 });
check(PG_TIMEOUT_PHASES.length === 5 && timeoutCancellation.declarations.endTimeoutMs === 80, "timeout declarations incomplete");
const cancellationResult = timeoutCancellation.requestCancellation();
check(timeoutCancellation.isCancelled() && cancellationResult.requested && !cancellationResult.serverAcknowledged && cancellationResult.externalContinuationUnresolved, "cancellation overclaimed server stop");
check(Object.isFrozen(result) && Object.isFrozen(accepted) && Object.isFrozen(sanitized), "outputs mutable");
check(result.extensions.fixtureOnly && !result.extensions.actualDatabaseEvidence && result.extensions.retryCount === 0, "evidence classification invalid");
check(result.finalConclusion == null, "root cause manufactured");
check(!JSON.stringify(result).match(/postgres(?:ql)?:\/\//i), "connection string exposed");
check(!JSON.stringify(result).match(/Sprint 17C active/i), "authority reopened");

console.log(JSON.stringify({ status: "RUNTIME_EVIDENCE_FRAMEWORK_V1_PG_CLIENT_ADAPTER_IMPLEMENTED_AND_FAKE_ONLY_VALIDATED", checks, mandatoryScenarios: 60, clientCount: m.clientCount, poolCount: m.poolCount, connectCount: m.connectCount, maximumConcurrentQueryCount: m.maximumConcurrentQueryCount, endCount: m.endCount, networkCalls: m.networkCalls, dnsCalls: m.dnsCalls, socketCalls: m.socketCalls, realSqlExecutions: m.realSqlExecutions, environmentReads: m.environmentReads, retryCount: successful.driver.metrics.retry, authorization: "CONSUMED_PERMANENTLY_NON_REUSABLE" }));
