const exact = Object.freeze({
  result_identity: "FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_VISIBLE_RESULT", result_version: "17C.24.1", mode: "PREFLIGHT",
  classification: "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_017C24_PREFLIGHT_PASSED", mismatch_count: 0,
  set_state: false, create_state: false, metadata_storage_present: true, migration_014_metadata_count: 0,
  evidence_complete: true, read_only: true, mutation_count: 0, project_id: "ahmorpzcaapvoymiqlkv",
  database: "Primary Database", branch: "main", sql_role: "postgres",
});

export const FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_017C24_SCENARIOS = Object.freeze({
  exactBeforeState: Object.freeze({ rows: Object.freeze([exact]), expected: "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_017C24_PREFLIGHT_PASSED" }),
  aclMismatch: Object.freeze({ rows: Object.freeze([{ ...exact, classification: "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_INCONSISTENT_RECOVERY_REQUIRED", mismatch_count: 1 }]) }),
  missingMetadata: Object.freeze({ rows: Object.freeze([{ ...exact, classification: "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED", metadata_storage_present: false, evidence_complete: false }]) }),
  missingRole: Object.freeze({ rows: Object.freeze([{ ...exact, classification: "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED", evidence_complete: false }]) }),
  sqlError: Object.freeze({ rows: Object.freeze([]), sqlError: "sanitized_error" }),
  noticeOnly: Object.freeze({ rows: Object.freeze([]) }),
  successNoRows: Object.freeze({ rows: Object.freeze([]) }),
  incompleteFinalRow: Object.freeze({ rows: Object.freeze([{ result_identity: exact.result_identity }]) }),
  staleSessionValue: Object.freeze({ rows: Object.freeze([{ ...exact, result_version: "STALE" }]) }),
  conflictingRows: Object.freeze({ rows: Object.freeze([exact, { ...exact, mismatch_count: 1 }]) }),
  optionalRelationAbsent: Object.freeze({ rows: Object.freeze([{ ...exact, classification: "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED", metadata_storage_present: false, evidence_complete: false }]) }),
  exactZeroSequenceInventory: Object.freeze({ rows: Object.freeze([exact]), expectedSequenceCount: 0 }),
  unexpectedSequence: Object.freeze({ rows: Object.freeze([{ ...exact, classification: "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_INCONSISTENT_RECOVERY_REQUIRED", mismatch_count: 1 }]) }),
  lostTableCoverage: Object.freeze({ sqlMutation: "governed_tables constant text[] := ARRAY[]::text[]" }),
  lostFunctionCoverage: Object.freeze({ sqlMutation: "pg_catalog.pg_proc", remove: true }),
  lostBrowserRoleDenial: Object.freeze({ sqlMutation: "('authenticated',authenticated_oid)", remove: true }),
  unsafeDynamicIdentifier: Object.freeze({ sqlMutation: "EXECUTE client_sql" }),
  consumedAuthorization: Object.freeze({ authorizationConsumed: true, retryAuthorized: false }),
  attemptedRetry: Object.freeze({ authorizationConsumed: true, retryAuthorized: true }),
  amendmentExecutionIncluded: Object.freeze({ amendmentAuthorized: true }),
});

export default FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_017C24_SCENARIOS;
