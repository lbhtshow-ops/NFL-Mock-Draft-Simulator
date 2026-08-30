const freeze = (value) => Object.freeze(value);
const bounded = (value, max) => typeof value === "string" && value.length > 0 && value.length <= max && /^[A-Za-z0-9:_./-]+$/.test(value);
const fail = (code) => { throw Object.assign(new TypeError(code), { code }); };

export function buildApplicationName(correlationReference) {
  const fragment = String(correlationReference ?? "none").replace(/[^A-Za-z0-9]/g, "").slice(-16) || "none";
  const value = `ref-nonprod-${fragment}`; if (value.length > 63) fail("APPLICATION_NAME_TOO_LONG"); return value;
}

export function buildTimeoutConfiguration(overrides = {}) {
  const values = freeze({ connectTimeoutMs: 3000, queryTimeoutMs: 4000, statementTimeoutIntentMs: 3500, lockTimeoutIntentMs: 1000, idleInTransactionTimeoutIntentMs: 8000, controllerTimeoutMs: 20000, rollbackTimeoutMs: 3000, endTimeoutMs: 3000, ...overrides });
  if (Object.values(values).some((v) => !Number.isInteger(v) || v <= 0 || v > 60000)) fail("TIMEOUT_OUT_OF_BOUNDS");
  if (values.controllerTimeoutMs < Math.max(values.connectTimeoutMs, values.queryTimeoutMs, values.rollbackTimeoutMs, values.endTimeoutMs)) fail("CONTROLLER_TIMEOUT_TOO_SHORT");
  return freeze({ ...values, retryAllowed: false, serverSettingsApplied: false, timeoutAfterSubmissionPreservesUncertainty: true });
}

export const FAKE_TLS_DECLARATION = freeze({ tlsRequired: true, certificateVerificationRequired: true, hostnameValidationRequired: true, trustSource: "UNRESOLVED", officialSupabaseCaReviewRequired: true, rejectUnauthorizedFalseProhibited: true, runtimeSslConfigurationCreated: false, fixtureOnly: true });

export function buildSanitizedConnectionConfiguration({ target, credential, tls = FAKE_TLS_DECLARATION, timeouts = buildTimeoutConfiguration(), correlationReference, allowUnresolvedEndpoint = false } = {}) {
  const d = target?.declarations ?? {}; const m = credential?.metadata ?? {};
  if (target?.status !== "ACQUIRED") fail("TARGET_NOT_ACQUIRED");
  if (target.contradictoryFields?.length) fail("CONTRADICTORY_TARGET_DECLARATION");
  if (!m.credentialPresent || m.acquisitionStatus !== "ACQUIRED") fail(`CREDENTIAL_${m.acquisitionStatus ?? "INVALID"}`);
  if (m.expiry === "EXPIRED") fail("CREDENTIAL_EXPIRED");
  if (d.connectionMode !== "DIRECT") fail(d.connectionMode === "TRANSACTION_POOLER" ? "TRANSACTION_POOLER_PROHIBITED" : "UNSUPPORTED_CONNECTION_MODE");
  if (!d.endpointReference && !allowUnresolvedEndpoint) fail("ENDPOINT_REQUIRED");
  if (!Number.isInteger(d.port) || d.port < 1 || d.port > 65535) fail("PORT_OUT_OF_BOUNDS");
  if (!bounded(d.databaseName, 63)) fail("DATABASE_NAME_INVALID"); if (!bounded(d.expectedRoleReference, 160)) fail("ROLE_REFERENCE_INVALID");
  if (!tls.tlsRequired || !tls.certificateVerificationRequired || !tls.hostnameValidationRequired || tls.rejectUnauthorized === false) fail("TLS_POLICY_TOO_WEAK");
  const applicationName = buildApplicationName(correlationReference);
  const portable = freeze({ targetReference: d.projectReference, environmentReference: d.governedEnvironment, endpointReference: d.endpointReference ?? null, port: d.port, databaseName: d.databaseName, roleReference: d.expectedRoleReference, applicationName, connectionMode: d.connectionMode, tlsPolicyReference: d.tlsPolicyReference, targetProviderReference: target.providerReference, credentialProviderReference: m.providerReference, connectTimeoutMs: timeouts.connectTimeoutMs, limitations: freeze([...(target.unresolvedBindings ?? []), "TLS_TRUST_UNRESOLVED", "ROLE_AUTHORITY_UNPROVED", "FIXTURE_ONLY"]) });
  const privateDriverConfiguration = freeze({ fixtureOnly: true, nonRunnable: true, applicationName, port: d.port, databaseName: d.databaseName, connectTimeoutMs: timeouts.connectTimeoutMs, targetRef: d.projectReference, environmentRef: d.governedEnvironment, endpointRef: d.endpointReference ?? null, roleRef: d.expectedRoleReference, connectionMode: d.connectionMode });
  const privateCredentialBridge = freeze({ async provide() { return credential.usePrivateValue((password) => freeze({ password })); } });
  return freeze({ portable, privateDriverConfiguration, privateCredentialBridge });
}
