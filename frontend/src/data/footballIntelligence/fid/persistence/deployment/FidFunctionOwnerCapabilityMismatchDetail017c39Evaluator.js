import contract from "./FidFunctionOwnerCapabilityMismatchDetail017c39Contract.js";
import { HISTORICAL_21_FIELD_ORDER_017C37 } from "./FidFunctionOwnerCapabilityMismatchDetail017c39OrderedFields.js";

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function evaluate017c39SuccessorContract(candidate = {}) {
  const failures = [];
  const fields = candidate.orderedFields ?? [];
  const externalKeys = candidate.externalTargetKeys ?? [];
  if (candidate.mode !== contract.mode.requiredValue) failures.push("wrong_mode_value");
  if (same(fields, HISTORICAL_21_FIELD_ORDER_017C37)) failures.push("historical_21_field_contract_still_authoritative");
  if (fields.length !== 25) failures.push("field_count_not_25");
  if (!same(fields, contract.orderedFields)) failures.push("field_order_or_membership_mismatch");
  if (new Set(fields).size !== fields.length) failures.push("duplicate_field");
  if (fields.indexOf("mode") !== fields.indexOf("result_version") + 1) failures.push("mode_insertion_point");
  const databaseIndex = fields.indexOf("database_observed_target_evidence");
  if (!same(fields.slice(databaseIndex - 3, databaseIndex), ["metadata_storage_present", "migration_014_metadata_count", "evidence_complete"])) failures.push("metadata_insertion_point_or_order");
  for (const field of HISTORICAL_21_FIELD_ORDER_017C37) if (!fields.includes(field)) failures.push(`removed_historical_field_${field}`);
  if (externalKeys.includes("project_id")) failures.push("deprecated_project_id");
  if (externalKeys.includes("database_source")) failures.push("deprecated_database_source");
  for (const field of ["project_reference", "dashboard_database_source"]) if (!externalKeys.includes(field)) failures.push(`missing_${field}`);
  if (candidate.externalMetadataObservedByDatabase === true) failures.push("external_metadata_mislabeled_observed");
  if (candidate.evidenceCompleteFromExternalMetadata === true) failures.push("evidence_complete_conflated_with_external_attestation");
  if (candidate.sqlOnlyOverallTargetVerified === true) failures.push("sql_only_overall_target_verification");
  if (candidate.sqlExecutionAuthorized === true) failures.push("sql_execution_authorized");
  if (candidate.migration014Authorized === true) failures.push("migration_014_authorized");
  if (candidate.capabilityAmendmentAuthorized === true) failures.push("capability_amendment_authorized");
  return Object.freeze({ accepted: failures.length === 0, historicalRecognized: same(fields, HISTORICAL_21_FIELD_ORDER_017C37), failures: Object.freeze([...new Set(failures)]) });
}

export default evaluate017c39SuccessorContract;
