import { deepFreeze } from "./ProspectIdentityDryRunRequest.js";

const source = (field, authority, producer, validationOwner, options = {}) => Object.freeze({ field, authority, producer, validationOwner, required: true, sensitive: options.sensitive === true, auditSafe: options.auditSafe !== false, databaseVerifiable: options.databaseVerifiable !== false, mutableAfterValidation: false, clientControlled: false, candidateDerived: false, staticConfiguration: false, missingBehavior: "REJECT_BEFORE_GENERATION_OR_HANDOFF", conflictingBehavior: "REJECT_WITH_BINDING_MISMATCH" });
export const PROSPECT_IDENTIFIER_RUNTIME_GOVERNANCE_FIELD_SOURCE_MAP = Object.freeze([
  source("generationResultRef", "FID_PROSPECT_IDENTITY_ISSUER_DOMAIN", "PROSPECT_IDENTIFIER_GENERATION_INVOCATION@1.2.0", "GENERATOR_PORT_AND_RUNTIME_BINDING"),
  source("generationInvocationRef", "FID_PROSPECT_IDENTITY_ISSUER_DOMAIN", "PROSPECT_IDENTIFIER_GENERATION_INVOCATION@1.2.0", "GENERATOR_PORT_AND_RUNTIME_BINDING"),
  source("attemptNumber", "FID_PROSPECT_IDENTITY_ISSUER_DOMAIN", "PROSPECT_IDENTIFIER_ISSUER_ATTEMPT_CONTEXT@1.1.0", "ISSUER_AND_RUNTIME_BINDING"),
  source("attemptPolicyRef", "FID_PROSPECT_IDENTITY_ISSUER_DOMAIN", "PROSPECT_IDENTIFIER_ISSUER_ATTEMPT_CONTEXT@1.1.0", "ISSUER_AND_RUNTIME_BINDING"),
  source("authorizationRef", "FID_PROSPECT_IDENTITY_ISSUANCE_AUTHORIZATION_OWNER", "PROSPECT_IDENTIFIER_AUTHORIZATION_RUNTIME_RESULT@1.1.0", "AUTHORIZATION_VERIFIER_AND_RUNTIME_BINDING"),
  source("actorRef", "AUTHENTICATION_THEN_AUTHORIZATION_BINDING", "PROSPECT_IDENTIFIER_AUTHORIZATION_RUNTIME_RESULT@1.1.0", "AUTHORIZATION_VERIFIER_AND_RUNTIME_BINDING"),
  source("requestRef", "TRUSTED_RUNTIME_REQUEST_OWNER", "VALIDATED_TRUSTED_RUNTIME_REQUEST", "AUTHORIZATION_AND_RUNTIME_BINDING"),
  source("operationRef", "FID_PROSPECT_IDENTITY_ISSUER_DOMAIN", "VALIDATED_ISSUER_OPERATION_CONTEXT", "AUTHORIZATION_AND_RUNTIME_BINDING"),
  source("identifierLayer", "FID_PROSPECT_IDENTITY_ISSUANCE_AUTHORIZATION_OWNER", "AUTHORIZED_SCOPE_AND_GENERATION_INVOCATION", "CROSS_CONTRACT_BINDING"),
  source("namespace", "FID_PROSPECT_IDENTITY_ISSUANCE_AUTHORIZATION_OWNER", "AUTHORIZED_SCOPE_AND_GENERATION_INVOCATION", "CROSS_CONTRACT_BINDING"),
  source("strategyRef", "FID_PROSPECT_IDENTITY_IDENTIFIER_STRATEGY_OWNER", "AUTHORIZED_SCOPE_AND_GENERATION_INVOCATION", "CROSS_CONTRACT_BINDING"),
  source("conventionRef", "FID_PROSPECT_IDENTITY_IDENTIFIER_CONVENTION_OWNER", "AUTHORIZED_SCOPE_AND_GENERATION_INVOCATION", "CROSS_CONTRACT_BINDING"),
  source("generatorPortRef", "FID_PROSPECT_IDENTITY_GENERATOR_PORT_OWNER", "GENERATION_INVOCATION_AND_RESULT", "CROSS_CONTRACT_BINDING"),
  source("adapterRef", "FID_PROSPECT_IDENTITY_GENERATOR_ADAPTER_OWNER", "GENERATION_INVOCATION_AND_RESULT", "CROSS_CONTRACT_BINDING"),
  source("providerRef", "FID_PROSPECT_IDENTITY_ENTROPY_PROVIDER_OWNER", "GENERATION_INVOCATION_AND_RESULT", "CROSS_CONTRACT_BINDING"),
  source("environment", "TRUSTED_RUNTIME_HOST_OWNER", "VALIDATED_RUNTIME_CONTEXT", "AUTHORIZATION_AND_CROSS_CONTRACT_BINDING"),
  source("outputSizePolicyRef", "FID_PROSPECT_IDENTITY_OUTPUT_SIZE_POLICY_OWNER", "GENERATION_INVOCATION_AND_RESULT", "CROSS_CONTRACT_BINDING"),
  source("encodingPolicyRef", "FID_PROSPECT_IDENTITY_ENCODING_POLICY_OWNER", "GENERATION_INVOCATION_AND_RESULT", "CROSS_CONTRACT_BINDING"),
  source("idempotencyRef", "FID_PROSPECT_IDENTITY_ISSUER_DOMAIN", "VALIDATED_RUNTIME_ISSUER_CONTEXT", "RUNTIME_IDEMPOTENCY_CAPABILITY"),
  source("candidateIdentifier", "GENERATOR_ADAPTER_RUNTIME_RESULT", "PROSPECT_IDENTIFIER_GENERATION_RUNTIME_RESULT@1.2.0", "ISSUER_STRUCTURAL_VALIDATOR", { sensitive: true, auditSafe: false }),
]);

