export const CANONICAL_PROSPECT_IDENTIFIER_017C7_EXECUTION_FAILURE_RECORD = Object.freeze({
  recordId: "CANONICAL_PROSPECT_IDENTIFIER_017C7_EXECUTION_FAILURE_RECORD",
  recordVersion: "1.0.0",
  status: "017C7_READ_ONLY_PREFLIGHT_EXECUTION_FAILED",
  target: Object.freeze({ projectId: "ahmorpzcaapvoymiqlkv", database: "PRIMARY_DATABASE", sqlEditorRole: "postgres" }),
  artifact: Object.freeze({ path: "src/data/footballIntelligence/fid/persistence/deployment/review/017c7_supabase_function_owner_deployment_capability_read_only_preflight_correction.sql", sha256: "BC96C898B17BB9C55B34991E6CB164C2AB038BD16B1DDC45BC4B2F12D939FD57" }),
  failure: Object.freeze({ sqlstate: "42P10", line: 34, classification: "SELECT_DISTINCT_ORDER_BY_EXPRESSION_NOT_IN_SELECT_LIST", offendingOrdering: "ORDER BY expected.role_name COLLATE C", attempts: 1, resultSetsReturned: 0, stageCompleted: false }),
  effects: Object.freeze({ databaseMutations: 0, migration014Executed: false, roleOrMembershipChanges: false, rpcInvocations: 0 }),
  authoritativeDatabaseState: "MIGRATION_014_FULLY_ROLLED_BACK",
});

export default CANONICAL_PROSPECT_IDENTIFIER_017C7_EXECUTION_FAILURE_RECORD;
