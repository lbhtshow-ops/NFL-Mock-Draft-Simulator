import authorization from "./FidFunctionOwnerCapabilityPreflight017c26ExecutionAuthorization.js";

export const VALID_017C26_CONTEXT = Object.freeze({
  organization: authorization.organization, projectName: authorization.projectName, projectId: authorization.projectId,
  region: authorization.region, branch: authorization.branch, database: authorization.database, sqlRole: authorization.sqlRole,
  sqlSha256: authorization.sqlSha256, projectActive: true, testOnly: true, completeFile: true,
  completeFileByteForByte: true, fullQuerySelected: true, captureCompleteVisibleRow: true, readOnly: true,
  sprint017c25Ready: true, migration015Absent: true, migration014FullyRolledBack: true,
  priorAuthorizationConsumed: true, aclParity261: true, noSensitiveOutput: true, projectPaused: false,
  productionTrafficOrData: false, sqlModified: false, partialSelection: false, protected017c19: false,
  retryAuthorized: false, authorizationReused: false, automaticReconciliation: false, amendmentAuthorized: false,
  postVerificationAuthorized: false, migration014Authorized: false, rpcAuthorized: false, roleAclMutationAuthorized: false,
  identifierGenerationAuthorized: false, noticeOnlyAccepted: false, zeroRowAcceptedAsPass: false,
  pendingAcceptedAsPass: false, malformedRowAcceptedAsPass: false, existingUnconsumedSuccessorAuthorization: false,
  maximumExecutionCount: 1, resultColumns: authorization.resultColumns,
});

const changes = Object.freeze([
  ["wrong-organization", "organization", "Other"], ["wrong-project-name", "projectName", "Other"],
  ["wrong-project-id", "projectId", "wrong"], ["wrong-region", "region", "us-west-1"],
  ["wrong-branch", "branch", "develop"], ["wrong-database", "database", "Replica"], ["wrong-role", "sqlRole", "anon"],
  ["paused", "projectPaused", true], ["inactive", "projectActive", false], ["production-data", "productionTrafficOrData", true],
  ["wrong-hash", "sqlSha256", "0".repeat(64)], ["modified-sql", "sqlModified", true], ["not-byte-exact", "completeFileByteForByte", false],
  ["partial", "partialSelection", true], ["selection-incomplete", "fullQuerySelected", false], ["protected-017c19", "protected017c19", true],
  ["multiple", "maximumExecutionCount", 2], ["retry", "retryAuthorized", true], ["reuse", "authorizationReused", true],
  ["auto-reconcile", "automaticReconciliation", true], ["amendment", "amendmentAuthorized", true],
  ["post-verification", "postVerificationAuthorized", true], ["migration-014", "migration014Authorized", true],
  ["rpc", "rpcAuthorized", true], ["role-acl-mutation", "roleAclMutationAuthorized", true],
  ["identifier-generation", "identifierGenerationAuthorized", true], ["missing-capture", "captureCompleteVisibleRow", false],
  ["notice-only", "noticeOnlyAccepted", true], ["zero-row-pass", "zeroRowAcceptedAsPass", true],
  ["pending-pass", "pendingAcceptedAsPass", true], ["malformed-pass", "malformedRowAcceptedAsPass", true],
  ["existing-authorization", "existingUnconsumedSuccessorAuthorization", true], ["missing-readiness", "sprint017c25Ready", false],
  ["migration-015", "migration015Absent", false], ["migration-014-not-rolled-back", "migration014FullyRolledBack", false],
  ["acl-parity-loss", "aclParity261", false], ["sensitive-output", "noSensitiveOutput", false],
  ["wrong-columns", "resultColumns", authorization.resultColumns.slice(0, 15)], ["not-read-only", "readOnly", false],
]);

export const FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_017C26_SCENARIOS = Object.freeze(changes.map(([id, field, value]) => Object.freeze({ id, context: Object.freeze({ ...VALID_017C26_CONTEXT, [field]: value }), expectedFailure: field })));

export default FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_017C26_SCENARIOS;
