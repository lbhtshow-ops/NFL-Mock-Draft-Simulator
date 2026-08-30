export const VISIBLE_CLASSIFICATIONS_017C24 = Object.freeze([
  "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_017C24_PREFLIGHT_PASSED",
  "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_INCONSISTENT_RECOVERY_REQUIRED",
  "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED",
]);

export const REQUIRED_VISIBLE_COLUMNS_017C24 = Object.freeze([
  "result_identity", "result_version", "mode", "classification", "mismatch_count",
  "set_state", "create_state", "metadata_storage_present", "migration_014_metadata_count",
  "evidence_complete", "read_only", "mutation_count", "project_id", "database", "branch", "sql_role",
]);

export function evaluateVisiblePreflightResult017c24({ rows, sqlError = null }) {
  if (sqlError) return Object.freeze({ accepted: false, reason: "SQL_ERROR_BEFORE_FINAL_RESULT" });
  if (!Array.isArray(rows) || rows.length === 0) return Object.freeze({ accepted: false, reason: "VISIBLE_RESULT_MISSING" });
  if (rows.length !== 1) return Object.freeze({ accepted: false, reason: "MULTIPLE_OR_CONFLICTING_SUMMARY_ROWS" });
  const row = rows[0];
  if (REQUIRED_VISIBLE_COLUMNS_017C24.some((column) => !(column in row) || row[column] == null)) {
    return Object.freeze({ accepted: false, reason: "INCOMPLETE_FINAL_ROW" });
  }
  if (row.result_identity !== "FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_VISIBLE_RESULT"
    || row.result_version !== "17C.24.1" || row.mode !== "PREFLIGHT") {
    return Object.freeze({ accepted: false, reason: "RESULT_CONTRACT_IDENTITY_MISMATCH" });
  }
  if (!VISIBLE_CLASSIFICATIONS_017C24.includes(row.classification)) return Object.freeze({ accepted: false, reason: "UNRECOGNIZED_CLASSIFICATION" });
  if (row.read_only !== true || row.mutation_count !== 0) return Object.freeze({ accepted: false, reason: "READ_ONLY_CONTRACT_BREACH" });
  if (row.project_id !== "ahmorpzcaapvoymiqlkv" || row.database !== "Primary Database"
    || row.branch !== "main" || row.sql_role !== "postgres") return Object.freeze({ accepted: false, reason: "TARGET_BINDING_MISMATCH" });
  if (row.classification === VISIBLE_CLASSIFICATIONS_017C24[0]
    && (row.evidence_complete !== true || row.mismatch_count !== 0 || row.set_state !== false
      || row.create_state !== false || row.metadata_storage_present !== true
      || row.migration_014_metadata_count !== 0)) {
    return Object.freeze({ accepted: false, reason: "POSITIVE_CLASSIFICATION_WITHOUT_EXACT_COMPLETE_EVIDENCE" });
  }
  if (row.evidence_complete !== true && row.classification !== VISIBLE_CLASSIFICATIONS_017C24[2]) {
    return Object.freeze({ accepted: false, reason: "INCOMPLETE_EVIDENCE_NOT_UNRESOLVED" });
  }
  if (row.mismatch_count > 0 && row.classification !== VISIBLE_CLASSIFICATIONS_017C24[1]) {
    return Object.freeze({ accepted: false, reason: "MISMATCH_NOT_INCONSISTENT" });
  }
  return Object.freeze({ accepted: true, classification: row.classification });
}

export function reviewVisiblePreflightSql017c24(sql) {
  const failures = [];
  const withoutComments = sql.replace(/--.*$/gm, "");
  const withoutLiterals = withoutComments.replace(/'(?:''|[^'])*'/gs, "''");
  if (!/BEGIN\s+TRANSACTION\s+READ\s+ONLY/i.test(sql) || !/\bCOMMIT\s*;/i.test(sql)) failures.push("read_only_transaction_missing");
  if (!/pg_catalog\.set_config\(result_setting,\s*'PENDING',\s*true\)/i.test(sql)) failures.push("stale_result_sentinel_missing");
  if (!/pg_catalog\.current_setting\('lbht\.017c24_preflight_result',\s*true\)::jsonb/i.test(sql)) failures.push("ordinary_visible_select_missing");
  if (!/SELECT\s+[\s\S]*result_identity[\s\S]*classification[\s\S]*evidence_complete[\s\S]*mutation_count/i.test(sql)) failures.push("stable_columns_missing");
  if (/RAISE\s+(?:NOTICE|INFO)/i.test(sql)) failures.push("notice_dependent_result");
  if (/\b(?:CREATE\s+(?:TEMP|TEMPORARY|TABLE|FUNCTION|VIEW|SCHEMA)|GRANT|REVOKE|INSERT|UPDATE|DELETE|MERGE|TRUNCATE|DROP|ALTER)\b/i.test(withoutLiterals)) failures.push("mutation_or_helper_object");
  if ((sql.match(/\bEXECUTE\s+pg_catalog\.format\b/gi) ?? []).length !== 1) failures.push("unsafe_dynamic_sql_count");
  if ((withoutLiterals.match(/\bEXECUTE\b/gi) ?? []).length !== 1) failures.push("unsafe_dynamic_identifier");
  if (!/metadata_oid::pg_catalog\.regclass/i.test(sql) || /FROM\s+fid\.fid_persistence_migrations/i.test(withoutLiterals)) failures.push("optional_relation_safety");
  const coverageTokens = [
    "fid_record_revisions", "fid_persistence_effect_receipts", "fid_persistence_audit_events",
    "fid_persistence_idempotency", "fid_persistence_batches", "fid_persistence_batch_operations",
    "fid_persistence_migrations", "fid_execute_atomic_persistence_batch", "service_role", "anon",
    "authenticated", "PUBLIC", "relkind='S'", "pg_catalog.pg_proc",
  ];
  if (coverageTokens.some((token) => !sql.includes(token))) failures.push("acl_coverage_loss");
  if (!["('service_role',service_oid)", "('anon',anon_oid)", "('authenticated',authenticated_oid)", "('PUBLIC',0::oid)"]
    .every((token) => sql.includes(token))) failures.push("browser_role_boundary_loss");
  if (/executionAuthorized:\s*true|retryAuthorized:\s*true|amendmentAuthorized:\s*true|migration014Authorized:\s*true/i.test(sql)) failures.push("authorization_created");
  return Object.freeze({ passed: failures.length === 0, failures: Object.freeze(failures) });
}

export default evaluateVisiblePreflightResult017c24;
