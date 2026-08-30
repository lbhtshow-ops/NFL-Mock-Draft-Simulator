export const FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_017C28_INDEPENDENT_REVIEW = Object.freeze({
  id: "CORRECTED_DASHBOARD_VISIBLE_FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_INDEPENDENT_REVIEW_017C28",
  version: "17C.28.1", reviewOnly: true,
  targetPath: "frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c27_fid_function_owner_capability_acl_matrix_dashboard_visible_preflight_custom_setting_correction.sql",
  targetSha256: "6D62107634519BD150C1772D7F9170CD48C4F245680CF630C2D07E07733DCD55",
  protected017c24Sha256: "C70E565DD877A3A32876176D82660E0A23A7553D5FE86E6C5075CCC352579B2A",
  settingName: "lbht.preflight_017c24_result", invalidSettingName: "lbht.017c24_preflight_result",
  resultIdentity: "FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_VISIBLE_RESULT", resultVersion: "17C.27.1",
  authoritativeDatabaseState: "MIGRATION_014_FULLY_ROLLED_BACK",
  authorization017c23Consumed: true, authorization017c26Consumed: true,
  failedAttempt: Object.freeze({ sqlstate: "42602", visibleRows: 0, aclOutcomeEstablished: false, retryAuthorized: false }),
  matrix: Object.freeze({ id: "FID_FUNCTION_OWNER_ACL_MATRIX_017C21_V1", version: "17C.21.1", sha256: "E92CAE3BAA5F341ACAC12D9800603DFA09FBB04F084BACC0998581EC673F70FC", entries: 260, invariants: 1, units: 261 }),
  parser: Object.freeze({ tool: "pglast v8.4", grammar: "PostgreSQL 18.4", complete: true, plpgsql: true, dynamicSelects: 1, finalSelect: true, postgresql17Proof: false }),
  executionAuthorizationCreated: false, retryAuthorizationCreated: false, sqlExecuted: false, databaseConnected: false,
  status: "READY_FOR_CORRECTED_DASHBOARD_VISIBLE_FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_EXECUTION_AUTHORIZATION_REVIEW",
  nextSprint: "SPRINT_17C29_CORRECTED_DASHBOARD_VISIBLE_FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_EXECUTION_AUTHORIZATION_REVIEW",
});
export default FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_017C28_INDEPENDENT_REVIEW;
