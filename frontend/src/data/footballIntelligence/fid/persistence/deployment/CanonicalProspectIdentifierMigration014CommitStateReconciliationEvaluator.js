const immutable = (value) => Object.freeze(value);

export function evaluateCanonicalProspectIdentifierMigration014CommitStateReconciliation(amendment, evidence = {}) {
  const requiredClassifications = amendment?.commitStateClassifications ?? [];
  const checks = immutable({
    amendmentPresent: amendment?.amendmentId === "CANONICAL_PROSPECT_IDENTIFIER_MIGRATION_014_COMMIT_STATE_RECONCILIATION_AMENDMENT",
    exactTarget: evidence.projectId === amendment?.exactProjectId,
    failureExact: evidence.sqlstate === "42501" && evidence.failureLine === 249 && evidence.executionAttempts === 1 && evidence.commitStateUnknown === true,
    migrationHashExact: evidence.migrationSha256 === amendment?.migrationSha256,
    migrationInventoryExact: evidence.migrationInventory === "001_THROUGH_014_EXACT" && evidence.migration015Absent === true,
    reconciliationHashExact: evidence.reconciliationSha256 === amendment?.reconciliation?.sha256,
    sessionAndRolesCovered: evidence.sessionAndRolesCovered === true,
    pg17MembershipOptionsCovered: evidence.pg17MembershipOptionsCovered === true,
    setRoleCapabilityDistinct: evidence.setRoleCapabilityDistinct === true,
    exactObjectsCovered: evidence.exactObjectsCovered === true,
    tableStructureCovered: evidence.tableStructureCovered === true,
    exactConstraintsCovered: evidence.exactConstraintsCovered === true,
    functionStructureCovered: evidence.functionStructureCovered === true,
    policiesAndPrivilegesCovered: evidence.policiesAndPrivilegesCovered === true,
    safeCountsCovered: evidence.safeCountsCovered === true,
    migrationMetadataCovered: evidence.migrationMetadataCovered === true,
    allCommitStatesCovered: requiredClassifications.length === 6 && requiredClassifications.every((classification) => evidence.commitStateClassifications?.includes(classification)),
    readOnlyStatements: evidence.readOnlyStatements === true,
    noLockingReads: evidence.noLockingReads === true,
    noSetRoleExecution: evidence.noSetRoleExecution === true,
    noUuidOrRpcInvocation: evidence.noUuidOrRpcInvocation === true,
    noSensitiveRows: evidence.noSensitiveRows === true,
    noRepairOrRetry: evidence.noRepairOrRetry === true,
    noReviewEffects: evidence.noReviewEffects === true,
  });
  const blockers = Object.entries(checks).filter(([, passed]) => !passed).map(([key]) => immutable({ code: `${key.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase()}_FAILED` }));
  const ready = blockers.length === 0;
  return immutable({
    status: ready ? "READY_FOR_CONTROLLED_MIGRATION_014_FAILED_EXECUTION_READ_ONLY_RECONCILIATION" : "MIGRATION_014_FAILED_EXECUTION_RECONCILIATION_BLOCKED",
    checks,
    blockers: immutable(blockers),
    reconciliationExecutionAuthorized: ready,
    migrationRetryAuthorized: false,
    repairAuthorized: false,
    cleanupAuthorized: false,
    grantAuthorized: false,
    setRoleAuthorized: false,
    migration014ExecutionAuthorized: false,
    databaseOperationsDuringReview: 0,
    networkRequestsDuringReview: 0,
  });
}

export default Object.freeze({ evaluateCanonicalProspectIdentifierMigration014CommitStateReconciliation });
