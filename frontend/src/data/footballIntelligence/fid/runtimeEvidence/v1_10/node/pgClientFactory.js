import pg from "pg";

const { Client } = pg;
const forbidden = /(password|connectionString|ssl|host|user)/i;
export function createPgClientFactory({ ClientConstructor = Client, credentialProvider, targetAttestationProvider } = {}) {
  let acquisitions = 0, clients = 0, ended = false;
  return Object.freeze({
    classification: "NODE_ONLY_PG_CLIENT_FACTORY",
    get metrics() { return Object.freeze({ acquisitions, clients, poolCount: 0, credentialProviderCalls: credentialProvider?.callCount ?? 0 }); },
    async acquireClient(configuration = {}) {
      if (acquisitions || ended) throw Object.assign(new Error("PG_CLIENT_SECOND_ACQUISITION_PROHIBITED"), { code: "PG_CLIENT_SECOND_ACQUISITION_PROHIBITED" });
      if (Object.keys(configuration).some((key) => forbidden.test(key))) throw Object.assign(new Error("PG_CONFIGURATION_SECRET_FIELD_PROHIBITED"), { code: "PG_CONFIGURATION_SECRET_FIELD_PROHIBITED" });
      acquisitions += 1;
      const attestation = await targetAttestationProvider?.attest?.(configuration);
      const credentials = await credentialProvider?.provide?.(configuration.credentialProviderRef);
      const client = new ClientConstructor({ application_name: configuration.applicationName, port: configuration.port, database: configuration.databaseName, connectionTimeoutMillis: configuration.connectTimeoutMs, ...(credentials ?? {}) });
      clients += 1;
      return Object.freeze({ client, connectionRef: `ref:pg-client:${clients}`, sessionRef: `ref:pg-session:${clients}`, attestation, markEnded() { ended = true; } });
    },
  });
}

export function createSyntheticCredentialProvider({ fail = false } = {}) { let calls = 0; return Object.freeze({ get callCount() { return calls; }, async provide() { calls += 1; if (fail) throw Object.assign(new Error("CREDENTIAL_PROVIDER_FAILED"), { code: "CREDENTIAL_PROVIDER_FAILED" }); return Object.freeze({ password: "FAKE-ONLY-NEVER-EVIDENCE" }); } }); }
export function createDeclaredTargetAttestationProvider() { return Object.freeze({ async attest(configuration) { return Object.freeze({ sourceClassification: "DECLARED", targetRef: configuration.targetRef ?? null, environmentRef: configuration.environmentRef ?? null, endpointRef: configuration.endpointRef ?? null, databaseName: configuration.databaseName ?? null, roleRef: configuration.roleRef ?? null, connectionMode: configuration.connectionMode ?? null }); } }); }
