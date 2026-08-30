const immutable = (value) => Object.freeze(value);

export function evaluateCanonicalProspectIdentifier017c7StaticReview(declaration,authorization,evidence = {}) {
  const checks = immutable({
    declarationPresent: declaration?.declarationId === "CANONICAL_PROSPECT_IDENTIFIER_017C7_STATIC_REVIEW_DECLARATION",
    exactTarget: evidence.projectId === declaration?.exactTarget?.projectId && declaration?.exactTarget?.database === "PRIMARY_DATABASE" && declaration?.exactTarget?.sqlEditorRole === "postgres",
    authoritativeState: declaration?.authoritativeState?.migration014State === "MIGRATION_014_FULLY_ROLLED_BACK" && declaration?.authoritativeState?.migration014Applied === false && declaration?.authoritativeState?.stage1Valid === true,
    hashesExact: evidence.preflight017c7Hash === declaration?.artifact?.sha256 && evidence.preflight017c6Hash === declaration?.protected?.preflight017c6Sha256 && evidence.migration014Hash === declaration?.protected?.migration014Sha256 && evidence.reconciliation017c5Hash === declaration?.protected?.reconciliation017c5Sha256,
    intendedDeltaOnly: evidence.intendedDeltaOnly === true,
    readOnlySafe: evidence.readOnlySafe === true,
    postgresql17Compatible: evidence.postgresql17Compatible === true,
    identitiesBound: evidence.identitiesBound === true,
    coverageComplete: evidence.coverageComplete === true,
    sanitized: evidence.sanitized === true,
    authorizationNarrow: authorization?.scope?.executionCount === 1 && authorization?.scope?.mandatoryStopAfterExecution === true && authorization?.artifact?.sha256 === declaration?.artifact?.sha256,
    prohibitionsComplete: authorization && Object.values(authorization.prohibited).every((value) => value === true),
    inventoryProtected: evidence.inventoryExact === true && evidence.migration015Absent === true,
    noReviewEffects: evidence.noReviewEffects === true,
  });
  const blockers = Object.entries(checks).filter(([,passed]) => !passed).map(([key]) => immutable({ code: `${key.replace(/([a-z])([A-Z])/g,"$1_$2").toUpperCase()}_FAILED` }));
  return immutable({
    status: blockers.length === 0 ? "READY_FOR_CONTROLLED_SUPABASE_OWNERSHIP_CAPABILITY_READ_ONLY_PREFLIGHT_EXECUTION" : "SUPABASE_OWNERSHIP_CAPABILITY_PREFLIGHT_REVIEW_BLOCKED",
    checks,
    blockers: immutable(blockers),
    preflight017c7ExecutionAuthorized: blockers.length === 0,
    preflight017c6ExecutionAuthorized: false,
    migration014ExecutionAuthorized: false,
    databaseOperationsDuringReview: 0,
    networkDatabaseConnectionsDuringReview: 0,
  });
}

export default Object.freeze({ evaluateCanonicalProspectIdentifier017c7StaticReview });
