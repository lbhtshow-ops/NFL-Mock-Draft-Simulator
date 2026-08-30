const scenario=(name,mutate,failure)=>Object.freeze({name,mutate,failure});
export const FID_ATOMIC_FUNCTION_ACL_PREFLIGHT_017C45_SCENARIOS=Object.freeze([
  scenario("protected-package",(value)=>value,null),
  scenario("preflight-hash-drift",(value)=>({...value,hashes:{...value.hashes,preflight:"0".repeat(64)}}),"protected_hash:preflight"),
  scenario("remediation-hash-drift",(value)=>({...value,hashes:{...value.hashes,remediation:"0".repeat(64)}}),"protected_hash:remediation"),
  scenario("missing-preflight-metadata-evidence",(value)=>({...value,preflight:value.preflight.replace("FROM fid.fid_persistence_migrations","FROM guarded_metadata")}),"review_fixture:preflight_metadata_reference_missing"),
  scenario("missing-owner-literal",(value)=>({...value,preflight:value.preflight.replace(",true owner_derived_authority,",",false owner_derived_authority,")}),"review_fixture:owner_literal_missing"),
  scenario("reconciliation-gains-effective-check",(value)=>({...value,reconciliation:`${value.reconciliation}\nSELECT has_function_privilege('service_role','fid.fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb)','EXECUTE');`}),"review_fixture:reconciliation_effective_privilege_unexpected"),
]);
export default FID_ATOMIC_FUNCTION_ACL_PREFLIGHT_017C45_SCENARIOS;
