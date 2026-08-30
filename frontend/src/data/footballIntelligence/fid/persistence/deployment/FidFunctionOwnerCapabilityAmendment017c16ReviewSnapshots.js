export const FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_017C16_SNAPSHOTS = Object.freeze({
  effectiveCreateWithoutGrantAuthority: Object.freeze({ schemaOwnedByExecutor: false, directCreateGrantOption: false, effectiveCreate: true, expectedAuthority: false }),
  grantableCreateWithoutOwnership: Object.freeze({ schemaOwnedByExecutor: false, directCreateGrantOption: true, expectedAuthority: true }),
  schemaOwnershipAuthority: Object.freeze({ schemaOwnedByExecutor: true, directCreateGrantOption: false, expectedAuthority: true }),
  missingMetadataRelation: Object.freeze({ expectedClassification: "STATE_UNRESOLVED", currentSqlCanClassify: false }),
  setOnlyPartial: Object.freeze({ set: true, create: false, expectedClassification: "SET_ONLY_PARTIAL_STATE" }),
  createOnlyPartial: Object.freeze({ set: false, create: true, expectedClassification: "CREATE_ONLY_PARTIAL_STATE" }),
  correctBefore: Object.freeze({ set: false, create: false, expectedClassification: "NOT_APPLIED" }),
  correctAfter: Object.freeze({ set: true, create: true, expectedClassification: "FULLY_APPLIED" }),
});

export default FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_017C16_SNAPSHOTS;
