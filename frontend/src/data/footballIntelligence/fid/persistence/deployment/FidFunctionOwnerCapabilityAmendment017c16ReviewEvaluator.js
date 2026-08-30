const OPTIONAL_METADATA_REFERENCE = /\bfrom\s+fid\.fid_persistence_migrations\b/i;

export function evaluate017c16ReadOnlyFailureReachability(sql = "") {
  return Object.freeze({
    directOptionalMetadataReference: OPTIONAL_METADATA_REFERENCE.test(sql),
    missingMetadataSanitized: !OPTIONAL_METADATA_REFERENCE.test(sql),
  });
}

export function evaluate017c16ReconciliationCoverage(sql = "") {
  const setOnly = /SET_ONLY/i.test(sql);
  const createOnly = /CREATE_ONLY/i.test(sql);
  return Object.freeze({ setOnly, createOnly, sixOutcomesExplicit: setOnly && createOnly });
}

export function evaluate017c16Review(evidence = {}) {
  const checks = Object.freeze({
    correctedHashesExact: evidence.correctedHashesExact === true,
    protectedHashesExact: evidence.protectedHashesExact === true,
    migrationInventoryExact: evidence.migrationInventoryExact === true,
    migration015Absent: evidence.migration015Absent === true,
    amendmentBoundaryValid: evidence.amendmentBoundaryValid === true,
    preflightMissingMetadataSanitized: evidence.preflightMissingMetadataSanitized === true,
    reconciliationMissingMetadataSanitized: evidence.reconciliationMissingMetadataSanitized === true,
    postMissingMetadataSanitized: evidence.postMissingMetadataSanitized === true,
    reconciliationSixOutcomesExplicit: evidence.reconciliationSixOutcomesExplicit === true,
  });
  const blockers = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
  return Object.freeze({
    status: blockers.length === 0 ? "READY_FOR_CORRECTED_FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_EXECUTION_AUTHORIZATION_REVIEW" : "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_CORRECTION_REQUIRED",
    checks,
    blockers: Object.freeze(blockers),
    executionAuthorized: false,
    sqlExecuted: false,
  });
}

export default Object.freeze({ evaluate017c16ReadOnlyFailureReachability, evaluate017c16ReconciliationCoverage, evaluate017c16Review });
