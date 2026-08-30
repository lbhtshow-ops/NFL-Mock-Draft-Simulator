const count=(text,re)=>(text.match(re)||[]).length;
export function reviewFidAtomicFunctionAclSql017c44(sqlByMode={}) {
  const failures=[]; const remediation=sqlByMode.remediation??""; const companions=[sqlByMode.preflight??"",sqlByMode.reconciliation??"",sqlByMode.postVerification??""];
  if(count(remediation,/\bBEGIN;/g)!==1||count(remediation,/\bCOMMIT;/g)!==1) failures.push("remediation_transaction");
  if(!/REVOKE EXECUTE ON FUNCTION fid\.fid_execute_atomic_persistence_batch\(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb\) FROM PUBLIC, anon, authenticated, fid_function_owner;/.test(remediation)) failures.push("exact_revoke");
  if(!/GRANT EXECUTE ON FUNCTION fid\.fid_execute_atomic_persistence_batch\(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb\) TO service_role;/.test(remediation)) failures.push("exact_grant");
  if(count(remediation,/\b(?:REVOKE|GRANT)\b/g)!==2) failures.push("mutation_scope");
  for(const token of ["pg_get_function_identity_arguments","aclexplode(p.proacl)","has_function_privilege","before_source_md5","migration_014_metadata_count","migration_014_object_count","RAISE EXCEPTION"]) if(!remediation.includes(token)) failures.push(`remediation_missing:${token}`);
  companions.forEach((sql,index)=>{if(!/BEGIN TRANSACTION READ ONLY;/.test(sql)||!/^COMMIT;$/m.test(sql)) failures.push(`companion_transaction:${index}`);if(/\b(?:GRANT|REVOKE|INSERT|UPDATE|DELETE|TRUNCATE|ALTER|CREATE|DROP|CALL)\b/i.test(sql.replace(/^--.*$/gm,""))) failures.push(`companion_mutation:${index}`);for(const token of ["aclexplode(p.proacl)","owner_derived_authority","external_target_attestation_required","migration_014_metadata_count","migration_014_object_count"]) if(!sql.includes(token)) failures.push(`companion_missing:${index}:${token}`);});
  for(const state of ["FULLY_UNAPPLIED","FULLY_APPLIED","PARTIALLY_APPLIED","STATE_INCONSISTENT_RECOVERY_REQUIRED","STATE_UNRESOLVED"]) if(!(sqlByMode.reconciliation??"").includes(`FID_ATOMIC_FUNCTION_ACL_REMEDIATION_${state}`)) failures.push(`reconciliation_state:${state}`);
  return Object.freeze({accepted:failures.length===0,failures:Object.freeze([...new Set(failures)])});
}
export default reviewFidAtomicFunctionAclSql017c44;
