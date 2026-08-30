export const FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_017C38_CORRECTION = Object.freeze({
  id: "SPLIT_AUTHORITY_MISMATCH_DETAIL_DASHBOARD_VISIBLE_RESULT_CONTRACT_CORRECTION_017C38",
  version: "17C.38.1", repositoryOnly: true, correctionImplemented: false,
  protectedPredecessorPath: "frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c36_fid_function_owner_capability_mismatch_detail_split_authority_correction.sql",
  protectedPredecessorSha256: "ECB92D08C6712B81CEE71C59FD8DFD9CBCE4FA7B441EE0E6199ED912A28F894C",
  authoritativeContractSource: "CanonicalProspectIdentifierFidFunctionOwnerCapabilityMismatchDetail017c37IndependentReview.md",
  authoritativeFieldCount: 21,
  requiredAddedFields: Object.freeze(["mode", "metadata_storage_present", "migration_014_metadata_count", "evidence_complete"]),
  unspecifiedRemovalCount: 4,
  blocker: "AUTHORITATIVE_21_FIELD_ORDER_CONFLICTS_WITH_FOUR_MANDATORY_ADDITIONS_AND_NO_REPLACEMENT_MAPPING",
  authoritativeDatabaseState: "MIGRATION_014_FULLY_ROLLED_BACK",
  authorization017c23Consumed: true, authorization017c26Consumed: true, authorization017c29Consumed: true,
  sqlExecuted: false, databaseConnected: false, authorizationCreated: false,
  status: "SPLIT_AUTHORITY_FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_DIAGNOSTIC_ADDITIONAL_CORRECTION_REQUIRED",
});

export default FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_017C38_CORRECTION;
