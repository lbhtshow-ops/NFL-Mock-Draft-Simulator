export const FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_017C24_VISIBLE_RESULT_CORRECTION = Object.freeze({
  id: "FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_VISIBLE_RESULT_CORRECTION_017C24",
  version: "17C.24.1",
  status: "READY_FOR_DASHBOARD_VISIBLE_FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_REVIEW",
  protectedPreflightModified: false,
  successorPath: "frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c24_fid_function_owner_capability_acl_matrix_dashboard_visible_preflight.sql",
  successorSha256: "C70E565DD877A3A32876176D82660E0A23A7553D5FE86E6C5075CCC352579B2A",
  mechanism: "READ_ONLY_TRANSACTION_LOCAL_CUSTOM_SETTING_TO_ORDINARY_SELECT",
  expectedVisibleResultSets: 1,
  expectedRows: 1,
  stableColumns: Object.freeze([
    "result_identity", "result_version", "mode", "classification", "mismatch_count",
    "set_state", "create_state", "metadata_storage_present", "migration_014_metadata_count",
    "evidence_complete", "read_only", "mutation_count", "project_id", "database", "branch", "sql_role",
  ]),
  aclMatrix: Object.freeze({ id: "FID_FUNCTION_OWNER_ACL_MATRIX_017C21_V1", version: "17C.21.1", governanceUnits: 261 }),
  optionalMetadata: "TO_REGCLASS_OID_THEN_CONSTANT_DYNAMIC_AGGREGATE_SELECT",
  sessionState: Object.freeze({ transactionLocal: true, initializedBeforeReview: true, clearedAtTransactionEnd: true, staleReuseRejected: true, sensitiveContent: false }),
  readOnly: true,
  mutationCount: 0,
  executionAuthorized: false,
  retryAuthorized: false,
  amendmentAuthorized: false,
  migration014Authorized: false,
});

export default FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_017C24_VISIBLE_RESULT_CORRECTION;
