const freeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

export const CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_NON_PRODUCTION_TEST_TARGET_AUTHORIZATION = freeze({
  authorizationId: "CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_NON_PRODUCTION_TEST_TARGET_AUTHORIZATION",
  authorizationVersion: "1.0.0",
  owner: "FID_PROSPECT_IDENTITY_ISSUANCE_TRANSACTION_OWNER",
  status: "ACTIVE_UNCONSUMED",
  exactMatchOnly: true,
  transferable: false,
  singleUse: true,
  consumed: false,
  expiresWhen: ["TARGET_STATE_CHANGES", "AUTHORIZED_DEPLOYMENT_COMPLETES", "AUTHORIZATION_IS_REVOKED"],
  target: {
    organizationName: "Lunch Break Hot Take",
    projectName: "LBHT FID Persistence Test",
    projectId: "ahmorpzcaapvoymiqlkv",
    region: "us-east-1",
    branchName: "main",
    platformLabel: "PRODUCTION",
  },
  governedEnvironment: {
    classification: "DEDICATED_NON_PRODUCTION_TEST",
    dedicatedTest: true,
    nonProduction: true,
    testOnly: true,
    productionProhibited: true,
    canonicalIdentityCreationProhibited: true,
    canonicalRecordCreationProhibited: true,
    productionDataProhibited: true,
  },
  platformBranchRole: {
    classification: "PRODUCTION_PRIMARY_BRANCH",
    branchName: "main",
    primaryBranch: true,
    previewBranch: false,
    platformProductionLabelObserved: true,
    platformLabelDefinesBranchTopology: true,
    platformLabelDoesNotOverrideGovernedProjectClassification: true,
  },
  authorizationScope: "CANONICAL_PROSPECT_IDENTIFIER_NON_PRODUCTION_PERSISTENCE_TRANSACTION_DEPLOYMENT",
  migration: {
    migrationId: "014",
    approvedMigrationSha256: "18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD",
    prohibitedMigrationSha256: "3B271BC994D82C8109CDE4E62E6A1F85A67E49F86C5D98FBD0EBA46D6D214F13",
  },
  safeguards: {
    wildcardOrganizationProhibited: true,
    wildcardProjectProhibited: true,
    wildcardProjectIdProhibited: true,
    wildcardBranchProhibited: true,
    otherMigrationProhibited: true,
    productionCustomerDataProhibited: true,
    productionRuntimeActivationProhibited: true,
    productionEdgeFunctionDeploymentProhibited: true,
    productionSecretsProhibited: true,
    productionTrafficProhibited: true,
    canonicalIdentityCreationProhibited: true,
    canonicalRecordCreationProhibited: true,
    fiisPromotionProhibited: true,
    simulatorRegistrationProhibited: true,
    displayNameOnlyInferenceProhibited: true,
    activeUnpausedObservationRequired: true,
    readOnlyTargetPreflightRequired: true,
    controlledOperatorConfirmationRequired: true,
  },
  authorizationStatement: "The Supabase Dashboard PRODUCTION label observed on branch main identifies the primary branch role within project ahmorpzcaapvoymiqlkv. It does not reclassify the containing LBHT FID Persistence Test project as an LBHT production environment. This exact branch is authorized solely as the primary branch of the dedicated non-production test project for the controlled deployment of corrected migration 014.",
  permissions: {
    stage1Repeat: true,
    stage2: false,
    sqlExecution: false,
    databaseAccess: false,
    supabaseAccess: false,
    secretAccess: false,
    networkAccess: false,
    uuidGeneration: false,
    candidateGeneration: false,
    collisionCheck: false,
    persistence: false,
    deployment: false,
    productionActivation: false,
  },
});

export default CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_NON_PRODUCTION_TEST_TARGET_AUTHORIZATION;
