import baseline from "./FidFunctionOwnerCapabilityAclMatrix017c19.js";
import corrected from "./FidFunctionOwnerCapabilityAclMatrix017c21.js";

const syntheticPattern = /(?:\*|placeholder|synthetic|governed_set_must_be_empty)/i;
const key = (item) => [item.principal, item.objectClass, item.schema, item.object, item.privilege].join("|");
const stable = (value) => JSON.stringify(value);

export function evaluateInventoryModel(candidate) {
  const failures = [];
  const invariants = candidate?.inventoryInvariants ?? [];

  for (const item of candidate?.entries ?? []) {
    if (!item.object || syntheticPattern.test(item.object)) failures.push(`synthetic_or_wildcard_object:${key(item)}`);
  }

  for (const invariant of invariants) {
    if (!invariant.schema || syntheticPattern.test(invariant.schema)) failures.push("inventory_exact_schema_missing");
    if (!invariant.objectClass) failures.push("inventory_exact_object_class_missing");
    const identities = invariant.expectedGovernedIdentities ?? [];
    if (invariant.invariantType === "EXACT_OBJECT_INVENTORY" && invariant.expectedCountBefore === 0 && identities.length !== 0) {
      failures.push("empty_inventory_has_identities");
    }
    if ((invariant.expectedCountBefore > 0 || invariant.expectedCountAfter > 0) && identities.length === 0) {
      failures.push("nonempty_inventory_lacks_bound_identities");
    }
    for (const stage of ["preflight", "reconciliation", "postVerification"]) {
      if (!invariant.coverage?.[stage]?.required) failures.push(`inventory_coverage_missing:${stage}`);
    }
    if (invariant.expectedCountBefore === 0 && invariant.expectedCountAfter === 0) {
      const forbidden = (candidate?.entries ?? []).filter((item) => item.objectClass === invariant.objectClass && item.schema === invariant.schema);
      if (forbidden.length) failures.push("per_object_rows_attached_to_empty_inventory");
      if (invariant.perObjectPrivilegeEntriesPermitted !== false) failures.push("empty_inventory_privilege_rows_not_prohibited");
      if (invariant.perObjectOwnershipEntriesPermitted !== false) failures.push("empty_inventory_ownership_rows_not_prohibited");
      if (invariant.perObjectGrantOptionEntriesPermitted !== false) failures.push("empty_inventory_grant_option_rows_not_prohibited");
    }
  }
  return Object.freeze([...new Set(failures)]);
}

export function evaluateSqlSequenceCoverage(sql, stage) {
  const failures = [];
  if (!/relnamespace\s*=\s*fid_oid\s+AND\s+relkind\s*=\s*'S'/i.test(sql)) failures.push(`${stage}:missing_exact_fid_sequence_predicate`);
  if (!/mismatch_count\s*:=\s*mismatch_count\s*\+\s*1/i.test(sql)) failures.push(`${stage}:sequence_does_not_increment_mismatch`);
  if (stage === "reconciliation" && !/WHEN mode='RECONCILIATION' AND mismatch_count>0 THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_INCONSISTENT_RECOVERY_REQUIRED'/.test(sql)) {
    failures.push("reconciliation:sequence_drift_can_reach_positive_state");
  }
  if (stage === "preflight" && !/mismatch_count=0 AND NOT set_state AND NOT create_state/.test(sql)) failures.push("preflight:pass_not_guarded_by_zero_mismatch");
  if (stage === "postVerification" && !/mismatch_count=0 AND set_state AND create_state/.test(sql)) failures.push("postVerification:pass_not_guarded_by_zero_mismatch");
  return Object.freeze(failures);
}

export function evaluateMatrix017c21(candidate = corrected) {
  const failures = [...evaluateInventoryModel(candidate)];
  const retained = baseline.entries.filter((item) => item.objectClass !== "sequence");
  if (baseline.entries.length - retained.length !== 15) failures.push("removed_entry_count_not_15");
  if (candidate.entries?.length !== retained.length) failures.push("retained_entry_count_changed");
  retained.forEach((item, index) => {
    if (stable(candidate.entries?.[index]) !== stable(item)) failures.push(`unrelated_entry_changed:${key(item)}`);
  });
  for (const field of ["tables", "tablePrivileges", "functions", "prohibitedMigration014Functions", "membership", "ownerAttributes", "schemaExclusions"]) {
    if (stable(candidate[field]) !== stable(baseline[field])) failures.push(`unrelated_matrix_field_changed:${field}`);
  }
  if (candidate.inventoryInvariants?.length !== 1) failures.push("sequence_invariant_cardinality");
  if (!Object.isFrozen(candidate) || !Object.isFrozen(candidate.entries) || !Object.isFrozen(candidate.inventoryInvariants)) failures.push("matrix_not_immutable");
  return Object.freeze({ passed: failures.length === 0, failures: Object.freeze([...new Set(failures)]) });
}

export const REQUIRED_SCENARIOS_017C21 = Object.freeze([
  "exact_zero_sequence_inventory", "one_unexpected_sequence", "multiple_unexpected_sequences", "sequence_in_another_schema",
  "synthetic_sequence_identity", "wildcard_sequence_identity", "empty_set_placeholder_as_object", "principal_acl_row_on_empty_set",
  "ownership_row_on_empty_set", "grant_option_row_on_empty_set", "empty_invariant_nonempty_identities", "nonempty_inventory_without_identities",
  "missing_preflight_coverage", "missing_reconciliation_coverage", "missing_post_verification_coverage",
  "valid_future_nonempty_sequence_model", "unrelated_table_entry_removed", "unrelated_function_entry_changed", "unrelated_membership_entry_changed",
]);

export default Object.freeze({ evaluateInventoryModel, evaluateSqlSequenceCoverage, evaluateMatrix017c21, REQUIRED_SCENARIOS_017C21 });
