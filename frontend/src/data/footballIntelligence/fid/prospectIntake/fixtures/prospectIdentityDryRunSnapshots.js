export const prospectIdentityDryRunSnapshots = Object.freeze({
  existingCanonicalReuse: Object.freeze({ readiness: "READY_FOR_EXISTING_IDENTITY_REUSE_REVIEW", decision: "REUSE_EXISTING_CANONICAL_IDENTITY", existingCanonicalIdentity: true, executionAuthorized: false }),
  peterWoodsConflict: Object.freeze({ readiness: "NOT_READY_DRAFT_CYCLE_CONFLICT", decision: "DRAFT_CYCLE_CONFLICT_REQUIRES_RESOLUTION", existingCanonicalIdentity: true, duplicateIdentityCreationProhibited: true, resolutionRequired: true, automaticReuseAuthorized: false, automaticReclassificationAuthorized: false, populationAuthorized: false }),
  newIdentityUnauthorized: Object.freeze({ readiness: "READY_FOR_NEW_IDENTITY_ISSUANCE_POLICY", decision: "CANONICAL_ID_ISSUANCE_NOT_AUTHORIZED", identifierIssuanceAuthorized: false }),
  duplicateRisk: Object.freeze({ readiness: "NOT_READY_DUPLICATE_RISK", decision: "DUPLICATE_RISK_REQUIRES_REVIEW" }),
  uncommittedOwnership: Object.freeze({ readiness: "NOT_READY_UNCOMMITTED_OWNERSHIP_AMBIGUITY", decision: "DRY_RUN_BLOCKED" }),
  firstCohortBatch: Object.freeze({ operationType: "IDENTITY_DRY_RUN_BATCH", planCount: 4, decision: "DRY_RUN_BLOCKED", executionAuthorized: false, partialExecutionState: false }),
});
export default prospectIdentityDryRunSnapshots;
