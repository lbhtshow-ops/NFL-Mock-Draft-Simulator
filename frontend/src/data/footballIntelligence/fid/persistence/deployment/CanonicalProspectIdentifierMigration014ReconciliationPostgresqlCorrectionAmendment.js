import failureRecord from "./CanonicalProspectIdentifierMigration014Reconciliation017c4ExecutionFailureRecord.js";

export const CANONICAL_PROSPECT_IDENTIFIER_MIGRATION_014_RECONCILIATION_POSTGRESQL_CORRECTION_AMENDMENT = Object.freeze({
  amendmentId: "CANONICAL_PROSPECT_IDENTIFIER_MIGRATION_014_RECONCILIATION_POSTGRESQL_CORRECTION_AMENDMENT",
  amendmentVersion: "1.0.0",
  status: "READY_FOR_CONTROLLED_MIGRATION_014_FAILED_EXECUTION_READ_ONLY_RECONCILIATION_REEXECUTION",
  failureRecordReference: `${failureRecord.recordId}@${failureRecord.recordVersion}`,
  exactProjectId: "ahmorpzcaapvoymiqlkv",
  migration014Sha256: "18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD",
  protected017c4Sha256: "9DE16F74704F8BB0EE89E35E0783DE6787D58B5B0FAFFB21898641581AEF54CC",
  successor: Object.freeze({
    path: "src/data/footballIntelligence/fid/persistence/deployment/review/017c5_failed_migration_014_read_only_commit_state_reconciliation_postgresql_correction.sql",
    sha256: "EF3F45440082D9558A6CCF60F9F91F1017D0EC8E3EC0338C37FCEB6DC4742AA7",
    invalidAlias: "constraint",
    safeAlias: "constraint_record",
    correctedAliasDeclarations: 5,
    correctedQualifiedReferences: 10,
    semanticsChanged: false,
    manualExecutionOnly: true,
  }),
  preservedCommitStateClassifications: Object.freeze([
    "MIGRATION_014_FULLY_ROLLED_BACK",
    "MIGRATION_014_PARTIALLY_APPLIED",
    "MIGRATION_014_STRUCTURALLY_APPLIED_OWNERSHIP_OR_PRIVILEGES_INCOMPLETE",
    "MIGRATION_014_FULLY_APPLIED_BUT_EXECUTION_RESPONSE_INCONSISTENT",
    "MIGRATION_014_STATE_INCONSISTENT_RECOVERY_REQUIRED",
    "MIGRATION_014_COMMIT_STATE_UNRESOLVED",
  ]),
  restrictions: Object.freeze({ readOnly: true, repairProhibited: true, retryProhibited: true, roleChangeProhibited: true, grantProhibited: true, rpcInvocationProhibited: true }),
  parserReview: Object.freeze({ localPostgresqlParserAvailable: false, parserInstallationAuthorized: false, deterministicWholeFileChecksRequired: true }),
  effects: Object.freeze({ databaseOperations: 0, supabaseConnections: 0, networkRequests: 0, sqlExecutedDuringReview: false }),
  requiredNextAction: "MANUALLY_EXECUTE_ONLY_AUTHORIZED_017C5_READ_ONLY_RECONCILIATION_RETURN_ALL_SANITIZED_RESULTS_AND_STOP",
});

export default CANONICAL_PROSPECT_IDENTIFIER_MIGRATION_014_RECONCILIATION_POSTGRESQL_CORRECTION_AMENDMENT;
