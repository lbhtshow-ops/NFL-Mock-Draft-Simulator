export const FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_017C32_SCENARIOS=Object.freeze([
  ["missing-table-skip","FROM table_acl WHERE complete AND acl_ready AND","FROM table_acl WHERE complete AND","table_skip_behavior"],
  ["unresolved-table-name","has_table_privilege(x.principal_oid,x.table_oid","has_table_privilege(x.principal_oid,x.table_name","resolved_table_identity"],
  ["missing-prerequisite","MISSING_OPTIONAL_METADATA_STORAGE","OPTIONAL_METADATA_UNKNOWN","unresolved_prerequisites"],
  ["missing-set-conflict","UNEXPECTED_MEMBERSHIP_SET_TRUE","UNREPORTED_SET","before_state_conflicts"],
  ["missing-create-conflict","UNEXPECTED_OWNER_CREATE_TRUE","UNREPORTED_CREATE","before_state_conflicts"],
  ["collapsed-member-evidence","membership_evidence","collapsed_membership","membership_evidence"],
  ["missing-environment","DEDICATED_NON_PRODUCTION_TEST","UNKNOWN_ENVIRONMENT","environment_binding"],
  ["count-disagreement","jsonb_array_length(s.mismatch_details) detail_count","4 detail_count","count_reconciliation"],
  ["nondeterministic","row_number() OVER(ORDER BY unit_id,mismatch_id)","row_number() OVER()","deterministic_order"],
  ["mutation","COMMIT;","UPDATE fid.example SET x=1; COMMIT;","mutation_lock_role_generation"],
  ["locking","COMMIT;","SELECT 1 FOR UPDATE; COMMIT;","mutation_lock_role_generation"],
  ["role-change","COMMIT;","SET ROLE postgres; COMMIT;","mutation_lock_role_generation"],
  ["rpc","COMMIT;","SELECT fid_execute_atomic_persistence_batch(); COMMIT;","rpc"],
]);
export default FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_017C32_SCENARIOS;
