import { RESULT_COLUMNS_017C29 } from "./FidFunctionOwnerCapabilityPreflight017c29ExecutionAuthorization.js";

const expected = Object.freeze({
  repository: "C:\\Users\\zeyga\\NFL-Mock-Draft-Simulator-main\\NFL-Mock-Draft-Simulator-main",
  organization: "Lunch Break Hot Take", projectName: "LBHT FID Persistence Test", projectId: "ahmorpzcaapvoymiqlkv",
  region: "us-east-1", branch: "main", platformBranchLabel: "PRODUCTION",
  governedEnvironment: "DEDICATED_NON_PRODUCTION_TEST", database: "Primary Database", sqlRole: "postgres",
  sqlPath: "frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c27_fid_function_owner_capability_acl_matrix_dashboard_visible_preflight_custom_setting_correction.sql",
  sqlSha256: "6D62107634519BD150C1772D7F9170CD48C4F245680CF630C2D07E07733DCD55",
  settingName: "lbht.preflight_017c24_result",
});

export function evaluatePreflightAuthorization017c29(context) {
  const failures = [];
  for (const [field, value] of Object.entries(expected)) if (context?.[field] !== value) failures.push(field);
  const requiredTrue = ["projectActive", "testOnly", "completeFile", "completeFileByteForByte", "fullQuerySelected",
    "captureCompleteVisibleRow", "readOnly", "sprint017c28Ready", "migration015Absent", "migration014FullyRolledBack",
    "amendmentUnapplied", "priorAuthorizationsConsumed", "aclParity261", "optionalMetadataSafe", "noSensitiveOutput"];
  for (const field of requiredTrue) if (context?.[field] !== true) failures.push(field);
  const requiredFalse = ["projectPaused", "productionTrafficOrData", "sqlModified", "partialSelection", "protected017c24",
    "protected017c19", "retryAuthorized", "authorizationReusable", "automaticReconciliation", "amendmentAuthorized",
    "postVerificationAuthorized", "migration014Authorized", "rpcAuthorized", "roleAclMutationAuthorized",
    "identifierGenerationAuthorized", "noticeOnlyAccepted", "zeroRowAcceptedAsPass", "pendingAcceptedAsPass",
    "malformedRowAcceptedAsPass", "existingUnconsumedSuccessorAuthorization"];
  for (const field of requiredFalse) if (context?.[field] !== false) failures.push(field);
  if (context?.maximumExecutionCount !== 1) failures.push("maximumExecutionCount");
  if (JSON.stringify(context?.resultColumns) !== JSON.stringify(RESULT_COLUMNS_017C29)) failures.push("resultColumns");
  return Object.freeze({ authorized: failures.length === 0, failures: Object.freeze([...new Set(failures)]) });
}
export default evaluatePreflightAuthorization017c29;
