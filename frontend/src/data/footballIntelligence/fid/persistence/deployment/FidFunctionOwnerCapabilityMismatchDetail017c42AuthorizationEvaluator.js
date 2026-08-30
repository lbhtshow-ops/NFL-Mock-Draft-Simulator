import { AUTHORITATIVE_25_FIELD_ORDER_017C39 } from "./FidFunctionOwnerCapabilityMismatchDetail017c39OrderedFields.js";

const expected = Object.freeze({
  repository: "C:\\Users\\zeyga\\NFL-Mock-Draft-Simulator-main\\NFL-Mock-Draft-Simulator-main",
  frontendWorkingDirectory: "C:\\Users\\zeyga\\NFL-Mock-Draft-Simulator-main\\NFL-Mock-Draft-Simulator-main\\frontend",
  branch: "main", origin: "https://github.com/lbhtshow-ops/NFL-Mock-Draft-Simulator.git", upstream: "origin/fid-persistence-v1.0.1",
  organization: "Lunch Break Hot Take", projectName: "LBHT FID Persistence Test", projectReference: "ahmorpzcaapvoymiqlkv",
  region: "us-east-1", dashboardDatabaseSource: "Primary Database", sqlEditorRole: "postgres",
  governedEnvironment: "DEDICATED_NON_PRODUCTION_TEST", platformBranchLabel: "PRODUCTION",
  sqlFilename: "017c40_fid_function_owner_capability_mismatch_detail_split_authority_25_field_successor.sql",
  sqlSha256: "8D56003C1835ED6889C947DA75B56C4D032736DD31532FCF428FD68FF421688E",
});

export function evaluateMismatchDetailAuthorization017c42(context = {}) {
  const failures = [];
  for (const [field, value] of Object.entries(expected)) if (context[field] !== value) failures.push(field);
  const requiredTrue = ["inheritedDirtyWorktreePreserved", "migrationsExactly001Through014", "migration015Absent",
    "migration014Unchanged", "migration014Unapplied", "migration014FullyRolledBack", "allProtectedHashesMatch",
    "sprint017c41Ready", "priorAuthorizationsConsumed", "completeFileByteForByte", "manualDashboardTargetAttestationRequired",
    "captureCompleteSingleRow", "captureAll25FieldsInOrder", "captureFullMismatchDetailsWithoutTruncation", "readOnlyDiagnosticOnly"];
  for (const field of requiredTrue) if (context[field] !== true) failures.push(field);
  const requiredFalse = ["newerDiagnosticAuthorizationAlreadyExists", "sqlModified", "partialSelection", "retryAuthorized",
    "authorizationReusable", "secondExecutionAuthorized", "reconciliationAuthorized", "repairOrCleanupAuthorized",
    "grantOrRevokeAuthorized", "roleOrMembershipChangeAuthorized", "capabilityAmendmentAuthorized",
    "postAmendmentVerificationAuthorized", "migration014Authorized", "rpcAuthorized", "identifierOperationAuthorized",
    "prospectOrCohortOperationAuthorized", "databaseMutationAuthorized"];
  for (const field of requiredFalse) if (context[field] !== false) failures.push(field);
  if (context.maximumAttempts !== 1) failures.push("maximumAttempts");
  if (context.maximumExecutions !== 1) failures.push("maximumExecutions");
  if (JSON.stringify(context.resultColumns) !== JSON.stringify(AUTHORITATIVE_25_FIELD_ORDER_017C39)) failures.push("resultColumns");
  return Object.freeze({ authorized: failures.length === 0, failures: Object.freeze([...new Set(failures)]) });
}

export default evaluateMismatchDetailAuthorization017c42;
