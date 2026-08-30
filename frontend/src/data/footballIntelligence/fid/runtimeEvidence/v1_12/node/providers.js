const freeze = (value) => Object.freeze(value);
const CLASSIFICATION = freeze(["DECLARED", "FIXTURE_ONLY", "SYNTHETIC", "NOT_PLATFORM_ATTESTED", "NOT_CONNECTION_OBSERVED", "NOT_DATABASE_OBSERVED", "NOT_EXTERNALLY_VERIFIED"]);

export function assertTargetAttestationProvider(provider) {
  if (!provider || typeof provider.getTargetAttestation !== "function") throw Object.assign(new TypeError("TARGET_PROVIDER_INVALID"), { code: "TARGET_PROVIDER_INVALID" });
  return provider;
}

export function createDeterministicFakeTargetAttestationProvider(configuration = {}) {
  let calls = 0; const history = [];
  const base = { organization: "Lunch Break Hot Take", projectName: "LBHT FID Persistence Test", projectReference: "ahmorpzcaapvoymiqlkv", region: "us-east-1", branch: "main", databaseSource: "Primary Database", governedEnvironment: "DEDICATED_NON_PRODUCTION_TEST", endpointReference: "fake:direct:ahmorpzcaapvoymiqlkv", port: 5432, databaseName: "postgres", expectedRoleReference: "ref:role:fake-ref-executor", connectionMode: "DIRECT", tlsPolicyReference: "ref:tls:official-supabase-ca-review-required" };
  return freeze({ providerType: "DETERMINISTIC_FAKE_TARGET_ATTESTATION_PROVIDER", get callCount() { return calls; }, get history() { return freeze(history.map(freeze)); }, async getTargetAttestation(request) { calls += 1; history.push({ sequence: calls, request: freeze({ ...request }) }); if (configuration.cancelled) return freeze({ status: "CANCELLED", classification: CLASSIFICATION }); if (configuration.failure) return freeze({ status: "FAILED", code: "SYNTHETIC_TARGET_PROVIDER_FAILURE", classification: CLASSIFICATION }); const declarations = { ...base, ...(configuration.declarations ?? {}) }; for (const field of configuration.missingFields ?? []) delete declarations[field]; return freeze({ status: "ACQUIRED", providerReference: "ref:provider:fake-target-v1-12", declarations: freeze(declarations), fieldClassifications: freeze(Object.fromEntries(Object.keys(declarations).map((key) => [key, CLASSIFICATION]))), contradictoryFields: freeze([...(configuration.contradictoryFields ?? [])]), unresolvedBindings: freeze([...(configuration.unresolvedBindings ?? [])]), limitations: freeze(["FIXTURE_ONLY", "NO_PLATFORM_ATTESTATION", "NO_ENDPOINT_OBSERVATION"]) }); } });
}

export function assertCredentialProvider(provider) {
  if (!provider || typeof provider.getCredential !== "function") throw Object.assign(new TypeError("CREDENTIAL_PROVIDER_INVALID"), { code: "CREDENTIAL_PROVIDER_INVALID" });
  return provider;
}

export function createDeterministicFakeCredentialProvider(configuration = {}) {
  let calls = 0; const history = []; const syntheticValue = configuration.syntheticValue ?? "REF_V1_12_SYNTHETIC_PRIVATE_CREDENTIAL_DO_NOT_USE";
  return freeze({ providerType: "DETERMINISTIC_FAKE_CREDENTIAL_PROVIDER", get callCount() { return calls; }, get history() { return freeze(history.map(freeze)); }, async getCredential(request) { calls += 1; history.push({ sequence: calls, request: freeze({ ...request }) }); const metadata = freeze({ providerReference: "ref:provider:fake-credential-v1-12", providerType: "DETERMINISTIC_FAKE", acquisitionStatus: configuration.failure ? "FAILED" : configuration.cancelled ? "CANCELLED" : configuration.missing ? "MISSING" : "ACQUIRED", credentialPresent: !configuration.failure && !configuration.cancelled && !configuration.missing, expiry: configuration.expired ? "EXPIRED" : "UNKNOWN", rotation: configuration.rotationRequired ? "REQUIRED" : "UNKNOWN", operatorCancelled: configuration.cancelled === true, classification: CLASSIFICATION, limitations: freeze(["SYNTHETIC_PROVIDER_BEHAVIOR_ONLY", "NOT_REAL_CREDENTIAL_AVAILABILITY"]) }); return freeze({ metadata, usePrivateValue(consumer) { if (typeof consumer !== "function") throw new TypeError("PRIVATE_CONSUMER_REQUIRED"); return consumer(syntheticValue); } }); } });
}

export { CLASSIFICATION as FAKE_PROVIDER_CLASSIFICATION };
