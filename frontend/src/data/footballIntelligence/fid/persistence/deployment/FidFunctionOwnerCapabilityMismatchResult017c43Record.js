const detail = (value) => Object.freeze({ ...value });

export const FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_RESULT_017C43_RECORD = Object.freeze({
  recordId: "FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_RESULT_017C43_V1",
  version: "17C.43.1",
  sourceAuthorization: "SPLIT_AUTHORITY_MISMATCH_DETAIL_DIAGNOSTIC_ONE_EXECUTION_017C42_V1",
  authorizationStatus: "CONSUMED_NON_REUSABLE",
  executedSqlFilename: "017c40_fid_function_owner_capability_mismatch_detail_split_authority_25_field_successor.sql",
  executedSqlSha256: "8D56003C1835ED6889C947DA75B56C4D032736DD31532FCF428FD68FF421688E",
  executionCount: 1,
  target: Object.freeze({ organization: "Lunch Break Hot Take", projectName: "LBHT FID Persistence Test",
    projectReference: "ahmorpzcaapvoymiqlkv", region: "us-east-1", branch: "main",
    dashboardDatabaseSource: "Primary Database", sqlRole: "postgres",
    governedEnvironment: "DEDICATED_NON_PRODUCTION_TEST", platformLabel: "PRODUCTION",
    platformLabelMeaning: "PRIMARY_BRANCH_TOPOLOGY_ONLY_FOR_THIS_EXACT_NON_PRODUCTION_TEST_PROJECT" }),
  result: Object.freeze({
    result_version: "17C.40.1", mode: "MISMATCH_DETAIL_DIAGNOSTIC",
    classification: "MISMATCH_DETAIL_REVIEW_REQUIRED_EXTERNAL_TARGET_ATTESTATION_REQUIRED",
    mismatch_count: 6, detail_count: 6, count_reconciled: true,
    captured_preflight_mismatch_count: 5, captured_count_reconciled: false,
    unresolved_details: Object.freeze([]), state_conflicts: Object.freeze([]),
    expected_before_set_state: false, expected_before_create_state: false,
    metadata_storage_present: true, migration_014_metadata_count: 0,
    evidence_complete: true, database_evidence_complete: true,
    external_target_attestation_required: true, overall_target_verified: false,
    read_only: true, mutation_count: 0,
    mismatch_details: Object.freeze([
      detail({ severity:"BLOCKING",check_type:"EFFECTIVE_PRIVILEGE_MISMATCH",mismatch_id:"FUNCTION_EXECUTE_ANON",object_class:"function",principal_ref:"anon",mismatch_ordinal:1,increment_unit_id:"FUNCTION_ACL:anon",governed_object_ref:"function:fid.fid_execute_atomic_persistence_batch",expected_classification:"ABSENT",observed_classification:"PRESENT",recovery_classification:"GOVERNANCE_REVIEW_REQUIRED" }),
      detail({ severity:"BLOCKING",check_type:"EFFECTIVE_PRIVILEGE_MISMATCH",mismatch_id:"FUNCTION_EXECUTE_AUTHENTICATED",object_class:"function",principal_ref:"authenticated",mismatch_ordinal:2,increment_unit_id:"FUNCTION_ACL:authenticated",governed_object_ref:"function:fid.fid_execute_atomic_persistence_batch",expected_classification:"ABSENT",observed_classification:"PRESENT",recovery_classification:"GOVERNANCE_REVIEW_REQUIRED" }),
      detail({ severity:"BLOCKING",check_type:"UNEXPECTED_DIRECT_PRIVILEGE",mismatch_id:"FUNCTION_EXECUTE_FID_FUNCTION_OWNER",object_class:"function",principal_ref:"fid_function_owner",mismatch_ordinal:3,increment_unit_id:"FUNCTION_ACL:fid_function_owner",governed_object_ref:"function:fid.fid_execute_atomic_persistence_batch",expected_classification:"ABSENT",observed_classification:"PRESENT",recovery_classification:"GOVERNANCE_REVIEW_REQUIRED" }),
      detail({ severity:"BLOCKING",check_type:"UNEXPECTED_DIRECT_PRIVILEGE",mismatch_id:"FUNCTION_EXECUTE_PUBLIC",object_class:"function",principal_ref:"PUBLIC",mismatch_ordinal:4,increment_unit_id:"FUNCTION_ACL:PUBLIC",governed_object_ref:"function:fid.fid_execute_atomic_persistence_batch",expected_classification:"ABSENT",observed_classification:"PRESENT",recovery_classification:"GOVERNANCE_REVIEW_REQUIRED" }),
      detail({ severity:"BLOCKING",check_type:"MISSING_DIRECT_PRIVILEGE",mismatch_id:"FUNCTION_EXECUTE_SERVICE_ROLE",object_class:"function",principal_ref:"service_role",mismatch_ordinal:5,increment_unit_id:"FUNCTION_ACL:service_role",governed_object_ref:"function:fid.fid_execute_atomic_persistence_batch",expected_classification:"PRESENT",observed_classification:"PRESENT",recovery_classification:"GOVERNANCE_REVIEW_REQUIRED" }),
      detail({ severity:"BLOCKING",check_type:"ROLLBACK_INVENTORY",mismatch_id:"MIGRATION_014_ROLLBACK_STATE",object_class:"metadata",principal_ref:null,mismatch_ordinal:6,increment_unit_id:"ROLLBACK_STATE",governed_object_ref:"metadata:migration_014",expected_classification:"ROLLED_BACK_UNAPPLIED",observed_classification:"CONFLICT",recovery_classification:"GOVERNANCE_REVIEW_REQUIRED" }),
    ]),
  }),
  omittedVisibleFields: Object.freeze(["result_identity", "membership_evidence", "database_observed_target_evidence", "externally_authorized_target_binding"]),
  omissionReason: "NOT_INCLUDED_IN_THE_GOVERNED_HANDOFF;_VALUES_MUST_NOT_BE_INVENTED",
});

export default FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_RESULT_017C43_RECORD;
