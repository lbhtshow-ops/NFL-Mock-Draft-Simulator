export const AUTHORITATIVE_017C37_FIELD_ORDER = Object.freeze([
  "result_identity", "result_version", "classification", "mismatch_count", "mismatch_details", "detail_count",
  "count_reconciled", "captured_preflight_mismatch_count", "captured_count_reconciled", "unresolved_details",
  "state_conflicts", "expected_before_set_state", "expected_before_create_state", "membership_evidence",
  "database_observed_target_evidence", "externally_authorized_target_binding", "database_evidence_complete",
  "external_target_attestation_required", "overall_target_verified", "read_only", "mutation_count",
]);

export const MANDATORY_017C38_ADDITIONS = Object.freeze([
  "mode", "metadata_storage_present", "migration_014_metadata_count", "evidence_complete",
]);

export const MANDATORY_017C38_EXTERNAL_RENAMES = Object.freeze({
  project_id: "project_reference",
  database_source: "dashboard_database_source",
});

export default Object.freeze({ AUTHORITATIVE_017C37_FIELD_ORDER, MANDATORY_017C38_ADDITIONS, MANDATORY_017C38_EXTERNAL_RENAMES });
