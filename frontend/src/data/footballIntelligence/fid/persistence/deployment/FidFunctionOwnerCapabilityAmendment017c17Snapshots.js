import { classify017c17 } from "./FidFunctionOwnerCapabilityAmendment017c17Evaluator.js";

const exact = Object.freeze({ inspectable: true, metadataPresent: true, protectedExact: true, metadata014Rows: 0, metadata013Exact: true });
export const FID_FUNCTION_OWNER_CAPABILITY_017C17_SNAPSHOTS = Object.freeze([
  ["metadata relation absent", {}, "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED"],
  ["metadata relation unresolved", { inspectable: false }, "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED"],
  ["unapplied", { ...exact, set: false, create: false }, "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_FULLY_UNAPPLIED"],
  ["applied", { ...exact, set: true, create: true }, "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_FULLY_APPLIED"],
  ["SET only", { ...exact, set: true, create: false }, "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_SET_ONLY_PARTIALLY_APPLIED"],
  ["CREATE only", { ...exact, set: false, create: true }, "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_CREATE_ONLY_PARTIALLY_APPLIED"],
  ["SET unknown", { ...exact, create: false }, "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED"],
  ["CREATE unknown", { ...exact, set: false }, "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED"],
  ["migration 014 row", { ...exact, set: false, create: false, metadata014Rows: 1 }, "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_INCONSISTENT_RECOVERY_REQUIRED"],
  ["duplicate migration 014", { ...exact, set: false, create: false, metadata014Rows: 2 }, "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_INCONSISTENT_RECOVERY_REQUIRED"],
  ["001-013 mismatch", { ...exact, set: false, create: false, metadata013Exact: false }, "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_INCONSISTENT_RECOVERY_REQUIRED"],
  ...["membership edge missing", "ADMIN changed", "INHERIT changed", "restricted owner drift",
    "grant authority missing", "effective CREATE without authority", "other-schema CREATE",
    "browser expansion", "service table expansion", "PUBLIC expansion", "unexpected sequence",
    "unexpected function privilege", "migration 014 object", "missing function", "wrong current user",
    "wrong session user"].map((name) => [name, { ...exact, set: false, create: false, protectedExact: false }, "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_INCONSISTENT_RECOVERY_REQUIRED"]),
].map(([name, evidence, expected]) => Object.freeze({ name, evidence: Object.freeze(evidence), expected, observed: classify017c17(evidence) })));

export default FID_FUNCTION_OWNER_CAPABILITY_017C17_SNAPSHOTS;
