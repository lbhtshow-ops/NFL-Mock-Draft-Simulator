const immutable = (value) => Object.freeze(value);

export function evaluateCanonicalProspectIdentifierMigration014ReconciliationPostgresqlCorrection(amendment, evidence = {}) {
  const checks = immutable({
    amendmentPresent: amendment?.amendmentId === "CANONICAL_PROSPECT_IDENTIFIER_MIGRATION_014_RECONCILIATION_POSTGRESQL_CORRECTION_AMENDMENT",
    exactTarget: evidence.projectId === amendment?.exactProjectId,
    exactFailure: evidence.sqlstate === "42601" && evidence.failureLine === 135 && evidence.failureClassification === "RESERVED_KEYWORD_ALIAS_SYNTAX_FAILURE" && evidence.attempts === 1,
    migration014Protected: evidence.migration014Sha256 === amendment?.migration014Sha256,
    reconciliation017c4Protected: evidence.reconciliation017c4Sha256 === amendment?.protected017c4Sha256,
    successorHashExact: evidence.successorSha256 === amendment?.successor?.sha256,
    exactMechanicalCorrection: evidence.exactMechanicalCorrection === true,
    invalidAliasAbsent: evidence.invalidAliasAbsent === true,
    safeAliasConsistent: evidence.safeAliasConsistent === true,
    reservedTableAliasesAbsent: evidence.reservedTableAliasesAbsent === true,
    syntaxStructureBalanced: evidence.syntaxStructureBalanced === true,
    coveragePreserved: evidence.coveragePreserved === true,
    classifierComplete: evidence.classifierComplete === true,
    readOnly: evidence.readOnly === true,
    noLockingOrInvocation: evidence.noLockingOrInvocation === true,
    noRepairOrRetry: evidence.noRepairOrRetry === true,
    inventoryProtected: evidence.inventoryExact === true && evidence.migration015Absent === true,
    noReviewEffects: evidence.noReviewEffects === true,
  });
  const blockers = Object.entries(checks).filter(([, passed]) => !passed).map(([key]) => immutable({ code: `${key.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase()}_FAILED` }));
  const ready = blockers.length === 0;
  return immutable({
    status: ready ? "READY_FOR_CONTROLLED_MIGRATION_014_FAILED_EXECUTION_READ_ONLY_RECONCILIATION_REEXECUTION" : "MIGRATION_014_RECONCILIATION_POSTGRESQL_CORRECTION_BLOCKED",
    checks,
    blockers: immutable(blockers),
    reconciliation017c5ExecutionAuthorized: ready,
    migration014RetryAuthorized: false,
    repairAuthorized: false,
    roleChangeAuthorized: false,
    grantAuthorized: false,
    rpcInvocationAuthorized: false,
    databaseOperationsDuringReview: 0,
    networkRequestsDuringReview: 0,
  });
}

export default Object.freeze({ evaluateCanonicalProspectIdentifierMigration014ReconciliationPostgresqlCorrection });
