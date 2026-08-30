export const FID_MIGRATION_012_CAPABILITY_COMPATIBILITY_SUCCESSOR = Object.freeze({
  id: "FID_MIGRATION_012_CAPABILITY_COMPATIBILITY_SUCCESSOR_17C13",
  historicalArtifactModified: false,
  supersededExpectation: "fid_function_owner CREATE on fid is false",
  successorExpectation: "fid_function_owner CREATE on fid is true",
  rationale: "PostgreSQL 17 ALTER FUNCTION OWNER requires the caller to be able to SET ROLE to the new owner and that owner to have CREATE on the function schema.",
  scope: Object.freeze({ projectId: "ahmorpzcaapvoymiqlkv", environment: "DEDICATED_NON_PRODUCTION_TEST", schema: "fid", otherSchemasCreate: false }),
  preserved: Object.freeze({ usage: true, admin: true, membershipInherit: false, restrictedOwnerAttributes: true, browserAndRuntimeBoundaries: true }),
});

export function evaluateMigration012CapabilityCompatibility({ ownerCreateOnFid, ownerCreateOnOtherSchema, restrictedAttributesExact } = {}) {
  return ownerCreateOnFid === true && ownerCreateOnOtherSchema === false && restrictedAttributesExact === true
    ? "FID_MIGRATION_012_CAPABILITY_SUCCESSOR_COMPATIBLE"
    : "FID_MIGRATION_012_CAPABILITY_SUCCESSOR_DRIFT";
}

export default FID_MIGRATION_012_CAPABILITY_COMPATIBILITY_SUCCESSOR;
