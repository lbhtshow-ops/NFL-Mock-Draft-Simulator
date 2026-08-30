import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import review from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c23AuthorizationReview.js";
import authorization from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c23ExecutionAuthorization.js";
import evaluate, { PREFLIGHT_RESULT_CLASSIFICATIONS_017C23 as C } from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c23ResultEvaluator.js";
import scenarios from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c23ResultScenarios.js";
import matrix from "../persistence/deployment/FidFunctionOwnerCapabilityAclMatrix017c21.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontend = path.resolve(here, "../../../../..");
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(path.join(frontend, file.replace(/^frontend\//, "")))).digest("hex").toUpperCase();

for (const artifact of Object.values(review.protectedArtifacts)) assert.equal(sha256(artifact.path), artifact.sha256);
assert.equal(matrix.id, review.matrix.id);
assert.equal(matrix.version, review.matrix.version);
assert.equal(matrix.entries.length, 260);
assert.equal(matrix.inventoryInvariants.length, 1);
assert.equal(matrix.entries.length + matrix.inventoryInvariants.length, 261);

const preflight = fs.readFileSync(path.join(frontend, authorization.preflightPath.replace(/^frontend\//, "")), "utf8");
const withoutComments = preflight.replace(/--.*$/gm, "");
const withoutLiterals = withoutComments.replace(/'(?:''|[^'])*'/gs, "''");
assert.doesNotMatch(withoutLiterals, /\b(?:GRANT|REVOKE|INSERT|UPDATE|DELETE|MERGE|TRUNCATE|CREATE\s+(?!OR\s+REPLACE\s+FUNCTION)|DROP|ALTER|LOCK|SET\s+ROLE)\b/i);
assert.doesNotMatch(withoutLiterals, /\b(?:pg_advisory|gen_random_uuid|uuid_generate|rpc)\w*\s*\(/i);
assert.match(preflight, /EXECUTE\s+pg_catalog\.format\(\s*'SELECT count\(\*\), count\(\*\) FILTER \(WHERE migration_id LIKE %L\), count\(\*\) FILTER \(WHERE migration_id=%L AND migration_sequence=13 AND expected_migration_count=13\) FROM %s'/i);
assert.equal((preflight.match(/\bEXECUTE\s+pg_catalog\.format\b/gi) ?? []).length, 1);

assert.equal(authorization.maximumExecutionCount, 1);
assert.equal(authorization.consumption.outcomeIndependent, true);
assert.equal(authorization.consumption.retryAfterConsumption, false);
assert.equal(authorization.amendmentExecution, "PROHIBITED");
assert.equal(authorization.migration014Execution, "PROHIBITED");
assert.equal(authorization.reconciliationExecution, "PROHIBITED");
assert.equal(authorization.postVerificationExecution, "PROHIBITED");
assert.equal(authorization.rpcInvocation, "PROHIBITED");

assert.equal(evaluate(scenarios.exact).classification, C.exact);
assert.equal(evaluate(scenarios.incomplete).classification, C.incomplete);
assert.equal(evaluate(scenarios.executionFailed).classification, C.failed);
assert.equal(evaluate(scenarios.reviewRequired).classification, C.review);
assert.equal(evaluate(scenarios.blocked).classification, C.blocked);
assert.equal(evaluate(null).classification, C.incomplete);

console.log("Sprint 17C.23 diagnostics passed: exact one-execution read-only preflight authorization ready");
