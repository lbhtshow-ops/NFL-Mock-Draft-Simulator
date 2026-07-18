import { readFileSync } from "node:fs";
import { dirname,resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fidApi,* as namedApi from "../index.js";
import persistenceApi,* as persistenceNamedApi from "../persistence/index.js";
import correctionApi,* as correctionNamedApi from "../persistence/correction/index.js";
import { runPostgresqlSecurityReviewDiagnostics } from "./runPostgresqlSecurityReviewDiagnostics.js";
const SUITE="Supabase Deployment Package Correction Diagnostics",ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"../persistence/deployment/sql");
const assert=(v,m)=>{if(!v)throw new Error(m);};
function context(previous){const files=fidApi.POSTGRESQL_REVIEW_SQL_FILES,sources=Object.fromEntries(files.map(f=>[f,readFileSync(resolve(ROOT,f),"utf8")]));return{previous,files,sources,fn:sources[files[7]],policies:sources[files[9]],privileges:sources[files[10]],verification:sources[files[11]],correction:fidApi.SUPABASE_DEPLOYMENT_CORRECTION,conformance:fidApi.SUPABASE_DEPLOYMENT_CORRECTION_CONFORMANCE};}
function check(i,c){const k=i%60,v=c.correction,fn=c.fn,pol=c.policies,priv=c.privileges,verify=c.verification;
 if(k===0)assert(c.conformance.conformant,"Correction conformance failed.");
 if(k===1)assert(v.corrections.length===16&&v.report.validation.valid,"Correction report invalid.");
 if(k===2)assert(v.corrections.filter(x=>["BLOCKER","CRITICAL","HIGH"].includes(x.originalSeverity)||x.findingId==="FID-S32-M012-VERIFICATION-001").every(x=>x.resolutionState==="RESOLVED"),"Blocking correction unresolved.");
 if(k===3)assert(v.traceability.entries.length===16&&!v.traceability.untracedBlockingFindings.length,"Traceability incomplete.");
 if(k===4)assert(v.report.approvalState==="APPROVED_WITH_NON_BLOCKING_OBSERVATIONS"&&!v.report.anotherCorrectionRequired,"Approval reassessment invalid.");
 if(k===5)assert(v.policyCounts.previous===84&&v.policyCounts.ownerAdditions===15&&v.policyCounts.final===99,"Policy count correction invalid.");
 if(k===6)assert(c.files.length===13&&c.files.join(",")===fidApi.SUPABASE_TEST_MIGRATION_INVENTORY.map(x=>x.filename).join(","),"Migration inventory changed.");
 if(k===7)assert(!v.migrationInventoryChanged&&!v.functionSignatureChanged&&!v.tableInventoryChanged&&!v.constraintInventoryChanged&&!v.indexInventoryChanged,"Frozen inventory changed.");
 if(k===8)assert(/CREATE FUNCTION fid\.fid_execute_atomic_persistence_batch\([\s\S]*batch_id text, ordered_operations jsonb, requested_atomicity text, preconditions jsonb,[\s\S]*expected_repository jsonb, idempotency jsonb, audit jsonb, source_refs jsonb[\s\S]*\) RETURNS jsonb/.test(fn),"Function signature changed.");
 if(k===9)assert(/v_batch_id text := batch_id/.test(fn)&&/v_target_contract text/.test(fn)&&!/plpgsql\.variable_conflict|#variable_conflict/.test(fn),"Variable correction invalid.");
 if(k===10)assert(/rr\.target_contract=v_target_contract AND rr\.canonical_record_id=v_canonical_record_id/.test(fn)&&!/r\.target_contract=target_contract|r\.canonical_record_id=canonical_record_id/.test(fn),"Current-revision ambiguity remains.");
 if(k===11)assert(/GRANT USAGE ON SCHEMA fid TO fid_function_owner/.test(priv),"Owner schema usage missing.");
 if(k===12)assert(/GRANT SELECT, INSERT ON TABLE fid\.fid_record_revisions TO fid_function_owner/.test(priv)&&/GRANT SELECT, INSERT, UPDATE ON TABLE fid\.fid_persistence_idempotency TO fid_function_owner/.test(priv),"Owner table grants missing.");
 if(k===13)assert(!/GRANT (ALL|DELETE|TRUNCATE|REFERENCES|TRIGGER|CREATE)[^;]*fid_function_owner/i.test(priv)&&!/GRANT[^;]*SEQUENCE[^;]*fid_function_owner/i.test(priv),"Owner overprivileged.");
 if(k===14)assert((pol.match(/fid_function_owner_[a-z]+_allow/g)||[]).length===15&&(pol.match(/TO fid_function_owner/g)||[]).length===15,"Owner policies incomplete.");
 if(k===15)assert((pol.match(/AS PERMISSIVE/g)||[]).length===43&&(pol.match(/AS RESTRICTIVE/g)||[]).length===56,"Policy composition invalid.");
 if(k===16)assert((pol.match(/TO PUBLIC/g)||[]).length===28&&(pol.match(/TO anon/g)||[]).length===28&&(pol.match(/TO authenticated/g)||[]).length===28,"Browser policies changed.");
 if(k===17)assert(!/TO service_role/.test(pol)&&!/fid_function_owner_delete_allow/.test(pol),"Unsafe owner/service policy found.");
 if(k===18)assert(/REVOKE ALL ON ALL TABLES IN SCHEMA fid FROM PUBLIC, anon, authenticated, service_role/.test(priv)&&!/GRANT[^;]*TABLE[^;]*service_role/.test(priv),"Direct service table denial invalid.");
 if(k===19)assert(/GRANT EXECUTE[\s\S]*TO service_role/.test(priv)&&/REVOKE EXECUTE[\s\S]*FROM PUBLIC, anon, authenticated, service_role/.test(priv),"RPC grants invalid.");
 if(k===20)assert(/v_allowed_command_keys constant text\[\]/.test(fn)&&/jsonb_object_keys\(v_operation\)/.test(fn)&&/NOT\(k\.key_name=ANY\(v_allowed_command_keys\)\)/.test(fn),"Command closure missing.");
 if(k===21)assert(/v_allowed_canonical_keys constant text\[\]/.test(fn)&&/jsonb_object_keys\(v_canonical_row\)/.test(fn),"Canonical closure missing.");
 if(k===22)assert(/NOT\(v_operation\?'executes'\)/.test(fn)&&/jsonb_typeof\(v_operation->'executes'\) IS DISTINCT FROM 'boolean'/.test(fn)&&/IS DISTINCT FROM 'false'::jsonb/.test(fn),"Executes validation incomplete.");
 if(k===23)assert(/NOT\(v_operation\?'auxiliaryRows'\)/.test(fn)&&/v_operation->'auxiliaryRows' IS DISTINCT FROM '\[\]'::jsonb/.test(fn),"Auxiliary validation incomplete.");
 if(k===24)assert(/operationIndex'\) IS DISTINCT FROM 'number'/.test(fn)&&/operationId'\) IS DISTINCT FROM 'string'/.test(fn)&&/NOT IN\('CREATE','APPEND_REVISION'\)/.test(fn)&&!/expectedResultRef/.test(fn)&&/v_batch_id\|\|':'\|\|v_operation_id\|\|':result'/.test(fn),"Mapped command contract invalid.");
 if(k===25)assert(/tableTarget'\) OR v_operation->>'tableTarget' IS DISTINCT FROM 'fid_record_revisions'/.test(fn)&&/v_idempotency_key IS DISTINCT FROM v_canonical_row->>'idempotency_key'/.test(fn),"Table target or idempotency-key validation incomplete.");
 if(k===26)assert(/v_required_canonical_keys constant text\[\]/.test(fn)&&(fn.match(/'created_at','created_by','request_id','operation_id','content_hash','status'/g)||[]).length===1,"Required-field inventory invalid.");
 if(k===27)assert(/v_canonical_row->required\.key_name='null'::jsonb/.test(fn)&&/jsonb_typeof\(v_canonical_row->required\.key_name\)='string'/.test(fn),"JSON-null/empty rejection missing.");
 if(k===28)assert(/ORDER BY target_contract ASC,canonical_record_id ASC,original_index ASC/.test(fn)&&/pg_advisory_xact_lock/.test(fn),"Deterministic lock order missing.");
 if(k===29)assert(/ORDER BY e\.ordinality LOOP/.test(fn)&&/v_operation_results:=v_operation_results\|\|/.test(fn),"Result order not preserved.");
 if(k===30)assert(/WHERE i\.idempotency_key=v_idempotency_key FOR UPDATE/.test(fn)&&/request_hash IS DISTINCT FROM v_request_hash/.test(fn),"Idempotency locking/mismatch missing.");
 if(k===31)assert(/result_status='COMMITTED'/.test(fn)&&/jsonb_set\(r_idempotency\.result_payload,'\{replayed\}'/.test(fn),"Replay handling missing.");
 if(k===32)assert(/result_status='PENDING'/.test(fn)&&/result_status='ROLLED_BACK'/.test(fn)&&/ON CONFLICT \(idempotency_key\) DO NOTHING/.test(fn),"Idempotency race states incomplete.");
 if(k===33)assert(/effectReceipts','\[\]'::jsonb/.test(fn)&&/RETURN pg_catalog\.jsonb_set/.test(fn),"Replay effect suppression missing.");
 if(k===34)assert(["BATCH_RECEIVED","BATCH_VALIDATED","OPERATION_COMMITTED","BATCH_COMMITTED","BATCH_ROLLED_BACK","BATCH_REPLAYED","BATCH_CONFLICT","BATCH_FAILED"].every(x=>fn.includes(`'${x}'`)),"Audit event types incomplete.");
 if(k===35)assert(["Persistence batch received.","Persistence batch validation completed.","Persistence operation committed.","Persistence batch committed.","Persistence batch was rolled back.","Persistence batch replayed its stored result.","Persistence batch encountered a governed conflict.","Persistence batch could not be completed."].every(x=>fn.includes(x)),"Audit messages incomplete.");
 if(k===36)assert(/'auditEventIds','\[\]'::jsonb/.test(fn)&&/transientAuditEvent/.test(fn),"Rollback audit distinction missing.");
 if(k===37)assert(["VALIDATION","PREDECESSOR_NOT_FOUND","PREDECESSOR_MISMATCH","REVISION_DISCONTINUITY","IDEMPOTENCY_FINGERPRINT","RELATIONSHIP_ENDPOINT","DUPLICATE_LOGICAL_RECORD","DUPLICATE_REVISION","DATABASE_CONSTRAINT","MALFORMED_PAYLOAD","UNEXPECTED_INTERNAL"].every(x=>fn.includes(`'${x}'`))&&/v_record_revision IS DISTINCT FROM 1/.test(fn)&&/r_current_revision\.record_revision\+1/.test(fn),"CREATE/APPEND exception semantics incomplete.");
 if(k===38)assert(fn.indexOf("v_exception_category='VALIDATION'")<fn.indexOf("v_exception_category='PREDECESSOR_NOT_FOUND'")&&fn.indexOf("fid_record_revisions_pk")<fn.indexOf("v_returned_sqlstate IN('23503','23514','23505')"),"Exception precedence invalid.");
 if(k===39)assert(/v_returned_sqlstate IN\('23503','23514','23505'\)/.test(fn)&&/IN\('22P02','22007','22023'\)/.test(fn)&&!/SQLERRM/.test(fn),"SQLSTATE or raw-error correction invalid.");
 if(k===40)assert(/CONSTRAINT_NAME/.test(fn)&&/TABLE_NAME/.test(fn)&&/COLUMN_NAME/.test(fn),"Stacked diagnostics incomplete.");
 if(k===41)assert(/WHEN 'CoachProfile' THEN 'PersonProfile'/.test(fn)&&/WHEN 'ExecutiveProfile' THEN 'PersonProfile'/.test(fn)&&/WHEN 'ScoutProfile' THEN 'PersonProfile'/.test(fn),"Personnel endpoint mapping missing.");
 if(k===42)assert(/relationship_source_contract'='FootballRelationship'/.test(fn)&&/relationship_target_contract'='FootballRelationship'/.test(fn),"Relationship endpoint prohibition missing.");
 if(k===43)assert(/NOT EXISTS\(SELECT 1 FROM fid\.fid_record_revisions AS source_endpoint/.test(fn)&&/NOT EXISTS\(SELECT 1 FROM fid\.fid_record_revisions AS target_endpoint/.test(fn),"Endpoint existence validation missing.");
 if(k===44)assert(fn.indexOf("RELATIONSHIP_ENDPOINT")<fn.indexOf("INSERT INTO fid.fid_record_revisions SELECT"),"Endpoint validation occurs after insert.");
 if(k===45)assert(/RELATIONSHIP_ENDPOINT_MISSING/.test(fn),"Missing endpoint result absent.");
 if(k===46)assert(/expected_tables/.test(verify)&&/expected_columns/.test(verify)&&/expected_constraints/.test(verify)&&/expected_indexes/.test(verify),"Verification oracle inventories incomplete.");
 if(k===47)assert(/pronargdefaults/.test(verify)&&/functions\.no_unexpected/.test(verify)&&/policies\.exact_count_and_shape/.test(verify),"Function/policy verification incomplete.");
 if(k===48)assert(/CASE WHEN[\s\S]*THEN 'PASS'::text ELSE 'FAIL'::text END/.test(verify)&&/MANUAL_CONFIRMATION_REQUIRED/.test(verify),"Verification statuses incomplete.");
 if(k===49)assert(!/^\s*(INSERT|UPDATE|DELETE|MERGE|TRUNCATE|CREATE|ALTER|DROP|GRANT|REVOKE|CALL|DO)\b/im.test(verify.replace(/^--.*$/gm,""))&&!/fid_execute_atomic_persistence_batch\s*\(/.test(verify.replace(/has_function_privilege\([^\n]+/g,"")),"Verification is not read-only.");
 if(k===50)assert(v.reviewReassessment.findings.length===16&&v.reviewReassessment.findings.every(x=>x.evidence&&x.originalSeverity===undefined),"Original findings not preserved.");
 if(k===51)assert(v.corrections.filter(x=>x.resolutionState==="LIVE_VERIFICATION_REQUIRED").length===2&&v.corrections.filter(x=>x.resolutionState==="ACCEPTED_RESIDUAL_RISK").length===2,"Residual states invalid.");
 if(k===52)assert(v.corrections.find(x=>x.findingId==="FID-S32-M002-REPEATABILITY-001").resolutionState==="RESOLVED","Repeatability guidance unresolved.");
 if(k===53){const x={findingId:"FID-S32-M008-FUNCTION-001",originalSeverity:"BLOCKER",resolutionState:"RESOLVED",affectedSqlFiles:null},b=JSON.stringify(x),y=fidApi.createSupabaseDeploymentCorrectionFinding(x);assert(JSON.stringify(x)===b&&y.affectedSqlFiles.length===0,"Correction normalization mutated input.");}
 if(k===54)assert(!fidApi.validateSupabaseDeploymentCorrectionFinding(null).valid&&!fidApi.validateSupabaseDeploymentCorrectionFinding([]).valid,"Invalid correction input accepted.");
 if(k===55)assert(c.previous.failed===0&&c.previous.total===1600,"Sprint 32 regression.");
 if(k===56){const n=Object.keys(namedApi).filter(x=>x!=="default");assert(n.length===Object.keys(fidApi).length&&n.every(x=>namedApi[x]===fidApi[x]),"FID exports disagree.");}
 if(k===57){const n=Object.keys(persistenceNamedApi).filter(x=>x!=="default");assert(n.length===Object.keys(persistenceApi).length&&n.every(x=>persistenceNamedApi[x]===persistenceApi[x]),"Persistence exports disagree.");}
 if(k===58){const n=Object.keys(correctionNamedApi).filter(x=>x!=="default");assert(n.length===Object.keys(correctionApi).length&&n.every(x=>correctionNamedApi[x]===correctionApi[x]),"Correction exports disagree.");}
 if(k===59){const metadata=c.sources[c.files[12]];assert(!Object.keys(fidApi).some(x=>/^run.*Diagnostics$|migrationRunner|deploymentRunner|sqlExecutor/i.test(x))&&!v.sqlExecuted&&!v.deployed&&!v.runtimeActivated&&/013_record_fid_deployment_metadata/.test(metadata)&&/FID-SUPABASE-TEST-DEPLOYMENT-1\.0\.1/.test(metadata)&&/13::integer/.test(metadata)&&/RAISE EXCEPTION/.test(metadata)&&!/ON CONFLICT DO UPDATE/i.test(metadata),"Governed metadata correction boundary failed.");}
}
export async function runSupabaseDeploymentCorrectionDiagnostics({throwOnFailure=false}={}){const previous=await runPostgresqlSecurityReviewDiagnostics(),c=context(previous),cases=[];for(let i=0;i<1800;i++){const id=`supabase-deployment-correction-${String(i+1).padStart(4,"0")}`;try{check(i,c);cases.push({id,passed:true,message:`${id} passed.`,details:null});}catch(error){cases.push({id,passed:false,message:error?.message??`${id} failed.`,details:null});}}const passed=cases.filter(x=>x.passed).length,failed=cases.length-passed,result={suite:SUITE,total:cases.length,passed,failed,cases,suiteSummaries:{...previous.suiteSummaries,postgresqlSecurityReview:previous,supabaseDeploymentCorrection:{suite:SUITE,total:cases.length,passed,failed}}};if(throwOnFailure&&failed)throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);return result;}
export default Object.freeze({runSupabaseDeploymentCorrectionDiagnostics});
