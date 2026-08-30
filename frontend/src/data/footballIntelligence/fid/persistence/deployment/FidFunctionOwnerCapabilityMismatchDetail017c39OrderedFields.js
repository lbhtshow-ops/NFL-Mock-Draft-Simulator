export const HISTORICAL_21_FIELD_ORDER_017C37 = Object.freeze([
  "result_identity", "result_version", "classification", "mismatch_count", "mismatch_details", "detail_count",
  "count_reconciled", "captured_preflight_mismatch_count", "captured_count_reconciled", "unresolved_details",
  "state_conflicts", "expected_before_set_state", "expected_before_create_state", "membership_evidence",
  "database_observed_target_evidence", "externally_authorized_target_binding", "database_evidence_complete",
  "external_target_attestation_required", "overall_target_verified", "read_only", "mutation_count",
]);

const insertAfter = (fields, anchor, additions) => {
  const index = fields.indexOf(anchor);
  return [...fields.slice(0, index + 1), ...additions, ...fields.slice(index + 1)];
};
const withMode = insertAfter(HISTORICAL_21_FIELD_ORDER_017C37, "result_version", ["mode"]);
const databaseEvidenceIndex = withMode.indexOf("database_observed_target_evidence");

export const AUTHORITATIVE_25_FIELD_ORDER_017C39 = Object.freeze([
  ...withMode.slice(0, databaseEvidenceIndex),
  "metadata_storage_present", "migration_014_metadata_count", "evidence_complete",
  ...withMode.slice(databaseEvidenceIndex),
]);

export default AUTHORITATIVE_25_FIELD_ORDER_017C39;
