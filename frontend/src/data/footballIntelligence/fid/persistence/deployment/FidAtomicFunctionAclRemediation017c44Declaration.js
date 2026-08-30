const artifact = (filename, sha256, mode) => Object.freeze({ filename,
  path: `frontend/src/data/footballIntelligence/fid/persistence/deployment/review/${filename}`, sha256, mode });

export const FID_ATOMIC_FUNCTION_ACL_REMEDIATION_017C44_DECLARATION = Object.freeze({
  declarationId: "FID_ATOMIC_FUNCTION_ACL_REMEDIATION_017C44_V1", version: "17C.44.1",
  reviewStatus: "INDEPENDENT_REVIEW_CONFIRMED", executionAuthorized: false,
  target: Object.freeze({ organization:"Lunch Break Hot Take",projectName:"LBHT FID Persistence Test",projectReference:"ahmorpzcaapvoymiqlkv",region:"us-east-1",branch:"main",dashboardDatabaseSource:"Primary Database",sqlRole:"postgres",environment:"DEDICATED_NON_PRODUCTION_TEST" }),
  authoritativeState: Object.freeze({ migration014:"MIGRATION_014_FULLY_ROLLED_BACK",migration014Applied:false,migration015Absent:true,capabilityAmendmentApplied:false }),
  matrix: Object.freeze({ identity:"FID_FUNCTION_OWNER_ACL_MATRIX_017C21_V1",governanceUnits:261,amended:false }),
  historicalCountComparison: "UNRESOLVED_TEMPORAL_OR_ORACLE_DIFFERENCE_WITHOUT_PRIOR_DETAIL_ROWS",
  mutations: Object.freeze(["REVOKE EXECUTE FROM PUBLIC, anon, authenticated, fid_function_owner ON EXACT GOVERNED FUNCTION","GRANT EXECUTE TO service_role ON EXACT GOVERNED FUNCTION"]),
  preserved: Object.freeze(["function ownership","function signature","function body","SECURITY DEFINER","search_path=pg_catalog, fid","forced RLS","table ACLs","schema ACLs","roles and memberships","Migration 014 objects and metadata","all unrelated function ACLs"]),
  artifacts: Object.freeze({
    remediation:artifact("017c44a_fid_atomic_function_acl_remediation.sql","40E51473798DDC0D23D6A724B45D5FC632BB0B9924A29CFA622AD11831BD69DF","MUTATING_NOT_AUTHORIZED"),
    preflight:artifact("017c44b_fid_atomic_function_acl_preflight.sql","CB88039F42EB725274E41D4335628255DB41A6DB848B760CBCE4C7B454FB36A6","READ_ONLY"),
    reconciliation:artifact("017c44c_fid_atomic_function_acl_reconciliation.sql","BB857624579C56CC32F2C31346086F34304A32A3E57F5B8A22AF5C82D82AC144","READ_ONLY"),
    postVerification:artifact("017c44d_fid_atomic_function_acl_post_verification.sql","5ACCE671B4E640170B15A393770F6FE0B8BAEAB945AE4E865D1DE0DB4C8EF5AC","READ_ONLY"),
  }),
});
export default FID_ATOMIC_FUNCTION_ACL_REMEDIATION_017C44_DECLARATION;
