const stable = (value) => JSON.stringify(value);
const entryKey = (item) => [item.principal, item.objectClass, item.schema, item.object, item.privilege].join("|");

export function evaluateFidFunctionOwnerCapabilityAmendment017c22Review({ baseline, corrected, sqlByStage, hashesMatch }) {
  const failures = [];
  const removed = baseline.entries.filter((item) => item.objectClass === "sequence");
  const retained = baseline.entries.filter((item) => item.objectClass !== "sequence");
  const invariant = corrected.inventoryInvariants?.[0];

  if (!hashesMatch) failures.push("protected_hash_mismatch");
  if (corrected.id !== "FID_FUNCTION_OWNER_ACL_MATRIX_017C21_V1" || corrected.version !== "17C.21.1") failures.push("matrix_identity");
  if (removed.length !== 15 || new Set(removed.map((item) => item.principal)).size !== 5 || new Set(removed.map((item) => item.privilege)).size !== 3
    || removed.some((item) => item.object !== "GOVERNED_SET_MUST_BE_EMPTY")) failures.push("exact_removal_scope");
  if (corrected.entries.length !== 260 || corrected.inventoryInvariants?.length !== 1) failures.push("cardinality");
  retained.forEach((item, index) => {
    if (stable(item) !== stable(corrected.entries[index])) failures.push(`retained_entry_changed:${entryKey(item)}`);
  });
  for (const field of ["tables", "tablePrivileges", "functions", "prohibitedMigration014Functions", "membership", "ownerAttributes", "schemaExclusions", "expectedSequenceCount"]) {
    if (stable(baseline[field]) !== stable(corrected[field])) failures.push(`unrelated_policy_changed:${field}`);
  }
  if (corrected.entries.some((item) => /(?:\*|placeholder|synthetic|governed_set_must_be_empty)/i.test(item.object))) failures.push("unbound_object_identity");

  const invariantExpected = invariant?.schema === "fid" && invariant?.objectClass === "sequence"
    && invariant?.invariantType === "EXACT_OBJECT_INVENTORY" && invariant?.expectedCountBefore === 0
    && invariant?.expectedCountAfter === 0 && invariant?.expectedGovernedIdentities?.length === 0
    && Object.isFrozen(invariant.expectedGovernedIdentities)
    && invariant?.unexpectedDiscoveredObjectAction === "STATE_INCONSISTENT_RECOVERY_REQUIRED"
    && invariant?.perObjectPrivilegeEntriesPermitted === false && invariant?.perObjectOwnershipEntriesPermitted === false
    && invariant?.perObjectGrantOptionEntriesPermitted === false
    && ["preflight", "reconciliation", "postVerification"].every((stage) => invariant?.coverage?.[stage]?.required === true);
  if (!invariantExpected) failures.push("sequence_inventory_invariant");

  const keys = new Set();
  for (const item of corrected.entries) {
    const key = entryKey(item);
    if (keys.has(key)) failures.push(`duplicate:${key}`);
    keys.add(key);
  }
  for (const [stage, sql] of Object.entries(sqlByStage)) {
    if (!/relnamespace\s*=\s*fid_oid\s+AND\s+relkind\s*=\s*'S'/i.test(sql)) failures.push(`${stage}:sequence_scope`);
    if (!/mismatch_count\s*:=\s*mismatch_count\s*\+\s*1/i.test(sql)) failures.push(`${stage}:sequence_mismatch`);
    if (!/mismatch_count=0/.test(sql)) failures.push(`${stage}:positive_not_guarded`);
  }
  if (!/mode='RECONCILIATION' AND mismatch_count>0 THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_INCONSISTENT_RECOVERY_REQUIRED'/.test(sqlByStage.reconciliation)) failures.push("reconciliation_order");

  return Object.freeze({
    passed: failures.length === 0,
    failures: Object.freeze([...new Set(failures)]),
    status: failures.length === 0
      ? "READY_FOR_FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_EXECUTION_AUTHORIZATION_REVIEW"
      : "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_ADDITIONAL_CORRECTION_REQUIRED",
  });
}

export default evaluateFidFunctionOwnerCapabilityAmendment017c22Review;
