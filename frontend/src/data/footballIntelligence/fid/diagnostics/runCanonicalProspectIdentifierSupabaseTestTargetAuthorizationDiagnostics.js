import fs from "node:fs";
import { createHash } from "node:crypto";
import authorization from "../persistence/deployment/CanonicalProspectIdentifierSupabaseTestTargetAuthorization.js";
import manifest from "../persistence/deployment/CanonicalProspectIdentifierSupabaseTestDeploymentManifestV2.js";
import { createFidDeploymentEnvironmentPrimaryBranch } from "../persistence/runbook/FidDeploymentEnvironmentPrimaryBranchContract.js";
import { evaluateCanonicalProspectIdentifierSupabaseTestTargetAuthorization as evaluate, evaluateCanonicalProspectIdentifierSupabaseTestTargetAuthorizationBatch as evaluateBatch } from "../persistence/deployment/CanonicalProspectIdentifierSupabaseTestTargetAuthorizationEvaluator.js";
import snapshots, { CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_TEST_TARGET_AUTHORIZATION_SCENARIOS as scenarios } from "../prospectIntake/fixtures/canonicalProspectIdentifierSupabaseTestTargetAuthorizationSnapshots.js";

const assert = (value, message) => { if (!value) throw new Error(message); };
const tests = [];
const test = (name, fn) => tests.push([name, fn]);
const migration = fs.readFileSync(new URL("../persistence/deployment/sql/014_create_fid_identifier_issuance_transaction.sql", import.meta.url));
const calculatedHash = createHash("sha256").update(migration).digest("hex").toUpperCase();
const exact = scenarios[0].observedTarget;

for (const item of scenarios) {
  test(`scenario-${item.id}`, () => assert(evaluate(authorization, item.observedTarget).status === item.expectedStatus, item.id));
}

test("authorization-identity-version", () => assert(authorization.authorizationId === "CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_NON_PRODUCTION_TEST_TARGET_AUTHORIZATION" && authorization.authorizationVersion === "1.0.0", "authorization identity"));
test("exact-target", () => assert(JSON.stringify(authorization.target) === JSON.stringify({ organizationName: "Lunch Break Hot Take", projectName: "LBHT FID Persistence Test", projectId: "ahmorpzcaapvoymiqlkv", region: "us-east-1", branchName: "main", platformLabel: "PRODUCTION" }), "target"));
test("two-independent-axes", () => assert(authorization.governedEnvironment.classification === "DEDICATED_NON_PRODUCTION_TEST" && authorization.platformBranchRole.classification === "PRODUCTION_PRIMARY_BRANCH" && authorization.platformBranchRole.platformLabelDoesNotOverrideGovernedProjectClassification, "axes"));
test("environment-successor", () => assert(createFidDeploymentEnvironmentPrimaryBranch({ governedEnvironment: authorization.governedEnvironment, platformBranchRole: authorization.platformBranchRole, exactTargetAuthorization: authorization }).validation.valid, "environment contract"));
test("environment-requires-authorization", () => assert(!createFidDeploymentEnvironmentPrimaryBranch({ governedEnvironment: authorization.governedEnvironment, platformBranchRole: authorization.platformBranchRole }).validation.valid, "authorization optional"));
test("manifest-successor", () => assert(manifest.manifestVersion === "2.0.0" && manifest.status === "AUTHORIZED_DEDICATED_NON_PRODUCTION_TEST_PRIMARY_BRANCH" && !manifest.platformLabelException.generalizable, "manifest"));
test("corrected-hash", () => assert(calculatedHash === authorization.migration.approvedMigrationSha256, "corrected hash"));
test("original-hash-rejected", () => assert(evaluate(authorization, { ...exact, migrationSha256: authorization.migration.prohibitedMigrationSha256 }).decision === "BLOCK", "original hash"));
test("missing-authorization", () => assert(evaluate(null, exact).decision === "BLOCK", "missing authorization"));
test("batch-mixed-deterministic", () => { const input = [exact, scenarios[3].observedTarget]; const first = evaluateBatch([authorization, authorization], input); const second = evaluateBatch([authorization, authorization], input); assert(first.status === "BATCH_CONTROLLED_DEPLOYMENT_STAGE_1_BLOCKED" && JSON.stringify(first) === JSON.stringify(second), "batch"); });
test("cohort-zero-execution", () => assert(snapshots.cohort.length === 4 && snapshots.cohort.every((item) => Object.entries(item).filter(([key]) => key.endsWith("Count")).every(([, value]) => value === 0)), "cohort"));
test("stage2-prohibited", () => assert(manifest.stage2.authorized === false && evaluate(authorization, exact).stage2Authorized === false, "stage2"));
test("all-effects-zero", () => assert(Object.values(evaluate(authorization, exact).effects).every((value) => value === false || value === 0), "effects"));
test("production-prohibitions", () => assert([authorization.governedEnvironment.productionProhibited, authorization.safeguards.productionRuntimeActivationProhibited, authorization.safeguards.productionEdgeFunctionDeploymentProhibited, authorization.safeguards.productionCustomerDataProhibited, authorization.safeguards.productionTrafficProhibited].every(Boolean), "production safeguards"));
test("immutable", () => assert(Object.isFrozen(authorization) && Object.isFrozen(authorization.target) && Object.isFrozen(evaluate(authorization, exact)), "immutability"));
test("sanitized-snapshots", () => assert(!/(password|access[_-]?token|service[_-]?role[_-]?key|database[_-]?url|authorization[_-]?header)/i.test(JSON.stringify(snapshots)), "secret-like fixture key"));

let passed = 0;
for (const [name, fn] of tests) {
  try { fn(); passed += 1; console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}: ${error.message}`); }
}
console.log(`Supabase test target authorization diagnostics: ${passed}/${tests.length}`);
console.log(`Synthetic scenarios: ${scenarios.length}/${scenarios.length}`);
console.log(`Four-prospect cohort: ${snapshots.cohort.length} declarations, 0 operations`);
if (passed !== tests.length) globalThis.process.exitCode = 1;
