export const FID_ATOMIC_FUNCTION_ACL_TRANSACTION_LOCAL_DIAGNOSTIC_017C60_EXECUTION_RECORD=Object.freeze({
  recordId:"FID_ATOMIC_FUNCTION_ACL_TRANSACTION_LOCAL_ROLLBACK_DIAGNOSTIC_EXECUTION_RECORD_017C61_V1",
  immutable:true,
  target:Object.freeze({organization:"Lunch Break Hot Take",project:"LBHT FID Persistence Test",projectReference:"ahmorpzcaapvoymiqlkv",region:"us-east-1",branch:"main",databaseSource:"Primary Database",sqlRole:"postgres",environment:"DEDICATED_NON_PRODUCTION_TEST"}),
  authorization:Object.freeze({authorizationId:"FID_ATOMIC_FUNCTION_ACL_TRANSACTION_LOCAL_ROLLBACK_DIAGNOSTIC_ONE_EXECUTION_017C60_V1",lifecycle:"CONSUMED_PERMANENTLY_NON_REUSABLE",attemptCount:1,executionCount:1,retryPermitted:false,dashboardRetryPermitted:false}),
  artifact:Object.freeze({filename:"017c60a_fid_atomic_function_acl_transaction_local_rollback_diagnostic.sql",sha256:"41F6C2F40E4F42E38DE7A1FF784B8644BB7E8ABE57D4FA8DE09E1782535CA759"}),
  result:Object.freeze({visibleRowCount:1,sqlstateErrorShown:false,explicitRollbackReached:true,commitStatementPresent:false,persistentMutationAuthorized:false,classification:"FID_ATOMIC_FUNCTION_ACL_TRANSACTION_LOCAL_DIAGNOSTIC_DIRECT_ACL_MUTATION_FAILURE",failedAfterStatePredicateCount:5,failedAfterStatePredicates:Object.freeze(["after_public_direct_execute_absent","after_service_direct_execute_present","after_public_effective_execute_absent","after_anon_effective_execute_absent","after_authenticated_effective_execute_absent"]),directAcl:Object.freeze({public:1,owner:1,serviceRole:0,anon:0,authenticated:0,total:2,grantable:0}),effectiveExecute:Object.freeze({public:true,owner:true,serviceRole:true,anon:true,authenticated:true})}),
  safety:Object.freeze({beforeStateExact:true,functionPropertiesUnchanged:true,ownerRoleAttributesUnchanged:true,migration014Unchanged:true,evidenceComplete:true,transactionLocalDiagnostic:true,persistentChangeAuthorized:false,commitStatementPresent:false,explicitRollbackPresent:true,rollbackRequired:true,intendedAclStatementsReportedExecutedTransactionLocally:true,resultEmittedBeforeRollback:true,persistentMutationCountExpected:0,remediationSuccessEstablished:false,finalAclPolicyEstablished:false,externalTargetAttestationRequired:true,postgresObservedExternalTargetValues:false,overallTargetVerified:false}),
  currentDatabaseStateAfterRollback:"NOT_INDEPENDENTLY_REVERIFIED_DURING_17C61",
  rollbackExpectationNotTreatedAsPersistentStateEvidence:true,
  remediationSuccessEstablished:false,
  finalAclPolicyEstablished:false,
  sqlExecutedByThisRecord:false,
  databaseConnectedByThisRecord:false,
});
export default FID_ATOMIC_FUNCTION_ACL_TRANSACTION_LOCAL_DIAGNOSTIC_017C60_EXECUTION_RECORD;
