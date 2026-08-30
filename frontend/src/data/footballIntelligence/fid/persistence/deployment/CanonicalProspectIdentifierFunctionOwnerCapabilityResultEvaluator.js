export const FUNCTION_OWNER_CAPABILITY_DECISIONS = Object.freeze({
  READY: "READY_FOR_GOVERNED_FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_DESIGN",
  BLOCKED: "FID_FUNCTION_OWNER_CAPABILITY_REMEDIATION_BLOCKED",
});

export function evaluateFunctionOwnerCapabilityResult(record) {
  const observed = record?.observed ?? {};
  const targetExact = record?.target?.projectId === "ahmorpzcaapvoymiqlkv"
    && record?.target?.database === "Primary Database"
    && record?.target?.executionRole === "postgres";
  const protectedResult = record?.protectedHash === "5131801D2DFDCDBE04504BD0414272B66329E620EBBCEB1557F6FE8336105495";
  const blockersExact = observed.memberCapability === true
    && observed.setCapability === false
    && observed.adminCapability === true
    && observed.ownerSchemaUsage === true
    && observed.ownerSchemaCreate === false
    && observed.ownershipTransferCapability === false;
  const noEffects = record?.execution?.readOnly === true
    && record?.execution?.databaseMutations === false
    && record?.migration014Executed === false
    && record?.authoritativeDatabaseState === "MIGRATION_014_FULLY_ROLLED_BACK";
  return Object.freeze({ targetExact, protectedResult, blockersExact, noEffects, decision: targetExact && protectedResult && blockersExact && noEffects ? FUNCTION_OWNER_CAPABILITY_DECISIONS.READY : FUNCTION_OWNER_CAPABILITY_DECISIONS.BLOCKED });
}

export default Object.freeze({ evaluateFunctionOwnerCapabilityResult });
