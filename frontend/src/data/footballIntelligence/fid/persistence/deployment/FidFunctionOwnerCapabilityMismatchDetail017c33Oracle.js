const stripSqlLiteralsAndComments = (sql) => sql
  .replace(/--.*$/gm, "")
  .replace(/'(?:''|[^'])*'/g, "''");

export function independentlyReviewMismatchDetail017c33(sql) {
  const failures = [];
  const bare = stripSqlLiteralsAndComments(sql);
  const requireLiteral = (literal, failure) => { if (!sql.includes(literal)) failures.push(failure); };

  requireLiteral("Lunch Break Hot Take", "missing_organization_binding");
  requireLiteral("LBHT FID Persistence Test", "missing_project_name_binding");
  requireLiteral("ahmorpzcaapvoymiqlkv", "missing_project_id_binding");
  requireLiteral("us-east-1", "missing_region_binding");
  requireLiteral("Primary Database", "missing_database_binding");
  requireLiteral("'main'::text branch", "missing_branch_binding");
  requireLiteral("'postgres'::text sql_role", "missing_sql_role_binding");
  requireLiteral("DEDICATED_NON_PRODUCTION_TEST", "missing_governed_environment_binding");

  if (!/BEGIN TRANSACTION READ ONLY;/i.test(sql) || !/\bCOMMIT;/i.test(sql)) failures.push("read_only_transaction_missing");
  if (/\b(?:INSERT|UPDATE|DELETE|MERGE|TRUNCATE|CREATE|ALTER|DROP|COMMENT|GRANT|REVOKE|COPY|SET\s+ROLE|SET\s+SESSION|FOR\s+(?:UPDATE|SHARE)|pg_advisory\w*|gen_random_uuid|uuid_generate\w*|nextval|setval)\b/i.test(bare)) failures.push("mutating_or_locking_sql");
  if (/fid_execute_(?:atomic_persistence_batch|prospect_identifier_issuance_transaction)\s*\(/i.test(bare)) failures.push("rpc_invocation");
  if (!/TABLE_PREREQUISITE[\s\S]*FROM tables WHERE complete AND NOT acl_ready/i.test(sql) || !/FROM table_acl WHERE complete AND acl_ready AND/i.test(sql)) failures.push("table_prerequisite_skip_failure");
  if (!/row_number\(\) OVER\(ORDER BY unit_id,mismatch_id\)/i.test(sql) || !/jsonb_agg[\s\S]*ORDER BY mismatch_ordinal/i.test(sql)) failures.push("ordinal_contract_failure");
  if (!/count\(\*\)::integer mismatch_count[\s\S]*jsonb_array_length\(s\.mismatch_details\) detail_count[\s\S]*count_reconciled/i.test(sql)) failures.push("count_detail_reconciliation_failure");
  if (!/UNEXPECTED_MEMBERSHIP_SET_TRUE[\s\S]*UNEXPECTED_OWNER_CREATE_TRUE/i.test(sql)) failures.push("state_conflict_evidence_missing");
  if (!/jsonb_build_object\('member_exact'[\s\S]*'admin_state'[\s\S]*'inherit_state'[\s\S]*'set_state'/i.test(sql)) failures.push("membership_evidence_collapsed");
  if (/\b(?:relacl|nspacl|proacl|oid|function_definition|sql_text|credential|token|url)\b[\s\S]*jsonb_build_object/i.test(sql)) failures.push("potential_sensitive_output");

  return Object.freeze({
    passed: failures.length === 0,
    correctionRequired: failures.length > 0,
    failures: Object.freeze([...new Set(failures)]),
  });
}

export default independentlyReviewMismatchDetail017c33;
