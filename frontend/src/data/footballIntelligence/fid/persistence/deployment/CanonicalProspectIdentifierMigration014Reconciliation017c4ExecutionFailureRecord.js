export const CANONICAL_PROSPECT_IDENTIFIER_MIGRATION_014_RECONCILIATION_017C4_EXECUTION_FAILURE_RECORD = Object.freeze({
  recordId: "CANONICAL_PROSPECT_IDENTIFIER_MIGRATION_014_RECONCILIATION_017C4_EXECUTION_FAILURE_RECORD",
  recordVersion: "1.0.0",
  status: "MIGRATION_014_COMMIT_STATE_RECONCILIATION_EXECUTION_BLOCKED",
  target: Object.freeze({ projectId: "ahmorpzcaapvoymiqlkv", branch: "main", governedEnvironment: "DEDICATED_NON_PRODUCTION_TEST" }),
  attemptedArtifact: Object.freeze({
    path: "src/data/footballIntelligence/fid/persistence/deployment/review/017c4_failed_migration_014_read_only_commit_state_reconciliation.sql",
    sha256: "9DE16F74704F8BB0EE89E35E0783DE6787D58B5B0FAFFB21898641581AEF54CC",
  }),
  failure: Object.freeze({
    sqlstate: "42601",
    line: 135,
    classification: "RESERVED_KEYWORD_ALIAS_SYNTAX_FAILURE",
    failingAlias: "constraint",
    reconciliationAttempts: 1,
    reconciliationResultsProduced: false,
    databaseMutations: 0,
    commitStateDetermined: false,
  }),
  controls: Object.freeze({ automaticDatabaseCorrectionProhibited: true, correctiveRepositorySuccessorRequired: true, migration014RetryProhibited: true }),
  effects: Object.freeze({ databaseOperationsDuringRepositoryReview: 0, supabaseConnections: 0, sqlExecutedDuringRepositoryReview: false }),
});

export default CANONICAL_PROSPECT_IDENTIFIER_MIGRATION_014_RECONCILIATION_017C4_EXECUTION_FAILURE_RECORD;
