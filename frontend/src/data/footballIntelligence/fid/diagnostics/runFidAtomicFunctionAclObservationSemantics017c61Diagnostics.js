import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import record from "../persistence/deployment/FidAtomicFunctionAclTransactionLocalDiagnostic017c60ExecutionRecord.js";
import audit from "../persistence/deployment/FidAtomicFunctionAclObservationSemantics017c61Audit.js";

const deployment=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../persistence/deployment");
const review=path.join(deployment,"review"),sqlDir=path.join(deployment,"sql");
const read=(base,name)=>fs.readFileSync(path.join(base,name),"utf8");
const hash=(value)=>crypto.createHash("sha256").update(value).digest("hex").toUpperCase();
const diagnostic=read(review,"017c60a_fid_atomic_function_acl_transaction_local_rollback_diagnostic.sql"),failures=[];
for(const [name,expected] of [["014_create_fid_identifier_issuance_transaction.sql",audit.protected.migration014],["017c54a_fid_atomic_function_acl_corrected_owner_preserving_remediation.sql",audit.protected.remediation017c54a],["017c58a_fid_atomic_function_acl_failed_after_state_read_only_reconciliation.sql",audit.protected.reconciliation017c58a],["017c60a_fid_atomic_function_acl_transaction_local_rollback_diagnostic.sql",audit.protected.diagnostic017c60a]]){
  const actual=hash(read(name.startsWith("014_")?sqlDir:review,name));if(actual!==expected)failures.push(`hash:${name}`);
}
const migrations=fs.readdirSync(sqlDir).filter(name=>/^\d{3}_.*\.sql$/.test(name)).sort();
if(migrations.length!==14||migrations.some((name,index)=>!name.startsWith(String(index+1).padStart(3,"0")+"_"))||migrations.some(name=>name.startsWith("015_")))failures.push("migration_inventory");
const positions=["REVOKE EXECUTE ON FUNCTION","GRANT EXECUTE ON FUNCTION","INTO direct_public,direct_owner,direct_service","\n    effective_owner:=pg_catalog.has_function_privilege","PERFORM pg_catalog.set_config(setting_name,(","SELECT r.* FROM"].map(token=>diagnostic.indexOf(token));
positions.push(diagnostic.lastIndexOf("ROLLBACK;"));
if(positions.some(position=>position<0)||positions.some((position,index)=>index>0&&position<=positions[index-1]))failures.push("dataflow_order");
for(const token of ["INTO before_public,before_owner,before_service","INTO direct_public,direct_owner,direct_service","'public_direct_execute_count',direct_public","'service_direct_execute_count',direct_service","'public_effective_execute',effective_public","'anon_effective_execute',effective_anon","'authenticated_effective_execute',effective_authenticated"])if(!diagnostic.includes(token))failures.push(`mapping:${token}`);
const resultSlice=diagnostic.slice(diagnostic.indexOf("'result_identity'"),diagnostic.indexOf(")::text,true);"));
const keys=[...resultSlice.matchAll(/'([a-z][a-z0-9_]*)'\s*,/g)].map(match=>match[1]);
if(keys.length!==47||new Set(keys).size!==47)failures.push("json_keys");
if(record.authorization.lifecycle!=="CONSUMED_PERMANENTLY_NON_REUSABLE"||record.authorization.attemptCount!==1||record.authorization.executionCount!==1||record.result.visibleRowCount!==1||record.result.failedAfterStatePredicateCount!==record.result.failedAfterStatePredicates.length||record.result.classification!=="FID_ATOMIC_FUNCTION_ACL_TRANSACTION_LOCAL_DIAGNOSTIC_DIRECT_ACL_MUTATION_FAILURE")failures.push("runtime_record");
if(audit.rootCauseClassification!=="OUTCOME_I_REPOSITORY_EVIDENCE_INSUFFICIENT"||audit.decisions.diagnostic017c60DefectProven||audit.decisions.successorCreated||audit.decisions.successorAuthorizationCreated||audit.decisions.remediationAuthorizationCreated)failures.push("decision_boundary");
if(failures.length)throw new Error(`17C.61: ${[...new Set(failures)].join(",")}`);
console.log(JSON.stringify({status:audit.status,rootCauseClassification:audit.rootCauseClassification,migrations:migrations.length,migration015Absent:true,jsonKeys:keys.length,failedPredicates:record.result.failedAfterStatePredicateCount,authorizationLifecycle:record.authorization.lifecycle,successorCreated:false,authorizationCreated:false,sqlExecuted:false,databaseConnected:false}));
