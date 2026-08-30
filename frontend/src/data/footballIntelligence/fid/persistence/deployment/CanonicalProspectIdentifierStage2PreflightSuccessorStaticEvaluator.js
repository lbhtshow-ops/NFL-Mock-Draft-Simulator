const immutable = (value) => Object.freeze(value);

export function evaluateCanonicalProspectIdentifierStage2PreflightSuccessorStaticEvidence(amendment, evidence = {}) {
  const checks = immutable({
    amendmentPresent: amendment?.amendmentId === "CANONICAL_PROSPECT_IDENTIFIER_STAGE_2_PREFLIGHT_COVERAGE_AMENDMENT",
    stage1Passed: evidence.stage1Status === amendment?.stage1Prerequisite,
    exactTargetAuthorized: evidence.exactTargetAuthorized === true,
    originalPreflightHashPreserved: evidence.originalPreflightSha256 === amendment?.originalPreflight?.sha256,
    successorHashMatched: evidence.successorSha256 === amendment?.authorizedSuccessor?.sha256,
    migration014HashMatched: evidence.migration014Sha256 === amendment?.migration?.approvedSha256,
    prohibitedMigrationHashRejected: evidence.migration014Sha256 !== amendment?.migration?.prohibitedSha256,
    migrationInventoryExact: evidence.migrationInventory === "001_THROUGH_014_EXACT",
    migration015Absent: evidence.migration015Absent === true,
    approvedChecksPreserved: evidence.approvedChecksPreserved === true,
    exactMigrationMetadataCovered: evidence.exactMigrationMetadataCovered === true,
    metadataFailureClassificationsCovered: evidence.metadataFailureClassificationsCovered === true,
    ownershipTransferCovered: evidence.ownershipTransferCovered === true,
    exactSixIndexesCovered: evidence.exactSixIndexesCovered === true,
    readOnlyStatements: evidence.readOnlyStatements === true,
    noLockingRead: evidence.noLockingRead === true,
    noUuidInvocation: evidence.noUuidInvocation === true,
    noIssuanceRpcInvocation: evidence.noIssuanceRpcInvocation === true,
    noSensitiveCatalog: evidence.noSensitiveCatalog === true,
    sanitizedOutput: evidence.sanitizedOutput === true,
    noExternalEffects: evidence.noExternalEffects === true,
  });
  const blockers = Object.entries(checks).filter(([, passed]) => !passed).map(([key]) => immutable({ code: `${key.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase()}_FAILED` }));
  const ready = blockers.length === 0;
  return immutable({
    amendmentId: amendment?.amendmentId ?? null,
    amendmentVersion: amendment?.amendmentVersion ?? null,
    status: ready ? "READY_FOR_CONTROLLED_DEPLOYMENT_STAGE_2_READ_ONLY_PREFLIGHT_EXECUTION" : "CONTROLLED_DEPLOYMENT_STAGE_2_READ_ONLY_PREFLIGHT_BLOCKED",
    checks,
    blockers: immutable(blockers),
    successorPreflightExecutionAuthorized: ready,
    originalPreflightExecutionAuthorized: false,
    migration014ExecutionAuthorized: false,
    sqlExecutedDuringReview: false,
    databaseOperations: 0,
    networkRequests: 0,
    requiredNextAction: ready ? amendment.requiredNextAction : "RESOLVE_STAGE_2_PREFLIGHT_SUCCESSOR_STATIC_REVIEW_BLOCKERS",
  });
}

export default Object.freeze({ evaluateCanonicalProspectIdentifierStage2PreflightSuccessorStaticEvidence });
