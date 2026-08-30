import { createProspectIdentifierGenerationInvocationV1_2, createProspectIdentifierGenerationRuntimeResultV1_2, createProspectIdentifierRuntimeGovernanceBindingV1_1 } from "../../../../src/data/footballIntelligence/fid/prospectIntake/ProspectIdentifierRuntimeGovernanceContractsV1_2.js";

export const CANONICAL_PROSPECT_IDENTIFIER_GENERATOR_PORT_V1_2 = Object.freeze({ portId: "CANONICAL_PROSPECT_IDENTIFIER_GENERATOR_PORT", portVersion: "1.2.0", status: "IMPLEMENTED_NON_PRODUCTION_NOT_BOUND", generationResultContract: "PROSPECT_IDENTIFIER_GENERATION_RUNTIME_RESULT@1.2.0", persistenceCapable: false, productionApproved: false });

export function createRuntimeGovernanceGenerationInvocationV1_2(issuerContext, authorizationResult) {
  if (!issuerContext || !authorizationResult?.validation?.valid) return Object.freeze({ validation: Object.freeze({ valid: false, errors: Object.freeze([{ code: "AUTHORITATIVE_CONTEXT_REQUIRED" }]) }) });
  return createProspectIdentifierGenerationInvocationV1_2({
    invocationRef: issuerContext.generationInvocationRef,
    generationResultRef: issuerContext.generationResultRef,
    generationResultRefOrigin: issuerContext.generationResultRefOrigin,
    requestRef: issuerContext.requestRef,
    operationRef: issuerContext.operationRef,
    authorizationRef: authorizationResult.authorizationRef,
    identifierLayer: authorizationResult.identifierLayer,
    namespace: authorizationResult.namespace,
    strategyRef: authorizationResult.strategyRef,
    conventionRef: authorizationResult.conventionRef,
    generatorPortRef: issuerContext.generatorPortRef,
    adapterRef: issuerContext.adapterRef,
    providerRef: issuerContext.providerRef,
    environment: authorizationResult.environment,
    outputSizePolicyRef: issuerContext.outputSizePolicyRef,
    encodingPolicyRef: issuerContext.encodingPolicyRef,
    attemptContext: issuerContext.attemptContext,
    auditRefs: issuerContext.auditRefs,
  });
}

export function bindGeneratedCandidateToGovernanceV1_2(invocation, generatedCandidate, options = {}) {
  return createProspectIdentifierGenerationRuntimeResultV1_2({ status: "CANDIDATE_GENERATED", generationResultRef: invocation?.generationResultRef, invocation, generatedCandidate, declarationOnlyRedacted: options.declarationOnlyRedacted === true });
}

export function createPreTransactionRuntimeGovernanceBindingV1_1(input) {
  return createProspectIdentifierRuntimeGovernanceBindingV1_1(input);
}

export function createRuntimeGovernanceCompositionV1_2(input = {}) {
  const errors = [];
  if (!["TEST", "DEVELOPMENT"].includes(input.environment)) errors.push("UNSUPPORTED_ENVIRONMENT");
  if (input.runtimeTarget !== "SERVER") errors.push("BROWSER_RUNTIME_PROHIBITED");
  if (input.generatorPortVersion !== "1.2.0") errors.push("GENERATOR_PORT_VERSION_MISMATCH");
  for (const dependency of ["authenticationVerifier", "authorizationVerifier", "issuerContextProvider"]) if (typeof input[dependency] !== "function") errors.push(`MISSING_${dependency.toUpperCase()}`);
  return Object.freeze({ valid: !errors.length, errors: Object.freeze(errors), compositionId: "CANONICAL_PROSPECT_IDENTIFIER_RUNTIME_GOVERNANCE_COMPOSITION", compositionVersion: "1.2.0", environment: input.environment ?? null, dependencies: errors.length ? null : Object.freeze({ authenticationVerifier: input.authenticationVerifier, authorizationVerifier: input.authorizationVerifier, issuerContextProvider: input.issuerContextProvider }), generatorPort: CANONICAL_PROSPECT_IDENTIFIER_GENERATOR_PORT_V1_2, preTransactionBindingOnly: true, transactionPort: null, persistenceAdapter: null, supabaseClient: null, registered: false, runtimeBound: false, deployed: false, productionApproved: false });
}

export default Object.freeze({ CANONICAL_PROSPECT_IDENTIFIER_GENERATOR_PORT_V1_2, createRuntimeGovernanceGenerationInvocationV1_2, bindGeneratedCandidateToGovernanceV1_2, createPreTransactionRuntimeGovernanceBindingV1_1, createRuntimeGovernanceCompositionV1_2 });
