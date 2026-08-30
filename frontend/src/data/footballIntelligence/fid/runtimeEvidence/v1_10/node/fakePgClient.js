export function createFakePgClientHarness(configuration = {}) {
  const metrics = { factoryCount: 0, clientCount: 0, connectCount: 0, queryCount: 0, activeQueryCount: 0, maximumConcurrentQueryCount: 0, beginCount: 0, rollbackCount: 0, commitCount: 0, endCount: 0, errorEventCount: 0, endEventCount: 0, cancellationRequestCount: 0, poolCount: 0, networkCalls: 0, dnsCalls: 0, socketCalls: 0, environmentReads: 0, realSqlExecutions: 0, orderedQueries: [], lifecycle: [] };
  const listeners = new Map();
  class FakeClient {
    constructor() { metrics.clientCount += 1; metrics.lifecycle.push("CLIENT_CONSTRUCTED"); }
    on(type, listener) { listeners.set(type, listener); return this; }
    async connect() { metrics.connectCount += 1; metrics.lifecycle.push("CONNECT"); if (configuration.failAt === "CONNECT") throw Object.assign(new Error("synthetic connect failure"), { code: "SYNTHETIC_CONNECT_FAILURE" }); }
    async query(config) { const text = typeof config === "string" ? config : config?.text; metrics.queryCount += 1; if (text === "BEGIN") metrics.beginCount += 1; if (text === "ROLLBACK") metrics.rollbackCount += 1; if (text === "COMMIT") metrics.commitCount += 1; metrics.activeQueryCount += 1; metrics.maximumConcurrentQueryCount = Math.max(metrics.maximumConcurrentQueryCount, metrics.activeQueryCount); metrics.orderedQueries.push(text); metrics.lifecycle.push(`QUERY:${text}`); try { if (configuration.holdQuery) await configuration.holdQuery(text); if (configuration.disconnectAt === text) { listeners.get("end")?.(); metrics.endEventCount += 1; throw Object.assign(new Error("synthetic disconnect"), { code: "PG_DISCONNECT", uncertain: true }); } if (configuration.failAt === text) throw Object.assign(new Error(`synthetic failure ${text}`), { code: "SYNTHETIC_QUERY_FAILURE", stack: "RAW STACK", detail: text }); return configuration.results?.[text] ?? { command: text, rowCount: 0, rows: [] }; } finally { metrics.activeQueryCount -= 1; } }
    async end() { metrics.endCount += 1; metrics.lifecycle.push("END"); if (configuration.failAt === "END") throw Object.assign(new Error("synthetic end failure"), { code: "SYNTHETIC_END_FAILURE", uncertain: true }); }
  }
  const ClientConstructor = class extends FakeClient { constructor(config) { super(config); metrics.factoryCount += 1; } };
  return Object.freeze({ ClientConstructor, metrics });
}
