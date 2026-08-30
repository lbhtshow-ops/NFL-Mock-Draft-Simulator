export const CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_OWNERSHIP_CAPABILITY_PREFLIGHT_STATIC_REVIEW = Object.freeze({
  reviewId: "CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_OWNERSHIP_CAPABILITY_PREFLIGHT_STATIC_REVIEW",
  reviewVersion: "1.0.0",
  status: "SUPABASE_OWNERSHIP_CAPABILITY_PREFLIGHT_CORRECTION_REQUIRED",
  exactTarget: Object.freeze({ projectId: "ahmorpzcaapvoymiqlkv", database: "PRIMARY_DATABASE", sqlEditorRole: "postgres", governedEnvironment: "DEDICATED_NON_PRODUCTION_TEST" }),
  authoritativeState: "MIGRATION_014_FULLY_ROLLED_BACK",
  protected: Object.freeze({
    migration014Sha256: "18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD",
    reconciliation017c5Sha256: "EF3F45440082D9558A6CCF60F9F91F1017D0EC8E3EC0338C37FCEB6DC4742AA7",
    preflight017c6Sha256: "3D42FF4F38C7A3C3D7275F461E24BB55AB6B41DA8B6977537E67B3ADF695786B",
  }),
  defect: Object.freeze({
    classification: "CAPABILITY_COVERAGE_AND_EXECUTION_IDENTITY_BINDING_INCOMPLETE",
    missingEvidence: Object.freeze(["DEPLOYMENT_SCHEMA_USAGE", "DEPLOYMENT_SCHEMA_CREATE", "TARGET_OWNER_SCHEMA_USAGE"]),
    identityBindingMissing: true,
    consequence: "TRANSFER_CLASSIFICATION_COULD_BE_TRUE_WITHOUT_PROVING_THE_ACTUAL_EXECUTION_IDENTITY_AND_ALL_GOVERNED_SCHEMA_CAPABILITIES",
    narrowCorrectionAvailable: true,
  }),
  successor: Object.freeze({
    path: "src/data/footballIntelligence/fid/persistence/deployment/review/017c7_supabase_function_owner_deployment_capability_read_only_preflight_correction.sql",
    sha256: "BC96C898B17BB9C55B34991E6CB164C2AB038BD16B1DDC45BC4B2F12D939FD57",
    executionAuthorized: false,
    correctionReviewRequired: true,
  }),
  preserved: Object.freeze({ blocksAThroughDExactExceptVersionHeader: true, readOnly: true, sanitized: true, postgresql17MembershipChecks: true }),
  permissions: Object.freeze({ preflightExecution: false, migration014Execution: false, migration014Modification: false, roleChange: false, grant: false, supabaseConnection: false, rpcInvocation: false }),
  requiredNextAction: "STATICALLY_REVIEW_017C7_CORRECTION_BEFORE_ANY_EXECUTION_AUTHORIZATION",
});

export default CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_OWNERSHIP_CAPABILITY_PREFLIGHT_STATIC_REVIEW;
