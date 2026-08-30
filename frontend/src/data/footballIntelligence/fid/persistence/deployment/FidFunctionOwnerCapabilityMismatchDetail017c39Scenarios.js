import contract from "./FidFunctionOwnerCapabilityMismatchDetail017c39Contract.js";
import { HISTORICAL_21_FIELD_ORDER_017C37 } from "./FidFunctionOwnerCapabilityMismatchDetail017c39OrderedFields.js";

const valid = Object.freeze({ orderedFields: contract.orderedFields, externalTargetKeys: contract.externalTargetKeys,
  mode: "MISMATCH_DETAIL_DIAGNOSTIC",
  externalMetadataObservedByDatabase: false, evidenceCompleteFromExternalMetadata: false, sqlOnlyOverallTargetVerified: false,
  sqlExecutionAuthorized: false, migration014Authorized: false, capabilityAmendmentAuthorized: false });
const alter = (id, changes, failure) => Object.freeze({ id, candidate: Object.freeze({ ...valid, ...changes }), accepted: false, failure });
const without = (field) => contract.orderedFields.filter((value) => value !== field);

export const VALID_017C39_CONTRACT_SCENARIO = Object.freeze({ id: "exact-valid-25", candidate: valid, accepted: true });
export const CONTRACT_017C39_SCENARIOS = Object.freeze([
  VALID_017C39_CONTRACT_SCENARIO,
  alter("historical-21", { orderedFields: HISTORICAL_21_FIELD_ORDER_017C37 }, "historical_21_field_contract_still_authoritative"),
  alter("additions-appended", { orderedFields: Object.freeze([...HISTORICAL_21_FIELD_ORDER_017C37, "mode", "metadata_storage_present", "migration_014_metadata_count", "evidence_complete"]) }, "field_order_or_membership_mismatch"),
  alter("remove-existing-to-21", { orderedFields: Object.freeze(contract.orderedFields.slice(4)) }, "field_count_not_25"),
  alter("replace-four-existing", { orderedFields: Object.freeze([...contract.orderedFields.slice(0, 21), "mode", "metadata_storage_present", "migration_014_metadata_count", "evidence_complete"]) }, "field_order_or_membership_mismatch"),
  alter("wrong-mode-position", { orderedFields: Object.freeze(["mode", ...without("mode")]) }, "mode_insertion_point"),
  alter("wrong-metadata-position", { orderedFields: Object.freeze([...contract.orderedFields.filter((f) => !["metadata_storage_present", "migration_014_metadata_count", "evidence_complete"].includes(f)), "metadata_storage_present", "migration_014_metadata_count", "evidence_complete"]) }, "metadata_insertion_point_or_order"),
  alter("wrong-metadata-order", { orderedFields: Object.freeze(contract.orderedFields.map((f) => f === "metadata_storage_present" ? "evidence_complete" : f === "evidence_complete" ? "metadata_storage_present" : f)) }, "metadata_insertion_point_or_order"),
  alter("duplicate", { orderedFields: Object.freeze([...contract.orderedFields.slice(0, -1), "read_only"]) }, "duplicate_field"),
  alter("extra", { orderedFields: Object.freeze([...contract.orderedFields, "extra"]) }, "field_count_not_25"),
  alter("missing-mode", { orderedFields: Object.freeze(without("mode")) }, "field_count_not_25"),
  alter("wrong-mode-value", { mode: "PREFLIGHT" }, "wrong_mode_value"),
  alter("missing-metadata-storage", { orderedFields: Object.freeze(without("metadata_storage_present")) }, "field_count_not_25"),
  alter("missing-migration-count", { orderedFields: Object.freeze(without("migration_014_metadata_count")) }, "field_count_not_25"),
  alter("missing-evidence-complete", { orderedFields: Object.freeze(without("evidence_complete")) }, "field_count_not_25"),
  alter("deprecated-project-id", { externalTargetKeys: Object.freeze([...contract.externalTargetKeys, "project_id"]) }, "deprecated_project_id"),
  alter("deprecated-database-source", { externalTargetKeys: Object.freeze([...contract.externalTargetKeys, "database_source"]) }, "deprecated_database_source"),
  alter("missing-project-reference", { externalTargetKeys: Object.freeze(contract.externalTargetKeys.filter((f) => f !== "project_reference")) }, "missing_project_reference"),
  alter("external-observed", { externalMetadataObservedByDatabase: true }, "external_metadata_mislabeled_observed"),
  alter("completeness-conflated", { evidenceCompleteFromExternalMetadata: true }, "evidence_complete_conflated_with_external_attestation"),
  alter("execution-authorized", { sqlExecutionAuthorized: true }, "sql_execution_authorized"),
  alter("migration-authorized", { migration014Authorized: true }, "migration_014_authorized"),
  alter("amendment-authorized", { capabilityAmendmentAuthorized: true }, "capability_amendment_authorized"),
]);

export default CONTRACT_017C39_SCENARIOS;
