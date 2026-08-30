export const CANONICAL_PROSPECT_IDENTIFIER_017C8_STATIC_REVIEW_DECLARATION=Object.freeze({
  declarationId:"CANONICAL_PROSPECT_IDENTIFIER_017C8_STATIC_REVIEW_DECLARATION",
  declarationVersion:"1.0.0",
  status:"READY_FOR_CONTROLLED_017C8_READ_ONLY_PREFLIGHT_EXECUTION",
  exactTarget:Object.freeze({projectId:"ahmorpzcaapvoymiqlkv",database:"PRIMARY_DATABASE",sqlEditorRole:"postgres",currentUser:"postgres",sessionUser:"postgres",postgresqlVersion:"17.6",governedEnvironment:"DEDICATED_NON_PRODUCTION_TEST"}),
  authoritativeState:Object.freeze({migration014State:"MIGRATION_014_FULLY_ROLLED_BACK",migration014Applied:false,migration015Absent:true,stage1Valid:true}),
  artifact:Object.freeze({path:"src/data/footballIntelligence/fid/persistence/deployment/review/017c8_supabase_function_owner_deployment_capability_read_only_preflight_distinct_order_correction.sql",sha256:"5131801D2DFDCDBE04504BD0414272B66329E620EBBCEB1557F6FE8336105495",readOnly:true,sanitized:true,executed:false}),
  protected:Object.freeze({preflight017c7Sha256:"BC96C898B17BB9C55B34991E6CB164C2AB038BD16B1DDC45BC4B2F12D939FD57",migration014Sha256:"18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD",reconciliation017c5Sha256:"EF3F45440082D9558A6CCF60F9F91F1017D0EC8E3EC0338C37FCEB6DC4742AA7"}),
  findings:Object.freeze({intendedDeltaOnly:true,wholeFilePostgresql17Compatible:true,distinctOrderingCompatible:true,compoundOrderingCompatible:true,aliasScopeValid:true,readOnlySafe:true,identityBindingComplete:true,capabilityCoverageComplete:true,sanitizationPassed:true,remainingDefects:Object.freeze([])}),
  effects:Object.freeze({sqlExecutedDuringReview:false,supabaseConnections:0,databaseOperations:0,roleChanges:0,rpcInvocations:0}),
});

export default CANONICAL_PROSPECT_IDENTIFIER_017C8_STATIC_REVIEW_DECLARATION;
