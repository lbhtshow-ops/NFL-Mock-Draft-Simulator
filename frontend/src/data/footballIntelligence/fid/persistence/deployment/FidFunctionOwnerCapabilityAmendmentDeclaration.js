import { FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT as constants } from "./FidFunctionOwnerCapabilityAmendmentConstants.js";

export const FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_DECLARATION = Object.freeze({
  id: "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_IMPLEMENTATION_17C13",
  status: "READY_FOR_FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_DEPLOYMENT_REVIEW",
  target: constants,
  migrationState: "MIGRATION_014_FULLY_ROLLED_BACK",
  sqlExecuted: false,
  executionAuthorized: false,
  exactChanges: Object.freeze(["membership SET false -> true", "schema fid CREATE false -> true"]),
  invariants: Object.freeze(["ADMIN true", "membership INHERIT false", "owner USAGE true", "restricted owner attributes false", "migration 014 absent", "no CREATE on another schema"]),
  artifacts: Object.freeze({
    amendment: "review/017c13_fid_function_owner_capability_amendment.sql",
    preflight: "review/017c13_fid_function_owner_capability_amendment_preflight.sql",
    reconciliation: "review/017c13_fid_function_owner_capability_amendment_reconciliation.sql",
    verification: "review/017c13_fid_function_owner_capability_amendment_post_verification.sql",
  }),
});

export default FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_DECLARATION;
