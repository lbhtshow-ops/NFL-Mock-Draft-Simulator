import contract from "./FidFunctionOwnerCapabilityMismatchDetail017c39Contract.js";

export function createValid017c40Result() {
  const values = {
    result_identity: "SPLIT_AUTHORITY_25_FIELD_FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_RESULT", result_version: "17C.40.1",
    mode: "MISMATCH_DETAIL_DIAGNOSTIC", classification: "NO_MISMATCHES_EXTERNAL_TARGET_ATTESTATION_REQUIRED",
    mismatch_count: 0, mismatch_details: [], detail_count: 0, count_reconciled: true,
    captured_preflight_mismatch_count: 5, captured_count_reconciled: false, unresolved_details: [], state_conflicts: [],
    expected_before_set_state: false, expected_before_create_state: false, membership_evidence: {},
    metadata_storage_present: true, migration_014_metadata_count: 0, evidence_complete: true,
    database_observed_target_evidence: { database_name: "postgres", current_user: "postgres", session_user: "postgres" },
    externally_authorized_target_binding: { verification_status: "REQUIRED_NOT_DATABASE_OBSERVED", project_reference: "ahmorpzcaapvoymiqlkv", dashboard_database_source: "Primary Database" },
    database_evidence_complete: true, external_target_attestation_required: true, overall_target_verified: false,
    read_only: true, mutation_count: 0,
  };
  return Object.fromEntries(contract.orderedFields.map((field) => [field, values[field]]));
}

const mutate = (id, transform, failure, observed = {}) => Object.freeze({ id, transform, failure, observed: Object.freeze(observed) });
export const RESULT_017C40_SCENARIOS = Object.freeze([
  Object.freeze({ id: "exact-valid-25", transform: (value) => value, failure: null, observed: Object.freeze({}) }),
  mutate("historical-21", (value) => Object.fromEntries(Object.entries(value).filter(([,], i) => ![2, 15, 16, 17].includes(i))), "top_level_contract"),
  mutate("missing-mode", (value) => { const { mode: _, ...rest } = value; return rest; }, "top_level_contract"),
  mutate("wrong-mode", (value) => ({ ...value, mode: "PREFLIGHT" }), "mode"),
  mutate("missing-metadata-storage", (value) => { const { metadata_storage_present: _, ...rest } = value; return rest; }, "top_level_contract"),
  mutate("missing-migration-count", (value) => { const { migration_014_metadata_count: _, ...rest } = value; return rest; }, "top_level_contract"),
  mutate("missing-evidence-complete", (value) => { const { evidence_complete: _, ...rest } = value; return rest; }, "top_level_contract"),
  mutate("wrong-order", (value) => Object.fromEntries(Object.entries(value).reverse()), "top_level_contract"),
  mutate("extra-field", (value) => ({ ...value, extra: true }), "top_level_contract"),
  mutate("duplicate-field-contract", (value) => Object.fromEntries([...Object.entries(value).slice(0, -1), ["read_only", true]]), "top_level_contract"),
  mutate("deprecated-project-id", (value) => ({ ...value, externally_authorized_target_binding: { ...value.externally_authorized_target_binding, project_id: "ahmorpzcaapvoymiqlkv" } }), "deprecated_project_id"),
  mutate("deprecated-database-source", (value) => ({ ...value, externally_authorized_target_binding: { ...value.externally_authorized_target_binding, database_source: "Primary Database" } }), "deprecated_database_source"),
  mutate("missing-project-reference", (value) => { const { project_reference: _, ...external } = value.externally_authorized_target_binding; return { ...value, externally_authorized_target_binding: external }; }, "project_reference"),
  mutate("missing-dashboard-source", (value) => { const { dashboard_database_source: _, ...external } = value.externally_authorized_target_binding; return { ...value, externally_authorized_target_binding: external }; }, "dashboard_database_source"),
  mutate("external-mislabeled-observed", (value) => ({ ...value, externally_authorized_target_binding: { ...value.externally_authorized_target_binding, verification_status: "DATABASE_OBSERVED" } }), "external_authority_label"),
  mutate("complete-with-unresolved", (value) => value, "evidence_complete_with_unresolved_database_evidence", { requiredDatabaseEvidenceComplete: false }),
  mutate("external-only-complete", (value) => value, "external_metadata_completeness", { externalMetadataOnly: true }),
  mutate("sql-only-verified", (value) => ({ ...value, overall_target_verified: true }), "sql_only_target_verification"),
  mutate("missing-external-attestation", (value) => ({ ...value, external_target_attestation_required: false }), "external_attestation_required"),
  mutate("missing-optional-metadata", (value) => ({ ...value, metadata_storage_present: false, evidence_complete: false }), null),
  mutate("nonzero-migration-count", (value) => ({ ...value, migration_014_metadata_count: 1 }), null),
  mutate("count-detail-disagreement", (value) => ({ ...value, detail_count: 1 }), "count_detail_reconciliation"),
  mutate("mutation-count", (value) => ({ ...value, mutation_count: 1 }), "read_only_contract"),
]);

export const STATIC_017C40_SCENARIOS = Object.freeze([
  "missing_governed_role_or_schema", "missing_wrong_kind_or_wrongly_owned_table", "acl_unit_loss_or_expansion",
  "sensitive_output_exposure", "mutating_sql", "unrelated_mismatch_logic_change",
]);

export default RESULT_017C40_SCENARIOS;
