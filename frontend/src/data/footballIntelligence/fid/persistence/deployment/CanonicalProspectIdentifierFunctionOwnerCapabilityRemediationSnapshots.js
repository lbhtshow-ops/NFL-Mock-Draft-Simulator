export const CANONICAL_PROSPECT_IDENTIFIER_FUNCTION_OWNER_CAPABILITY_REMEDIATION_SNAPSHOTS = Object.freeze({
  successful017c8: Object.freeze({ classification: "TARGET_OWNER_SCHEMA_CAPABILITY_MISSING", setCapability: false, ownerSchemaCreate: false, adminCapability: true, expectedDecision: "READY_FOR_GOVERNED_FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_DESIGN" }),
  adminOnlyIsInsufficient: Object.freeze({ adminCapability: true, setCapability: false, ownerSchemaCreate: true, ownershipTransferCapability: false }),
  setOnlyIsInsufficient: Object.freeze({ setCapability: true, ownerSchemaCreate: false, ownershipTransferCapability: false }),
  leastPrivilegeAfterState: Object.freeze({ set: true, membershipInherit: false, ownerSchemaCreate: true, ownerLogin: false, ownerSuperuser: false, browserAccessExpanded: false, serviceRoleTableAccessExpanded: false }),
  wrongTarget: Object.freeze({ projectId: "not-authorized", expectedDecision: "FID_FUNCTION_OWNER_CAPABILITY_REMEDIATION_BLOCKED" }),
});

export default CANONICAL_PROSPECT_IDENTIFIER_FUNCTION_OWNER_CAPABILITY_REMEDIATION_SNAPSHOTS;
