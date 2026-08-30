export const FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_017C15_SNAPSHOTS = Object.freeze({
  ownerAuthority: Object.freeze({ schemaOwner: true, grantableCreateAcl: false, accepted: true }),
  grantOptionAuthority: Object.freeze({ schemaOwner: false, grantableCreateAcl: true, accepted: true }),
  effectiveCreateOnly: Object.freeze({ schemaOwner: false, grantableCreateAcl: false, effectiveCreate: true, accepted: false }),
  boundaries: Object.freeze({ ownerTablesExact: true, serviceSchemaUsage: true, serviceFunctionExecute: true, browserDenied: true, publicDenied: true, otherSchemaCreateDenied: true }),
  reconciliation: Object.freeze(["FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_NOT_APPLIED", "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_FULLY_APPLIED", "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_PARTIALLY_APPLIED", "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_UNEXPECTED_PRIVILEGE_EXPANSION", "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_INCONSISTENT", "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED"]),
});

export default FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_017C15_SNAPSHOTS;
