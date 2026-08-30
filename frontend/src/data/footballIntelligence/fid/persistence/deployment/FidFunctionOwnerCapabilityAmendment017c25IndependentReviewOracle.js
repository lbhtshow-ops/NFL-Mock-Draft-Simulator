export const RESULT_COLUMNS_017C25 = Object.freeze([
  "result_identity", "result_version", "mode", "classification", "mismatch_count",
  "set_state", "create_state", "metadata_storage_present", "migration_014_metadata_count",
  "evidence_complete", "read_only", "mutation_count", "project_id", "database", "branch", "sql_role",
]);

const coverageTokens = Object.freeze([
  "fid_record_revisions", "fid_persistence_effect_receipts", "fid_persistence_audit_events",
  "fid_persistence_idempotency", "fid_persistence_batches", "fid_persistence_batch_operations",
  "fid_persistence_migrations", "fid_execute_atomic_persistence_batch", "fid_execute_prospect_identifier_issuance_transaction",
  "admin_option AND NOT inherit_option", "set_option", "rolcanlogin", "rolsuper", "rolcreatedb", "rolcreaterole",
  "rolreplication", "rolbypassrls", "rolinherit", "has_schema_privilege", "has_table_privilege",
  "has_function_privilege", "aclexplode", "is_grantable", "relkind='S'", "relkind='r'", "prosecdef",
  "search_path=pg_catalog, fid", "n.nspowner=postgres_oid", "metadata_total<>1", "metadata_014<>0",
  "WHEN 'fid_record_revisions' THEN ARRAY['SELECT','INSERT']",
  "(SELECT count(*) FROM pg_catalog.pg_proc WHERE pronamespace=fid_oid)<>1",
  "n.oid<>fid_oid", "fid.fid_identifier_reservations", "fid.fid_identifier_issuance_ledger",
  "fid.fid_identifier_issuance_idempotency",
]);

const stripCommentsAndLiterals = (sql) => sql.replace(/--.*$/gm, "").replace(/'(?:''|[^'])*'/gs, "''");
const occurrences = (text, regex) => text.match(regex)?.length ?? 0;

