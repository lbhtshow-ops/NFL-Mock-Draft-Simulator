import fs from "node:fs";
import { createHash } from "node:crypto";
import review from "../persistence/deployment/CanonicalProspectIdentifierSupabaseFunctionOwnerGovernanceReview.js";
import snapshots from "../persistence/deployment/CanonicalProspectIdentifierSupabaseFunctionOwnerGovernanceSnapshots.js";
import { evaluateCanonicalProspectIdentifierSupabaseFunctionOwnerGovernance as evaluate } from "../persistence/deployment/CanonicalProspectIdentifierSupabaseFunctionOwnerGovernanceEvaluator.js";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const hash = (value) => createHash("sha256").update(value).digest("hex").toUpperCase();
const assert = (value, message) => { if (!value) throw new Error(message); };
const preflight = read("../persistence/deployment/review/017c6_supabase_function_owner_deployment_capability_read_only_preflight.sql");
const migration014 = read("../persistence/deployment/sql/014_create_fid_identifier_issuance_transaction.sql");
const reconciliation017c5 = read("../persistence/deployment/review/017c5_failed_migration_014_read_only_commit_state_reconciliation_postgresql_correction.sql");
const migration001 = read("../persistence/deployment/sql/001_create_fid_schema.sql");
const migration008 = read("../persistence/deployment/sql/008_create_fid_atomic_persistence_function.sql");
const migration009 = read("../persistence/deployment/sql/009_enable_fid_rls.sql");
const migration010 = read("../persistence/deployment/sql/010_create_fid_policies.sql");
const migration011 = read("../persistence/deployment/sql/011_apply_fid_privileges.sql");
const migration012 = read("../persistence/deployment/sql/012_define_fid_verification.sql");
const migrationFiles = fs.readdirSync(new URL("../persistence/deployment/sql/", import.meta.url)).filter((name) => /^\d{3}_.*\.sql$/.test(name)).sort();
const stripped = preflight.replace(/--[^\r\n]*/g, "");
const structural = stripped.replace(/'(?:''|[^'])*'/g, "''");
const statements = stripped.split(";").map((statement) => statement.trim()).filter(Boolean);
const mutation = /\b(create|alter|drop|truncate|insert|update|delete|merge|grant|revoke|comment|vacuum|analyze|refresh|reindex|cluster|copy|call|do|lock|begin|commit|rollback|set\s+role)\b/i;
const coverageTokens = [
  "CURRENT_USER", "SESSION_USER", "fid_function_owner", "pg_catalog.pg_auth_members",
  "admin_option", "inherit_option", "set_option", "'MEMBER'", "'USAGE'", "'SET'",
  "'MEMBER WITH ADMIN OPTION'", "rolsuper", "rolcreaterole", "rolbypassrls",
  "has_schema_privilege", "ownership_transfer_capability", "membership_governance_capability",
];
const evidence = {
  projectId: review.exactTarget.projectId,
  migration014Hash: hash(migration014),
  reconciliation017c5Hash: hash(reconciliation017c5),
  preflightHash: hash(preflight),
  officialPrimarySourcesOnly: review.officialSources.length === 10 && review.officialSources.every((source) => source.url.startsWith("https://supabase.com/docs/") || source.url.startsWith("https://www.postgresql.org/docs/17/")),
  preflightReadOnly: statements.every((statement) => /^(SELECT|WITH)\b/i.test(statement)) && !mutation.test(structural),
  preflightCoverageComplete: coverageTokens.every((token) => preflight.includes(token)),
  noRoleMutation: !/\b(?:GRANT|REVOKE|ALTER\s+ROLE|CREATE\s+ROLE|DROP\s+ROLE|SET\s+ROLE)\b/i.test(structural),
  migrationInventoryExact: migrationFiles.length === 14 && migrationFiles.every((name, index) => name.startsWith(`${String(index + 1).padStart(3, "0")}_`)),
  migration015Absent: !migrationFiles.some((name) => name.startsWith("015_")),
  noReviewEffects: Object.values(review.permissions).every((value) => value === false),
};
const result = evaluate(review, evidence);
const tests = [
  ["protected-hashes", () => assert(evidence.migration014Hash === review.protectedHashes.migration014 && evidence.reconciliation017c5Hash === review.protectedHashes.reconciliation017c5, "hash")],
  ["fully-rolled-back", () => assert(review.authoritativeState.migration014State === "MIGRATION_014_FULLY_ROLLED_BACK" && !review.authoritativeState.migration014Applied, "state")],
  ["migration-001-role-verification", () => assert(migration001.includes("Required database role fid_function_owner is missing") && !/CREATE\s+ROLE/i.test(migration001), "role verification")],
  ["migration-008-owner-precedent", () => assert(/SECURITY DEFINER/i.test(migration008) && /SET search_path = pg_catalog, fid/i.test(migration008) && /OWNER TO fid_function_owner/i.test(migration008), "owner precedent")],
  ["migrations-009-012-security", () => assert(/FORCE ROW LEVEL SECURITY/i.test(migration009) && /TO fid_function_owner/i.test(migration010) && /REVOKE EXECUTE[\s\S]+FROM PUBLIC, anon, authenticated, service_role/i.test(migration011) && /fid_function_owner is NOLOGIN/i.test(migration012), "security")],
  ["official-sources", () => assert(evidence.officialPrimarySourcesOnly, "sources")],
  ["client-authority", () => assert(!review.findings.clientChangesAuthority, "client authority")],
  ["four-paths", () => assert(review.paths.length === 4 && review.paths.every((path) => path.status), "paths")],
  ["preflight-hash", () => assert(evidence.preflightHash === review.preflight.sha256, "preflight hash")],
  ["preflight-read-only", () => assert(evidence.preflightReadOnly && evidence.noRoleMutation, "read-only")],
  ["preflight-coverage", () => assert(evidence.preflightCoverageComplete, "coverage")],
  ["no-sensitive-access", () => assert(!/\b(pg_authid|pg_shadow|password|passwd|secret|token|api[_ ]?key|connection[_ ]?string)\b/i.test(structural), "sensitive")],
  ["no-invocation", () => assert(!/\bgen_random_uuid\s*\(|\bfid_execute_prospect_identifier_issuance_transaction\s*\(/i.test(structural), "invocation")],
  ["negative-dashboard-owner", () => assert(!snapshots.broadPostgresOwner.approved, "dashboard owner")],
  ["negative-client-switch", () => assert(!snapshots.dashboardToCliSameIdentity.authorityChanged, "client switch")],
  ["negative-member-without-set", () => assert(!snapshots.memberWithoutSet.ownershipTransferCapable, "member without set")],
  ["negative-set-without-schema-create", () => assert(!snapshots.setWithoutSchemaCreate.ownershipTransferCapable, "schema create")],
  ["admin-not-authorization", () => assert(!snapshots.adminWithoutSet.membershipMutationExecuted, "admin")],
  ["inventory", () => assert(evidence.migrationInventoryExact && evidence.migration015Absent, "inventory")],
  ["review-outcome", () => assert(result.status === "READY_FOR_SUPABASE_OWNERSHIP_CAPABILITY_READ_ONLY_PREFLIGHT_REVIEW" && !result.migrationDeploymentReady && result.blockers.length === 0, "outcome")],
  ["no-review-effects", () => assert(result.databaseOperations === 0 && result.networkDatabaseConnections === 0, "effects")],
];

let passed = 0;
for (const [name, test] of tests) {
  try { test(); passed += 1; console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}: ${error.message}`); }
}
console.log(`Supabase function-owner governance diagnostics: ${passed}/${tests.length}`);
if (passed !== tests.length) globalThis.process.exitCode = 1;
