const base=Object.freeze({functionCount:1,functionResolved:true,rolesResolved:true,securityExact:true,migration014MetadataCount:0,migration014ObjectCount:0,grantableCount:0,publicDirect:true,ownerDirect:true,serviceDirect:false,anonDirect:false,authenticatedDirect:false,directCount:2});
const set=(name,changes,expected)=>Object.freeze({name,input:Object.freeze({...base,...changes}),expected});
export const FID_ATOMIC_FUNCTION_ACL_REMEDIATION_017C44_SCENARIOS=Object.freeze([
  set("captured-unapplied",{},"FID_ATOMIC_FUNCTION_ACL_REMEDIATION_FULLY_UNAPPLIED"),
  set("fully-applied",{publicDirect:false,ownerDirect:false,serviceDirect:true,directCount:1},"FID_ATOMIC_FUNCTION_ACL_REMEDIATION_FULLY_APPLIED"),
  set("public-revoked-only",{publicDirect:false,directCount:1},"FID_ATOMIC_FUNCTION_ACL_REMEDIATION_PARTIALLY_APPLIED"),
  set("service-granted-only",{serviceDirect:true,directCount:3},"FID_ATOMIC_FUNCTION_ACL_REMEDIATION_STATE_INCONSISTENT_RECOVERY_REQUIRED"),
  set("browser-direct",{anonDirect:true,directCount:3},"FID_ATOMIC_FUNCTION_ACL_REMEDIATION_STATE_INCONSISTENT_RECOVERY_REQUIRED"),
  set("grant-option",{grantableCount:1},"FID_ATOMIC_FUNCTION_ACL_REMEDIATION_STATE_INCONSISTENT_RECOVERY_REQUIRED"),
  set("migration-object",{migration014ObjectCount:1},"FID_ATOMIC_FUNCTION_ACL_REMEDIATION_STATE_INCONSISTENT_RECOVERY_REQUIRED"),
  set("migration-metadata",{migration014MetadataCount:1},"FID_ATOMIC_FUNCTION_ACL_REMEDIATION_STATE_INCONSISTENT_RECOVERY_REQUIRED"),
  set("missing-function",{functionCount:0,functionResolved:false},"FID_ATOMIC_FUNCTION_ACL_REMEDIATION_STATE_UNRESOLVED"),
  set("missing-role",{rolesResolved:false},"FID_ATOMIC_FUNCTION_ACL_REMEDIATION_STATE_UNRESOLVED"),
]);
export default FID_ATOMIC_FUNCTION_ACL_REMEDIATION_017C44_SCENARIOS;