export function independentlyReviewVisiblePreflight017c25(sql) {
  const failures = [];
  const bare = stripCommentsAndLiterals(sql);
  const finalStart = sql.lastIndexOf("WITH payload AS (");
  const finalEnd = sql.lastIndexOf("COMMIT;");
  const finalSql = finalStart >= 0 && finalEnd > finalStart ? sql.slice(finalStart, finalEnd) : "";

  if (occurrences(sql, /BEGIN\s+TRANSACTION\s+READ\s+ONLY\s*;/gi) !== 1 || occurrences(sql, /\bCOMMIT\s*;/gi) !== 1) failures.push("single_read_only_transaction");
  if (occurrences(sql, /WITH payload AS \(/g) !== 1 || !/^WITH payload AS \(/.test(finalSql)) failures.push("single_final_select");
  if (!/FROM payload\s+WHERE[\s\S]*classification'<>\s*'PENDING'/i.test(finalSql)) failures.push("pending_output_guard");
  if (!/set_config\(result_setting,\s*'PENDING',\s*true\)/i.test(sql)) failures.push("pending_sentinel");
  if (/set_config\([^;]*,\s*false\s*\)/i.test(sql) || occurrences(sql, /set_config\(/gi) !== 3) failures.push("transaction_local_bridge");
  if (!/result_setting constant text := 'lbht\.017c24_preflight_result'/i.test(sql)
    || !/current_setting\('lbht\.017c24_preflight_result',\s*true\)/i.test(finalSql)) failures.push("fixed_bridge_identity");
  if (!/result_identity'='FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_VISIBLE_RESULT'/i.test(finalSql)
    || !/result_version'='17C\.24\.1'/i.test(finalSql) || !/mode'='PREFLIGHT'/i.test(finalSql)) failures.push("bridge_validation");

  let cursor = -1;
  for (const column of RESULT_COLUMNS_017C25) {
    const position = finalSql.indexOf(` AS ${column}`, cursor + 1);
    if (position < 0 || position <= cursor) failures.push(`column_order:${column}`);
    cursor = position;
  }
  if (occurrences(finalSql, /\sAS\s+[a-z][a-z0-9_]*/gi) !== RESULT_COLUMNS_017C25.length + 1) failures.push("extra_or_missing_visible_column");
  if (!/WHEN unresolved THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED'/i.test(sql)
    || !/WHEN mismatch_count=0 AND NOT set_state AND NOT create_state THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_017C24_PREFLIGHT_PASSED'/i.test(sql)
    || !/ELSE 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_INCONSISTENT_RECOVERY_REQUIRED'/i.test(sql)) failures.push("classification_trichotomy");
  if (!/'evidence_complete',NOT unresolved/i.test(sql) || !/'evidence_complete',false/i.test(sql)) failures.push("evidence_completeness");

  const forbidden = /\b(?:INSERT|UPDATE|DELETE|MERGE|TRUNCATE|CREATE|ALTER|DROP|COMMENT|GRANT|REVOKE|COPY|SECURITY\s+LABEL|SET\s+ROLE|SET\s+SESSION\s+AUTHORIZATION|LOCK)\b/i;
  if (forbidden.test(bare)) failures.push("mutation_lock_or_role_change");
  if (/\b(?:pg_advisory\w*|gen_random_uuid|uuid_generate\w*|nextval|setval)\s*\(/i.test(bare)) failures.push("lock_uuid_or_identifier_generation");
  if (/\b(?:fid_execute_atomic_persistence_batch|fid_execute_prospect_identifier_issuance_transaction)\s*\(/i.test(bare)) failures.push("rpc_invocation");
  if (/\bCREATE\s+(?:TEMP|TEMPORARY|TABLE|FUNCTION|PROCEDURE|VIEW|SCHEMA|EXTENSION)\b/i.test(bare)) failures.push("helper_object");
  if (/\bFOR\s+(?:UPDATE|NO\s+KEY\s+UPDATE|SHARE|KEY\s+SHARE)\b/i.test(bare)) failures.push("row_locking_select");

  if (!/to_regclass\('fid\.fid_persistence_migrations'\)::oid/i.test(sql)
    || /FROM\s+fid\.fid_persistence_migrations/i.test(bare)
    || occurrences(sql, /\bEXECUTE\s+pg_catalog\.format\b/gi) !== 1
    || occurrences(bare, /\bEXECUTE\b/gi) !== 1
    || !/metadata_oid::pg_catalog\.regclass/i.test(sql)) failures.push("optional_metadata_or_dynamic_sql_safety");
  if (!/IF metadata_oid IS NULL THEN[\s\S]*STATE_UNRESOLVED[\s\S]*'metadata_storage_present',false[\s\S]*RETURN;/i.test(sql)) failures.push("missing_metadata_visible_unresolved");
  if (/\bEXCEPTION\b/i.test(bare)) failures.push("unexpected_error_swallowing");

  if (coverageTokens.some((token) => !sql.includes(token))) failures.push("acl_matrix_coverage_loss");
  for (const principal of ["('fid_function_owner',owner_oid)", "('service_role',service_oid)", "('anon',anon_oid)", "('authenticated',authenticated_oid)", "('PUBLIC',0::oid)"]) {
    if (sql.split(principal).length - 1 !== 3) failures.push(`principal_coverage:${principal}`);
  }
  if (/authorization|retryAuthorized|executionAuthorized/i.test(sql)) failures.push("authorization_scope_expansion");
  return Object.freeze({ passed: failures.length === 0, failures: Object.freeze([...new Set(failures)]) });
}

export default independentlyReviewVisiblePreflight017c25;
