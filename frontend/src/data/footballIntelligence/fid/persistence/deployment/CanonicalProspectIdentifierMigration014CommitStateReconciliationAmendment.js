import failureRecord from "./CanonicalProspectIdentifierMigration014FailedExecutionRecord.js";

export const CANONICAL_PROSPECT_IDENTIFIER_MIGRATION_014_COMMIT_STATE_RECONCILIATION_AMENDMENT = Object.freeze({
  amendmentId: "CANONICAL_PROSPECT_IDENTIFIER_MIGRATION_014_COMMIT_STATE_RECONCILIATION_AMENDMENT",
  amendmentVersion: "1.0.0",
  status: "READY_FOR_CONTROLLED_MIGRATION_014_FAILED_EXECUTION_READ_ONLY_RECONCILIATION",
  failureRecordReference: `${failureRecord.recordId}@${failureRecord.recordVersion}`,
  exactProjectId: "ahmorpzcaapvoymiqlkv",
  migrationSha256: "18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD",
  reconciliation: Object.freeze({
    path: "src/data/footballIntelligence/fid/persistence/deployment/review/017c4_failed_migration_014_read_only_commit_state_reconciliation.sql",
    sha256: "9DE16F74704F8BB0EE89E35E0783DE6787D58B5B0FAFFB21898641581AEF54CC",
    manualExecutionOnly: true,
    completeSanitizedResultsRequired: true,
  }),
  postgresql17RoleCapability: Object.freeze({
    membershipCatalog: "pg_catalog.pg_auth_members",
    fields: Object.freeze(["admin_option", "inherit_option", "set_option"]),
    authoritativeCapabilityCheck: "pg_has_role(postgres,fid_function_owner,SET)",
    memberAloneSufficient: false,
    setRoleExecuted: false,
  }),
  commitStateClassifications: Object.freeze([
    "MIGRATION_014_FULLY_ROLLED_BACK",
    "MIGRATION_014_PARTIALLY_APPLIED",
    "MIGRATION_014_STRUCTURALLY_APPLIED_OWNERSHIP_OR_PRIVILEGES_INCOMPLETE",
    "MIGRATION_014_FULLY_APPLIED_BUT_EXECUTION_RESPONSE_INCONSISTENT",
    "MIGRATION_014_STATE_INCONSISTENT_RECOVERY_REQUIRED",
    "MIGRATION_014_COMMIT_STATE_UNRESOLVED",
  ]),
  restrictions: Object.freeze({
    readOnly: true,
    retryProhibited: true,
    repairProhibited: true,
    cleanupProhibited: true,
    grantsProhibited: true,
    setRoleProhibited: true,
    migrationExecutionProhibited: true,
    rpcInvocationProhibited: true,
  }),
  effects: Object.freeze({ sqlExecutedDuringReview: false, databaseOperations: 0, supabaseConnections: 0, networkRequests: 0, persistenceOperations: 0 }),
  requiredNextAction: "MANUALLY_EXECUTE_ONLY_AUTHORIZED_READ_ONLY_FAILED_EXECUTION_RECONCILIATION_RETURN_ALL_SANITIZED_RESULTS_AND_STOP",
});

export default CANONICAL_PROSPECT_IDENTIFIER_MIGRATION_014_COMMIT_STATE_RECONCILIATION_AMENDMENT;
