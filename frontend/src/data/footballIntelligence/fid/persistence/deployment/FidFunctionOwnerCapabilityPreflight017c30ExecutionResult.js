export const RESULT_COLUMNS_017C30_CAPTURE = Object.freeze([
  "result_identity", "result_version", "mode", "classification", "mismatch_count", "set_state", "create_state",
  "metadata_storage_present", "migration_014_metadata_count", "evidence_complete", "read_only", "mutation_count",
  "project_id", "database", "branch", "sql_role",
]);
export const FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_017C30_EXECUTION_RESULT = Object.freeze({
  recordId: "CORRECTED_FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_RESULT_017C30_V1", version: "17C.30.1",
  authorizationId: "CORRECTED_DASHBOARD_VISIBLE_FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_ONE_EXECUTION_017C29_V1",
  executedSqlPath: "frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c27_fid_function_owner_capability_acl_matrix_dashboard_visible_preflight_custom_setting_correction.sql",
  executedSqlSha256: "6D62107634519BD150C1772D7F9170CD48C4F245680CF630C2D07E07733DCD55",
  customSetting: "lbht.preflight_017c24_result", visibleResultRows: 1, sqlError: null, sqlstate: null,
  authorizationConsumed: true, retryPermitted: false, databaseMutation: false, amendmentExecuted: false,
  migration014Executed: false, rpcInvoked: false, aclPreflightPassed: false,
  aclPreflightFailedConclusively: false, recoveryGovernanceReviewRequired: true,
  row: Object.freeze({
    result_identity: "FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_VISIBLE_RESULT", result_version: "17C.27.1", mode: "PREFLIGHT",
    classification: "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_INCONSISTENT_RECOVERY_REQUIRED", mismatch_count: 5,
    set_state: false, create_state: false, metadata_storage_present: true, migration_014_metadata_count: 0,
    evidence_complete: true, read_only: true, mutation_count: 0, project_id: "ahmorpzcaapvoymiqlkv",
    database: "Primary Database", branch: "main", sql_role: "postgres",
  }),
});
export default FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_017C30_EXECUTION_RESULT;
