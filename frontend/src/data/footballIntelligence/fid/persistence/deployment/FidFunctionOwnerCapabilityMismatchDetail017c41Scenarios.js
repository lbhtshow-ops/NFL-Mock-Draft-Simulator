import { createValid017c40Result } from "./FidFunctionOwnerCapabilityMismatchDetail017c40Scenarios.js";

const base = () => {
  const row = createValid017c40Result();
  row.externally_authorized_target_binding = {
    authority_source: "CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_NON_PRODUCTION_TEST_TARGET_AUTHORIZATION@1.0.0",
    verification_boundary: "STAGE_1_OPERATOR_DASHBOARD_ATTESTATION", verification_status: "REQUIRED_NOT_DATABASE_OBSERVED",
    organization: "Lunch Break Hot Take", project_name: "LBHT FID Persistence Test", project_reference: "ahmorpzcaapvoymiqlkv",
    region: "us-east-1", branch: "main", dashboard_database_source: "Primary Database", governed_environment: "DEDICATED_NON_PRODUCTION_TEST",
  };
  return { completionCertain: true, sqlError: null, rows: [row] };
};
const scenario = (id, transform, classification, accepted = false) => Object.freeze({ id, input: transform(base()), classification, accepted });

export const RESULT_017C41_SCENARIOS = Object.freeze([
  scenario("complete-zero", (value) => value, "COMPLETE_RESULT_ZERO_MISMATCHES_EXTERNAL_ATTESTATION_STILL_REQUIRED", true),
  scenario("complete-mismatches", (value) => { const row = value.rows[0]; row.mismatch_count=1; row.detail_count=1; row.mismatch_details=[{ mismatch_ordinal:1 }]; row.count_reconciled=true; return value; }, "COMPLETE_RESULT_WITH_MISMATCH_DETAILS_REVIEW_REQUIRED", true),
  scenario("count-disagreement", (value) => { value.rows[0].detail_count=1; return value; }, "COUNT_DETAIL_DISAGREEMENT"),
  scenario("malformed-fields", (value) => { delete value.rows[0].mode; return value; }, "MALFORMED_25_FIELD_OUTPUT"),
  scenario("missing-attestation", (value) => { value.rows[0].external_target_attestation_required=false; return value; }, "MISSING_EXTERNAL_ATTESTATION_REQUIREMENT"),
  scenario("wrong-session", (value) => { value.rows[0].database_observed_target_evidence.current_user="anon"; return value; }, "INCORRECT_DATABASE_SESSION_EVIDENCE"),
  scenario("missing-metadata", (value) => { value.rows[0].metadata_storage_present=false; value.rows[0].evidence_complete=false; return value; }, "MISSING_METADATA_STORAGE"),
  scenario("migration-metadata", (value) => { value.rows[0].migration_014_metadata_count=1; return value; }, "NONZERO_MIGRATION_014_METADATA_COUNT"),
  scenario("incomplete-evidence", (value) => { value.rows[0].evidence_complete=false; return value; }, "INCOMPLETE_DATABASE_EVIDENCE"),
  scenario("wrong-target", (value) => { value.rows[0].externally_authorized_target_binding.region="us-west-1"; return value; }, "WRONG_TARGET_AUTHORIZATION_METADATA"),
  scenario("sql-error", (value) => ({ ...value, sqlError: { sqlstate:"XX000" } }), "SQL_ERROR"),
  scenario("zero-rows", (value) => ({ ...value, rows:[] }), "ZERO_VISIBLE_ROWS"),
  scenario("multiple-rows", (value) => ({ ...value, rows:[value.rows[0], value.rows[0]] }), "MULTIPLE_VISIBLE_ROWS"),
  scenario("uncertain", (value) => ({ ...value, completionCertain:false }), "UNKNOWN_OR_UNCERTAIN_COMPLETION"),
]);

export const STATIC_017C41_SCENARIOS = Object.freeze([
  "wrong_kind_table", "wrong_owner_table", "missing_table", "unsafe_oid_privilege_call", "acl_unit_drift",
  "ordinal_gap_or_duplicate", "fabricated_five_identities", "sensitive_output", "mutation", "uncontrolled_dynamic_sql",
]);

export default RESULT_017C41_SCENARIOS;
