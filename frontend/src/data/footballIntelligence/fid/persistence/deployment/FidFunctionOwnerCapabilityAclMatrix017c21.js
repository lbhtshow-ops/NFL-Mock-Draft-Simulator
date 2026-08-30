import baseline from "./FidFunctionOwnerCapabilityAclMatrix017c19.js";

const freeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

const objectBoundEntries = baseline.entries.filter((item) => item.objectClass !== "sequence");

const sequenceInventoryInvariant = {
  invariantId: "FID_SEQUENCE_EXACT_OBJECT_INVENTORY",
  entryKind: "INVENTORY_LEVEL_INVARIANT",
  schema: "fid",
  objectClass: "sequence",
  invariantType: "EXACT_OBJECT_INVENTORY",
  expectedCountBefore: 0,
  expectedCountAfter: 0,
  expectedGovernedIdentities: [],
  unexpectedDiscoveredObjectAction: "STATE_INCONSISTENT_RECOVERY_REQUIRED",
  perObjectPrivilegeEntriesPermitted: false,
  perObjectOwnershipEntriesPermitted: false,
  perObjectGrantOptionEntriesPermitted: false,
  governingAuthority: [
    "003-012_GOVERNED_FID_OBJECT_INVENTORY",
    "017C19A_PREFLIGHT_SEQUENCE_INVENTORY_CHECK",
    "017C19B_RECONCILIATION_SEQUENCE_INVENTORY_CHECK",
    "017C19C_POST_VERIFICATION_SEQUENCE_INVENTORY_CHECK",
  ],
  coverage: {
    preflight: { required: true, predicate: "fid schema contains no pg_class row with relkind='S'" },
    reconciliation: { required: true, predicate: "a fid sequence increments mismatch_count before classification" },
    postVerification: { required: true, predicate: "fid sequence presence prevents passed classification" },
  },
};

export const FID_FUNCTION_OWNER_ACL_MATRIX_017C21 = freeze({
  ...baseline,
  id: "FID_FUNCTION_OWNER_ACL_MATRIX_017C21_V1",
  version: "17C.21.1",
  supersedes: baseline.id,
  entries: [...objectBoundEntries],
  inventoryInvariants: [sequenceInventoryInvariant],
  cardinalityDerivation: {
    originalObjectBoundEntries: baseline.entries.length,
    removedSyntheticSequenceEntries: baseline.entries.length - objectBoundEntries.length,
    retainedObjectBoundEntries: objectBoundEntries.length,
    addedInventoryInvariants: 1,
    totalGovernanceUnits: objectBoundEntries.length + 1,
  },
});

export default FID_FUNCTION_OWNER_ACL_MATRIX_017C21;
