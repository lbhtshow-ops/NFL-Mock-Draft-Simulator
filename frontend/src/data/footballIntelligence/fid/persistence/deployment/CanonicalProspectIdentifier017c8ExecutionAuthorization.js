import declaration from "./CanonicalProspectIdentifier017c8StaticReviewDeclaration.js";

export const CANONICAL_PROSPECT_IDENTIFIER_017C8_EXECUTION_AUTHORIZATION=Object.freeze({
  authorizationId:"CANONICAL_PROSPECT_IDENTIFIER_017C8_EXECUTION_AUTHORIZATION",
  authorizationVersion:"1.0.0",
  status:"AUTHORIZED_FOR_ONE_MANUAL_READ_ONLY_EXECUTION",
  declarationReference:`${declaration.declarationId}@${declaration.declarationVersion}`,
  target:declaration.exactTarget,
  artifact:declaration.artifact,
  scope:Object.freeze({executionCount:1,interface:"SUPABASE_DASHBOARD_SQL_EDITOR",purpose:"READ_ONLY_FUNCTION_OWNER_CAPABILITY_INSPECTION",completeSanitizedResultCaptureRequired:true,mandatoryStopAfterExecution:true}),
  prohibited:Object.freeze({execute017c6:true,execute017c7:true,executeMigration014:true,modifyMigration014:true,createMigration015:true,roleOrMembershipChange:true,grantOrRevoke:true,setRole:true,rpcInvocation:true,uuidOrCandidateGeneration:true,persistenceActivity:true,interactiveRepair:true}),
  consumed:false,
  requiredNextAction:"MANUALLY_EXECUTE_EXACT_017C8_ONCE_RETURN_EVERY_SANITIZED_RESULT_SET_AND_STOP",
});

export default CANONICAL_PROSPECT_IDENTIFIER_017C8_EXECUTION_AUTHORIZATION;
