const freeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

const coverage = { preflight: true, reconciliation: true, postVerification: true };
const entry = (value) => ({ ...value, governingArtifact: "008-012_BASELINE_AND_017C15_AMENDMENT", coverage: { ...coverage } });
const tablePrivileges = ["SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"];
const ownerAllowed = {
  fid_record_revisions: ["SELECT", "INSERT"],
  fid_persistence_effect_receipts: ["SELECT", "INSERT"],
  fid_persistence_audit_events: ["SELECT", "INSERT"],
  fid_persistence_idempotency: ["SELECT", "INSERT", "UPDATE"],
  fid_persistence_batches: ["SELECT", "INSERT", "UPDATE"],
  fid_persistence_batch_operations: ["SELECT", "INSERT", "UPDATE"],
  fid_persistence_migrations: [],
};
const principals = ["fid_function_owner", "service_role", "anon", "authenticated", "PUBLIC"];

const tableEntries = Object.keys(ownerAllowed).flatMap((object) => principals.flatMap((principal) =>
  tablePrivileges.map((privilege) => {
    const expected = principal === "fid_function_owner" && ownerAllowed[object].includes(privilege);
    return entry({ principal, principalType: principal === "PUBLIC" ? "pseudo_role" : "role", objectClass: "table",
      schema: "fid", object, privilege, expectedDirect: expected, expectedEffective: expected,
      expectedGrantOption: false, expectedBefore: expected, expectedAfter: expected, expectedOwner: "postgres" });
  })));

const schemaEntries = [
  ["fid_function_owner", "USAGE", true, true], ["fid_function_owner", "CREATE", false, true],
  ["service_role", "USAGE", true, true], ["service_role", "CREATE", false, false],
  ...["anon", "authenticated", "PUBLIC"].flatMap((p) => [[p, "USAGE", false, false], [p, "CREATE", false, false]]),
].map(([principal, privilege, before, after]) => entry({ principal, principalType: principal === "PUBLIC" ? "pseudo_role" : "role",
  objectClass: "schema", schema: "fid", object: "fid", privilege, expectedDirect: before,
  expectedEffective: before, expectedGrantOption: false, expectedBefore: before, expectedAfter: after, expectedOwner: "postgres" }));

const functionEntries = principals.map((principal) => {
  const direct = principal === "service_role";
  const effective = direct || principal === "fid_function_owner";
  return entry({ principal, principalType: principal === "PUBLIC" ? "pseudo_role" : "role", objectClass: "function", schema: "fid",
    object: "fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb)", privilege: "EXECUTE",
    expectedDirect: direct, expectedEffective: effective, expectedGrantOption: false, expectedBefore: effective,
    expectedAfter: effective, expectedOwner: "fid_function_owner", expectedSecurityDefiner: true,
    expectedSearchPath: ["pg_catalog", "fid"], effectiveBasis: principal === "fid_function_owner" ? "OWNERSHIP" : direct ? "DIRECT_ACL" : "NONE" });
});

const sequenceEntries = principals.flatMap((principal) => ["USAGE", "SELECT", "UPDATE"].map((privilege) => entry({
  principal, principalType: principal === "PUBLIC" ? "pseudo_role" : "role", objectClass: "sequence", schema: "fid",
  object: "GOVERNED_SET_MUST_BE_EMPTY", privilege, expectedDirect: false, expectedEffective: false,
  expectedGrantOption: false, expectedBefore: false, expectedAfter: false, expectedOwner: null,
})));

export const FID_FUNCTION_OWNER_ACL_MATRIX_017C19 = freeze({
  id: "FID_FUNCTION_OWNER_ACL_MATRIX_017C19_V1", version: "17C.19.1", authoritativeState: "MIGRATION_014_FULLY_ROLLED_BACK",
  schemaExclusions: { exact: ["information_schema"], prefixes: ["pg_"], rationale: "PostgreSQL system schemas only; managed Supabase schemas are not assumed governed." },
  tables: Object.keys(ownerAllowed), tablePrivileges, functions: ["fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb)"],
  prohibitedMigration014Functions: ["fid_execute_prospect_identifier_issuance_transaction"], expectedSequenceCount: 0,
  membership: entry({ principal: "postgres", principalType: "role", objectClass: "membership", schema: null,
    object: "postgres->fid_function_owner", privilege: "MEMBER", expectedDirect: true, expectedEffective: true,
    expectedGrantOption: true, expectedBefore: { member: true, admin: true, inherit: false, set: false },
    expectedAfter: { member: true, admin: true, inherit: false, set: true } }),
  ownerAttributes: { role: "fid_function_owner", login: false, superuser: false, createdb: false, createrole: false, replication: false, bypassrls: false, inherit: false },
  entries: [...schemaEntries, ...tableEntries, ...sequenceEntries, ...functionEntries],
});

export default FID_FUNCTION_OWNER_ACL_MATRIX_017C19;
