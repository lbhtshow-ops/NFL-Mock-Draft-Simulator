const scenario=(name,mode,mutate,expected)=>Object.freeze({name,mode,mutate,expected});
export const FID_ATOMIC_FUNCTION_ACL_COMPANION_017C46_STATIC_SCENARIOS=Object.freeze([
  scenario("static-metadata-regression","preflight",(sql)=>sql.replace("SELECT r.* FROM","SELECT * FROM fid.fid_persistence_migrations;\nSELECT r.* FROM"),"preflight:static_metadata_reference"),
  scenario("missing-effective-evidence","reconciliation",(sql)=>sql.replaceAll("effective_service","removed_service_effective"),"reconciliation:missing:effective_service"),
  scenario("hardcoded-owner-authority","postVerification",(sql)=>sql.replace("owner_derived:=owner_match IS TRUE AND effective_owner IS TRUE","owner_derived:=true"),"postVerification:missing:owner_derived:=owner_match IS TRUE AND effective_owner IS TRUE"),
  scenario("missing-already-applied","preflight",(sql)=>sql.replace("FID_ATOMIC_FUNCTION_ACL_REMEDIATION_ALREADY_APPLIED","REMOVED_ALREADY_APPLIED"),"preflight:states"),
  scenario("multiple-visible-rows","preflight",(sql)=>sql.replace("COMMIT;","SELECT r.* FROM pg_catalog.jsonb_to_record('{}'::jsonb) AS r(x text);\nCOMMIT;"),"preflight:visible_row"),
  scenario("mutation-regression","reconciliation",(sql)=>sql.replace("COMMIT;","UPDATE fid.forbidden SET x=1;\nCOMMIT;"),"reconciliation:mutation_or_lock"),
  scenario("locking-read-regression","postVerification",(sql)=>sql.replace("COMMIT;","SELECT 1 FOR UPDATE;\nCOMMIT;"),"postVerification:mutation_or_lock"),
  scenario("sensitive-output-regression","preflight",(sql)=>sql.replace("mutation_count integer","mutation_count integer,prosrc text"),"preflight:sensitive_output"),
]);
export default FID_ATOMIC_FUNCTION_ACL_COMPANION_017C46_STATIC_SCENARIOS;
