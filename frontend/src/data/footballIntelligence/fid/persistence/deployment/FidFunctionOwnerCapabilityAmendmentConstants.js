export const FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT = Object.freeze({
  sprint: "17C.13",
  projectId: "ahmorpzcaapvoymiqlkv",
  environment: "DEDICATED_NON_PRODUCTION_TEST",
  database: "Primary Database",
  postgresql: "17.6",
  deploymentRole: "postgres",
  ownerRole: "fid_function_owner",
  schema: "fid",
  before: Object.freeze({ set: false, inherit: false, admin: true, usage: true, create: false }),
  after: Object.freeze({ set: true, inherit: false, admin: true, usage: true, create: true }),
  protectedHashes: Object.freeze({
    preflight017c8: "5131801D2DFDCDBE04504BD0414272B66329E620EBBCEB1557F6FE8336105495",
    migration014: "18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD",
    reconciliation017c5: "EF3F45440082D9558A6CCF60F9F91F1017D0EC8E3EC0338C37FCEB6DC4742AA7",
  }),
});

export default FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT;
