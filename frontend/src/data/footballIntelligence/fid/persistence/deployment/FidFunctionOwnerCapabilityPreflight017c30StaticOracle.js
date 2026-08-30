const occurrences=(text,pattern)=>text.match(pattern)?.length??0;
export function reviewMismatchDetail017c30(sql){
  const failures=[]; const bare=sql.replace(/--.*$/gm,"").replace(/'(?:''|[^'])*'/g,"''");
  if(!/^\s*--[^\n]*\nBEGIN TRANSACTION READ ONLY;/i.test(sql)||occurrences(sql,/\bCOMMIT;/gi)!==1) failures.push("read_only_transaction");
  if(/\b(?:INSERT|UPDATE|DELETE|MERGE|TRUNCATE|CREATE|ALTER|DROP|COMMENT|GRANT|REVOKE|COPY|SET\s+ROLE|SET\s+SESSION|FOR\s+(?:UPDATE|SHARE)|pg_advisory\w*|gen_random_uuid|uuid_generate\w*|nextval|setval)\b/i.test(bare)) failures.push("mutation_lock_role_or_generation");
  if(/fid_execute_(?:atomic_persistence_batch|prospect_identifier_issuance_transaction)\s*\(/i.test(bare)) failures.push("rpc_invocation");
  if(/set_config|current_setting|RAISE\s+NOTICE|CREATE\s+(?:TEMP|FUNCTION|TABLE)/i.test(bare)) failures.push("setting_notice_or_helper");
  if(occurrences(sql,/\bSELECT\s*\n\s*'FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_RESULT'/gi)!==1) failures.push("single_visible_result");
  if(occurrences(sql,/CROSS JOIN principals p/g)!==1 || occurrences(sql,/FROM principals p CROSS JOIN/g)!==1 || occurrences(sql,/FROM function_policy x/g)!==1 || !/<>7/.test(sql)) failures.push("matrix_261_parity");
  if(!/metadata_ref[\s\S]*CASE WHEN relation_ref IS NULL THEN NULL ELSE pg_catalog\.query_to_xml/i.test(sql)) failures.push("optional_metadata_guard");
  if(!/FROM %s'[\s\S]*relation_ref\)/i.test(sql)||/query_to_xml\([^)]*(?:client|input|parameter)/i.test(sql)) failures.push("catalog_resolved_dynamic_identity");
  if(!/jsonb_agg[\s\S]*ORDER BY mismatch_ordinal/i.test(sql)||!/row_number\(\) OVER \(ORDER BY mismatch_id/i.test(sql)) failures.push("deterministic_order");
  if(!/mismatch_details[\s\S]*FROM summary/i.test(sql)||/generate_series|\bAS\s+(?:raw_acl|acl_item|oid|function_body|sql_definition|credential|secret|url|connection_string|payload|uuid|user_data|prospect_data)\b/i.test(sql)) failures.push("sanitized_bounded_output");
  const required=["MISSING_DIRECT_PRIVILEGE","UNEXPECTED_DIRECT_PRIVILEGE","MISSING_EFFECTIVE_PRIVILEGE","UNEXPECTED_EFFECTIVE_PRIVILEGE","UNEXPECTED_GRANT_OPTION","OBJECT_OWNER","OWNER_RESTRICTED_ATTRIBUTES","OWNER_MEMBERSHIP_OPTIONS","OWNER_CREATE_OTHER_SCHEMA","FID_TABLE_INVENTORY","FID_SEQUENCE_INVENTORY","FID_FUNCTION_INVENTORY","OPTIONAL_METADATA_STORAGE","MIGRATION_014_ROLLBACK_STATE"];
  if(required.some(token=>!sql.includes(token))) failures.push("mismatch_taxonomy");
  return Object.freeze({passed:failures.length===0,failures:Object.freeze([...new Set(failures)])});
}
export default reviewMismatchDetail017c30;
