import { deepFreeze } from "./contractSupport.js";

export function createDeterministicFakePostgresDriver(configuration = {}) {
  const counts = { invocation: 0, connection: 0, begin: 0, rollback: 0, commit: 0, release: 0 };
  const stageCounts = new Map();
  const history = [];
  const connection = Object.freeze({ fixtureConnection: true });
  const connectionRef = configuration.connectionRef ?? "fixture-connection-1";
  const record = (type, detail = null) => history.push(deepFreeze({ sequence: history.length + 1, type, detail }));
  const response = (point, fallback) => ({ ...fallback, ...(configuration.responses?.[point] ?? {}) });
  return Object.freeze({
    classification: "DETERMINISTIC_IN_MEMORY_FAKE_POSTGRES_DRIVER",
    get metrics() { return deepFreeze({ ...counts, perStage: Object.fromEntries(stageCounts), history: [...history], networkCalls: 0, filesystemCalls: 0, processSpawns: 0, environmentReads: 0, realExecutions: 0 }); },
    async acquireDedicatedConnection() { counts.invocation += 1; counts.connection += 1; record("CONNECTION_ACQUISITION_REQUESTED"); if (configuration.cancelAt === "BEFORE_CONNECTION") return response("acquire", { state: "CANCELLED" }); return response("acquire", { state: "ACQUIRED", connection, connectionRef, sessionRef: configuration.sessionRef ?? "fixture-session-1" }); },
    async beginTransaction(value) { counts.begin += 1; record("TRANSACTION_BEGIN_REQUESTED", value.connectionRef); return response("begin", { state: "ACKNOWLEDGED", connection, connectionRef, transactionRef: configuration.transactionRef ?? "fixture-transaction-1" }); },
    async executeGovernedStage(value) { const count = (stageCounts.get(value.stageRef) ?? 0) + 1; stageCounts.set(value.stageRef, count); record("STAGE_SUBMITTED", value.stageRef); const configured = configuration.responses?.[`stage:${value.stageRef}`] ?? {}; return { state: "ACKNOWLEDGED", completionState: "COMPLETED", connection, connectionRef, transactionRef: configuration.transactionRef ?? "fixture-transaction-1", result: null, ...configured }; },
    async requestRollback(value) { counts.rollback += 1; record("ROLLBACK_REQUESTED", value.transactionRef); return response("rollback", { state: "OBSERVED", connection, connectionRef, transactionRef: configuration.transactionRef ?? "fixture-transaction-1" }); },
    async requestCommit(value) { counts.commit += 1; record("COMMIT_REQUESTED", value.transactionRef); return response("commit", { state: "OBSERVED", connection, connectionRef, transactionRef: configuration.transactionRef ?? "fixture-transaction-1" }); },
    async releaseConnection(value) { counts.release += 1; record("CONNECTION_RELEASE_REQUESTED", value.connectionRef); return response("release", { state: "RELEASED", connection, connectionRef }); },
  });
}
