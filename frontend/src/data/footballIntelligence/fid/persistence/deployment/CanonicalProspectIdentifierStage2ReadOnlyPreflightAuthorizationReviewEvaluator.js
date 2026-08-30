const immutable = (value) => Object.freeze(value);

export function evaluateCanonicalProspectIdentifierStage2ReadOnlyPreflightAuthorizationReview(review, evidence = {}) {
  const checks = immutable({
    reviewPresent: review?.reviewId === "CANONICAL_PROSPECT_IDENTIFIER_STAGE_2_READ_ONLY_PREFLIGHT_AUTHORIZATION_REVIEW",
    stage1Passed: evidence.stage1Status === "CONTROLLED_DEPLOYMENT_STAGE_1_PASSED",
    exactTargetAuthorized: evidence.exactTargetAuthorized === true,
    migrationInventoryExact: evidence.migrationInventory === "001_THROUGH_014_EXACT",
    migration015Absent: evidence.migration015Absent === true,
    correctedMigrationHash: evidence.migration014Sha256 === review?.migration?.approvedSha256,
    prohibitedHashRejected: evidence.migration014Sha256 !== review?.migration?.prohibitedSha256,
    preflightHashMatched: evidence.preflightSha256 === review?.preflight?.sha256,
    selectOnlyStatements: evidence.selectOnlyStatements === true,
    noMutatingSql: evidence.noMutatingSql === true,
    uuidNotInvoked: evidence.uuidNotInvoked === true,
    issuanceRpcNotInvoked: evidence.issuanceRpcNotInvoked === true,
    sensitiveSourcesAbsent: evidence.sensitiveSourcesAbsent === true,
    migrationMetadataCovered: evidence.migrationMetadataCovered === true,
    ownerTransferCapabilityCovered: evidence.ownerTransferCapabilityCovered === true,
    indexConflictsCovered: evidence.indexConflictsCovered === true,
  });
  const blockers = Object.entries(checks).filter(([, passed]) => !passed).map(([key]) => immutable({ code: `${key.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase()}_FAILED` }));
  const ready = blockers.length === 0;
  return immutable({
    reviewId: review?.reviewId ?? null,
    reviewVersion: review?.reviewVersion ?? null,
    status: ready ? "READY_FOR_CONTROLLED_DEPLOYMENT_STAGE_2_READ_ONLY_PREFLIGHT_EXECUTION" : "CONTROLLED_DEPLOYMENT_STAGE_2_READ_ONLY_PREFLIGHT_BLOCKED",
    checks,
    blockers: immutable(blockers),
    stage2PreflightExecutionAuthorized: ready,
    migration014ExecutionAuthorized: false,
    sqlExecutedDuringReview: false,
    databaseOperations: 0,
    networkRequests: 0,
    requiredNextAction: ready
      ? "MANUALLY_EXECUTE_AUTHORIZED_STAGE_2_READ_ONLY_PREFLIGHT_AND_STOP"
      : review?.requiredNextAction ?? "RESOLVE_STAGE_2_PREFLIGHT_REVIEW_BLOCKERS",
  });
}

export default Object.freeze({ evaluateCanonicalProspectIdentifierStage2ReadOnlyPreflightAuthorizationReview });
