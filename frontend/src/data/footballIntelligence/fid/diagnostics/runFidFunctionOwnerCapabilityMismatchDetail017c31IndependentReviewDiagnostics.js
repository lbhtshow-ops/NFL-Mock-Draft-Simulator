import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import declaration from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c31IndependentReview.js";
import review from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c31Oracle.js";
import scenarios,{VALID_017C31_REVIEW_EVIDENCE,evaluate017c31ReviewEvidence} from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c31Scenarios.js";
import result from "../persistence/deployment/FidFunctionOwnerCapabilityPreflight017c30ExecutionResult.js";
const frontend=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../../../../..");
const bytes=(relative)=>fs.readFileSync(path.join(frontend,relative.replace(/^frontend\//,"")));
const hash=(relative)=>crypto.createHash("sha256").update(bytes(relative)).digest("hex").toUpperCase();
const sql=bytes(declaration.targetPath).toString("utf8");
assert.equal(hash(declaration.targetPath),declaration.targetSha256);
const outcome=review(sql);assert.equal(outcome.correctionRequired,true);
for(const finding of ["missing_object_fanout_or_error","aggregate_detail_count_unreconciled","set_true_not_reported",
  "create_true_not_reported","membership_identities_collapsed","governed_environment_binding_absent","missing_role_or_schema_evidence_not_classified"])
  assert.equal(outcome.findings.includes(finding),true,finding);
assert.equal(outcome.findings.includes("read_only_violation"),false);
assert.equal(outcome.findings.includes("rpc_invocation"),false);
assert.equal(result.row.mismatch_count,5);assert.equal(result.row.set_state,false);assert.equal(result.row.create_state,false);
assert.equal(result.authorizationConsumed,true);assert.equal(result.retryPermitted,false);
assert.equal(evaluate017c31ReviewEvidence(VALID_017C31_REVIEW_EVIDENCE).accepted,true);
for(const scenario of scenarios){const r=evaluate017c31ReviewEvidence(scenario.evidence);assert.equal(r.accepted,false,scenario.id);assert.equal(r.failures.includes(scenario.expectedFailure),true,scenario.id);}
const protectedFiles=[
  [result.executedSqlPath,"6D62107634519BD150C1772D7F9170CD48C4F245680CF630C2D07E07733DCD55"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c24_fid_function_owner_capability_acl_matrix_dashboard_visible_preflight.sql","C70E565DD877A3A32876176D82660E0A23A7553D5FE86E6C5075CCC352579B2A"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c15a_fid_function_owner_capability_amendment_authority_and_boundary_correction.sql","8A1FDAC9C00D87550B2E06078221AEFF8D20515906682D6C5B7E34B8E9A8152C"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c19a_fid_function_owner_capability_acl_matrix_preflight.sql","A58B83C605C9488985355CC3A38A44306B479D80E1B80C3F0A7CC9EBEA3222C2"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c19b_fid_function_owner_capability_acl_matrix_reconciliation.sql","2EE7BB6741D58D6ED04EB43DEBACB0C5E9E673FE42670BDD82F2A1B1B331F802"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c19c_fid_function_owner_capability_acl_matrix_post_verification.sql","281723131FDCAAA0F04EFF929FD09264307939E21884B8A49659717C2B753E42"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/sql/014_create_fid_identifier_issuance_transaction.sql","18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c5_failed_migration_014_read_only_commit_state_reconciliation_postgresql_correction.sql","EF3F45440082D9558A6CCF60F9F91F1017D0EC8E3EC0338C37FCEB6DC4742AA7"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c8_supabase_function_owner_deployment_capability_read_only_preflight_distinct_order_correction.sql","5131801D2DFDCDBE04504BD0414272B66329E620EBBCEB1557F6FE8336105495"],
];
for(const [file,expected] of protectedFiles)assert.equal(hash(file),expected);
const migrations=fs.readdirSync(path.join(frontend,"src/data/footballIntelligence/fid/persistence/deployment/sql")).filter(name=>/^\d{3}_.+\.sql$/.test(name)).sort();
assert.deepEqual(migrations.map(name=>name.slice(0,3)),Array.from({length:14},(_,i)=>String(i+1).padStart(3,"0")));
console.log(JSON.stringify({status:declaration.status,assertions:29+protectedFiles.length+scenarios.length*2,
  blockingFindings:declaration.blockingFindings.length,negativeScenariosRejected:scenarios.length,sqlExecuted:false,authorizationCreated:false}));
