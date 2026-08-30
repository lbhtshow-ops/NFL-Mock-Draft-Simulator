import { createProspectIdentifierAuthorizationRuntimeResultV1_1, createProspectIdentifierIssuerAttemptContextV1_1 } from "../../../../src/data/footballIntelligence/fid/prospectIntake/ProspectIdentifierRuntimeGovernanceContractsV1_2.js";

export function createGovernedAuthorizationVerifierV1_1(declaration) {
  return async function verify(reference, context) {
    if (reference !== declaration.authorizationRef || context.actorRef !== declaration.actorRef) return Object.freeze({ ok: false, status: "AUTHORIZATION_DENIED", validation: Object.freeze({ valid: false, errors: Object.freeze([{ code: "AUTHORIZATION_MISMATCH" }]) }) });
    return createProspectIdentifierAuthorizationRuntimeResultV1_1(declaration);
  };
}

export function createIssuerContextProviderV1_2(declaration) {
  const attemptContext = createProspectIdentifierIssuerAttemptContextV1_1(declaration.attemptContext);
  return function provide(operationRef) {
    if (operationRef !== declaration.operationRef || !attemptContext.validation.valid) return null;
    return Object.freeze({ ...declaration, attemptContext, candidate: undefined });
  };
}

export default Object.freeze({ createGovernedAuthorizationVerifierV1_1, createIssuerContextProviderV1_2 });
