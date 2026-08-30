const freeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

export const CANONICAL_PROSPECT_IDENTIFIER_STAGE_2_PREFLIGHT_COVERAGE_AMENDMENT = freeze({
  amendmentId: "CANONICAL_PROSPECT_IDENTIFIER_STAGE_2_PREFLIGHT_COVERAGE_AMENDMENT",
  amendmentVersion: "1.0.0",
  status: "READY_FOR_CONTROLLED_DEPLOYMENT_STAGE_2_READ_ONLY_PREFLIGHT_EXECUTION",
  stage1Prerequisite: "CONTROLLED_DEPLOYMENT_STAGE_1_PASSED",
  exactTargetAuthorization: "CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_NON_PRODUCTION_TEST_TARGET_AUTHORIZATION@1.0.0",
  predecessorReview: "CANONICAL_PROSPECT_IDENTIFIER_STAGE_2_READ_ONLY_PREFLIGHT_AUTHORIZATION_REVIEW@1.0.0",
  originalPreflight: {
    path: "src/data/footballIntelligence/fid/persistence/deployment/review/017c_read_only_target_preflight.sql",
    sha256: "F7B56039B54334AB3D0D13C64B0B1E0C8DFC0E02273C5BF696FA018F02D29524",
    modified: false,
  },
  authorizedSuccessor: {
    path: "src/data/footballIntelligence/fid/persistence/deployment/review/017c2_stage2_read_only_target_preflight_successor.sql",
    sha256: "D9956965EACC8F022E6FE962EFC06F6604711A9159C25728AEADE248BCE7BBAE",
    manualExecutionOnly: true,
    completeSanitizedResultsRequired: true,
  },
  migration: {
    migrationId: "014",
    approvedSha256: "18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD",
    prohibitedSha256: "3B271BC994D82C8109CDE4E62E6A1F85A67E49F86C5D98FBD0EBA46D6D214F13",
  },
  closedBlockers: [
    "MIGRATIONS_001_THROUGH_013_APPLICATION_EVIDENCE_MISSING",
    "FUNCTION_OWNER_TRANSFER_CAPABILITY_NOT_VERIFIED",
    "MIGRATION_014_INDEX_NAME_CONFLICTS_NOT_VERIFIED",
  ],
  expectedMigrationIds: [
    "fid-001-schema", "fid-002-schema-version", "fid-003-canonical-table", "fid-004-auxiliary-tables",
    "fid-005-relationships", "fid-006-constraints", "fid-007-indexes", "fid-008-atomic-function",
    "fid-009-rls", "fid-010-policies", "fid-011-privileges", "fid-012-verification",
    "013_record_fid_deployment_metadata",
  ],
  expectedIndexNames: [
    "fid_identifier_reservations_operation_idx",
    "fid_identifier_reservations_authorization_idx",
    "fid_identifier_issuance_ledger_operation_idx",
    "fid_identifier_issuance_ledger_authorization_idx",
    "fid_identifier_issuance_idempotency_request_idx",
    "fid_identifier_issuance_idempotency_recovery_idx",
  ],
  restrictions: {
    readOnly: true,
    lockingReadsProhibited: true,
    uuidInvocationProhibited: true,
    issuanceRpcInvocationProhibited: true,
    sensitiveCatalogAccessProhibited: true,
    stage3Prohibited: true,
    migration014ExecutionProhibited: true,
  },
  effects: {
    sqlExecutedDuringReview: false,
    databaseOperations: 0,
    supabaseConnections: 0,
    networkRequests: 0,
    uuidOperations: 0,
    candidateOperations: 0,
    persistenceOperations: 0,
  },
  requiredNextAction: "MANUALLY_EXECUTE_ONLY_THE_AUTHORIZED_STAGE_2_READ_ONLY_PREFLIGHT_SUCCESSOR_RETURN_COMPLETE_SANITIZED_RESULTS_AND_STOP",
});

export default CANONICAL_PROSPECT_IDENTIFIER_STAGE_2_PREFLIGHT_COVERAGE_AMENDMENT;
