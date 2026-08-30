export const RESULT_COLUMNS_017C29 = Object.freeze([
  "result_identity", "result_version", "mode", "classification", "mismatch_count",
  "set_state", "create_state", "metadata_storage_present", "migration_014_metadata_count",
  "evidence_complete", "read_only", "mutation_count", "project_id", "database", "branch", "sql_role",
]);

export const FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_017C29_EXECUTION_AUTHORIZATION = Object.freeze({
  authorizationId: "CORRECTED_DASHBOARD_VISIBLE_FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_ONE_EXECUTION_017C29_V1",
  version: "17C.29.1", status: "ACTIVE_UNCONSUMED",
  organization: "Lunch Break Hot Take", projectName: "LBHT FID Persistence Test",
  projectId: "ahmorpzcaapvoymiqlkv", region: "us-east-1", branch: "main",
  platformBranchLabel: "PRODUCTION", platformLabelMeaning: "PRIMARY_BRANCH_TOPOLOGY_ONLY_NOT_LBHT_PRODUCTION",
  governedEnvironment: "DEDICATED_NON_PRODUCTION_TEST", database: "Primary Database", sqlRole: "postgres",
  operation: "CORRECTED_DASHBOARD_VISIBLE_READ_ONLY_CAPABILITY_PREFLIGHT",
  sqlPath: "frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c27_fid_function_owner_capability_acl_matrix_dashboard_visible_preflight_custom_setting_correction.sql",
  sqlSha256: "6D62107634519BD150C1772D7F9170CD48C4F245680CF630C2D07E07733DCD55",
  settingName: "lbht.preflight_017c24_result", maximumExecutionCount: 1,
  executionMode: "MANUAL_SUPABASE_DASHBOARD_SQL_EDITOR", completeFileByteForByteRequired: true,
  partialOrSelectedBlockExecution: "PROHIBITED", dashboardEditing: "PROHIBITED", readOnlyInspectionOnly: true,
  resultColumns: RESULT_COLUMNS_017C29, completeVisibleRowRequired: true,
  noticeOnlyAccepted: false, zeroRowAcceptedAsPass: false, pendingAcceptedAsPass: false, malformedRowAcceptedAsPass: false,
  retry: "PROHIBITED", reusable: false,
  protected017c24Execution: "PROHIBITED", protected017c19Execution: "PROHIBITED",
  reconciliationExecution: "PROHIBITED", amendmentExecution: "PROHIBITED", postVerificationExecution: "PROHIBITED",
  migration014Execution: "PROHIBITED", rpcInvocation: "PROHIBITED", roleAclObjectMutation: "PROHIBITED",
  identifierUuidProspectOperations: "PROHIBITED", automaticReconciliation: "PROHIBITED",
  consumption: Object.freeze({
    event: "THE_SINGLE_EXECUTION_ATTEMPT_BEGINS", outcomeIndependent: true,
    consumedOn: Object.freeze(["SUCCESS", "FAILURE", "INTERRUPTION", "TIMEOUT", "UNCERTAIN_RESPONSE", "NO_VISIBLE_ROW", "MALFORMED_OR_INCOMPLETE_ROW"]),
    reusable: false, retryAuthorized: false,
  }),
});
export default FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_017C29_EXECUTION_AUTHORIZATION;
