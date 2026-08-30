import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import record from "../persistence/deployment/CanonicalProspectIdentifier017c8ExecutionResultRecord.js";
import { evaluateFunctionOwnerCapabilityResult } from "../persistence/deployment/CanonicalProspectIdentifierFunctionOwnerCapabilityResultEvaluator.js";
import comparison from "../persistence/deployment/CanonicalProspectIdentifierFunctionOwnerRemediationPathComparison.js";
import design from "../persistence/deployment/CanonicalProspectIdentifierFunctionOwnerCapabilityRemediationDesignDeclaration.js";
import snapshots from "../persistence/deployment/CanonicalProspectIdentifierFunctionOwnerCapabilityRemediationSnapshots.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const deployment = path.resolve(here, "../persistence/deployment");
const sqlDir = path.join(deployment, "sql");
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test("result-target", () => assert.equal(record.target.projectId, "ahmorpzcaapvoymiqlkv"));
test("result-hash", () => assert.equal(record.protectedHash, "5131801D2DFDCDBE04504BD0414272B66329E620EBBCEB1557F6FE8336105495"));
test("result-read-only", () => assert.deepEqual([record.execution.readOnly, record.execution.databaseMutations], [true, false]));
test("rolled-back", () => assert.equal(record.authoritativeDatabaseState, "MIGRATION_014_FULLY_ROLLED_BACK"));
test("two-blockers", () => assert.deepEqual([record.observed.setCapability, record.observed.ownerSchemaCreate], [false, false]));
test("admin-not-set", () => assert.deepEqual([record.observed.adminCapability, record.observed.setCapability], [true, false]));
test("membership-governance", () => assert.equal(record.observed.membershipGovernanceCapability, true));
test("evaluation-ready", () => assert.equal(evaluateFunctionOwnerCapabilityResult(record).decision, design.status));
test("wrong-target-blocked", () => assert.equal(evaluateFunctionOwnerCapabilityResult({ ...record, target: { ...record.target, projectId: snapshots.wrongTarget.projectId } }).decision, snapshots.wrongTarget.expectedDecision));
test("mutating-result-blocked", () => assert.equal(evaluateFunctionOwnerCapabilityResult({ ...record, execution: { ...record.execution, databaseMutations: true } }).decision, "FID_FUNCTION_OWNER_CAPABILITY_REMEDIATION_BLOCKED"));
test("path-a-only", () => assert.deepEqual(Object.values(comparison.paths).filter((item) => item.selected).length, 1));
test("path-a-selected", () => assert.equal(comparison.paths.A.selected, true));
test("persistent-capabilities", () => assert.deepEqual([design.membershipOptionPolicy.persistence, design.schemaPrivilegePolicy.persistence], ["PERSISTENT", "PERSISTENT"]));
test("set-without-inherit", () => assert.deepEqual([design.membershipOptionPolicy.set, design.membershipOptionPolicy.inherit], [true, false]));
test("noinherit-owner", () => assert.equal(design.ownerAttributesRequired.inherit, false));
test("restricted-owner", () => assert.equal(Object.values(design.ownerAttributesRequired).every((value) => value === false), true));
test("schema-narrow", () => assert.deepEqual([design.schemaPrivilegePolicy.privilege, design.schemaPrivilegePolicy.schema, design.schemaPrivilegePolicy.grantee], ["CREATE", "fid", "fid_function_owner"]));
test("browser-boundary", () => assert.deepEqual([comparison.commonSecurityEffects.browserPublicDenialPreserved, snapshots.leastPrivilegeAfterState.browserAccessExpanded], [true, false]));
test("service-boundary", () => assert.deepEqual([comparison.commonSecurityEffects.serviceRoleOnlyRpcPreserved, snapshots.leastPrivilegeAfterState.serviceRoleTableAccessExpanded], [true, false]));
test("security-definer", () => assert.equal(comparison.commonSecurityEffects.securityDefinerPreserved, true));
test("search-path", () => assert.equal(comparison.commonSecurityEffects.fixedSearchPathPreserved, true));
test("forced-rls", () => assert.equal(comparison.commonSecurityEffects.forcedRlsPreserved, true));
test("failure-rollback", () => assert.match(design.failureBehavior, /Rollback the entire amendment transaction/));
test("unknown-commit", () => assert.match(design.unknownCommitReconciliation, /read-only catalog reconciliation/));
test("future-preflight", () => assert.equal(design.requiredNextReviews.includes("read-only capability preflight review"), true));
test("no-executable-sql", () => assert.equal(design.executableSqlAuthorized, false));
test("migration-not-ready", () => assert.equal(design.migration014Ready, false));
test("migration-001-role-model", () => assert.match(fs.readFileSync(path.join(sqlDir, "001_create_fid_schema.sql"), "utf8"), /rolcanlogin OR role_record\.rolsuper.*role_record\.rolinherit/s));
test("migration-008-owner-precedent", () => assert.match(fs.readFileSync(path.join(sqlDir, "008_create_fid_atomic_persistence_function.sql"), "utf8"), /ALTER FUNCTION[\s\S]*OWNER TO fid_function_owner/));
test("migration-009-forced-rls", () => assert.match(fs.readFileSync(path.join(sqlDir, "009_enable_fid_rls.sql"), "utf8"), /FORCE ROW LEVEL SECURITY/));
test("migration-010-owner-policy", () => assert.match(fs.readFileSync(path.join(sqlDir, "010_create_fid_policies.sql"), "utf8"), /TO fid_function_owner/));
test("migration-011-privileges", () => assert.match(fs.readFileSync(path.join(sqlDir, "011_apply_fid_privileges.sql"), "utf8"), /GRANT USAGE ON SCHEMA fid TO service_role/));
test("migration-012-create-prohibited", () => assert.match(fs.readFileSync(path.join(sqlDir, "012_define_fid_verification.sql"), "utf8"), /fid_function_owner\.schema_create[\s\S]*false/));
test("inventory", () => assert.deepEqual(fs.readdirSync(sqlDir).filter((name) => /^\d{3}_/.test(name)).sort().map((name) => name.slice(0, 3)), ["001", "002", "003", "004", "005", "006", "007", "008", "009", "010", "011", "012", "013", "014"]));
test("no-migration-015", () => assert.equal(fs.readdirSync(sqlDir).some((name) => /^015_/.test(name)), false));
test("design-has-no-sql", () => { const text = fs.readFileSync(path.join(deployment, "CanonicalProspectIdentifierFunctionOwnerCapabilityRemediationDesignDeclaration.js"), "utf8"); assert.doesNotMatch(text, /GRANT\s+\w+\s+ON|REVOKE\s+\w+\s+ON|SET\s+ROLE|ALTER\s+ROLE/i); });

let passed = 0;
for (const [name, fn] of tests) {
  try { fn(); passed += 1; console.log(`PASS ${name}`); } catch (error) { console.error(`FAIL ${name}: ${error.message}`); globalThis.process.exitCode = 1; }
}
console.log(`Function-owner capability remediation diagnostics: ${passed}/${tests.length}`);
