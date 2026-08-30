import { mapPgResult } from "./pgResultMapper.js";
import { mapPgError } from "./pgErrorMapper.js";

const driverError = (code, uncertain = false) => Object.assign(new Error(code), { code, uncertain });
export function createPgClientDriver({ factory, configuration = {}, profile, timeoutCancellation = null } = {}) {
  const stages = new Map((profile?.stages ?? []).map((stage) => [stage.stageRef, stage]));
  const metrics = { acquisition: 0, connect: 0, begin: 0, rollback: 0, commit: 0, release: 0, retry: 0, reconnect: 0, replacementClient: 0, activeQueries: 0, maximumConcurrentQueries: 0, stageOrder: [], lifecycle: [], lastError: null };
  let wrapper = null, connected = false, transactionActive = false, terminal = false, nextSequence = 1, ended = false;
  const guardedQuery = async (text, phase, stageRef = null) => {
    if (metrics.activeQueries) throw driverError("CONCURRENT_QUERY_PROHIBITED");
    metrics.activeQueries += 1; metrics.maximumConcurrentQueries = Math.max(metrics.maximumConcurrentQueries, metrics.activeQueries); metrics.lifecycle.push(`${phase}_REQUESTED`);
    try { const result = await wrapper.client.query({ text }); metrics.lifecycle.push(`${phase}_COMPLETED`); return result; }
    catch (error) { terminal = true; const uncertain = phase !== "BEGIN"; metrics.lastError = mapPgError(error, { stageRef, transactionPhase: phase, uncertainty: uncertain }); throw driverError(error?.code ?? "PG_QUERY_FAILURE", uncertain || error?.uncertain === true); }
    finally { metrics.activeQueries -= 1; }
  };
  return Object.freeze({
    classification: "NODE_ONLY_PRODUCTION_SHAPED_PG_CLIENT_DRIVER",
    get metrics() { return Object.freeze({ ...metrics, lifecycle: [...metrics.lifecycle], stageOrder: [...metrics.stageOrder], factory: factory?.metrics ?? null }); },
    async acquireDedicatedConnection() {
      if (wrapper || terminal) throw driverError("SECOND_CONNECTION_PROHIBITED");
      if (timeoutCancellation?.isCancelled?.()) throw driverError("CANCELLED_BEFORE_CONNECT");
      metrics.acquisition += 1; metrics.lifecycle.push("CLIENT_ACQUISITION_REQUESTED"); wrapper = await factory.acquireClient(configuration); metrics.lifecycle.push("CLIENT_ACQUIRED");
      try { metrics.connect += 1; metrics.lifecycle.push("CONNECT_REQUESTED"); await wrapper.client.connect(); connected = true; metrics.lifecycle.push("CONNECT_COMPLETED"); }
      catch (error) { terminal = true; metrics.lastError = mapPgError(error, { connectionPhase: "CONNECT" }); try { metrics.release += 1; metrics.lifecycle.push("END_REQUESTED"); await wrapper.client.end(); ended = true; wrapper.markEnded(); metrics.lifecycle.push("END_COMPLETED"); } catch { metrics.lastError = mapPgError(error, { connectionPhase: "END", uncertainty: true }); } throw driverError(error?.code ?? "PG_CONNECT_FAILURE"); }
      return Object.freeze({ state: "ACQUIRED", connection: wrapper.client, connectionRef: wrapper.connectionRef, sessionRef: wrapper.sessionRef });
    },
    async beginTransaction({ connection, connectionRef }) {
      if (!connected || terminal || connection !== wrapper?.client || connectionRef !== wrapper?.connectionRef || metrics.begin) throw driverError("BEGIN_PRECONDITION_FAILED");
      metrics.begin += 1; await guardedQuery("BEGIN", "BEGIN"); transactionActive = true;
      return Object.freeze({ state: "ACKNOWLEDGED", connection, connectionRef, transactionRef: `ref:pg-transaction:${metrics.begin}` });
    },
    async executeGovernedStage(value) {
      const expected = stages.get(value.stageRef);
      if (!connected || !transactionActive || terminal) throw driverError("STAGE_AFTER_TERMINAL_OR_INACTIVE_TRANSACTION");
      if (!expected) throw driverError("UNPLANNED_STAGE_PROHIBITED");
      if (metrics.stageOrder.includes(value.stageRef)) throw driverError("DUPLICATE_STAGE_PROHIBITED");
      if (value.sequence !== nextSequence || expected.sequence !== nextSequence) throw driverError("STAGE_ORDER_INVALID");
      if (value.stageType !== expected.stageType || value.payloadText !== expected.payloadText || value.payloadDigest !== expected.payloadDigest) throw driverError("STAGE_BINDING_MISMATCH");
      const raw = await guardedQuery(expected.payloadText, expected.stageType === "BOUNDED_OBSERVATION" ? "OBSERVATION_QUERY" : "STAGE_QUERY", value.stageRef);
      let result;
      try { result = mapPgResult(raw, { stageRef: value.stageRef, transactionRef: value.transactionRef }, profile.outputPolicy); }
      catch (error) { terminal = true; metrics.lastError = mapPgError(error, { stageRef: value.stageRef, transactionPhase: "RESULT_MAPPING", uncertainty: false }); throw error; }
      metrics.stageOrder.push(value.stageRef); nextSequence += 1;
      return Object.freeze({ state: "ACKNOWLEDGED", completionState: "COMPLETED", connection: value.connection, connectionRef: value.connectionRef, transactionRef: value.transactionRef, result });
    },
    async requestRollback(value) {
      if (!transactionActive || terminal || metrics.rollback || metrics.commit) throw driverError("ROLLBACK_PRECONDITION_FAILED", terminal);
      metrics.rollback += 1; await guardedQuery("ROLLBACK", "ROLLBACK"); transactionActive = false;
      return Object.freeze({ state: "OBSERVED", connection: value.connection, connectionRef: value.connectionRef, transactionRef: value.transactionRef });
    },
    async requestCommit() { metrics.commit += 1; terminal = true; throw driverError("COMMIT_PROHIBITED"); },
    async releaseConnection(value) {
      if (!wrapper || ended) throw driverError("CLIENT_END_REUSE_PROHIBITED", true);
      metrics.release += 1; metrics.lifecycle.push("END_REQUESTED");
      try { await wrapper.client.end(); ended = true; wrapper.markEnded(); connected = false; metrics.lifecycle.push("END_COMPLETED"); return Object.freeze({ state: "RELEASED", connection: value.connection, connectionRef: value.connectionRef }); }
      catch (error) { terminal = true; metrics.lastError = mapPgError(error, { connectionPhase: "END", uncertainty: true }); throw driverError(error?.code ?? "PG_END_FAILURE", true); }
    },
  });
}
