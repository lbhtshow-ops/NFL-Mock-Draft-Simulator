const immutable = (value) => Object.freeze(value);

export function evaluateCanonicalProspectIdentifierSupabaseFunctionOwnerGovernance(review, evidence = {}) {
  const checks = immutable({
    reviewPresent: review?.reviewId === "CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_FUNCTION_OWNER_GOVERNANCE_REVIEW",
    exactTarget: evidence.projectId === review?.exactTarget?.projectId,
    rollbackAuthoritative: review?.authoritativeState?.migration014State === "MIGRATION_014_FULLY_ROLLED_BACK" && review?.authoritativeState?.migration014Applied === false,
    protectedHashes: evidence.migration014Hash === review?.protectedHashes?.migration014 && evidence.reconciliation017c5Hash === review?.protectedHashes?.reconciliation017c5,
    officialPrimarySourcesOnly: evidence.officialPrimarySourcesOnly === true,
    clientAuthorityDistinguished: review?.findings?.clientChangesAuthority === false,
    fourPathsEvaluated: Array.isArray(review?.paths) && review.paths.length === 4,
    missingCapabilityIdentified: review?.findings?.currentSetCapabilityConfirmed === false && review?.findings?.currentAdminCapabilityKnown === false,
    preflightRequired: review?.findings?.additionalReadOnlyPreflightRequired === true,
    preflightHashExact: evidence.preflightHash === review?.preflight?.sha256,
    preflightReadOnly: evidence.preflightReadOnly === true,
    preflightCoverageComplete: evidence.preflightCoverageComplete === true,
    noRoleMutation: evidence.noRoleMutation === true,
    migrationInventoryProtected: evidence.migrationInventoryExact === true && evidence.migration015Absent === true,
    noReviewEffects: evidence.noReviewEffects === true,
  });
  const blockers = Object.entries(checks).filter(([, passed]) => !passed).map(([key]) => immutable({ code: `${key.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase()}_FAILED` }));
  return immutable({
    status: blockers.length === 0 ? "READY_FOR_SUPABASE_OWNERSHIP_CAPABILITY_READ_ONLY_PREFLIGHT_REVIEW" : "MIGRATION_014_OWNERSHIP_ARCHITECTURE_BLOCKED",
    checks,
    blockers: immutable(blockers),
    migrationDeploymentReady: false,
    preflightReviewReady: blockers.length === 0,
    databaseOperations: 0,
    networkDatabaseConnections: 0,
  });
}

export default Object.freeze({ evaluateCanonicalProspectIdentifierSupabaseFunctionOwnerGovernance });
