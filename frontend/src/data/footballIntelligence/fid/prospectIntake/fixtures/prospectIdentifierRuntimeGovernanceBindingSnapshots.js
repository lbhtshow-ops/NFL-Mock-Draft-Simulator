import { CANONICAL_PROSPECT_IDENTIFIER_RUNTIME_GOVERNANCE_BINDING_ACTIVATION_AMENDMENT as amendment } from "../CanonicalProspectIdentifierRuntimeGovernanceBindingActivationAmendment.js";
import { evaluateCanonicalProspectIdentifierRuntimeGovernanceBindingActivation as evaluate, evaluateCanonicalProspectIdentifierRuntimeGovernanceBindingActivationBatch as batch } from "../CanonicalProspectIdentifierRuntimeGovernanceBindingActivationEvaluator.js";

const readyContext = Object.freeze({ historicalPreserved: true, productionEnabled: false, browserRuntime: false });
const rejected = (reason) => Object.freeze({ status: "BINDING_REJECTED", reason, candidatePresent: false, candidateValueRedacted: true, generationCount: 0, transactionPortInvocationCount: 0, persistenceCount: 0 });
export const prospectIdentifierRuntimeGovernanceBindingSnapshots = Object.freeze({
  completeAuthoritativeBinding: evaluate(amendment, readyContext),
  missingGenerationResultRef: rejected("GENERATION_RESULT_REF_REQUIRED"),
  clientGenerationResultRef: rejected("CLIENT_GOVERNANCE_PROHIBITED"),
  candidateDerivedGenerationResultRef: rejected("CANDIDATE_DERIVATION_PROHIBITED"),
  generationReferenceMismatch: rejected("GENERATION_RESULT_REF_MISMATCH"),
  missingAttemptNumber: rejected("ATTEMPT_NUMBER_REQUIRED"),
  missingAttemptPolicyRef: rejected("ATTEMPT_POLICY_REF_REQUIRED"),
  runtimeIncrementedAttempt: rejected("RUNTIME_ATTEMPT_MUTATION_PROHIBITED"),
  adapterIncrementedAttempt: rejected("ADAPTER_ATTEMPT_MUTATION_PROHIBITED"),
  staticAttemptPolicy: rejected("STATIC_ATTEMPT_POLICY_PROHIBITED"),
  missingAuthorizationRef: rejected("AUTHORIZATION_REF_REQUIRED"),
  authenticationAsAuthorization: rejected("AUTHENTICATION_IS_NOT_AUTHORIZATION"),
  actorMismatch: rejected("ACTOR_BINDING_MISMATCH"),
  requestMismatch: rejected("REQUEST_BINDING_MISMATCH"),
  operationMismatch: rejected("OPERATION_BINDING_MISMATCH"),
  environmentMismatch: rejected("ENVIRONMENT_BINDING_MISMATCH"),
  layerMismatch: rejected("IDENTIFIER_LAYER_BINDING_MISMATCH"),
  namespaceMismatch: rejected("NAMESPACE_BINDING_MISMATCH"),
  strategyMismatch: rejected("STRATEGY_BINDING_MISMATCH"),
  conventionMismatch: rejected("CONVENTION_BINDING_MISMATCH"),
  attemptScopeMismatch: rejected("ATTEMPT_CONTEXT_BINDING_MISMATCH"),
  revokedAuthorization: rejected("AUTHORIZATION_NOT_ACTIVE"),
  tokenIncluded: rejected("PROHIBITED_FIELD"),
  entropyIncluded: rejected("PROHIBITED_FIELD"),
  matchingReplay: Object.freeze({ status: "MATCHING_COMPLETED", secureSourceInvocations: 0, generationCount: 0, governanceBindingCount: 0, transactionPortInvocationCount: 0, persistenceCount: 0 }),
  conflictingReplay: rejected("IDEMPOTENCY_CONFLICT"),
  productionRejected: evaluate(amendment, { ...readyContext, productionEnabled: true }),
  browserRejected: evaluate(amendment, { ...readyContext, browserRuntime: true }),
  mixedBatch: batch([amendment, amendment], [readyContext, { ...readyContext, productionEnabled: true }]),
  cohort: Object.freeze(Array.from({ length: 4 }, (_, index) => Object.freeze({ memberRef: `GOVERNED_COHORT_MEMBER_${index + 1}`, cohortRuntimeRequestCount: 0, cohortGenerationCount: 0, cohortTransactionRequestCount: 0, cohortTransactionPortInvocationCount: 0, cohortCollisionCheckCount: 0, cohortReservationCount: 0, cohortIssuanceCount: 0, cohortLedgerWriteCount: 0, cohortIdentityCreationCount: 0, cohortRecordCreationCount: 0, cohortPersistenceCount: 0 }))),
});

export default prospectIdentifierRuntimeGovernanceBindingSnapshots;
