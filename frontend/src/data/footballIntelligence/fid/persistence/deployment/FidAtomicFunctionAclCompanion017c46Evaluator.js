export function evaluateFidAtomicFunctionAclState017c46(v={}){
  if(!v.evidenceComplete||v.functionCount!==1||!v.rolesResolved||!v.metadataPresent)return "FID_ATOMIC_FUNCTION_ACL_REMEDIATION_STATE_UNRESOLVED";
  if(!v.ownerMatch||!v.securityExact||v.migration014MetadataCount!==0||v.migration014ObjectCount!==0||v.grantableCount!==0||v.anonDirect||v.authenticatedDirect||v.directCount!==[v.publicDirect,v.anonDirect,v.authenticatedDirect,v.ownerDirect,v.serviceDirect].filter(Boolean).length)return "FID_ATOMIC_FUNCTION_ACL_REMEDIATION_STATE_INCONSISTENT_RECOVERY_REQUIRED";
  const before=v.publicDirect&&v.ownerDirect&&!v.serviceDirect&&v.publicEffective&&v.anonEffective&&v.authenticatedEffective&&v.ownerEffective&&v.ownerDerived&&v.serviceEffective&&v.directCount===2;
  const after=!v.publicDirect&&!v.ownerDirect&&v.serviceDirect&&!v.publicEffective&&!v.anonEffective&&!v.authenticatedEffective&&v.ownerEffective&&v.ownerDerived&&v.serviceEffective&&v.directCount===1;
  if(v.mode==="PREFLIGHT"&&before)return "FID_ATOMIC_FUNCTION_ACL_REMEDIATION_FULLY_UNAPPLIED";
  if(v.mode==="PREFLIGHT"&&after)return "FID_ATOMIC_FUNCTION_ACL_REMEDIATION_ALREADY_APPLIED";
  if(v.mode==="RECONCILIATION"&&before)return "FID_ATOMIC_FUNCTION_ACL_REMEDIATION_FULLY_UNAPPLIED";
  if(v.mode==="RECONCILIATION"&&after)return "FID_ATOMIC_FUNCTION_ACL_REMEDIATION_FULLY_APPLIED";
  const partial=!v.anonDirect&&!v.authenticatedDirect&&v.ownerEffective&&v.ownerDerived&&v.publicEffective===v.publicDirect&&v.anonEffective===v.publicDirect&&v.authenticatedEffective===v.publicDirect&&v.serviceEffective===(v.publicDirect||v.serviceDirect);
  if(v.mode==="RECONCILIATION"&&partial)return "FID_ATOMIC_FUNCTION_ACL_REMEDIATION_PARTIALLY_APPLIED";
  if(v.mode==="POST_VERIFICATION"&&after)return "FID_ATOMIC_FUNCTION_ACL_REMEDIATION_POST_VERIFICATION_PASSED";
  return "FID_ATOMIC_FUNCTION_ACL_REMEDIATION_TARGET_STATE_BLOCKED";
}
export default evaluateFidAtomicFunctionAclState017c46;
