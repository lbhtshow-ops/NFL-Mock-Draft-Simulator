import contract from "./FidFunctionOwnerCapabilityMismatchDetail017c39Contract.js";

export function evaluate017c40VisibleResult(result = {}, observed = {}) {
  const failures = [];
  const keys = Object.keys(result);
  if (JSON.stringify(keys) !== JSON.stringify(contract.orderedFields)) failures.push("top_level_contract");
  if (new Set(keys).size !== 25) failures.push("top_level_uniqueness");
  if (result.mode !== contract.mode.requiredValue) failures.push("mode");
  if (typeof result.metadata_storage_present !== "boolean") failures.push("metadata_storage_present");
  if (!(typeof result.migration_014_metadata_count === "number" && Number.isSafeInteger(result.migration_014_metadata_count) && result.migration_014_metadata_count >= 0)) failures.push("migration_014_metadata_count");
  if (typeof result.evidence_complete !== "boolean") failures.push("evidence_complete_type");
  if (observed.requiredDatabaseEvidenceComplete === false && result.evidence_complete === true) failures.push("evidence_complete_with_unresolved_database_evidence");
  if (observed.externalMetadataOnly === true && result.evidence_complete === true) failures.push("external_metadata_completeness");
  const external = result.externally_authorized_target_binding ?? {};
  if (Object.hasOwn(external, "project_id")) failures.push("deprecated_project_id");
  if (Object.hasOwn(external, "database_source")) failures.push("deprecated_database_source");
  if (external.project_reference !== "ahmorpzcaapvoymiqlkv") failures.push("project_reference");
  if (external.dashboard_database_source !== "Primary Database") failures.push("dashboard_database_source");
  if (external.verification_status !== "REQUIRED_NOT_DATABASE_OBSERVED") failures.push("external_authority_label");
  if (result.external_target_attestation_required !== true) failures.push("external_attestation_required");
  if (result.overall_target_verified !== false) failures.push("sql_only_target_verification");
  if (result.mismatch_count !== result.detail_count || result.detail_count !== result.mismatch_details?.length) failures.push("count_detail_reconciliation");
  if (result.read_only !== true || result.mutation_count !== 0) failures.push("read_only_contract");
  return Object.freeze({ accepted: failures.length === 0, failures: Object.freeze([...new Set(failures)]) });
}

export default evaluate017c40VisibleResult;
