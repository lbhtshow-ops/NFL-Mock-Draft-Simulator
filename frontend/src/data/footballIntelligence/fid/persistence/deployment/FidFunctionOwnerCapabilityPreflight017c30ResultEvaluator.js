import { RESULT_COLUMNS_017C30_CAPTURE } from "./FidFunctionOwnerCapabilityPreflight017c30ExecutionResult.js";
const expected = Object.freeze({ result_identity: "FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_VISIBLE_RESULT", result_version: "17C.27.1",
  mode: "PREFLIGHT", classification: "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_INCONSISTENT_RECOVERY_REQUIRED",
  mismatch_count: 5, set_state: false, create_state: false, metadata_storage_present: true,
  migration_014_metadata_count: 0, evidence_complete: true, read_only: true, mutation_count: 0,
  project_id: "ahmorpzcaapvoymiqlkv", database: "Primary Database", branch: "main", sql_role: "postgres" });
export function evaluateCapturedPreflight017c30(record) {
  const failures=[];
  for(const [field,value] of Object.entries(expected)) if(record?.row?.[field]!==value) failures.push(field);
  if(JSON.stringify(Object.keys(record?.row??{}))!==JSON.stringify(RESULT_COLUMNS_017C30_CAPTURE)) failures.push("column_order");
  for(const field of ["authorizationConsumed","recoveryGovernanceReviewRequired"]) if(record?.[field]!==true) failures.push(field);
  for(const field of ["retryPermitted","databaseMutation","amendmentExecuted","migration014Executed","rpcInvoked","aclPreflightPassed","aclPreflightFailedConclusively"]) if(record?.[field]!==false) failures.push(field);
  if(record?.visibleResultRows!==1) failures.push("visibleResultRows");
  if(record?.sqlError!==null || record?.sqlstate!==null) failures.push("sqlError");
  return Object.freeze({ accepted: failures.length===0, failures:Object.freeze([...new Set(failures)]) });
}
export function evaluateMismatchGovernance017c30(context) {
  const failures=[];
  for(const field of ["multipleCombinationsProduceFive","setFalseExpected","createFalseExpected","authorizationConsumed"])
    if(context?.[field]!==true) failures.push(field);
  for(const field of ["staticExactInferenceAllowed","setFalseCountedAsMismatch","createFalseCountedAsMismatch","authorizationReusable",
    "retryAuthorized","amendmentAuthorized","migration014Authorized"]) if(context?.[field]!==false) failures.push(field);
  return Object.freeze({accepted:failures.length===0,failures:Object.freeze(failures)});
}
export default evaluateCapturedPreflight017c30;
