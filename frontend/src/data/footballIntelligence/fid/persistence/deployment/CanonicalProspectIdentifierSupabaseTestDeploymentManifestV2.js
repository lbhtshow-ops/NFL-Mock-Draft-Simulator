import authorization from "./CanonicalProspectIdentifierSupabaseTestTargetAuthorization.js";

export const CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_TEST_DEPLOYMENT_MANIFEST_V2 = Object.freeze({
  manifestId: "CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_TEST_DEPLOYMENT_MANIFEST",
  manifestVersion: "2.0.0",
  succeedsManifestContract: "SUPABASE_TEST_DEPLOYMENT_MANIFEST_CONTRACT",
  status: "AUTHORIZED_DEDICATED_NON_PRODUCTION_TEST_PRIMARY_BRANCH",
  target: authorization.target,
  governedEnvironment: authorization.governedEnvironment,
  platformBranchRole: authorization.platformBranchRole,
  authorizationReference: `${authorization.authorizationId}@${authorization.authorizationVersion}`,
  authorizationScope: authorization.authorizationScope,
  migration: authorization.migration,
  restrictions: Object.freeze([
    "EXACT_TARGET_ONLY",
    "TEST_ONLY",
    "PRODUCTION_PROHIBITED",
    "PRODUCTION_DATA_PROHIBITED",
    "PRODUCTION_RUNTIME_ACTIVATION_PROHIBITED",
    "CANONICAL_IDENTITY_CREATION_PROHIBITED",
    "CANONICAL_RECORD_CREATION_PROHIBITED",
    "NO_TRANSFER",
  ]),
  platformLabelException: Object.freeze({
    exactProjectId: authorization.target.projectId,
    exactBranchName: authorization.target.branchName,
    exactObservedLabel: authorization.target.platformLabel,
    interpretation: "SUPABASE_PRIMARY_BRANCH_TOPOLOGY_ONLY_WITHIN_THIS_EXACT_GOVERNED_TEST_PROJECT",
    generalizable: false,
  }),
  stage1: Object.freeze({
    exactTargetMatchRequired: true,
    twoAxisClassificationRequired: true,
    activeUnpausedObservationRequired: true,
    operatorTestOnlyConfirmationRequired: true,
    correctedHashRequired: true,
  }),
  stage2: Object.freeze({ authorized: false, readOnlyTargetPreflightRequiredBeforeAuthorization: true }),
  effects: Object.freeze({ sqlExecuted: false, networkRequests: 0, databaseOperations: 0, deploymentOperations: 0 }),
});

export default CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_TEST_DEPLOYMENT_MANIFEST_V2;
