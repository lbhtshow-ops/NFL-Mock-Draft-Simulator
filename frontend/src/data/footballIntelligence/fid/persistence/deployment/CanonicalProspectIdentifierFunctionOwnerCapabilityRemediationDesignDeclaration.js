export const CANONICAL_PROSPECT_IDENTIFIER_FUNCTION_OWNER_CAPABILITY_REMEDIATION_DESIGN = Object.freeze({
  declarationId: "CANONICAL_PROSPECT_IDENTIFIER_FUNCTION_OWNER_CAPABILITY_REMEDIATION_DESIGN",
  status: "READY_FOR_GOVERNED_FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_DESIGN",
  capabilityOwner: "Lunch Break Hot Take / LBHT FID Persistence Test governance authority",
  authorizedTarget: Object.freeze({ projectId: "ahmorpzcaapvoymiqlkv", environment: "DEDICATED_NON_PRODUCTION_TEST", database: "Primary Database", postgresql: "17.6" }),
  roles: Object.freeze({ deployment: "postgres", owner: "fid_function_owner" }),
  schema: "fid",
  requiredBeforeState: Object.freeze({ migrationState: "MIGRATION_014_FULLY_ROLLED_BACK", postgresMember: true, postgresSet: false, postgresAdmin: true, membershipInherit: false, ownerUsage: true, ownerCreate: false }),
  requiredAfterState: Object.freeze({ postgresMember: true, postgresSet: true, postgresAdmin: true, membershipInherit: false, ownerUsage: true, ownerCreate: true }),
  membershipOptionPolicy: Object.freeze({ set: true, inherit: false, persistence: "PERSISTENT", admin: "PRESERVE_OBSERVED_TRUE_NO_EXPANSION" }),
  schemaPrivilegePolicy: Object.freeze({ privilege: "CREATE", schema: "fid", grantee: "fid_function_owner", persistence: "PERSISTENT", usagePreserved: true }),
  ownerAttributesRequired: Object.freeze({ login: false, superuser: false, createdb: false, createrole: false, replication: false, bypassrls: false, inherit: false }),
  atomicity: "A future implementation must apply the membership-option amendment and schema privilege amendment as one governed transaction and must not include migration 014.",
  failureBehavior: "Rollback the entire amendment transaction and stop; do not retry migration 014.",
  unknownCommitReconciliation: "Run a separately authorized read-only catalog reconciliation for exact membership options, schema privileges, role attributes, and migration rollback state before any repair or retry decision.",
  verification: Object.freeze(["exact target and execution identity", "SET true and membership INHERIT false", "owner USAGE and CREATE true only on fid", "restricted owner attributes unchanged", "browser/service-role boundaries unchanged", "migration 014 still fully rolled back"]),
  rollbackPolicy: "Revocation requires a separate governed design and read-only dependency review; persistent capabilities are not automatically revoked after migration 014.",
  prohibitedExpansion: Object.freeze(["LOGIN", "SUPERUSER", "CREATEDB", "CREATEROLE", "REPLICATION", "BYPASSRLS", "membership INHERIT", "browser access", "service-role table access", "PUBLIC privileges", "privileges on schemas other than fid"]),
  requiredNextReviews: Object.freeze(["executable amendment implementation review", "read-only capability preflight review", "controlled amendment deployment review", "post-amendment read-only result review", "separate migration 014 authorization review"]),
  executableSqlAuthorized: false,
  migration014Ready: false,
});

export default CANONICAL_PROSPECT_IDENTIFIER_FUNCTION_OWNER_CAPABILITY_REMEDIATION_DESIGN;
