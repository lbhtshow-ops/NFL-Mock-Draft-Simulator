import fs from "node:fs";
import { createHash } from "node:crypto";
import review from "../persistence/deployment/CanonicalProspectIdentifierSupabaseOwnershipCapabilityPreflightStaticReview.js";
import snapshots from "../persistence/deployment/CanonicalProspectIdentifierSupabaseOwnershipCapabilityPreflightStaticReviewSnapshots.js";
import { evaluateCanonicalProspectIdentifierSupabaseOwnershipCapabilityPreflightStaticReview as evaluate } from "../persistence/deployment/CanonicalProspectIdentifierSupabaseOwnershipCapabilityPreflightStaticReviewEvaluator.js";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const hash = (value) => createHash("sha256").update(value).digest("hex").toUpperCase();
const assert = (value, message) => { if (!value) throw new Error(message); };
const preflight017c6 = read("../persistence/deployment/review/017c6_supabase_function_owner_deployment_capability_read_only_preflight.sql");
const preflight017c7 = read("../persistence/deployment/review/017c7_supabase_function_owner_deployment_capability_read_only_preflight_correction.sql");
const migration014 = read("../persistence/deployment/sql/014_create_fid_identifier_issuance_transaction.sql");
const reconciliation017c5 = read("../persistence/deployment/review/017c5_failed_migration_014_read_only_commit_state_reconciliation_postgresql_correction.sql");
const migrationFiles = fs.readdirSync(new URL("../persistence/deployment/sql/", import.meta.url)).filter((name) => /^\d{3}_.*\.sql$/.test(name)).sort();
const strip = (sql) => sql.replace(/--[^\r\n]*/g, "").replace(/'(?:''|[^'])*'/g, "''");
const structural = strip(preflight017c7);
const statements = preflight017c7.replace(/--[^\r\n]*/g, "").split(";").map((statement) => statement.trim()).filter(Boolean);
const mutation = /\b(insert|update|delete|merge|truncate|copy|create|alter|drop|comment|grant|revoke|do|call|execute|prepare|vacuum|analyze|refresh|reindex|cluster|begin|commit|rollback|savepoint|set|reset|lock)\b/i;
const locking = /\bFOR\s+(?:UPDATE|NO\s+KEY\s+UPDATE|SHARE|KEY\s+SHARE)\b|\bpg_(?:try_)?advisory_(?:xact_)?lock\b/i;
const reservedAlias = /\bAS\s+(?:constraint|select|where|group|order|limit|offset|values|with|recursive|returning|window|over|case|when|then|else|end)\b/i;
const balanced = (text) => {
  let depth = 0;
  for (const character of text) {
    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
};
const prefix = (sql) => sql.slice(0,sql.indexOf("-- BLOCK E:")).replace(/^-- SPRINT[^\r\n]*/m,"-- VERSION_HEADER").replace(/\r\n/g,"\n");
const coverage = [
  "CURRENT_USER='postgres'", "SESSION_USER='postgres'", "TARGET_OWNER_ROLE_MISSING", "DEPLOYMENT_ROLE_MISSING",
  "DIRECT_MEMBERSHIP_ABSENT", "INTERMEDIATE_MEMBERSHIP_PATH", "inherit_option", "set_option", "admin_option",
  "'MEMBER'", "'USAGE'", "'SET'", "'MEMBER WITH ADMIN OPTION'", "member_capability",
  "inherited_usage_capability", "set_capability", "admin_capability", "membership_governance_capability",
  "deployment_schema_usage", "deployment_schema_create", "owner_schema_usage", "owner_schema_create",
  "ownership_transfer_capability", "OWNERSHIP_CAPABILITY_UNRESOLVED", "sanitized_classification",
];
const evidence = {
  projectId: review.exactTarget.projectId,
  migration014Hash: hash(migration014),
  reconciliation017c5Hash: hash(reconciliation017c5),
  preflight017c6Hash: hash(preflight017c6),
  preflight017c7Hash: hash(preflight017c7),
  protectedPrefixPreserved: prefix(preflight017c6) === prefix(preflight017c7),
  readOnly: statements.every((statement) => /^(SELECT|WITH)\b/i.test(statement)) && !mutation.test(structural) && !locking.test(structural),
  postgresql17Compatible: ["pg_catalog.pg_roles", "pg_catalog.pg_auth_members", "inherit_option", "set_option", "admin_option", "pg_catalog.pg_has_role", "pg_catalog.has_schema_privilege"].every((token) => preflight017c7.includes(token)) && balanced(structural) && !reservedAlias.test(structural) && !/ORDER\s+BY\s+(?:CASE|pg_catalog\.)/i.test(structural),
  coverageComplete: coverage.every((token) => preflight017c7.includes(token)),
  sanitized: !/\b(pg_authid|pg_shadow|password|passwd|secret|token|credential|connection[_ ]?string|hostname|url|environment|candidate|reservation|ledger|idempotency|payload|audit)\b/i.test(structural),
  inventoryExact: migrationFiles.length === 14 && migrationFiles.every((name, index) => name.startsWith(`${String(index + 1).padStart(3,"0")}_`)),
  migration015Absent: !migrationFiles.some((name) => name.startsWith("015_")),
  noReviewEffects: Object.values(review.permissions).every((value) => value === false),
};
const result = evaluate(review,evidence);
const tests = [
  ["protected-hashes", () => assert(evidence.migration014Hash === review.protected.migration014Sha256 && evidence.reconciliation017c5Hash === review.protected.reconciliation017c5Sha256 && evidence.preflight017c6Hash === review.protected.preflight017c6Sha256, "hash")],
  ["successor-hash", () => assert(evidence.preflight017c7Hash === review.successor.sha256, "successor hash")],
  ["017c6-defect", () => assert(!preflight017c6.includes("deployment_schema_usage") && !preflight017c6.includes("deployment_schema_create") && !preflight017c6.includes("owner_schema_usage") && !preflight017c6.includes("CURRENT_USER='postgres'"), "defect")],
  ["prefix-preserved", () => assert(evidence.protectedPrefixPreserved, "prefix")],
  ["statement-prefixes", () => assert(statements.every((statement) => /^(SELECT|WITH)\b/i.test(statement)), "statement prefix")],
  ["no-mutation", () => assert(evidence.readOnly, "mutation")],
  ["no-locking", () => assert(!locking.test(structural), "locking")],
  ["no-role-or-session-change", () => assert(!/\b(?:SET|RESET|GRANT|REVOKE|ALTER\s+ROLE|CREATE\s+ROLE)\b/i.test(structural), "role mutation")],
  ["no-invocation", () => assert(!/\bgen_random_uuid\s*\(|\bfid_execute_prospect_identifier_issuance_transaction\s*\(/i.test(structural), "invocation")],
  ["catalogs", () => assert(["pg_catalog.pg_roles", "pg_catalog.pg_auth_members"].every((token) => preflight017c7.includes(token)), "catalog")],
  ["membership-options", () => assert(["inherit_option", "set_option", "admin_option"].every((token) => preflight017c7.includes(token)), "membership")],
  ["admin-mechanism", () => assert(preflight017c7.includes("'MEMBER WITH ADMIN OPTION'"), "admin")],
  ["oid-and-null-safety", () => assert(preflight017c7.includes("pg_catalog.to_regrole") && preflight017c7.includes("pg_catalog.to_regnamespace") && preflight017c7.includes("IS NULL"), "null safety")],
  ["schema-capabilities", () => assert(["deployment_schema_usage", "deployment_schema_create", "owner_schema_usage", "owner_schema_create"].every((token) => preflight017c7.includes(token)), "schema")],
  ["identity-binding", () => assert(preflight017c7.includes("current_role_exact AND session_role_exact AND set_capability"), "identity")],
  ["not-membership-only", () => assert(!/\(member_capability\s+AND\s+owner_schema_create\)\s+AS ownership_transfer_capability/i.test(preflight017c7), "membership-only")],
  ["compatibility", () => assert(evidence.postgresql17Compatible, "compatibility")],
  ["no-union-order-defect", () => assert(!/ORDER\s+BY\s+(?:CASE|pg_catalog\.)/i.test(structural), "union order")],
  ["no-reserved-alias", () => assert(!reservedAlias.test(structural) && !/\bconstraint\./i.test(structural), "reserved alias")],
  ["coverage", () => assert(evidence.coverageComplete, "coverage")],
  ["sanitized", () => assert(evidence.sanitized, "sanitization")],
  ["negative-identity", () => assert(!snapshots.currentRoleMismatch.executionReady && !snapshots.sessionRoleMismatch.executionReady, "identity scenario")],
  ["negative-schema", () => assert(!snapshots.missingDeploymentCreate.executionReady && !snapshots.missingOwnerCreate.executionReady, "schema scenario")],
  ["negative-membership", () => assert(!snapshots.memberWithoutSet.executionReady && !snapshots.adminWithoutSet.executionReady, "membership scenario")],
  ["no-premature-execution", () => assert(!snapshots.completeCapabilities.executionReady && !result.preflight017c6ExecutionAuthorized && !result.preflight017c7ExecutionAuthorized, "execution")],
  ["inventory", () => assert(evidence.inventoryExact && evidence.migration015Absent, "inventory")],
  ["decision", () => assert(result.status === "SUPABASE_OWNERSHIP_CAPABILITY_PREFLIGHT_CORRECTION_REQUIRED" && result.preflight017c7CorrectionReviewReady && result.blockers.length === 0, "decision")],
  ["no-review-effects", () => assert(result.databaseOperations === 0 && result.networkDatabaseConnections === 0, "effects")],
];

let passed = 0;
for (const [name,test] of tests) {
  try { test(); passed += 1; console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}: ${error.message}`); }
}
console.log(`Supabase ownership capability preflight static review diagnostics: ${passed}/${tests.length}`);
if (passed !== tests.length) globalThis.process.exitCode = 1;
