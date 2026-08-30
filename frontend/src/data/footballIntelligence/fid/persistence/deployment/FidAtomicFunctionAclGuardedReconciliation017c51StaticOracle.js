const count=(text,re)=>(text.match(re)||[]).length;
export function reviewFidAtomicFunctionAclGuardedReconciliation017c51(sql=""){
  const failures=[];const clean=sql.replace(/^--.*$/gm,"");const gate=(id,pass)=>{if(!pass)failures.push(id);};
  gate("read_only_one_row",count(clean,/BEGIN TRANSACTION READ ONLY;/g)===1&&count(clean,/\bCOMMIT\s*;/gi)===1&&count(sql,/^SELECT r\.\* FROM/gm)===1);
  gate("no_mutation_lock_or_role",!/\b(?:GRANT|REVOKE|INSERT|UPDATE|DELETE|TRUNCATE|ALTER|CREATE|DROP|CALL|LOCK|FOR\s+(?:UPDATE|SHARE)|SET\s+ROLE|SET\s+SESSION\s+AUTHORIZATION|pg_advisory_)\b/i.test(clean));
  gate("metadata_regclass",/to_regclass\('fid\.fid_persistence_migrations'\)/.test(sql)&&!/FROM\s+fid\.fid_persistence_migrations/i.test(clean));
  gate("metadata_identity",/c\.oid=metadata_ref/.test(sql)&&/n\.nspname='fid'/.test(sql)&&/c\.relname='fid_persistence_migrations'/.test(sql));
  gate("ordinary_table_only",/c\.relkind='r'/.test(sql)&&!/relkind\s+IN/i.test(sql));
  gate("exact_column_types",/a\.atttypid='pg_catalog\.text'::pg_catalog\.regtype/.test(sql)&&/a\.atttypid='pg_catalog\.int4'::pg_catalog\.regtype/.test(sql)&&/a\.atttypid='pg_catalog\._text'::pg_catalog\.regtype/.test(sql)&&/a\.attnum>0 AND NOT a\.attisdropped/.test(sql));
  gate("operator_guards",/to_regoperator\('pg_catalog\.~~\(text,text\)'\)/.test(sql)&&/to_regoperator\('pg_catalog\.=\(integer,integer\)'\)/.test(sql)&&/to_regoperator\('pg_catalog\.=\(text,text\)'\)/.test(sql));
  gate("dynamic_guard",/metadata_shape_match:=metadata_columns_match AND metadata_operators_match;\s+IF metadata_shape_match THEN\s+EXECUTE pg_catalog\.format/.test(sql));
  gate("fixed_dynamic_aggregate",/EXECUTE pg_catalog\.format\('SELECT count\(\*\) FROM %s WHERE migration_id COLLATE "C" LIKE %L OR migration_sequence=14 OR %L=ANY\(applied_migration_ids\)',metadata_ref,'%014%','fid-014-identifier-issuance-transaction'\)/.test(sql));
  gate("detail_count",/detail_count:=pg_catalog\.jsonb_array_length\(failures\)/.test(sql)&&/'detail_count',detail_count/.test(sql)&&/failed_baseline_predicates jsonb,detail_count integer,detail_count_matches_failed_count boolean/.test(sql));
  gate("count_guard",/detail_count>=0 AND failed_count>=0 AND detail_count=failed_count/.test(sql)&&/evidence_complete:=[^;]*counts_reconciled/.test(sql));
  const precedence=["EVIDENCE_UNRESOLVED","MIGRATION_014_STATE_UNEXPECTED","FUNCTION_PROPERTY_BASELINE_DRIFT","RESTRICTED_OWNER_ATTRIBUTE_DRIFT","EXACT_UNCHANGED_PRE_REMEDIATION_STATE","OWNER_PRESERVING_REMEDIATION_ALREADY_APPLIED","PARTIAL_OR_INCONSISTENT_ACL_STATE"];let cursor=-1;for(const item of precedence){const next=sql.indexOf(item);gate(`precedence:${item}`,next>cursor);cursor=next;}
  for(const token of ["function_identity_resolution_count","function_owner_role_resolution_count","service_role_resolution_count","anon_role_resolution_count","authenticated_role_resolution_count","function_owner_match","security_definer_match","volatility_match","parallel_safety_match","search_path_and_function_config_match","owner_nologin","owner_nosuperuser","owner_nocreatedb","owner_nocreaterole","owner_noreplication","owner_nobypassrls","owner_noinherit","owner_direct_acl_entry","owner_derived_authority","exact_unchanged_pre_remediation_state","owner_preserving_remediation_already_applied","overall_target_verified","mutation_count"])gate(`parity:${token}`,sql.includes(token));
  return Object.freeze({accepted:failures.length===0,failures:Object.freeze([...new Set(failures)])});
}
export default reviewFidAtomicFunctionAclGuardedReconciliation017c51;
