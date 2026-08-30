import result from "./FidFunctionOwnerCapabilityPreflight017c30ExecutionResult.js";
const rowChanges=[
  ["wrong-identity","result_identity","WRONG"],["wrong-version","result_version","0"],["wrong-project","project_id","wrong"],
  ["wrong-database","database","Replica"],["wrong-branch","branch","dev"],["wrong-role","sql_role","anon"],
  ["mutation","mutation_count",1],["not-read-only","read_only",false],["incomplete-evidence","evidence_complete",false],
  ["metadata-missing","metadata_storage_present",false],["migration-014-present","migration_014_metadata_count",1],
  ["zero-with-inconsistent","mismatch_count",0],["nonzero-with-pass","classification","FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_017C24_PREFLIGHT_PASSED"],
];
export const FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_017C30_RESULT_SCENARIOS=Object.freeze(rowChanges.map(([id,field,value])=>Object.freeze({id,record:Object.freeze({...result,row:Object.freeze({...result.row,[field]:value})}),expectedFailure:field})));
export const FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_017C30_STATIC_SCENARIOS=Object.freeze([
  ["missing-table","FID_TABLE_INVENTORY","REMOVED_TABLE_INVENTORY","mismatch_taxonomy"],
  ["unexpected-table","FID_TABLE_INVENTORY","WEAK_TABLE_INVENTORY","mismatch_taxonomy"],
  ["wrong-owner","OBJECT_OWNER","OBJECT_CHECK","mismatch_taxonomy"],
  ["missing-owner-privilege","MISSING_DIRECT_PRIVILEGE","MISSING_PRIVILEGE","mismatch_taxonomy"],
  ["unexpected-service-table-privilege","UNEXPECTED_DIRECT_PRIVILEGE","EXPANDED_PRIVILEGE","mismatch_taxonomy"],
  ["browser-expansion","UNEXPECTED_EFFECTIVE_PRIVILEGE","EXPANSION","mismatch_taxonomy"],
  ["public-expansion","UNEXPECTED_GRANT_OPTION","GRANT","mismatch_taxonomy"],
  ["unexpected-function","FID_FUNCTION_INVENTORY","FUNCTIONS","mismatch_taxonomy"],
  ["unexpected-sequence","FID_SEQUENCE_INVENTORY","SEQUENCES","mismatch_taxonomy"],
  ["other-schema-create","OWNER_CREATE_OTHER_SCHEMA","OTHER_CREATE","mismatch_taxonomy"],
  ["membership","OWNER_MEMBERSHIP_OPTIONS","MEMBERSHIP","mismatch_taxonomy"],
  ["missing-metadata-relation","CASE WHEN relation_ref IS NULL THEN NULL ELSE","CASE WHEN false THEN NULL ELSE","optional_metadata_guard"],
  ["dynamic-injection","relation_ref),false,true", "client_input),false,true","catalog_resolved_dynamic_identity"],
  ["sensitive-output","s.mismatch_details,","s.mismatch_details, current_setting('secret'),","setting_notice_or_helper"],
  ["multiple-rows","s.mismatch_details,","s.mismatch_details, generate_series(1,101),","sanitized_bounded_output"],
  ["mutation-statement","COMMIT;","UPDATE fid.example SET x=1; COMMIT;","mutation_lock_role_or_generation"],
  ["rpc","COMMIT;","SELECT fid_execute_atomic_persistence_batch(); COMMIT;","rpc_invocation"],
]);
export const VALID_017C30_GOVERNANCE=Object.freeze({multipleCombinationsProduceFive:true,staticExactInferenceAllowed:false,
  setFalseExpected:true,createFalseExpected:true,setFalseCountedAsMismatch:false,createFalseCountedAsMismatch:false,
  authorizationConsumed:true,authorizationReusable:false,retryAuthorized:false,amendmentAuthorized:false,migration014Authorized:false});
export const FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_017C30_GOVERNANCE_SCENARIOS=Object.freeze([
  ["unique-combination-claim","multipleCombinationsProduceFive",false],["speculative-identities","staticExactInferenceAllowed",true],
  ["set-false-not-expected","setFalseExpected",false],["create-false-not-expected","createFalseExpected",false],
  ["set-false-counted","setFalseCountedAsMismatch",true],["create-false-counted","createFalseCountedAsMismatch",true],
  ["authorization-reuse","authorizationReusable",true],["retry-permission","retryAuthorized",true],
  ["amendment-permission","amendmentAuthorized",true],["migration-014-permission","migration014Authorized",true],
].map(([id,field,value])=>Object.freeze({id,context:Object.freeze({...VALID_017C30_GOVERNANCE,[field]:value}),expectedFailure:field})));
export default FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_017C30_RESULT_SCENARIOS;
