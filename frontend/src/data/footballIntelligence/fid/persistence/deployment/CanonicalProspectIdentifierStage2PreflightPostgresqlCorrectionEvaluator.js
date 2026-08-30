const immutable = (value) => Object.freeze(value);

export function evaluateCanonicalProspectIdentifierStage2PreflightPostgresqlCorrection(amendment, evidence = {}) {
  const checks = immutable({
    amendmentPresent: amendment?.amendmentId === "CANONICAL_PROSPECT_IDENTIFIER_STAGE_2_PREFLIGHT_POSTGRESQL_CORRECTION_AMENDMENT",
    failureRecorded: evidence.failureClassification === "PREFLIGHT_SQL_POSTGRESQL_ORDER_BY_COMPATIBILITY_FAILURE" && evidence.sqlstate === "0A000",
    stage1Passed: evidence.stage1Status === amendment?.stage1Prerequisite,
    exactTargetAuthorized: evidence.exactTargetAuthorized === true,
    originalHashPreserved: evidence.originalPreflightSha256 === amendment?.protectedArtifacts?.originalPreflightSha256,
    incompatible017c2HashPreserved: evidence.preflight017c2Sha256 === amendment?.protectedArtifacts?.incompatible017c2Sha256,
    migration014HashPreserved: evidence.migration014Sha256 === amendment?.protectedArtifacts?.migration014Sha256,
    corrected017c3HashMatched: evidence.preflight017c3Sha256 === amendment?.authorizedSuccessor?.sha256,
    migrationInventoryExact: evidence.migrationInventory === "001_THROUGH_014_EXACT",
    migration015Absent: evidence.migration015Absent === true,
    incompatiblePatternAbsent: evidence.incompatiblePatternAbsent === true,
    outerOrderingPresent: evidence.outerOrderingPresent === true,
    deterministicOrderingPreserved: evidence.deterministicOrderingPreserved === true,
    resultColumnsPreserved: evidence.resultColumnsPreserved === true,
    allTenBlocksPreserved: evidence.allTenBlocksPreserved === true,
    exactMetadataCoveragePreserved: evidence.exactMetadataCoveragePreserved === true,
    ownershipCoveragePreserved: evidence.ownershipCoveragePreserved === true,
    exactSixIndexesPreserved: evidence.exactSixIndexesPreserved === true,
    readOnlyStatements: evidence.readOnlyStatements === true,
    noLockingReads: evidence.noLockingReads === true,
    noUuidInvocation: evidence.noUuidInvocation === true,
    noIssuanceRpcInvocation: evidence.noIssuanceRpcInvocation === true,
    noSensitiveAccess: evidence.noSensitiveAccess === true,
    noExternalEffects: evidence.noExternalEffects === true,
  });
  const blockers = Object.entries(checks).filter(([, passed]) => !passed).map(([key]) => immutable({ code: `${key.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase()}_FAILED` }));
  const ready = blockers.length === 0;
  return immutable({
    amendmentId: amendment?.amendmentId ?? null,
    amendmentVersion: amendment?.amendmentVersion ?? null,
    status: ready ? "READY_FOR_CONTROLLED_DEPLOYMENT_STAGE_2_READ_ONLY_PREFLIGHT_REEXECUTION" : "CONTROLLED_DEPLOYMENT_STAGE_2_READ_ONLY_PREFLIGHT_CORRECTION_BLOCKED",
    checks,
    blockers: immutable(blockers),
    preflight017c3ReexecutionAuthorized: ready,
    preflight017c2ReexecutionAuthorized: false,
    migration014ExecutionAuthorized: false,
    sqlExecutedDuringReview: false,
    databaseOperations: 0,
    networkRequests: 0,
    requiredNextAction: ready ? amendment.requiredNextAction : "RESOLVE_STAGE_2_POSTGRESQL_CORRECTION_BLOCKERS",
  });
}

export default Object.freeze({ evaluateCanonicalProspectIdentifierStage2PreflightPostgresqlCorrection });
