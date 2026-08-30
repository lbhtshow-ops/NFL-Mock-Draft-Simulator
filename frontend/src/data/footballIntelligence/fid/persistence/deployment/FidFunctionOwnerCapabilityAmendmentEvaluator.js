export const AMENDMENT_DECISIONS = Object.freeze({
  ready: "READY_FOR_FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_DEPLOYMENT_REVIEW",
  correction: "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_IMPLEMENTATION_CORRECTION_REQUIRED",
  blocked: "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_IMPLEMENTATION_BLOCKED",
});

export function evaluateFidFunctionOwnerCapabilityState(facts = {}) {
  const base = facts.identityExact === true && facts.targetExists === true && facts.admin === true && facts.inherit === false && facts.usage === true && facts.restrictedAttributesExact === true && facts.migration014Absent === true;
  let classification = "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED";
  if (!facts.resolved) classification = "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED";
  else if (!base) classification = "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_INCONSISTENT";
  else if (facts.unexpectedPrivilegeExpansion) classification = "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_UNEXPECTED_PRIVILEGE_EXPANSION";
  else if (!facts.set && !facts.create) classification = "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_NOT_APPLIED";
  else if (facts.set && facts.create) classification = "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_FULLY_APPLIED";
  else classification = "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_PARTIALLY_APPLIED";
  return Object.freeze({ classification });
}

export function evaluateFidFunctionOwnerCapabilityImplementation({ oraclePassed, scenariosPassed, protectedHashesExact, inventoryExact } = {}) {
  return oraclePassed && scenariosPassed && protectedHashesExact && inventoryExact ? AMENDMENT_DECISIONS.ready : AMENDMENT_DECISIONS.correction;
}

export default Object.freeze({ evaluateFidFunctionOwnerCapabilityState, evaluateFidFunctionOwnerCapabilityImplementation });
