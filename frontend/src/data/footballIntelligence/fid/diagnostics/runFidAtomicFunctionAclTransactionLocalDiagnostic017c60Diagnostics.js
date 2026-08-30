import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import declaration from "../persistence/deployment/FidAtomicFunctionAclTransactionLocalDiagnostic017c60Declaration.js";
import review from "../persistence/deployment/FidAtomicFunctionAclTransactionLocalDiagnostic017c60Review.js";
import authorization from "../persistence/deployment/FidAtomicFunctionAclTransactionLocalDiagnostic017c60Authorization.js";
import scenarios from "../persistence/deployment/FidAtomicFunctionAclTransactionLocalDiagnostic017c60Scenarios.js";
import staticOracle from "../persistence/deployment/FidAtomicFunctionAclTransactionLocalDiagnostic017c60StaticOracle.js";

const reviewDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../persistence/deployment/review");
const read=(name)=>fs.readFileSync(path.join(reviewDir,name),"utf8");
const hash=(text)=>crypto.createHash("sha256").update(text).digest("hex").toUpperCase();
const sql=read(declaration.artifact.filename),result=staticOracle(sql),failures=[];
if(hash(sql)!==declaration.artifact.sha256)failures.push("diagnostic_hash");
if(hash(read("017c54a_fid_atomic_function_acl_corrected_owner_preserving_remediation.sql"))!==declaration.protected.remediationSha256)failures.push("protected_remediation_hash");
if(hash(read("017c58a_fid_atomic_function_acl_failed_after_state_read_only_reconciliation.sql"))!==declaration.protected.reconciliationSha256)failures.push("protected_reconciliation_hash");
if(!result.accepted)failures.push(...result.failures);
if(JSON.stringify(result.builderArgumentCounts)!==JSON.stringify(declaration.artifact.builderArgumentCounts)||result.visibleFieldCount!==47)failures.push("contract");
if(scenarios.length!==58||scenarios.some((scenario,index)=>scenario.ordinal!==index+1||!scenario.covered))failures.push("adversarial_scenarios");
if(review.status!=="PASSED_WITHOUT_CORRECTION"||review.adversarialScenarios!==scenarios.length)failures.push("review");
if(authorization.status!=="ACTIVE_UNCONSUMED"||authorization.maximumAttempts!==1||authorization.maximumExecutions!==1||authorization.reusable||authorization.retryAuthorized||authorization.dashboardRetryAuthorized||authorization.artifact.sha256!==declaration.artifact.sha256||authorization.persistentMutationAuthorized)failures.push("authorization_lifecycle");
for(const [name,changed,expected] of [
  ["missing-rollback",sql.replace("ROLLBACK;",""),"transaction_boundary"],
  ["commit",sql.replace("ROLLBACK;","COMMIT;"),"transaction_boundary"],
  ["multiple-row",sql.replace("SELECT r.* FROM","SELECT r.* FROM\nSELECT r.* FROM"),"one_visible_row"],
  ["result-after-rollback",sql.replace(/SELECT r\.\* FROM[\s\S]*?\);\nROLLBACK;/,match=>`ROLLBACK;\n${match.replace("\nROLLBACK;","")}`),"transaction_boundary"],
  ["role-change",sql.replace("ROLLBACK;","ALTER ROLE anon LOGIN;\nROLLBACK;"),"no_prohibited_operation"],
  ["lock",sql.replace("ROLLBACK;","LOCK TABLE x;\nROLLBACK;"),"no_prohibited_operation"],
  ["over-100",sql.replace("pg_catalog.jsonb_build_object(",`pg_catalog.jsonb_build_object(${Array.from({length:51},(_,i)=>`'x${i}',${i}`).join(",")},`),"bounded_jsonb"],
]){const checked=staticOracle(changed);if(checked.accepted||!checked.failures.includes(expected))failures.push(`adversarial:${name}`);}
if(failures.length)throw new Error(`17C.60: ${[...new Set(failures)].join(",")}`);
console.log(JSON.stringify({status:declaration.status,hash:declaration.artifact.sha256,visibleFields:result.visibleFieldCount,builderArgumentCounts:result.builderArgumentCounts,fivePredicates:declaration.fivePredicates.length,classifications:declaration.classifications.length,adversarialScenarios:scenarios.length,authorizationId:authorization.authorizationId,authorizationStatus:authorization.status,commitStatements:0,explicitRollbacks:1,sqlExecuted:false,databaseConnected:false}));
