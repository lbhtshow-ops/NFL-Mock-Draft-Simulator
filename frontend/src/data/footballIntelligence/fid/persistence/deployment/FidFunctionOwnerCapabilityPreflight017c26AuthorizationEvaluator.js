import { RESULT_COLUMNS_017C26 } from "./FidFunctionOwnerCapabilityPreflight017c26ExecutionAuthorization.js";

const expected = Object.freeze({
  organization: "Lunch Break Hot Take", projectName: "LBHT FID Persistence Test",
  projectId: "ahmorpzcaapvoymiqlkv", region: "us-east-1", branch: "main",
  database: "Primary Database", sqlRole: "postgres",
  sqlSha256: "C70E565DD877A3A32876176D82660E0A23A7553D5FE86E6C5075CCC352579B2A",
});

export function evaluatePreflightAuthorization017c26(context) {
  const failures = [];
  for (const [field, value] of Object.entries(expected)) if (context?.[field] !== value) failures.push(field);
  const requiredTrue = ["projectActive", "testOnly", "completeFile", "completeFileByteForByte", "fullQuerySelected",
    "captureCompleteVisibleRow", "readOnly", "sprint017c25Ready", "migration015Absent", "migration014FullyRolledBack",
    "priorAuthorizationConsumed", "aclParity261", "noSensitiveOutput"];
  for (const field of requiredTrue) if (context?.[field] !== true) failures.push(field);
  const requiredFalse = ["projectPaused", "productionTrafficOrData", "sqlModified", "partialSelection", "protected017c19",
    "retryAuthorized", "authorizationReused", "automaticReconciliation", "amendmentAuthorized", "postVerificationAuthorized",
    "migration014Authorized", "rpcAuthorized", "roleAclMutationAuthorized", "identifierGenerationAuthorized",
    "noticeOnlyAccepted", "zeroRowAcceptedAsPass", "pendingAcceptedAsPass", "malformedRowAcceptedAsPass",
    "existingUnconsumedSuccessorAuthorization"];
  for (const field of requiredFalse) if (context?.[field] !== false) failures.push(field);
  if (context?.maximumExecutionCount !== 1) failures.push("maximumExecutionCount");
  if (JSON.stringify(context?.resultColumns) !== JSON.stringify(RESULT_COLUMNS_017C26)) failures.push("resultColumns");
  return Object.freeze({ authorized: failures.length === 0, failures: Object.freeze([...new Set(failures)]) });
}

export default evaluatePreflightAuthorization017c26;
