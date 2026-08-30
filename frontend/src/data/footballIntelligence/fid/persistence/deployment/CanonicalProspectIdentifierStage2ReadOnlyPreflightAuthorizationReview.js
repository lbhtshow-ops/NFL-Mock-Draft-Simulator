const freeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

export const CANONICAL_PROSPECT_IDENTIFIER_STAGE_2_READ_ONLY_PREFLIGHT_AUTHORIZATION_REVIEW = freeze({
  reviewId: "CANONICAL_PROSPECT_IDENTIFIER_STAGE_2_READ_ONLY_PREFLIGHT_AUTHORIZATION_REVIEW",
  reviewVersion: "1.0.0",
  status: "CONTROLLED_DEPLOYMENT_STAGE_2_READ_ONLY_PREFLIGHT_BLOCKED",
  stage1Prerequisite: "CONTROLLED_DEPLOYMENT_STAGE_1_PASSED",
  exactTargetAuthorization: "CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_NON_PRODUCTION_TEST_TARGET_AUTHORIZATION@1.0.0",
  preflight: {
    path: "src/data/footballIntelligence/fid/persistence/deployment/review/017c_read_only_target_preflight.sql",
    sha256: "F7B56039B54334AB3D0D13C64B0B1E0C8DFC0E02273C5BF696FA018F02D29524",
    readOnly: true,
    invokesGenRandomUuid: false,
    invokesIssuanceRpc: false,
    exposesSecrets: false,
  },
  migration: {
    migrationId: "014",
    approvedSha256: "18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD",
    prohibitedSha256: "3B271BC994D82C8109CDE4E62E6A1F85A67E49F86C5D98FBD0EBA46D6D214F13",
    inventory: "001_THROUGH_014_EXACT",
    migration015Absent: true,
  },
  coveredChecks: [
    "CURRENT_DATABASE_AND_SESSION_IDENTITY",
    "POSTGRESQL_VERSION",
    "PG_CATALOG_GEN_RANDOM_UUID_ZERO_ARGUMENT_IDENTITY_AND_RESULT",
    "REQUIRED_ROLE_ATTRIBUTES",
    "FID_SCHEMA_OWNERSHIP_AND_SELECTED_SCHEMA_PRIVILEGES",
    "EXACT_MIGRATION_014_TABLE_AND_RPC_NAME_ABSENCE",
    "FID_TABLE_PLANNER_ESTIMATES",
  ],
  blockers: [
    {
      code: "MIGRATIONS_001_THROUGH_013_APPLICATION_EVIDENCE_MISSING",
      evidence: "The preflight never queries fid.fid_persistence_migrations or an equivalent governed migration record.",
    },
    {
      code: "FUNCTION_OWNER_TRANSFER_CAPABILITY_NOT_VERIFIED",
      evidence: "Migration 014 alters the function owner to fid_function_owner, but the preflight never checks pg_has_role(current_user,'fid_function_owner','MEMBER') or equivalent ownership-transfer authority.",
    },
    {
      code: "MIGRATION_014_INDEX_NAME_CONFLICTS_NOT_VERIFIED",
      evidence: "The preflight checks three table names and one function name but not the six schema-scoped index names created by migration 014.",
    },
  ],
  permissions: {
    stage2PreflightExecution: false,
    migrationExecution: false,
    sqlExecutionDuringReview: false,
    databaseAccessDuringReview: false,
    supabaseAccessDuringReview: false,
    secretAccess: false,
    networkAccess: false,
  },
  requiredNextAction: "ADD_AND_REVIEW_A_GOVERNED_READ_ONLY_PREFLIGHT_SUCCESSOR_THAT_CLOSES_ALL_THREE_BLOCKERS",
});

export default CANONICAL_PROSPECT_IDENTIFIER_STAGE_2_READ_ONLY_PREFLIGHT_AUTHORIZATION_REVIEW;
