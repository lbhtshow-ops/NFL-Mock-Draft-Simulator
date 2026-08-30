export function evaluate017c15SchemaGrantAuthority({ schemaOwnedByExecutor = false, directCreateGrantOption = false } = {}) {
  return schemaOwnedByExecutor || directCreateGrantOption;
}

export function classify017c15CapabilityState(facts = {}) {
  if (!facts.identityExact || !facts.versionExact || !facts.targetsResolved) return "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED";
  if (facts.unexpectedPrivilegeExpansion) return "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_UNEXPECTED_PRIVILEGE_EXPANSION";
  if (!facts.admin || facts.inherit || !facts.usage || !facts.restrictedExact || !facts.fixedBoundaryExact || !facts.migrationStateExact) return "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_INCONSISTENT";
  if (!facts.set && !facts.create) return "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_NOT_APPLIED";
  if (facts.set && facts.create) return "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_FULLY_APPLIED";
  if (facts.set !== facts.create) return "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_PARTIALLY_APPLIED";
  return "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED";
}

export default Object.freeze({ evaluate017c15SchemaGrantAuthority, classify017c15CapabilityState });
