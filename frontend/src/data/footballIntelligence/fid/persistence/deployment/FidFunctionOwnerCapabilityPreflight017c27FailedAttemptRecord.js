export const FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_017C27_FAILED_ATTEMPT = Object.freeze({
  authorizationId: "DASHBOARD_VISIBLE_FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_ONE_EXECUTION_017C26_V1",
  attemptCount: 1, authorizationConsumed: true, authorizationReusable: false, retryAuthorized: false,
  sqlFile: "017c24_fid_function_owner_capability_acl_matrix_dashboard_visible_preflight.sql",
  executedSha256: "C70E565DD877A3A32876176D82660E0A23A7553D5FE86E6C5075CCC352579B2A",
  sqlstate: "42602", errorCategory: "INVALID_CONFIGURATION_PARAMETER_NAME",
  observedMessage: "invalid configuration parameter name \"lbht.017c24_preflight_result\"",
  postgresqlDetail: "Custom parameter names must be two or more simple identifiers separated by dots.",
  failingOperation: "pg_catalog.set_config(result_setting, 'PENDING', true)",
  plpgsqlLocation: "inline_code_block line 23 at PERFORM", visibleResultRows: 0,
  classificationCaptured: false, aclOutcomeEstablished: false, capabilityAmendmentExecuted: false,
  migration014Executed: false, rpcInvoked: false, databaseMutation: false,
  authoritativeDatabaseState: "MIGRATION_014_FULLY_ROLLED_BACK",
});
export default FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_017C27_FAILED_ATTEMPT;
