import { deepFreeze } from "../../prospectIntake/ProspectIdentityDryRunRequest.js";

export const CANONICAL_PROSPECT_IDENTIFIER_NON_PRODUCTION_PERSISTENCE_TRANSACTION_DEPLOYMENT_REVIEW = deepFreeze({
  reviewId: "CANONICAL_PROSPECT_IDENTIFIER_NON_PRODUCTION_PERSISTENCE_TRANSACTION_DEPLOYMENT_REVIEW",
  reviewVersion: "1.0.0",
  migration: "014_create_fid_identifier_issuance_transaction.sql",
  expectedSha256: "3B271BC994D82C8109CDE4E62E6A1F85A67E49F86C5D98FBD0EBA46D6D214F13",
  migrationExecuted: false,
  evidence: {
    migrationHashVerified: true, migrationOrderingVerified: true, authorizedObjectScopeVerified: true,
    postgresqlSyntaxStaticallyReviewed: true, uuidReadOnlyPreflightComplete: true,
    referenceLifecycleVerified: true, foreignKeyGraphInsertable: true, idempotencyComparisonComplete: true,
    replayBeforeUuidVerified: true, collisionPersistenceVerified: true, lockOrderVerified: true,
    atomicityVerified: true, rollbackVerified: true, resultMappingVerified: true,
    forcedRlsPolicyPathStaticallyResolved: true, rolePreflightComplete: true, browserRolesDenied: true,
    adapterMappingVerified: true, runbookComplete: true, acceptancePackageComplete: true, recoveryPlanComplete: true,
    inconsistentStoredStateDetectionVerified: false,
  },
  findings: [
    { findingId: "DR-014-001", classification: "BLOCKER", artifact: "014_create_fid_identifier_issuance_transaction.sql", location: "matching replay branch", issue: "Stored result payload is returned without relational consistency validation.", consequence: "An inconsistent stored outcome is replayed instead of returning recovery-required.", requiredCorrection: "Add governed consistency checks before replay return and emit a sanitized recovery-required result on mismatch.", migration014MustChange: true, contractAmendmentRequired: false, deploymentProhibited: true },
    { findingId: "DR-014-002", classification: "REVIEW_REQUIRED", artifact: "target environment", location: "read-only preflight", issue: "UUID function, roles, ownership, privileges, and project identity are not repository-provable.", consequence: "Controlled execution must stop unless every target preflight passes.", requiredCorrection: "Execute only the reviewed read-only preflight in the authorized deployment sprint.", migration014MustChange: false, contractAmendmentRequired: false, deploymentProhibited: true },
    { findingId: "DR-014-003", classification: "NON_BLOCKING_OBSERVATION", artifact: "ProspectIdentifierMigration014StaticOracle.js", location: "23 static checks", issue: "Substring and first-index checks cannot prove SQL parsing, branch semantics, FK validity, or stored-payload consistency.", consequence: "Oracle success is supporting evidence only.", requiredCorrection: "Retain independent semantic review and target acceptance.", migration014MustChange: false, contractAmendmentRequired: false, deploymentProhibited: false },
  ],
  permissions: { mayExecuteSql: false, mayConnectDatabase: false, mayCallSupabase: false, mayReadSecrets: false, mayGenerateUuid: false, mayGenerateCandidate: false, mayPersist: false, mayDeploy: false },
  requiredNextAction: "SPRINT_17B_3_NARROW_MIGRATION_014_INCONSISTENT_REPLAY_CORRECTION",
});

export default CANONICAL_PROSPECT_IDENTIFIER_NON_PRODUCTION_PERSISTENCE_TRANSACTION_DEPLOYMENT_REVIEW;
