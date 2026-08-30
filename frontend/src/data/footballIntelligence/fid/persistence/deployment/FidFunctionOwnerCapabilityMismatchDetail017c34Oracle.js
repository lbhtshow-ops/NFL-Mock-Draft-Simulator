const mutationPattern = /\b(?:INSERT|UPDATE|DELETE|MERGE|TRUNCATE|CREATE|ALTER|DROP|COMMENT|GRANT|REVOKE|COPY|SET\s+ROLE|SET\s+SESSION|FOR\s+(?:UPDATE|SHARE)|pg_advisory\w*|gen_random_uuid|uuid_generate\w*|nextval|setval)\b/i;
const strip = (sql) => sql.replace(/--.*$/gm, "").replace(/'(?:''|[^'])*'/g, "''");

export function reviewExactTargetCorrection017c34(sql) {
  const failures = [];
  const constants = [
    ["'Lunch Break Hot Take'::text organization", "organization"], ["'LBHT FID Persistence Test'::text project_name", "project_name"],
    ["'us-east-1'::text region", "region"], ["'ahmorpzcaapvoymiqlkv'::text project_id", "project_id"],
    ["'Primary Database'::text database", "database"], ["'main'::text branch", "branch"],
    ["'postgres'::text sql_role", "sql_role"], ["'DEDICATED_NON_PRODUCTION_TEST'::text governed_environment", "governed_environment"],
  ];
  for (const [literal, field] of constants) if (!sql.includes(literal)) failures.push(`missing_constant_${field}`);
  if (!/target_binding AS \([\s\S]*organization='Lunch Break Hot Take'[\s\S]*project_name='LBHT FID Persistence Test'[\s\S]*region='us-east-1'[\s\S]*project_id='ahmorpzcaapvoymiqlkv'[\s\S]*database='Primary Database'[\s\S]*branch='main'[\s\S]*sql_role='postgres'[\s\S]*governed_environment='DEDICATED_NON_PRODUCTION_TEST'[\s\S]*binding_valid/i.test(sql)) failures.push("exact_validation_missing");
  if (!/CASE WHEN NOT b\.binding_valid THEN 'TARGET_BINDING_INCONSISTENT' WHEN jsonb_array_length\(u\.unresolved_details\)>0/i.test(sql)) failures.push("classification_precedence");
  if (!/c\.organization,c\.project_name,c\.region,c\.project_id,c\.database,c\.branch,c\.sql_role,c\.governed_environment,b\.binding_valid target_binding_valid/i.test(sql)) failures.push("visible_target_order");
  if (/\b(?:current_setting|getenv|environment_variable|client_override|dashboard_label)\b/i.test(strip(sql))) failures.push("override_or_inference");
  if (!/BEGIN TRANSACTION READ ONLY;/i.test(sql) || !/\bCOMMIT;/i.test(sql)) failures.push("read_only_transaction");
  if (mutationPattern.test(strip(sql))) failures.push("mutation_or_operation");
  if (/fid_execute_(?:atomic_persistence_batch|prospect_identifier_issuance_transaction)\s*\(/i.test(strip(sql))) failures.push("rpc_invocation");
  for (const preserved of [
    [/FROM tables WHERE complete AND NOT acl_ready/i, "table_prerequisite"], [/FROM table_acl WHERE complete AND acl_ready AND/i, "table_acl_skip"],
    [/has_table_privilege\(x\.principal_oid,x\.table_oid/i, "resolved_table_oid"], [/row_number\(\) OVER\(ORDER BY unit_id,mismatch_id\)/i, "stable_ordinals"],
    [/count\(\*\)::integer mismatch_count[\s\S]*jsonb_array_length\(s\.mismatch_details\) detail_count[\s\S]*count_reconciled/i, "count_reconciliation"],
    [/UNEXPECTED_MEMBERSHIP_SET_TRUE[\s\S]*UNEXPECTED_OWNER_CREATE_TRUE/i, "state_conflicts"],
    [/jsonb_build_object\('member_exact'[\s\S]*'admin_state'[\s\S]*'inherit_state'[\s\S]*'set_state'/i, "membership_evidence"],
  ]) if (!preserved[0].test(sql)) failures.push(`preserved_${preserved[1]}`);
  return Object.freeze({ passed: failures.length === 0, failures: Object.freeze([...new Set(failures)]) });
}

export function normalize017c34To017c32(sql) {
  return sql
    .replace("-- Sprint 17C.34: exact-target-bound mismatch-detail diagnostic correction.", "-- Sprint 17C.32: mismatch-detail count, prerequisite, state, membership, and target correction.")
    .replace("  SELECT 'Lunch Break Hot Take'::text organization,'LBHT FID Persistence Test'::text project_name,'us-east-1'::text region,\n    'ahmorpzcaapvoymiqlkv'::text project_id", "  SELECT 'ahmorpzcaapvoymiqlkv'::text project_id")
    .replace(/\),\ntarget_binding AS \([\s\S]*?\n\),\nidentities AS \(/, "),\nidentities AS (")
    .replace("SELECT 'EXACT_TARGET_BOUND_FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_RESULT'::text result_identity,'17C.34.1'::text result_version,\n  CASE WHEN NOT b.binding_valid THEN 'TARGET_BINDING_INCONSISTENT' WHEN", "SELECT 'FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_RESULT'::text result_identity,'17C.32.1'::text result_version,\n  CASE WHEN")
    .replace("  c.organization,c.project_name,c.region,c.project_id,c.database,c.branch,c.sql_role,c.governed_environment,b.binding_valid target_binding_valid,", "  c.project_id,c.database,c.branch,c.sql_role,c.governed_environment,")
    .replace("CROSS JOIN state st CROSS JOIN target_binding b CROSS JOIN constants c;", "CROSS JOIN state st CROSS JOIN constants c;");
}

export default reviewExactTargetCorrection017c34;
