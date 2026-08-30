const adjudications = Object.freeze({
  FUNCTION_EXECUTE_ANON: ["GENUINE_EFFECTIVE_TARGET_STATE_MISMATCH", "PUBLIC_DERIVED_EFFECTIVE_AUTHORITY", "SHARED_PUBLIC_EXECUTE_ROOT_CAUSE"],
  FUNCTION_EXECUTE_AUTHENTICATED: ["GENUINE_EFFECTIVE_TARGET_STATE_MISMATCH", "PUBLIC_DERIVED_EFFECTIVE_AUTHORITY", "SHARED_PUBLIC_EXECUTE_ROOT_CAUSE"],
  FUNCTION_EXECUTE_FID_FUNCTION_OWNER: ["OWNERSHIP_DERIVED_AUTHORITY_MISLABELED_AS_DIRECT_GRANT", "DIRECT_EFFECTIVE_PRIVILEGE_REPORTING_DEFECT"],
  FUNCTION_EXECUTE_PUBLIC: ["GENUINE_DIRECT_TARGET_STATE_MISMATCH", "SHARED_PUBLIC_EXECUTE_ROOT_CAUSE"],
  FUNCTION_EXECUTE_SERVICE_ROLE: ["GENUINE_MISSING_DIRECT_TARGET_STATE_MISMATCH", "EFFECTIVE_PRESENT_VIA_PUBLIC", "DISPLAYED_OBSERVED_CLASSIFICATION_DEFECT", "SHARED_PUBLIC_EXECUTE_ROOT_CAUSE"],
  MIGRATION_014_ROLLBACK_STATE: ["ROLLBACK_STATE_ORACLE_DEFECT"],
});

const expectedTypes = Object.freeze({
  FUNCTION_EXECUTE_ANON: "EFFECTIVE_PRIVILEGE_MISMATCH", FUNCTION_EXECUTE_AUTHENTICATED: "EFFECTIVE_PRIVILEGE_MISMATCH",
  FUNCTION_EXECUTE_FID_FUNCTION_OWNER: "UNEXPECTED_DIRECT_PRIVILEGE", FUNCTION_EXECUTE_PUBLIC: "UNEXPECTED_DIRECT_PRIVILEGE",
  FUNCTION_EXECUTE_SERVICE_ROLE: "MISSING_DIRECT_PRIVILEGE", MIGRATION_014_ROLLBACK_STATE: "ROLLBACK_INVENTORY",
});

export function evaluate017c43Result(record = {}) {
  const failures = [];
  const row = record.result ?? {};
  const details = row.mismatch_details ?? [];
  if (record.authorizationStatus !== "CONSUMED_NON_REUSABLE" || record.executionCount !== 1) failures.push("authorization_consumption");
  if (record.executedSqlSha256 !== "8D56003C1835ED6889C947DA75B56C4D032736DD31532FCF428FD68FF421688E") failures.push("sql_hash");
  if (row.mismatch_count !== 6 || row.detail_count !== 6 || row.count_reconciled !== true || details.length !== 6) failures.push("detail_count");
  if (row.captured_preflight_mismatch_count !== 5 || row.captured_count_reconciled !== false) failures.push("captured_count_delta");
  if (row.read_only !== true || row.mutation_count !== 0) failures.push("read_only");
  if (row.migration_014_metadata_count !== 0 || row.metadata_storage_present !== true) failures.push("migration_metadata");
  for (const [index, item] of details.entries()) {
    if (item.mismatch_ordinal !== index + 1 || expectedTypes[item.mismatch_id] !== item.check_type) failures.push(`detail:${index + 1}`);
    if (!adjudications[item.mismatch_id]) failures.push(`unknown:${item.mismatch_id}`);
  }
  return Object.freeze({ accepted: failures.length === 0, failures: Object.freeze([...new Set(failures)]),
    adjudications: Object.freeze(details.map((item) => Object.freeze({ mismatchId: item.mismatch_id, classifications: Object.freeze(adjudications[item.mismatch_id] ?? ["UNRESOLVED"]) }))),
    rootCauses: Object.freeze({ PUBLIC_EXECUTE_DIRECT_ACL: Object.freeze(["FUNCTION_EXECUTE_PUBLIC", "FUNCTION_EXECUTE_ANON", "FUNCTION_EXECUTE_AUTHENTICATED", "FUNCTION_EXECUTE_SERVICE_ROLE"]),
      OWNER_AUTHORITY_MODELING: Object.freeze(["FUNCTION_EXECUTE_FID_FUNCTION_OWNER"]), ROLLBACK_ORACLE: Object.freeze(["MIGRATION_014_ROLLBACK_STATE"]) }),
    provenOracleDefects: Object.freeze(["OWNER_AUTHORITY_MODELED_AS_DIRECT_GRANT", "DIRECT_AND_EFFECTIVE_OBSERVED_CLASSIFICATION_CONFLATED", "ROLLBACK_COMPOSITE_CONFLICT_DISAGREES_WITH_AUTHORITATIVE_RECONCILIATION"]),
    countDelta: "UNRESOLVED_TEMPORAL_OR_ORACLE_DIFFERENCE_WITHOUT_PRIOR_DETAIL_ROWS" });
}

export default evaluate017c43Result;
