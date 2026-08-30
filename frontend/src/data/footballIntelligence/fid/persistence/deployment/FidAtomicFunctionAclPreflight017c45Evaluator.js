const requiredHashes=Object.freeze({remediation:"40E51473798DDC0D23D6A724B45D5FC632BB0B9924A29CFA622AD11831BD69DF",preflight:"CB88039F42EB725274E41D4335628255DB41A6DB848B760CBCE4C7B454FB36A6",reconciliation:"BB857624579C56CC32F2C31346086F34304A32A3E57F5B8A22AF5C82D82AC144",postVerification:"5ACCE671B4E640170B15A393770F6FE0B8BAEAB945AE4E865D1DE0DB4C8EF5AC"});
export function evaluateFidAtomicFunctionAclPreflightReview017c45(input={}){
  const failures=[];
  for(const [key,value] of Object.entries(requiredHashes))if(input.hashes?.[key]!==value)failures.push(`protected_hash:${key}`);
  if(!/FROM fid\.fid_persistence_migrations/.test(input.preflight??""))failures.push("review_fixture:preflight_metadata_reference_missing");
  if(!/FROM fid\.fid_persistence_migrations/.test(input.reconciliation??"")||!/FROM fid\.fid_persistence_migrations/.test(input.postVerification??""))failures.push("review_fixture:companion_metadata_reference_missing");
  if(/has_function_privilege/.test(input.reconciliation??""))failures.push("review_fixture:reconciliation_effective_privilege_unexpected");
  if(!/,true owner_derived_authority,/.test(input.preflight??"")||!/,true owner_derived_authority,/.test(input.reconciliation??"")||!/,true owner_derived_authority,/.test(input.postVerification??""))failures.push("review_fixture:owner_literal_missing");
  const blockers=Object.freeze(["OPTIONAL_METADATA_RELATION_NOT_SAFELY_GUARDED","RECONCILIATION_EFFECTIVE_PRIVILEGE_CONTRACT_MISSING","OWNER_DERIVED_AUTHORITY_NOT_OBSERVED","PREFLIGHT_STATE_CONTRACT_INCOMPLETE"]);
  return Object.freeze({accepted:failures.length===0,failures:Object.freeze(failures),authorizationPermitted:false,decision:"FID_ATOMIC_FUNCTION_ACL_REMEDIATION_IMPLEMENTATION_CORRECTION_REQUIRED",blockers});
}
export default evaluateFidAtomicFunctionAclPreflightReview017c45;
