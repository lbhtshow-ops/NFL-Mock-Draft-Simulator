import { AUTHORITATIVE_25_FIELD_ORDER_017C39 } from "./FidFunctionOwnerCapabilityMismatchDetail017c39OrderedFields.js";
import { SUCCESSOR_EXTERNAL_TARGET_KEYS_017C39 } from "./FidFunctionOwnerCapabilityMismatchDetail017c39NestedKeyMapping.js";

export const SPLIT_AUTHORITY_25_FIELD_MISMATCH_DETAIL_RESULT_CONTRACT_017C39 = Object.freeze({
  contractIdentity: "SPLIT_AUTHORITY_25_FIELD_MISMATCH_DETAIL_VISIBLE_RESULT_CONTRACT",
  contractVersion: "17C.39.1", owner: "FID_FUNCTION_OWNER_CAPABILITY_DIAGNOSTIC_GOVERNANCE_OWNER",
  status: "AUTHORITATIVE_FOR_FUTURE_IMPLEMENTATION", supersedes: "SPLIT_AUTHORITY_MISMATCH_DETAIL_VISIBLE_RESULT_CONTRACT@17C.37.1",
  fieldCount: 25, orderedFields: AUTHORITATIVE_25_FIELD_ORDER_017C39,
  mode: Object.freeze({ type: "SANITIZED_TEXT", requiredValue: "MISMATCH_DETAIL_DIAGNOSTIC", callerControlled: false }),
  metadataStoragePresent: Object.freeze({ type: "BOOLEAN", source: "GUARDED_CATALOG_RESOLUTION" }),
  migration014MetadataCount: Object.freeze({ type: "NON_NEGATIVE_BIGINT", source: "AGGREGATE_ONLY_GUARDED_METADATA_QUERY", expectedBeforeMigration014: 0 }),
  evidenceComplete: Object.freeze({ type: "BOOLEAN", requiresResolvedDatabaseEvidence: true, externalMetadataAloneSufficient: false, claimsExternalIdentityObserved: false }),
  externalTargetKeys: SUCCESSOR_EXTERNAL_TARGET_KEYS_017C39,
  authoritySplit: Object.freeze({ databaseObserved: Object.freeze(["current_database()", "CURRENT_USER", "SESSION_USER"]), externalAttestationRequired: true, sqlOnlyOverallVerificationProhibited: true }),
  implementation: Object.freeze({ included: false, sqlExecutionAuthorized: false, migration014Authorized: false, capabilityAmendmentAuthorized: false }),
});

export default SPLIT_AUTHORITY_25_FIELD_MISMATCH_DETAIL_RESULT_CONTRACT_017C39;