export const CANONICAL_PROSPECT_IDENTIFIER_RUNTIME_GOVERNANCE_BINDING_ACTIVATION_AMENDMENT = deepFreeze({
  amendmentId: "CANONICAL_PROSPECT_IDENTIFIER_RUNTIME_GOVERNANCE_BINDING_ACTIVATION_AMENDMENT",
  amendmentVersion: "1.0.0",
  status: "IMPLEMENTED_NON_PRODUCTION_NOT_BOUND",
  historicalPreservation: ["PROSPECT_IDENTIFIER_GENERATION_RUNTIME_RESULT@1.1.0", "CANONICAL_PROSPECT_IDENTIFIER_GENERATOR_PORT@1.1.0", "SPRINT_15B_RUNTIME"],
  successors: { generationResult: "PROSPECT_IDENTIFIER_GENERATION_RUNTIME_RESULT@1.2.0", generationInvocation: "PROSPECT_IDENTIFIER_GENERATION_INVOCATION@1.2.0", generatorPort: "CANONICAL_PROSPECT_IDENTIFIER_GENERATOR_PORT@1.2.0", attemptContext: "PROSPECT_IDENTIFIER_ISSUER_ATTEMPT_CONTEXT@1.1.0", authorizationResult: "PROSPECT_IDENTIFIER_AUTHORIZATION_RUNTIME_RESULT@1.1.0", runtimeBinding: "PROSPECT_IDENTIFIER_RUNTIME_GOVERNANCE_BINDING@1.1.0" },
  generationResultReference: { assignmentOwner: "FID_PROSPECT_IDENTITY_ISSUER_DOMAIN", assignedBeforeInvocation: true, carriedByInvocation: true, preservedByResult: true, operationScoped: true, candidateDerived: false, entropyDerived: false, timestampDerived: false, adapterSynthesized: false, clientSupplied: false },
  attemptOwnership: { owner: "FID_PROSPECT_IDENTITY_ISSUER_DOMAIN", historicalField: "maximumAttemptsPolicyReference", successorField: "attemptPolicyRef", runtimeMutation: false, adapterMutation: false, providerMutation: false, transactionMutation: false, clientOwnership: false },
  authorizationBinding: { owner: "FID_PROSPECT_IDENTITY_ISSUANCE_AUTHORIZATION_OWNER", authoritativeReference: "SPRINT_5_DECISION_ID", authenticationSeparate: true, fullPayloadIncluded: false, activeAndNotRevokedRequired: true },
  fieldSources: PROSPECT_IDENTIFIER_RUNTIME_GOVERNANCE_FIELD_SOURCE_MAP,
  replay: { matchingCompletedStopsBeforeGeneration: true, matchingCompletedStopsBeforeBinding: true, conflictingStopsBeforeGeneration: true, referenceStabilityRequired: true },
  candidatePolicy: { classification: "SENSITIVE_PRE_ISSUANCE_OPERATIONAL_DATA", logging: false, snapshots: false, auditMetadata: false },
  runtimeSuccessor: { implementedAsAdditivePreTransactionGovernanceBinding: true, persistenceTransactionPortCreated: false, historicalHandlerModified: false, productionAllowed: false, browserAllowed: false, persistenceAllowed: false },
  capabilityStatus: { generationResultReferenceActivated: true, issuerAttemptContextActivated: true, authorizationResultActivated: true, runtimeGovernanceBindingImplemented: true, transactionPortImplemented: false, databaseImplemented: false, runtimeBound: false, deployed: false, productionApproved: false },
  permissions: { mayGenerateForDiagnostics: false, mayCreateTransactionPort: false, mayWriteSql: false, mayCreateMigration: false, mayCreateRpc: false, mayConnectDatabase: false, mayCallSupabase: false, mayReadSecrets: false, mayPersist: false, mayDeploy: false, mayActivateProduction: false },
  remainingBlockers: [],
  nextAction: "RESUME_CANONICAL_PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_PORT_HANDOFF_AMENDMENT",
});

export default Object.freeze({ CANONICAL_PROSPECT_IDENTIFIER_RUNTIME_GOVERNANCE_BINDING_ACTIVATION_AMENDMENT, PROSPECT_IDENTIFIER_RUNTIME_GOVERNANCE_FIELD_SOURCE_MAP });
