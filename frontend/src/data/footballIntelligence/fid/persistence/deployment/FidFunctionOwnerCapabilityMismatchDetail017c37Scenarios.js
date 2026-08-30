export const SPLIT_AUTHORITY_017C37_REVIEW_SCENARIOS = Object.freeze([
  "external_constant_self_comparison", "external_metadata_mislabeled_database_observed", "sql_role_as_project_identity",
  "database_name_as_project_identity", "project_reference_infers_region_or_organization", "dashboard_label_as_environment",
  "caller_external_fields", "javascript_only_target", "transaction_local_setting_as_evidence", "missing_external_attestation",
  "wrong_external_attestation", "correct_attestation_wrong_session_role", "correct_attestation_wrong_database_evidence",
  "correct_database_missing_attestation", "sql_only_overall_verified", "missing_role_or_schema", "missing_metadata_relation",
  "missing_wrong_kind_or_owner_table", "acl_or_grant_expansion", "unexpected_table_function_or_sequence",
  "count_detail_disagreement", "duplicate_or_missing_ordinal", "multiple_details_one_increment", "sensitive_output", "mutating_sql",
  "missing_mode", "missing_visible_metadata_evidence", "missing_evidence_complete", "external_contract_key_drift",
]);

export function evaluateRequiredVisibleContract017c37(fields = {}) {
  const failures = [];
  for (const name of ["mode", "metadata_storage_present", "migration_014_metadata_count", "evidence_complete"]) if (!(name in fields)) failures.push(`missing_${name}`);
  const external = fields.externally_authorized_target_binding ?? {};
  if (!("project_reference" in external)) failures.push("missing_project_reference");
  if (!("dashboard_database_source" in external)) failures.push("missing_dashboard_database_source");
  return Object.freeze({ accepted: failures.length === 0, failures: Object.freeze(failures) });
}

export default SPLIT_AUTHORITY_017C37_REVIEW_SCENARIOS;
