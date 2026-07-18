export const SUPABASE_TEST_DEPLOYMENT_CONTRACT = "SupabaseTestSchemaDeploymentPackage";
export const SUPABASE_TEST_DEPLOYMENT_VERSION = "FID-SUPABASE-TEST-DEPLOYMENT-1.0.1";
export const SUPABASE_TEST_DEPLOYMENT_FREEZE = "FID_PERSISTENCE_SPECIFICATION_FREEZE_V2";
export const SUPABASE_TEST_DEPLOYMENT_SCHEMA_VERSION = "FID-SUPABASE-SCHEMA-V1";
export const SUPABASE_TEST_DEPLOYMENT_RESTRICTIONS = Object.freeze(["TEST_ONLY", "PRODUCTION_PROHIBITED", "MANUAL_REVIEW_REQUIRED", "EXECUTION_NOT_APPROVED", "NO_SQL_EXECUTION", "NO_NETWORK", "NO_CLIENT", "NO_RUNTIME", "NO_ADAPTER", "NO_REPOSITORY_EFFECT"]);
const unit = (migrationId, sequence, filename, dependencies, purpose, rollbackClassification) => Object.freeze({ migrationId, sequence, filename, dependencies: Object.freeze(dependencies), purpose, rollbackClassification, fileReference: `./sql/${filename}` });
export const SUPABASE_TEST_MIGRATION_INVENTORY = Object.freeze([
  unit("fid-001-schema",1,"001_create_fid_schema.sql",[],"schema:fid","STRUCTURALLY_REVERSIBLE_DATA_PRESERVING"),
  unit("fid-002-schema-version",2,"002_create_fid_schema_version_storage.sql",["fid-001-schema"],"table:fid_persistence_migrations","STRUCTURALLY_REVERSIBLE_DATA_PRESERVING"),
  unit("fid-003-canonical-table",3,"003_create_fid_canonical_table.sql",["fid-001-schema"],"table:fid_record_revisions","DESTRUCTIVE_ROLLBACK_PROHIBITED"),
  unit("fid-004-auxiliary-tables",4,"004_create_fid_auxiliary_tables.sql",["fid-002-schema-version","fid-003-canonical-table"],"five operational tables","STRUCTURALLY_REVERSIBLE_DATA_PRESERVING"),
  unit("fid-005-relationships",5,"005_define_fid_relationship_projection.sql",["fid-003-canonical-table"],"projection:relationship","STRUCTURALLY_REVERSIBLE_DATA_PRESERVING"),
  unit("fid-006-constraints",6,"006_apply_fid_constraints.sql",["fid-004-auxiliary-tables","fid-005-relationships"],"constraints:fid","STRUCTURALLY_REVERSIBLE_DATA_PRESERVING"),
  unit("fid-007-indexes",7,"007_create_fid_indexes.sql",["fid-006-constraints"],"indexes:fid","STRUCTURALLY_REVERSIBLE_DATA_PRESERVING"),
  unit("fid-008-atomic-function",8,"008_create_fid_atomic_persistence_function.sql",["fid-007-indexes"],"function:fid.fid_execute_atomic_persistence_batch","FORWARD_FIX_REQUIRED"),
  unit("fid-009-rls",9,"009_enable_fid_rls.sql",["fid-004-auxiliary-tables"],"rls:fid","FORWARD_FIX_REQUIRED"),
  unit("fid-010-policies",10,"010_create_fid_policies.sql",["fid-009-rls"],"policies:fid","FORWARD_FIX_REQUIRED"),
  unit("fid-011-privileges",11,"011_apply_fid_privileges.sql",["fid-008-atomic-function","fid-010-policies"],"privileges:fid","FORWARD_FIX_REQUIRED"),
  unit("fid-012-verification",12,"012_define_fid_verification.sql",["fid-011-privileges"],"verification:fid","FORWARD_FIX_REQUIRED"),
  unit("013_record_fid_deployment_metadata",13,"013_record_fid_deployment_metadata.sql",["fid-012-verification"],"metadata:fid.fid_persistence_migrations","FORWARD_FIX_REQUIRED")
]);
export const SUPABASE_TEST_TABLES = Object.freeze(["fid_record_revisions","fid_persistence_idempotency","fid_persistence_batches","fid_persistence_batch_operations","fid_persistence_effect_receipts","fid_persistence_audit_events","fid_persistence_migrations"]);
export const SUPABASE_TEST_FUNCTION_OWNER_POLICIES = Object.freeze(["fid_record_revisions_fid_function_owner_select_allow","fid_record_revisions_fid_function_owner_insert_allow","fid_persistence_idempotency_fid_function_owner_select_allow","fid_persistence_idempotency_fid_function_owner_insert_allow","fid_persistence_idempotency_fid_function_owner_update_allow","fid_persistence_batches_fid_function_owner_select_allow","fid_persistence_batches_fid_function_owner_insert_allow","fid_persistence_batches_fid_function_owner_update_allow","fid_persistence_batch_operations_fid_function_owner_select_allow","fid_persistence_batch_operations_fid_function_owner_insert_allow","fid_persistence_batch_operations_fid_function_owner_update_allow","fid_persistence_effect_receipts_fid_function_owner_select_allow","fid_persistence_effect_receipts_fid_function_owner_insert_allow","fid_persistence_audit_events_fid_function_owner_select_allow","fid_persistence_audit_events_fid_function_owner_insert_allow"]);
export default Object.freeze({ SUPABASE_TEST_DEPLOYMENT_CONTRACT, SUPABASE_TEST_DEPLOYMENT_VERSION, SUPABASE_TEST_DEPLOYMENT_FREEZE, SUPABASE_TEST_DEPLOYMENT_SCHEMA_VERSION, SUPABASE_TEST_DEPLOYMENT_RESTRICTIONS, SUPABASE_TEST_MIGRATION_INVENTORY, SUPABASE_TEST_TABLES, SUPABASE_TEST_FUNCTION_OWNER_POLICIES });
