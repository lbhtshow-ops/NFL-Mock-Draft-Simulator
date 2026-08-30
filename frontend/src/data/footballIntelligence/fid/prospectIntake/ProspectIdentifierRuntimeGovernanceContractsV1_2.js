import { deepFreeze } from "./ProspectIdentityDryRunRequest.js";

export const RUNTIME_GOVERNANCE_CONTRACT_VERSION = "1.2.0";
export const RUNTIME_GOVERNANCE_ENVIRONMENTS = Object.freeze(["TEST", "DEVELOPMENT"]);
export const RUNTIME_GOVERNANCE_LAYERS = Object.freeze({ PERSON: "person", PLAYER: "player", PROSPECT: "prospect", PROSPECT_PROFILE: "prospect-profile" });
const candidatePattern = /^(person|player|prospect|prospect-profile):[A-Za-z0-9_-]{22}$/;
const prohibited = /entropy|randomBytes|seed|jwt|token|credential|secret|database|supabase|client|callback|function/i;
const text = (value, path, errors) => { if (typeof value !== "string" || !value.trim()) errors.push({ code: "REQUIRED_FIELD", path }); return typeof value === "string" ? value.trim() : null; };
const inspect = (value, errors, path = "") => {
  if (typeof value === "function") { errors.push({ code: "EXECUTABLE_PROHIBITED", path }); return; }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    const next = path ? `${path}.${key}` : key;
    if (prohibited.test(key) && child != null && child !== false) errors.push({ code: "PROHIBITED_FIELD", path: next });
    inspect(child, errors, next);
  }
};

export function createProspectIdentifierIssuerAttemptContextV1_1(input = {}) {
  const errors = []; inspect(input, errors);
  if (!Number.isInteger(input.attemptNumber) || input.attemptNumber < 1) errors.push({ code: "ATTEMPT_INVALID", path: "attemptNumber" });
  if (input.origin !== "ISSUER") errors.push({ code: "ISSUER_ORIGIN_REQUIRED", path: "origin" });
  return deepFreeze({ contract: "PROSPECT_IDENTIFIER_ISSUER_ATTEMPT_CONTEXT", contractVersion: "1.1.0", attemptContextRef: text(input.attemptContextRef, "attemptContextRef", errors), attemptNumber: input.attemptNumber ?? null, attemptPolicyRef: text(input.attemptPolicyRef, "attemptPolicyRef", errors), maximumAttempts: Number.isInteger(input.maximumAttempts) && input.maximumAttempts > 0 ? input.maximumAttempts : null, origin: input.origin ?? null, immutableAfterValidation: true, runtimeMayIncrement: false, providerMayIncrement: false, adapterMayIncrement: false, transactionPortMayIncrement: false, clientOwned: false, validation: { valid: !errors.length, errors } });
}

export function createProspectIdentifierGenerationInvocationV1_2(input = {}) {
  const errors = []; inspect(input, errors);
  const attempt = createProspectIdentifierIssuerAttemptContextV1_1(input.attemptContext);
  if (!attempt.validation.valid) errors.push(...attempt.validation.errors.map((error) => ({ ...error, path: `attemptContext.${error.path}` })));
  const fields = ["invocationRef", "generationResultRef", "requestRef", "operationRef", "authorizationRef", "identifierLayer", "namespace", "strategyRef", "conventionRef", "generatorPortRef", "adapterRef", "providerRef", "environment", "outputSizePolicyRef", "encodingPolicyRef"];
  const values = Object.fromEntries(fields.map((field) => [field, text(input[field], field, errors)]));
  if (RUNTIME_GOVERNANCE_LAYERS[values.identifierLayer] !== values.namespace) errors.push({ code: "LAYER_NAMESPACE_MISMATCH" });
  if (!RUNTIME_GOVERNANCE_ENVIRONMENTS.includes(values.environment)) errors.push({ code: "UNSUPPORTED_ENVIRONMENT" });
  if (input.generationResultRefOrigin !== "ISSUER_GENERATION_OPERATION") errors.push({ code: "GENERATION_RESULT_REF_AUTHORITY_INVALID" });
  return deepFreeze({ contract: "PROSPECT_IDENTIFIER_GENERATION_INVOCATION", contractVersion: "1.2.0", ...values, attemptContext: attempt, generationResultRefOrigin: input.generationResultRefOrigin ?? null, candidateDerivedReference: false, entropyDerivedReference: false, timestampDerivedReference: false, clientSuppliedGovernance: false, auditRefs: Array.isArray(input.auditRefs) ? [...input.auditRefs] : [], validation: { valid: !errors.length, errors } });
}

export function createProspectIdentifierAuthorizationRuntimeResultV1_1(input = {}) {
  const errors = []; inspect(input, errors);
  const fields = ["authorizationRef", "actorRef", "requestRef", "operationRef", "environment", "identifierLayer", "namespace", "strategyRef", "conventionRef", "attemptContextRef"];
  const values = Object.fromEntries(fields.map((field) => [field, text(input[field], field, errors)]));
  if (input.status !== "AUTHORIZATION_APPROVED" || input.active !== true || input.revoked === true) errors.push({ code: "AUTHORIZATION_NOT_ACTIVE" });
  if (RUNTIME_GOVERNANCE_LAYERS[values.identifierLayer] !== values.namespace) errors.push({ code: "AUTHORIZATION_SCOPE_MISMATCH" });
  if (!RUNTIME_GOVERNANCE_ENVIRONMENTS.includes(values.environment)) errors.push({ code: "UNSUPPORTED_ENVIRONMENT" });
  return deepFreeze({ contract: "PROSPECT_IDENTIFIER_AUTHORIZATION_RUNTIME_RESULT", contractVersion: "1.1.0", ok: !errors.length, status: input.status ?? null, ...values, active: input.active === true, revoked: input.revoked === true, authenticationIsAuthorization: false, auditRefs: Array.isArray(input.auditRefs) ? [...input.auditRefs] : [], validation: { valid: !errors.length, errors } });
}

