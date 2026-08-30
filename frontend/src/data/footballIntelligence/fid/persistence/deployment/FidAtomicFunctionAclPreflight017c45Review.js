export const FID_ATOMIC_FUNCTION_ACL_PREFLIGHT_017C45_REVIEW=Object.freeze({
  reviewId:"FID_ATOMIC_FUNCTION_ACL_PREFLIGHT_017C45_CONTROLLED_DEPLOYMENT_REVIEW_V1",version:"17C.45.1",
  decision:"FID_ATOMIC_FUNCTION_ACL_REMEDIATION_IMPLEMENTATION_CORRECTION_REQUIRED",authorizationCreated:false,
  repositoryIdentityVerified:true,inheritedWorktreePreserved:true,migrations:Object.freeze({first:"001",last:"014",migration015Absent:true,migration014State:"MIGRATION_014_FULLY_ROLLED_BACK",migration014Applied:false}),
  protectedHashesVerified:10,
  passingGates:Object.freeze(["exact function schema/name/identity arguments","overload count","one remediation transaction","exact REVOKE and GRANT only","before and after ACL assertions","no exception suppression","no intermediate commit","no SET ROLE","no RPC invocation","read-only companion transactions","sanitized aggregate output","external target attestation","261-unit matrix preservation"]),
  blockingFindings:Object.freeze([
    Object.freeze({id:"OPTIONAL_METADATA_RELATION_NOT_SAFELY_GUARDED",files:Object.freeze(["017c44b","017c44c","017c44d"]),evidence:"Static reference to fid.fid_persistence_migrations is resolved before CASE classification; absence yields SQL error rather than one sanitized unresolved row."}),
    Object.freeze({id:"RECONCILIATION_EFFECTIVE_PRIVILEGE_CONTRACT_MISSING",files:Object.freeze(["017c44c"]),evidence:"Visible result contains direct ACL booleans and a literal owner-derived flag but no has_function_privilege-derived effective booleans."}),
    Object.freeze({id:"OWNER_DERIVED_AUTHORITY_NOT_OBSERVED",files:Object.freeze(["017c44b","017c44c","017c44d"]),evidence:"owner_derived_authority is the literal true even when function or owner evidence is unresolved."}),
    Object.freeze({id:"PREFLIGHT_STATE_CONTRACT_INCOMPLETE",files:Object.freeze(["017c44b"]),evidence:"The preflight distinguishes fully-unapplied, unresolved, and inconsistent only; it has no distinct already-applied or controlled blocked classification."}),
  ]),
  preflightVisibleColumnOrder:Object.freeze(["result_identity","result_version","classification","public_direct_execute","anon_direct_execute","authenticated_direct_execute","owner_direct_acl_entry","owner_derived_authority","service_direct_execute","anon_effective_execute","authenticated_effective_execute","service_effective_execute","migration_014_metadata_count","migration_014_object_count","external_target_attestation_required","overall_target_verified","read_only","mutation_count"]),
  preflightClassifications:Object.freeze({passing:"FID_ATOMIC_FUNCTION_ACL_REMEDIATION_FULLY_UNAPPLIED",blocked:"ABSENT_AS_DISTINCT_CLASSIFICATION",unresolved:"FID_ATOMIC_FUNCTION_ACL_REMEDIATION_STATE_UNRESOLVED",inconsistent:"FID_ATOMIC_FUNCTION_ACL_REMEDIATION_STATE_INCONSISTENT_RECOVERY_REQUIRED",alreadyApplied:"ABSENT_AS_DISTINCT_CLASSIFICATION"}),
  sqlExecuted:false,databaseConnected:false,databaseActionOccurred:false,
});
export default FID_ATOMIC_FUNCTION_ACL_PREFLIGHT_017C45_REVIEW;
