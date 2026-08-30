export function reviewMismatchDetailCorrection017c32(sql){
  const failures=[];const bare=sql.replace(/--.*$/gm,"").replace(/'(?:''|[^'])*'/g,"''");
  if(!/BEGIN TRANSACTION READ ONLY;/i.test(sql)||!/\bCOMMIT;/i.test(sql))failures.push("read_only_transaction");
  if(/\b(?:INSERT|UPDATE|DELETE|MERGE|TRUNCATE|CREATE|ALTER|DROP|COMMENT|GRANT|REVOKE|COPY|SET\s+ROLE|SET\s+SESSION|FOR\s+(?:UPDATE|SHARE)|pg_advisory\w*|gen_random_uuid|uuid_generate\w*|nextval|setval)\b/i.test(bare))failures.push("mutation_lock_role_generation");
  if(/fid_execute_(?:atomic_persistence_batch|prospect_identifier_issuance_transaction)\s*\(/i.test(bare))failures.push("rpc");
  if(!sql.includes("DEDICATED_NON_PRODUCTION_TEST"))failures.push("environment_binding");
  if(!/prerequisites AS[\s\S]*to_regclass\('fid\.fid_persistence_migrations'\)[\s\S]*AS complete/i.test(sql)||!/unresolved AS[\s\S]*MISSING_OPTIONAL_METADATA_STORAGE/i.test(sql))failures.push("unresolved_prerequisites");
  if(!/TABLE_PREREQUISITE[\s\S]*FROM tables WHERE complete AND NOT acl_ready/i.test(sql)||!/FROM table_acl WHERE complete AND acl_ready AND/i.test(sql))failures.push("table_skip_behavior");
  if(!/has_table_privilege\(x\.principal_oid,x\.table_oid/i.test(sql)||/has_table_privilege\([^)]*table_name/i.test(sql))failures.push("resolved_table_identity");
  if(!/state_conflicts AS[\s\S]*UNEXPECTED_MEMBERSHIP_SET_TRUE[\s\S]*UNEXPECTED_OWNER_CREATE_TRUE/i.test(sql))failures.push("before_state_conflicts");
  if(!/jsonb_build_object\('member_exact'[\s\S]*'admin_state'[\s\S]*'inherit_state'[\s\S]*'set_state'[\s\S]*membership_evidence/i.test(sql))failures.push("membership_evidence");
  if(!/count\(\*\)::integer mismatch_count[\s\S]*jsonb_array_length\(s\.mismatch_details\) detail_count[\s\S]*count_reconciled/i.test(sql))failures.push("count_reconciliation");
  if(!/row_number\(\) OVER\(ORDER BY unit_id,mismatch_id\)/i.test(sql)||!/jsonb_agg[\s\S]*ORDER BY mismatch_ordinal/i.test(sql))failures.push("deterministic_order");
  if(!/FROM summary s CROSS JOIN unresolved_summary[\s\S]*CROSS JOIN constants c/i.test(sql))failures.push("single_visible_row");
  return Object.freeze({passed:failures.length===0,failures:Object.freeze([...new Set(failures)])});
}
export default reviewMismatchDetailCorrection017c32;
