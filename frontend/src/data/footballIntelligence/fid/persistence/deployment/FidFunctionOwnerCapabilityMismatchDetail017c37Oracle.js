const strip = (sql) => sql.replace(/--.*$/gm, "").replace(/'(?:''|[^'])*'/g, "''");

export const RESULT_FIELD_ORDER_017C36 = Object.freeze([
  "result_identity", "result_version", "classification", "mismatch_count", "mismatch_details", "detail_count",
  "count_reconciled", "captured_preflight_mismatch_count", "captured_count_reconciled", "unresolved_details",
  "state_conflicts", "expected_before_set_state", "expected_before_create_state", "membership_evidence",
  "database_observed_target_evidence", "externally_authorized_target_binding", "database_evidence_complete",
  "external_target_attestation_required", "overall_target_verified", "read_only", "mutation_count",
]);

export function independentlyReviewSplitAuthority017c37(sql) {
  const failures = [];
  if (!/current_database\(\)::text database_name,CURRENT_USER::text current_user_name,\s*SESSION_USER::text session_user_name/i.test(sql)) failures.push("database_session_evidence_source_failure");
  if (!/database_observed_target_evidence/i.test(sql) || !/externally_authorized_target_binding/i.test(sql)) failures.push("authority_objects_not_separated");
  if (!/REQUIRED_NOT_DATABASE_OBSERVED/i.test(sql) || !/true external_target_attestation_required,false overall_target_verified/i.test(sql)) failures.push("external_attestation_boundary_failure");
  if (/target_binding AS[\s\S]*FROM constants/i.test(sql)) failures.push("self_validating_target_binding");
  if (!/\bmode\b/i.test(sql.slice(sql.lastIndexOf("\nSELECT ")))) failures.push("missing_result_mode");
  if (!/metadata_storage_present/i.test(sql.slice(sql.lastIndexOf("\nSELECT ")))) failures.push("missing_visible_metadata_storage_evidence");
  if (!/migration_014_metadata_count/i.test(sql.slice(sql.lastIndexOf("\nSELECT ")))) failures.push("missing_visible_migration_014_metadata_evidence");
  if (!/\bevidence_complete\b/i.test(sql.slice(sql.lastIndexOf("\nSELECT ")))) failures.push("missing_result_evidence_complete");
  const externalObject = sql.match(/jsonb_build_object\('authority_source','CANONICAL_PROSPECT_IDENTIFIER[\s\S]*?\) externally_authorized_target_binding/i)?.[0] ?? "";
  if (!/'project_reference',c\.project_id/i.test(externalObject)) failures.push("missing_external_project_reference_key");
  if (!/'dashboard_database_source',c\.database_source/i.test(externalObject)) failures.push("missing_external_dashboard_database_source_key");
  if (/'project_id',c\.project_id/i.test(externalObject)) failures.push("noncontract_external_project_id_key");
  if (/'database_source',c\.database_source/i.test(externalObject)) failures.push("noncontract_external_database_source_key");
  if (!/count\(\*\)::integer mismatch_count[\s\S]*jsonb_array_length\(s\.mismatch_details\) detail_count/i.test(sql)) failures.push("count_detail_reconciliation_missing");
  if (!/FROM tables WHERE complete AND NOT acl_ready/i.test(sql) || !/FROM table_acl WHERE complete AND acl_ready AND/i.test(sql)) failures.push("table_prerequisite_skip_regression");
  if (!/BEGIN TRANSACTION READ ONLY/i.test(sql) || !/\bCOMMIT;/i.test(sql)) failures.push("read_only_transaction_missing");
  if (/\b(?:INSERT|UPDATE|DELETE|MERGE|TRUNCATE|CREATE|ALTER|DROP|GRANT|REVOKE|SET\s+ROLE|pg_advisory\w*|gen_random_uuid|uuid_generate\w*)\b/i.test(strip(sql))) failures.push("mutating_or_operational_sql");
  return Object.freeze({ passed: failures.length === 0, correctionRequired: failures.length > 0, failures: Object.freeze([...new Set(failures)]) });
}

export default independentlyReviewSplitAuthority017c37;
