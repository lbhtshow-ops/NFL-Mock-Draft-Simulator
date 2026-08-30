import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import record from "../persistence/deployment/FidFunctionOwnerCapabilityPreflight017c30ExecutionResult.js";
import review from "../persistence/deployment/FidFunctionOwnerCapabilityPreflight017c30GovernanceReview.js";
import evaluate, { evaluateMismatchGovernance017c30 } from "../persistence/deployment/FidFunctionOwnerCapabilityPreflight017c30ResultEvaluator.js";
import staticReview from "../persistence/deployment/FidFunctionOwnerCapabilityPreflight017c30StaticOracle.js";
import { FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_017C30_RESULT_SCENARIOS as resultScenarios, FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_017C30_STATIC_SCENARIOS as staticScenarios, FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_017C30_GOVERNANCE_SCENARIOS as governanceScenarios, VALID_017C30_GOVERNANCE as validGovernance } from "../persistence/deployment/FidFunctionOwnerCapabilityPreflight017c30Scenarios.js";
const frontend=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../../../../..");
const bytes=(relative)=>fs.readFileSync(path.join(frontend,relative.replace(/^frontend\//,"")));
const hash=(relative)=>crypto.createHash("sha256").update(bytes(relative)).digest("hex").toUpperCase();
const sql=bytes(review.diagnosticPath).toString("utf8");
assert.equal(hash(review.diagnosticPath),review.diagnosticSha256);
assert.equal(evaluate(record).accepted,true);
assert.equal(staticReview(sql).passed,true);
assert.equal(review.exactMismatchIdentitiesRecoverableFromAggregate,false);
assert.equal(review.setFalseStandaloneMismatch,false);
assert.equal(review.createFalseStandaloneMismatch,false);
assert.equal(review.matrix.units,261);
assert.equal(review.authorizationCreated,false);
assert.equal(record.authorizationConsumed,true);
assert.equal(record.retryPermitted,false);
assert.equal(evaluateMismatchGovernance017c30(validGovernance).accepted,true);
for(const scenario of resultScenarios){const outcome=evaluate(scenario.record);assert.equal(outcome.accepted,false,scenario.id);assert.equal(outcome.failures.includes(scenario.expectedFailure),true,scenario.id);}
for(const scenario of staticScenarios){const outcome=staticReview(sql.replaceAll(scenario[1],scenario[2]));assert.equal(outcome.passed,false,scenario[0]);assert.equal(outcome.failures.includes(scenario[3]),true,scenario[0]);}
for(const scenario of governanceScenarios){const outcome=evaluateMismatchGovernance017c30(scenario.context);assert.equal(outcome.accepted,false,scenario.id);assert.equal(outcome.failures.includes(scenario.expectedFailure),true,scenario.id);}
const protectedFiles=[
  [record.executedSqlPath,"6D62107634519BD150C1772D7F9170CD48C4F245680CF630C2D07E07733DCD55"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c24_fid_function_owner_capability_acl_matrix_dashboard_visible_preflight.sql","C70E565DD877A3A32876176D82660E0A23A7553D5FE86E6C5075CCC352579B2A"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c15a_fid_function_owner_capability_amendment_authority_and_boundary_correction.sql","8A1FDAC9C00D87550B2E06078221AEFF8D20515906682D6C5B7E34B8E9A8152C"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c19a_fid_function_owner_capability_acl_matrix_preflight.sql","A58B83C605C9488985355CC3A38A44306B479D80E1B80C3F0A7CC9EBEA3222C2"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c19b_fid_function_owner_capability_acl_matrix_reconciliation.sql","2EE7BB6741D58D6ED04EB43DEBACB0C5E9E673FE42670BDD82F2A1B1B331F802"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c19c_fid_function_owner_capability_acl_matrix_post_verification.sql","281723131FDCAAA0F04EFF929FD09264307939E21884B8A49659717C2B753E42"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/sql/014_create_fid_identifier_issuance_transaction.sql","18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c5_failed_migration_014_read_only_commit_state_reconciliation_postgresql_correction.sql","EF3F45440082D9558A6CCF60F9F91F1017D0EC8E3EC0338C37FCEB6DC4742AA7"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c8_supabase_function_owner_deployment_capability_read_only_preflight_distinct_order_correction.sql","5131801D2DFDCDBE04504BD0414272B66329E620EBBCEB1557F6FE8336105495"],
];
for(const [file,expected] of protectedFiles) assert.equal(hash(file),expected);
const migrations=fs.readdirSync(path.join(frontend,"src/data/footballIntelligence/fid/persistence/deployment/sql")).filter(name=>/^\d{3}_.+\.sql$/.test(name)).sort();
assert.deepEqual(migrations.map(name=>name.slice(0,3)),Array.from({length:14},(_,index)=>String(index+1).padStart(3,"0")));
console.log(JSON.stringify({status:review.status,assertions:21+protectedFiles.length+(resultScenarios.length+staticScenarios.length+governanceScenarios.length)*2,
  resultScenariosRejected:resultScenarios.length,staticScenariosRejected:staticScenarios.length,governanceScenariosRejected:governanceScenarios.length,diagnosticSha256:review.diagnosticSha256,
  aclGovernanceUnits:review.matrix.units,sqlExecuted:false,authorizationCreated:false}));