export function createProspectIdentifierGenerationRuntimeResultV1_2(input = {}) {
  const errors = []; inspect(input, errors);
  const invocation = input.invocation;
  if (invocation?.contract !== "PROSPECT_IDENTIFIER_GENERATION_INVOCATION" || invocation?.contractVersion !== "1.2.0" || !invocation?.validation?.valid) errors.push({ code: "INVOCATION_INVALID" });
  const candidate = input.generatedCandidate;
  const redacted = input.declarationOnlyRedacted === true;
  if (!redacted && !candidatePattern.test(candidate ?? "")) errors.push({ code: "CANDIDATE_INVALID" });
  if (input.generationResultRef !== invocation?.generationResultRef) errors.push({ code: "GENERATION_RESULT_REF_MISMATCH" });
  return deepFreeze({ contract: "PROSPECT_IDENTIFIER_GENERATION_RUNTIME_RESULT", contractVersion: "1.2.0", status: input.status ?? null, generationResultRef: input.generationResultRef ?? null, invocationRef: invocation?.invocationRef ?? null, requestRef: invocation?.requestRef ?? null, operationRef: invocation?.operationRef ?? null, authorizationRef: invocation?.authorizationRef ?? null, identifierLayer: invocation?.identifierLayer ?? null, namespace: invocation?.namespace ?? null, strategyRef: invocation?.strategyRef ?? null, conventionRef: invocation?.conventionRef ?? null, generatorPortRef: invocation?.generatorPortRef ?? null, adapterRef: invocation?.adapterRef ?? null, providerRef: invocation?.providerRef ?? null, attemptNumber: invocation?.attemptContext?.attemptNumber ?? null, attemptPolicyRef: invocation?.attemptContext?.attemptPolicyRef ?? null, attemptContextRef: invocation?.attemptContext?.attemptContextRef ?? null, environment: invocation?.environment ?? null, outputSizePolicyRef: invocation?.outputSizePolicyRef ?? null, encodingPolicyRef: invocation?.encodingPolicyRef ?? null, generatedCandidate: redacted ? null : candidate ?? null, candidatePresent: input.status === "CANDIDATE_GENERATED", candidateValueRedacted: redacted, uniquenessClaimed: false, collisionChecked: false, reserved: false, issued: false, ledgerWritten: false, identityCreated: false, recordCreated: false, persisted: false, validation: { valid: !errors.length, errors } });
}

export function createProspectIdentifierRuntimeGovernanceBindingV1_1(input = {}) {
  const errors = []; inspect(input, errors);
  const { authenticationResult: authentication, authorizationResult: authorization, generationInvocation: invocation, generationResult: result } = input;
  if (!authentication?.ok || typeof authentication.actorRef !== "string") errors.push({ code: "AUTHENTICATION_INVALID" });
  if (!authorization?.validation?.valid) errors.push({ code: "AUTHORIZATION_INVALID" });
  if (!invocation?.validation?.valid) errors.push({ code: "INVOCATION_INVALID" });
  if (!result?.validation?.valid) errors.push({ code: "GENERATION_RESULT_INVALID" });
  const equal = (field, values) => { if (new Set(values.filter((value) => value != null)).size !== 1) errors.push({ code: `${field.toUpperCase()}_BINDING_MISMATCH` }); };
  equal("actor", [authentication?.actorRef, authorization?.actorRef]);
  for (const field of ["authorizationRef", "requestRef", "operationRef", "environment", "identifierLayer", "namespace", "strategyRef", "conventionRef", "attemptContextRef"]) equal(field, [authorization?.[field], invocation?.[field] ?? invocation?.attemptContext?.[field], result?.[field]]);
  for (const field of ["generationResultRef", "invocationRef", "generatorPortRef", "adapterRef", "providerRef", "outputSizePolicyRef", "encodingPolicyRef"]) equal(field, [invocation?.[field], result?.[field]]);
  equal("attemptNumber", [invocation?.attemptContext?.attemptNumber, result?.attemptNumber]);
  equal("attemptPolicyRef", [invocation?.attemptContext?.attemptPolicyRef, result?.attemptPolicyRef]);
  return deepFreeze({ contract: "PROSPECT_IDENTIFIER_RUNTIME_GOVERNANCE_BINDING", contractVersion: "1.1.0", status: errors.length ? "BINDING_REJECTED" : "BINDING_VALIDATED", generationResultRefPresent: Boolean(result?.generationResultRef), issuerAttemptBound: Boolean(result?.attemptPolicyRef), authorizationRefPresent: Boolean(authorization?.authorizationRef), actorBindingValid: !errors.some((error) => error.code === "ACTOR_BINDING_MISMATCH"), candidatePresent: result?.candidatePresent === true, candidateValueRedacted: true, persistenceOccurred: false, validation: { valid: !errors.length, errors } });
}

export default Object.freeze({ createProspectIdentifierIssuerAttemptContextV1_1, createProspectIdentifierGenerationInvocationV1_2, createProspectIdentifierAuthorizationRuntimeResultV1_1, createProspectIdentifierGenerationRuntimeResultV1_2, createProspectIdentifierRuntimeGovernanceBindingV1_1 });
