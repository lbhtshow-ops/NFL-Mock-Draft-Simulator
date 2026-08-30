import { deepFreeze } from "./ProspectIdentityDryRunRequest.js";

export function evaluateCanonicalProspectIdentifierRuntimeGovernanceBindingActivation(amendment, context = {}) {
  const checks = {
    identity: amendment?.amendmentId === "CANONICAL_PROSPECT_IDENTIFIER_RUNTIME_GOVERNANCE_BINDING_ACTIVATION_AMENDMENT" && amendment?.amendmentVersion === "1.0.0",
    historicalPreserved: context.historicalPreserved === true && amendment?.runtimeSuccessor?.historicalHandlerModified === false,
    resultReferenceAuthority: amendment?.generationResultReference?.assignmentOwner === "FID_PROSPECT_IDENTITY_ISSUER_DOMAIN" && !amendment?.generationResultReference?.candidateDerived && !amendment?.generationResultReference?.adapterSynthesized,
    attemptAuthority: amendment?.attemptOwnership?.owner === "FID_PROSPECT_IDENTITY_ISSUER_DOMAIN" && !amendment?.attemptOwnership?.runtimeMutation && !amendment?.attemptOwnership?.clientOwnership,
    authorizationAuthority: amendment?.authorizationBinding?.authoritativeReference === "SPRINT_5_DECISION_ID" && amendment?.authorizationBinding?.authenticationSeparate,
    sourcesComplete: amendment?.fieldSources?.length === 20 && amendment.fieldSources.every((item) => item.required && !item.clientControlled && !item.staticConfiguration && !item.mutableAfterValidation),
    replaySafe: amendment?.replay?.matchingCompletedStopsBeforeGeneration && amendment?.replay?.matchingCompletedStopsBeforeBinding,
    candidateProtected: amendment?.candidatePolicy?.logging === false && amendment?.candidatePolicy?.snapshots === false,
    nonProduction: !context.productionEnabled && !context.browserRuntime && !amendment?.runtimeSuccessor?.productionAllowed,
    noPersistence: !amendment?.runtimeSuccessor?.persistenceTransactionPortCreated && !amendment?.runtimeSuccessor?.persistenceAllowed,
    permissions: Object.values(amendment?.permissions ?? {}).every((value) => !value),
  };
  const remainingBlockers = Object.entries(checks).filter(([, valid]) => !valid).map(([key]) => ({ code: `${key.toUpperCase()}_FAILED` }));
  return deepFreeze({ contract: "PROSPECT_IDENTIFIER_RUNTIME_GOVERNANCE_BINDING_ASSESSMENT", contractVersion: "1.0.0", status: remainingBlockers.length ? "RUNTIME_GOVERNANCE_BINDINGS_BLOCKED" : "RUNTIME_GOVERNANCE_BINDINGS_READY", checks, remainingBlockers, eligibleForPersistenceTransactionPortHandoffAmendment: !remainingBlockers.length, requiredNextAction: remainingBlockers.length ? "RESOLVE_RUNTIME_GOVERNANCE_BINDING_BLOCKERS" : "RESUME_CANONICAL_PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_PORT_HANDOFF_AMENDMENT", executions: 0, generations: 0, persistenceOperations: 0 });
}

export function evaluateCanonicalProspectIdentifierRuntimeGovernanceBindingActivationBatch(amendments = [], contexts = []) {
  const assessments = Array.from({ length: Math.max(amendments.length, contexts.length) }, (_, index) => evaluateCanonicalProspectIdentifierRuntimeGovernanceBindingActivation(amendments[index], contexts[index]));
  return deepFreeze({ status: assessments.some((item) => item.status === "RUNTIME_GOVERNANCE_BINDINGS_BLOCKED") ? "BATCH_RUNTIME_GOVERNANCE_BINDINGS_BLOCKED" : "BATCH_RUNTIME_GOVERNANCE_BINDINGS_READY", assessments, inputOrderSelectsAuthority: false, executions: 0, networkRequests: 0, persistenceOperations: 0 });
}

export default Object.freeze({ evaluateCanonicalProspectIdentifierRuntimeGovernanceBindingActivation, evaluateCanonicalProspectIdentifierRuntimeGovernanceBindingActivationBatch });
