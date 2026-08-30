export const TARGET_EVIDENCE_017C36_NEGATIVE_SCENARIOS = Object.freeze([
  "constant_compared_with_itself", "javascript_only_input_not_received_by_sql", "caller_organization", "caller_project_name",
  "caller_region", "caller_project_id", "caller_environment", "same_sql_transaction_local_setting", "sql_role_as_project_identity",
  "database_name_as_project_identity", "missing_external_attestation", "wrong_external_attestation",
  "correct_attestation_wrong_sql_role", "correct_attestation_wrong_database_evidence", "hard_coded_external_metadata_mislabeled_observed",
  "dashboard_label_as_governed_environment", "undocumented_supabase_setting", "sensitive_catalog_or_connection_access",
  "target_mismatch_fully_verified", "mismatch_cardinality_or_acl_regression",
]);

export const SPLIT_AUTHORITY_COMBINATION_SCENARIOS_017C36 = Object.freeze([
  Object.freeze({ id: "missing-attestation", input: Object.freeze({ authorizationActive: false, authorizationExact: true, operatorDashboardConfirmed: true, databaseEvidenceComplete: true }), ready: false }),
  Object.freeze({ id: "wrong-attestation", input: Object.freeze({ authorizationActive: true, authorizationExact: false, operatorDashboardConfirmed: true, databaseEvidenceComplete: true }), ready: false }),
  Object.freeze({ id: "wrong-role", input: Object.freeze({ authorizationActive: true, authorizationExact: true, operatorDashboardConfirmed: true, databaseEvidenceComplete: false }), ready: false }),
  Object.freeze({ id: "operator-not-confirmed", input: Object.freeze({ authorizationActive: true, authorizationExact: true, operatorDashboardConfirmed: false, databaseEvidenceComplete: true }), ready: false }),
  Object.freeze({ id: "all-authorities-combined", input: Object.freeze({ authorizationActive: true, authorizationExact: true, operatorDashboardConfirmed: true, databaseEvidenceComplete: true }), ready: true }),
]);
