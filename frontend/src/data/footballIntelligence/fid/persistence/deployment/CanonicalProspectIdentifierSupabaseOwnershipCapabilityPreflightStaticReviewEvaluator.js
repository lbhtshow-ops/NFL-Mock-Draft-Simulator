const immutable = (value) => Object.freeze(value);

export function evaluateCanonicalProspectIdentifierSupabaseOwnershipCapabilityPreflightStaticReview(review, evidence = {}) {
  const checks = immutable({
    reviewPresent: review?.reviewId === "CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_OWNERSHIP_CAPABILITY_PREFLIGHT_STATIC_REVIEW",
    exactTarget: evidence.projectId === review?.exactTarget?.projectId && review?.exactTarget?.sqlEditorRole === "postgres",
    protectedHashes: evidence.migration014Hash === review?.protected?.migration014Sha256 && evidence.reconciliation017c5Hash === review?.protected?.reconciliation017c5Sha256 && evidence.preflight017c6Hash === review?.protected?.preflight017c6Sha256,
    defectExact: review?.defect?.classification === "CAPABILITY_COVERAGE_AND_EXECUTION_IDENTITY_BINDING_INCOMPLETE" && review?.defect?.narrowCorrectionAvailable === true,
    successorHashExact: evidence.preflight017c7Hash === review?.successor?.sha256,
    protectedPrefixPreserved: evidence.protectedPrefixPreserved === true,
    readOnly: evidence.readOnly === true,
    postgresql17Compatible: evidence.postgresql17Compatible === true,
    coverageComplete: evidence.coverageComplete === true,
    sanitized: evidence.sanitized === true,
    inventoryProtected: evidence.inventoryExact === true && evidence.migration015Absent === true,
    noReviewEffects: evidence.noReviewEffects === true,
  });
  const blockers = Object.entries(checks).filter(([, passed]) => !passed).map(([key]) => immutable({ code: `${key.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase()}_FAILED` }));
  return immutable({
    status: blockers.length === 0 ? "SUPABASE_OWNERSHIP_CAPABILITY_PREFLIGHT_CORRECTION_REQUIRED" : "SUPABASE_OWNERSHIP_CAPABILITY_PREFLIGHT_REVIEW_BLOCKED",
    checks,
    blockers: immutable(blockers),
    preflight017c6ExecutionAuthorized: false,
    preflight017c7ExecutionAuthorized: false,
    preflight017c7CorrectionReviewReady: blockers.length === 0,
    migrationDeploymentReady: false,
    databaseOperations: 0,
    networkDatabaseConnections: 0,
  });
}

export default Object.freeze({ evaluateCanonicalProspectIdentifierSupabaseOwnershipCapabilityPreflightStaticReview });
