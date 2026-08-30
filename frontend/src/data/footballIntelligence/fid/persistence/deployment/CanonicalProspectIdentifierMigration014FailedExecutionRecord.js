const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const CANONICAL_PROSPECT_IDENTIFIER_MIGRATION_014_FAILED_EXECUTION_RECORD = deepFreeze({
  recordId: "CANONICAL_PROSPECT_IDENTIFIER_MIGRATION_014_FAILED_EXECUTION_RECORD",
  recordVersion: "1.0.0",
  status: "MIGRATION_014_FAILED_COMMIT_STATE_RECONCILIATION_REQUIRED",
  target: {
    organizationName: "Lunch Break Hot Take",
    projectName: "LBHT FID Persistence Test",
    projectId: "ahmorpzcaapvoymiqlkv",
    region: "us-east-1",
    branchName: "main",
    platformBranchRole: "PRODUCTION_PRIMARY_BRANCH",
    governedEnvironment: "DEDICATED_NON_PRODUCTION_TEST",
    source: "PRIMARY_DATABASE",
    selectedRole: "postgres",
    purpose: "TEST_ONLY",
    productionTraffic: "NONE",
    productionData: "NONE",
  },
  migration: {
    filename: "014_create_fid_identifier_issuance_transaction.sql",
    approvedSha256: "18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD",
    prohibitedSha256: "3B271BC994D82C8109CDE4E62E6A1F85A67E49F86C5D98FBD0EBA46D6D214F13",
    pastedByteForByte: true,
    dashboardOperations: 1,
  },
  failure: {
    sqlstate: "42501",
    sanitizedError: "must be able to SET ROLE fid_function_owner",
    statementLine: 249,
    statementClassification: "ALTER_FUNCTION_OWNER_TO_FID_FUNCTION_OWNER",
    executionAttempts: 1,
    automaticRetryProhibited: true,
    interactiveRepairProhibited: true,
    exactCommitState: "UNKNOWN",
  },
  orderedPosition: {
    precedingStatements: ["CREATE_THREE_TABLES", "CREATE_SIX_INDEXES", "CREATE_TRANSACTION_FUNCTION"],
    failedStatement: "ALTER_FUNCTION_OWNER_TO_FID_FUNCTION_OWNER",
    followingStatements: ["COMMENT_FUNCTION", "ENABLE_AND_FORCE_RLS", "CREATE_FIFTEEN_POLICIES", "REVOKE_TABLE_AND_FUNCTION_ACCESS", "GRANT_OWNER_TABLE_ACCESS", "GRANT_SERVICE_ROLE_RPC_ACCESS"],
    statementOrderProvesCommitState: false,
  },
  effects: {
    rpcInvocations: 0,
    candidateGenerations: 0,
    prospectOperations: 0,
    knownRpcPersistenceOperations: 0,
  },
  prohibitedNextActions: ["RETRY", "REPAIR", "ROLLBACK", "CLEANUP", "PRIVILEGE_CHANGE", "MIGRATION_AMENDMENT", "SET_ROLE", "RPC_INVOCATION"],
});

export default CANONICAL_PROSPECT_IDENTIFIER_MIGRATION_014_FAILED_EXECUTION_RECORD;
