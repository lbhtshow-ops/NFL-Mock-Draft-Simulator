import authorization from "./FidFunctionOwnerCapabilityPreflight017c29ExecutionAuthorization.js";

export const VALID_017C29_CONTEXT = Object.freeze({
  repository: "C:\\Users\\zeyga\\NFL-Mock-Draft-Simulator-main\\NFL-Mock-Draft-Simulator-main",
  organization: authorization.organization, projectName: authorization.projectName, projectId: authorization.projectId,
  region: authorization.region, branch: authorization.branch, platformBranchLabel: authorization.platformBranchLabel,
  governedEnvironment: authorization.governedEnvironment, database: authorization.database, sqlRole: authorization.sqlRole,
  sqlPath: authorization.sqlPath, sqlSha256: authorization.sqlSha256, settingName: authorization.settingName,
  projectActive: true, testOnly: true, completeFile: true, completeFileByteForByte: true, fullQuerySelected: true,
  captureCompleteVisibleRow: true, readOnly: true, sprint017c28Ready: true, migration015Absent: true,
  migration014FullyRolledBack: true, amendmentUnapplied: true, priorAuthorizationsConsumed: true,
  aclParity261: true, optionalMetadataSafe: true, noSensitiveOutput: true, projectPaused: false,
  productionTrafficOrData: false, sqlModified: false, partialSelection: false, protected017c24: false,
  protected017c19: false, retryAuthorized: false, authorizationReusable: false, automaticReconciliation: false,
  amendmentAuthorized: false, postVerificationAuthorized: false, migration014Authorized: false, rpcAuthorized: false,
  roleAclMutationAuthorized: false, identifierGenerationAuthorized: false, noticeOnlyAccepted: false,
  zeroRowAcceptedAsPass: false, pendingAcceptedAsPass: false, malformedRowAcceptedAsPass: false,
  existingUnconsumedSuccessorAuthorization: false, maximumExecutionCount: 1, resultColumns: authorization.resultColumns,
});

const changes = Object.freeze([
  ["wrong-repository", "repository", "C:\\wrong"], ["wrong-organization", "organization", "Other"],
  ["wrong-project", "projectName", "Other"], ["wrong-project-id", "projectId", "wrong"],
  ["wrong-region", "region", "us-west-1"], ["wrong-branch", "branch", "develop"],
  ["wrong-source", "database", "Replica"], ["wrong-role", "sqlRole", "anon"],
  ["paused", "projectPaused", true], ["inactive", "projectActive", false],
  ["production-data", "productionTrafficOrData", true], ["wrong-path", "sqlPath", "frontend/wrong.sql"],
  ["wrong-hash", "sqlSha256", "0".repeat(64)], ["protected-017c24-hash", "sqlSha256", "C70E565DD877A3A32876176D82660E0A23A7553D5FE86E6C5075CCC352579B2A"],
  ["invalid-setting", "settingName", "lbht.017c24_preflight_result"], ["modified", "sqlModified", true],
  ["partial", "partialSelection", true], ["incomplete-file", "completeFile", false],
  ["multiple", "maximumExecutionCount", 2], ["retry", "retryAuthorized", true],
  ["reusable", "authorizationReusable", true], ["existing-authorization", "existingUnconsumedSuccessorAuthorization", true],
  ["missing-readiness", "sprint017c28Ready", false], ["notice-only", "noticeOnlyAccepted", true],
  ["zero-row-pass", "zeroRowAcceptedAsPass", true], ["pending-pass", "pendingAcceptedAsPass", true],
  ["malformed-pass", "malformedRowAcceptedAsPass", true], ["missing-columns", "resultColumns", authorization.resultColumns.slice(0, 15)],
  ["missing-capture", "captureCompleteVisibleRow", false], ["amendment", "amendmentAuthorized", true],
  ["reconciliation", "automaticReconciliation", true], ["post-verification", "postVerificationAuthorized", true],
  ["migration-014", "migration014Authorized", true], ["role-acl", "roleAclMutationAuthorized", true],
  ["rpc", "rpcAuthorized", true], ["identifier", "identifierGenerationAuthorized", true],
  ["migration-015", "migration015Absent", false], ["migration-014-not-rolled-back", "migration014FullyRolledBack", false],
  ["amendment-applied", "amendmentUnapplied", false], ["prior-not-consumed", "priorAuthorizationsConsumed", false],
  ["acl-loss", "aclParity261", false], ["metadata-unsafe", "optionalMetadataSafe", false],
  ["not-read-only", "readOnly", false], ["wrong-environment", "governedEnvironment", "PRODUCTION"],
]);
export const FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_017C29_SCENARIOS = Object.freeze(changes.map(([id, field, value]) => Object.freeze({ id, context: Object.freeze({ ...VALID_017C29_CONTEXT, [field]: value }), expectedFailure: field })));
export default FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_017C29_SCENARIOS;
