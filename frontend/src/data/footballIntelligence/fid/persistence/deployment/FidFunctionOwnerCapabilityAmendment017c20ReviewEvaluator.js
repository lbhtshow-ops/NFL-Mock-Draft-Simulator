export function evaluateFidFunctionOwnerCapabilityAmendment017c20Review({ matrix, protectedHashesMatch, migrationInventory }) {
  const failures = [];
  if (!protectedHashesMatch) failures.push("protected_hash_mismatch");
  if (migrationInventory?.join(",") !== "001,002,003,004,005,006,007,008,009,010,011,012,013,014") {
    failures.push("migration_inventory_mismatch");
  }

  const keys = new Set();
  for (const item of matrix?.entries ?? []) {
    const key = [item.principal, item.objectClass, item.schema, item.object, item.privilege].join("|");
    if (keys.has(key)) failures.push(`duplicate:${key}`);
    keys.add(key);
    if (item.objectClass === "sequence" && item.object === "GOVERNED_SET_MUST_BE_EMPTY") {
      failures.push(`unbound_sequence_expectation:${item.principal}:${item.privilege}`);
    }
  }

  return Object.freeze({
    passed: failures.length === 0,
    failures: Object.freeze([...new Set(failures)]),
    status: failures.length === 0
      ? "READY_FOR_FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_EXECUTION_AUTHORIZATION_REVIEW"
      : "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_ADDITIONAL_CORRECTION_REQUIRED",
  });
}

export default evaluateFidFunctionOwnerCapabilityAmendment017c20Review;
