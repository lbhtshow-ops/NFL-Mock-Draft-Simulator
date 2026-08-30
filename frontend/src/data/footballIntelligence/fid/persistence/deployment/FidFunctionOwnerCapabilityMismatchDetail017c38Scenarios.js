export const RESULT_CONTRACT_017C38_SCENARIOS = Object.freeze([
  Object.freeze({ id: "literal-request", removals: Object.freeze([]), solvable: false }),
  Object.freeze({ id: "invent-one-removal", removals: Object.freeze(["overall_target_verified"]), solvable: false }),
  Object.freeze({ id: "invent-two-removals", removals: Object.freeze(["overall_target_verified", "database_evidence_complete"]), solvable: false }),
  Object.freeze({ id: "invent-three-removals", removals: Object.freeze(["overall_target_verified", "database_evidence_complete", "captured_count_reconciled"]), solvable: false }),
]);

export const REQUIRED_CORRECTION_SCENARIOS_017C38 = Object.freeze([
  "valid_21_fields", "missing_mode", "wrong_mode", "missing_metadata_storage_present", "incorrect_metadata_storage_boolean",
  "missing_migration_014_metadata_count", "incorrect_migration_count", "missing_evidence_complete",
  "evidence_complete_true_with_unresolved_database_evidence", "external_metadata_affects_database_completeness",
  "missing_project_reference", "deprecated_project_id", "wrong_project_reference", "missing_dashboard_database_source",
  "deprecated_database_source", "wrong_dashboard_database_source", "wrong_order", "extra_field", "fewer_than_21",
  "more_than_21", "external_mislabeled_observed", "sql_only_target_verified", "count_detail_disagreement",
  "acl_unit_change", "mismatch_body_change", "mutating_sql",
]);

export default RESULT_CONTRACT_017C38_SCENARIOS;
