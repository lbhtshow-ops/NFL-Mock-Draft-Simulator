export const FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_017C15_CORRECTION = Object.freeze({
  id: "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_017C15_REVIEW_CORRECTION",
  status: "READY_FOR_FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_CORRECTED_DEPLOYMENT_REVIEW",
  target: Object.freeze({ projectId: "ahmorpzcaapvoymiqlkv", environment: "DEDICATED_NON_PRODUCTION_TEST", database: "Primary Database", role: "postgres", postgresql: "17.6" }),
  predecessorStatus: "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_IMPLEMENTATION_CORRECTION_REQUIRED",
  predecessorPreserved: true,
  corrections: Object.freeze(["schema ownership or direct grantable CREATE ACL", "complete before-state privilege boundary", "OID-guarded role and schema privilege checks", "complete schema/table/function/PUBLIC post-verification"]),
  exactChanges: Object.freeze(["GRANT CREATE ON SCHEMA fid TO fid_function_owner", "GRANT fid_function_owner TO postgres WITH ADMIN TRUE, INHERIT FALSE, SET TRUE"]),
  fixedHashes: Object.freeze({
    amendment: "8A1FDAC9C00D87550B2E06078221AEFF8D20515906682D6C5B7E34B8E9A8152C",
    preflight: "D2338D8A248ED8E4ABA35A355CF243E10E598AD527E9459B511243E7D0DD5373",
    reconciliation: "9F0F625A603B618AC68A80069F46D95FC066F814575A6655076CBCDA473D65A8",
    postVerification: "B4D8F4B1B427E8CDFF381E9051DB9C57E496A70A8F156C57F57197FCC2367F28",
  }),
  executionAuthorized: false,
  sqlExecuted: false,
  migration014Authorized: false,
});

export default FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_017C15_CORRECTION;
