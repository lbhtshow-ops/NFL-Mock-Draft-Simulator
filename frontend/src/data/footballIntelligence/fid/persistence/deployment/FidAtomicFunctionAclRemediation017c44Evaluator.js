export const ACL_REMEDIATION_STATES_017C44 = Object.freeze({ UNAPPLIED:"FID_ATOMIC_FUNCTION_ACL_REMEDIATION_FULLY_UNAPPLIED",APPLIED:"FID_ATOMIC_FUNCTION_ACL_REMEDIATION_FULLY_APPLIED",PARTIAL:"FID_ATOMIC_FUNCTION_ACL_REMEDIATION_PARTIALLY_APPLIED",INCONSISTENT:"FID_ATOMIC_FUNCTION_ACL_REMEDIATION_STATE_INCONSISTENT_RECOVERY_REQUIRED",UNRESOLVED:"FID_ATOMIC_FUNCTION_ACL_REMEDIATION_STATE_UNRESOLVED" });
export function evaluateFidAtomicFunctionAclState017c44(value={}) {
  const s=ACL_REMEDIATION_STATES_017C44;
  if(value.functionCount!==1||!value.functionResolved||!value.rolesResolved) return s.UNRESOLVED;
  if(!value.securityExact||value.migration014MetadataCount!==0||value.migration014ObjectCount!==0||value.grantableCount!==0) return s.INCONSISTENT;
  const direct=[value.publicDirect,value.ownerDirect,value.serviceDirect,value.anonDirect,value.authenticatedDirect];
  if(JSON.stringify(direct)===JSON.stringify([true,true,false,false,false])&&value.directCount===2) return s.UNAPPLIED;
  if(JSON.stringify(direct)===JSON.stringify([false,false,true,false,false])&&value.directCount===1) return s.APPLIED;
  if(direct.every((item)=>typeof item==="boolean")&&!value.anonDirect&&!value.authenticatedDirect&&value.directCount>=0&&value.directCount<=2) return s.PARTIAL;
  return s.INCONSISTENT;
}
export function evaluateFidAtomicFunctionAclVisibleResult017c44(row={}) {
  const failures=[];
  if(!Object.values(ACL_REMEDIATION_STATES_017C44).includes(row.classification)) failures.push("classification");
  if(row.read_only!==true||row.mutation_count!==0) failures.push("read_only");
  if(row.external_target_attestation_required!==true||row.overall_target_verified!==false) failures.push("split_authority");
  if(row.owner_derived_authority!==true) failures.push("owner_authority");
  if(row.classification===ACL_REMEDIATION_STATES_017C44.APPLIED&&(row.public_direct_execute||row.anon_direct_execute||row.authenticated_direct_execute||row.owner_direct_acl_entry||!row.service_direct_execute)) failures.push("applied_acl_shape");
  return Object.freeze({accepted:failures.length===0,failures:Object.freeze(failures)});
}
export default evaluateFidAtomicFunctionAclState017c44;
