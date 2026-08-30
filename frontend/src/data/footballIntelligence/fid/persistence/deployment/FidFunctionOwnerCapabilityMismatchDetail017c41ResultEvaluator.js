import contract from "./FidFunctionOwnerCapabilityMismatchDetail017c39Contract.js";

const exactExternal = Object.freeze({ authority_source: "CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_NON_PRODUCTION_TEST_TARGET_AUTHORIZATION@1.0.0",
  verification_boundary: "STAGE_1_OPERATOR_DASHBOARD_ATTESTATION", organization: "Lunch Break Hot Take", project_name: "LBHT FID Persistence Test",
  project_reference: "ahmorpzcaapvoymiqlkv", region: "us-east-1", branch: "main",
  dashboard_database_source: "Primary Database", governed_environment: "DEDICATED_NON_PRODUCTION_TEST" });

const outcome = (classification, accepted, blockers = []) => Object.freeze({ classification, accepted,
  repairAuthorized: false, amendmentAuthorized: false, migration014Authorized: false, retryAuthorized: false,
  blockers: Object.freeze(blockers) });

export function evaluateFuture017c41Result(input = {}) {
  if (input.completionCertain !== true) return outcome("UNKNOWN_OR_UNCERTAIN_COMPLETION", false, ["CERTAIN_COMPLETION_REQUIRED"]);
  if (input.sqlError) return outcome("SQL_ERROR", false, ["SQL_ERROR_REQUIRES_STOP"]);
  if (!Array.isArray(input.rows)) return outcome("MALFORMED_RESULT_CONTAINER", false, ["ROWS_ARRAY_REQUIRED"]);
  if (input.rows.length === 0) return outcome("ZERO_VISIBLE_ROWS", false, ["EXACTLY_ONE_ROW_REQUIRED"]);
  if (input.rows.length !== 1) return outcome("MULTIPLE_VISIBLE_ROWS", false, ["EXACTLY_ONE_ROW_REQUIRED"]);
  const row = input.rows[0] ?? {};
  if (JSON.stringify(Object.keys(row)) !== JSON.stringify(contract.orderedFields)) return outcome("MALFORMED_25_FIELD_OUTPUT", false, ["EXACT_25_FIELD_CONTRACT_REQUIRED"]);
  if (row.mode !== "MISMATCH_DETAIL_DIAGNOSTIC" || row.read_only !== true || row.mutation_count !== 0) return outcome("MALFORMED_25_FIELD_OUTPUT", false, ["IDENTITY_OR_READ_ONLY_CONTRACT_FAILED"]);
  if (!Array.isArray(row.mismatch_details) || row.mismatch_count !== row.detail_count || row.detail_count !== row.mismatch_details.length || row.count_reconciled !== true) return outcome("COUNT_DETAIL_DISAGREEMENT", false, ["COUNT_DETAIL_RECONCILIATION_REQUIRED"]);
  if (row.external_target_attestation_required !== true || row.overall_target_verified !== false) return outcome("MISSING_EXTERNAL_ATTESTATION_REQUIREMENT", false, ["SPLIT_AUTHORITY_FLAGS_REQUIRED"]);
  const observed = row.database_observed_target_evidence ?? {};
  if (observed.database_name !== "postgres" || observed.current_user !== "postgres" || observed.session_user !== "postgres" || row.database_evidence_complete !== true) return outcome("INCORRECT_DATABASE_SESSION_EVIDENCE", false, ["EXPECTED_DATABASE_SESSION_EVIDENCE_REQUIRED"]);
  if (row.metadata_storage_present !== true) return outcome("MISSING_METADATA_STORAGE", false, ["METADATA_STORAGE_REQUIRED_FOR_COMPLETE_RESULT"]);
  if (row.migration_014_metadata_count !== 0) return outcome("NONZERO_MIGRATION_014_METADATA_COUNT", false, ["ROLLED_BACK_METADATA_COUNT_ZERO_REQUIRED"]);
  if (row.evidence_complete !== true) return outcome("INCOMPLETE_DATABASE_EVIDENCE", false, ["COMPLETE_DATABASE_EVIDENCE_REQUIRED"]);
  const external = row.externally_authorized_target_binding ?? {};
  if (external.verification_status !== "REQUIRED_NOT_DATABASE_OBSERVED"
    || Object.entries(exactExternal).some(([key, value]) => external[key] !== value)
    || Object.hasOwn(external, "project_id") || Object.hasOwn(external, "database_source")) return outcome("WRONG_TARGET_AUTHORIZATION_METADATA", false, ["EXACT_EXTERNAL_AUTHORIZATION_METADATA_REQUIRED"]);
  if (row.mismatch_count === 0) return outcome("COMPLETE_RESULT_ZERO_MISMATCHES_EXTERNAL_ATTESTATION_STILL_REQUIRED", true);
  return outcome("COMPLETE_RESULT_WITH_MISMATCH_DETAILS_REVIEW_REQUIRED", true, ["MISMATCH_IS_DIAGNOSTIC_EVIDENCE_NOT_REPAIR_PERMISSION"]);
}

export default evaluateFuture017c41Result;
