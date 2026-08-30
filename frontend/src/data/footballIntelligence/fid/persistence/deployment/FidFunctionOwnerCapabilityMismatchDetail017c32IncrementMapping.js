const unit=(incrementUnitId,governedCheck,triggerCondition,skipBehavior,detailIdentifier,expectedCardinality,subordinateAclChecksExecute,unresolvedPrerequisites,governingAclMatrixUnits)=>Object.freeze({incrementUnitId,governedCheck,triggerCondition,skipBehavior,detailIdentifier,expectedCardinality,subordinateAclChecksExecute,unresolvedPrerequisites:Object.freeze(unresolvedPrerequisites),governingAclMatrixUnits});
export const FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_017C32_INCREMENT_MAPPING=Object.freeze([
  unit("EXECUTION_IDENTITY","current and session role","role is not postgres","none","ROLE_EXECUTION_IDENTITY",1,false,["postgres role"],0),
  unit("OWNER_ATTRIBUTES","restricted owner attributes","any prohibited attribute true","none","OWNER_RESTRICTED_ATTRIBUTES",1,false,["fid_function_owner"],0),
  unit("MEMBERSHIP_SHAPE","exact MEMBER/ADMIN/INHERIT membership shape","row count !=1 or ADMIN false or INHERIT true","none","OWNER_MEMBERSHIP_SHAPE",1,false,["fid_function_owner","postgres"],0),
  unit("FID_SCHEMA_CONTROL","postgres schema ownership/control","neither owner nor grantable CREATE","none","FID_SCHEMA_CONTROL",1,false,["fid schema","postgres"],0),
  unit("SCHEMA_ACL","principal x privilege schema unit","direct/effective/option differs","none","SCHEMA_{principal}_{privilege}",10,false,["fid schema","five principals"],10),
  unit("OTHER_SCHEMA_CREATE","owner CREATE outside allowlist","effective CREATE exists","none","OWNER_CREATE_OTHER_SCHEMA",1,false,["fid_function_owner"],0),
  unit("TABLE_INVENTORY","exact seven ordinary tables only","inventory predicate differs","none","FID_TABLE_INVENTORY",1,false,["fid schema"],1),
  unit("TABLE_PREREQUISITE","table existence, kind, and postgres owner","table absent/wrong kind/wrong owner","skip all ACL units for that table","TABLE_{table}_PREREQUISITE",7,false,["fid schema","postgres"],0),
  unit("TABLE_ACL","table x principal x privilege unit","direct/effective/option differs","only after table prerequisite passes","TABLE_{table}_{principal}_{privilege}",245,true,["resolved table OID","five principals"],245),
  unit("SEQUENCE_INVENTORY","exact zero sequences","any fid sequence exists","none","FID_SEQUENCE_INVENTORY",1,false,["fid schema"],0),
  unit("FUNCTION_INVENTORY","exact one function","function count differs","none","FID_FUNCTION_INVENTORY",1,false,["fid schema"],0),
  unit("FUNCTION_SECURITY","governed function owner/security config","predicate differs","none","GOVERNED_FUNCTION_SECURITY",1,false,["governed function OID","fid_function_owner"],0),
  unit("UNEXPECTED_ISSUANCE_FUNCTION","issuance function absent","function exists","none","UNEXPECTED_ISSUANCE_FUNCTION",1,false,["fid schema"],0),
  unit("FUNCTION_ACL","principal EXECUTE unit","direct/effective/option differs","only after function identity resolves","FUNCTION_EXECUTE_{principal}",5,true,["governed function OID","five principals"],5),
  unit("ROLLBACK_STATE","migration metadata and issuance objects composite","any composite predicate differs","one composite detail","MIGRATION_014_ROLLBACK_STATE",1,false,["metadata relation"],0),
]);
export const ACL_MATRIX_OBJECT_BOUND_UNITS_017C32=260;
export const ACL_MATRIX_INVENTORY_INVARIANTS_017C32=1;
export default FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_017C32_INCREMENT_MAPPING;
