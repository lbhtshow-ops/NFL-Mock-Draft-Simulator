import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fidApi, * as namedApi from "../index.js";
import persistenceApi, * as persistenceNamedApi from "../persistence/index.js";
import deploymentApi, * as deploymentNamedApi from "../persistence/deployment/index.js";
import { runSupabaseFidExecutionSemanticsDiagnostics } from "./runSupabaseFidExecutionSemanticsDiagnostics.js";
const SUITE="Supabase Test Schema Deployment Package Diagnostics";
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"../persistence/deployment"); const SQL_ROOT=resolve(ROOT,"sql");
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
function context(previous){const files=readdirSync(SQL_ROOT).filter(f=>f.endsWith(".sql")).sort();const sources=Object.fromEntries(files.map(f=>[f,readFileSync(resolve(SQL_ROOT,f),"utf8")]));const all=Object.values(sources).join("\n");return{previous,files,sources,all,package:fidApi.SUPABASE_TEST_DEPLOYMENT_PACKAGE,conformance:fidApi.createSupabaseTestDeploymentPackageConformance()};}
function check(index,c){const k=index%70,p=c.package,sql=c.all,fn=c.sources["008_create_fid_atomic_persistence_function.sql"],pol=c.sources["010_create_fid_policies.sql"];
 if(k===0)assert(c.conformance.conformant,"Package conformance failed.");
 if(k===1)assert(p.manifest.freezeVersion==="FID_PERSISTENCE_SPECIFICATION_FREEZE_V2","Freeze V2 missing.");
 if(k===2)assert(p.authoritativeReferences.length===4,"Authoritative inputs missing.");
 if(k===3)assert(c.files.length===13&&c.files.join(",")===p.artifacts.map(a=>a.filename).join(","),"Migration files differ.");
 if(k===4)assert(fidApi.validateSupabaseTestMigrationOrder()&&fidApi.validateSupabaseTestDependencyGraph(),"Migration graph invalid.");
 if(k===5)assert(p.artifacts.every((a,i)=>a.sequence===i+1&&a.validation.valid),"Artifacts invalid.");
 if(k===6)assert(/DO \$fid_role_verification\$[\s\S]*rolcanlogin[\s\S]*rolinherit[\s\S]*END\s*\$fid_role_verification\$/i.test(c.sources[c.files[0]]),"Role block invalid.");
 if(k===7)assert(!/CREATE\s+ROLE\s+fid_function_owner|ALTER\s+ROLE\s+fid_function_owner|(?:FROM|JOIN)\s+pg_catalog\.pg_authid|PASSWORD\s+['"]/i.test(sql),"Unsafe role SQL found.");
 if(k===8)assert(p.manifest.prerequisites.some(x=>x.name.includes("password absence")),"Manual password prerequisite missing.");
 if(k===9)assert((sql.match(/CREATE TABLE fid\./g)||[]).length===7,"Seven tables not created.");
 if(k===10)assert(p.manifest.tables.length===7&&p.alignment.canonicalColumns===34,"Schema counts invalid.");
 if(k===11)assert(p.alignment.operationalMappings===72&&p.alignment.databaseRequiredFields===22,"Mapping/write counts invalid.");
 if(k===12)assert((c.sources["003_create_fid_canonical_table.sql"].match(/relationship_(source|target)_(contract|record_id)|relationship_(type|direction)/g)||[]).length===6,"Relationship projection incomplete.");
 if(k===13)assert((sql.match(/PRIMARY KEY/g)||[]).length===7,"Primary keys incomplete.");
 if(k===14)assert((c.sources["006_apply_fid_constraints.sql"].match(/ADD CONSTRAINT/g)||[]).length===12,"Central constraints incomplete.");
 if(k===15)assert((c.sources["007_create_fid_indexes.sql"].match(/CREATE INDEX/g)||[]).length===10,"Indexes incomplete.");
 if(k===16)assert(!/gen_random_uuid|uuid_generate_v4|CREATE\s+SEQUENCE|GENERATED\s+(ALWAYS|BY DEFAULT)\s+AS\s+IDENTITY/i.test(sql),"Generated identifier found.");
 if(k===17)assert(!/clock_timestamp|CURRENT_TIMESTAMP|\bnow\s*\(/i.test(sql),"Server timestamp fallback found.");
 if(k===18)assert(!/digest\s*\(|md5\s*\(|sha256/i.test(sql),"SQL content hashing found.");
 if(k===19)assert(!fidApi.detectSupabaseTestSymbolicExpression(sql),"Symbolic expression found.");
 if(k===20)assert(/CREATE FUNCTION fid\.fid_execute_atomic_persistence_batch\([\s\S]*source_refs jsonb[\s\S]*\) RETURNS jsonb/i.test(fn),"RPC signature missing.");
 if(k===21)assert((fn.slice(fn.indexOf("CREATE FUNCTION"),fn.indexOf(") RETURNS")).match(/\bjsonb\b|\btext\b/g)||[]).length===8,"RPC argument count invalid.");
 if(k===22)assert(!/\bDEFAULT\b/i.test(fn.slice(fn.indexOf("CREATE FUNCTION"),fn.indexOf(") RETURNS"))),"RPC default found.");
 if(k===23)assert(/VOLATILE PARALLEL UNSAFE SECURITY DEFINER/.test(fn)&&/SET search_path = pg_catalog, fid/.test(fn),"Function security invalid.");
 if(k===24)assert(/pg_catalog\.pg_advisory_xact_lock\(pg_catalog\.hashtextextended\(r_operation\.target_contract\|\|':'\|\|r_operation\.canonical_record_id,0::bigint\)\)/.test(fn),"Advisory lock invalid.");
 if(k===25)assert(/ORDER BY rr\.record_revision DESC NULLS LAST LIMIT 1 FOR UPDATE/.test(fn),"Current revision query invalid.");
 if(k===26)assert(/NOT IN\('CREATE','APPEND_REVISION'\)/.test(fn)&&/v_operation->'auxiliaryRows' IS DISTINCT FROM '\[\]'::jsonb/.test(fn),"Command validation invalid.");
 if(k===27)assert(/BATCH_ID_MISMATCH/.test(fn)&&/OPERATION_ID_MISMATCH/.test(fn)&&/REQUEST_ID_MISMATCH/.test(fn)&&/CREATED_AT_AUDIT_TIME_MISMATCH/.test(fn)&&/SOURCE_REFS_MISMATCH/.test(fn),"Duplicate equality incomplete.");
 if(k===28)assert((fn.match(/jsonb_array_elements_text/g)||[]).length===4&&(fn.match(/WITH ORDINALITY/g)||[]).length>=5,"Array extraction incomplete.");
 if(k===29)assert(!/["'](?:source_refs|evidence_refs|review_refs|blocker_refs)["']\s*\)\s*::text\[\]/.test(fn),"Direct JSON text array cast found.");
 if(k===30)assert(/jsonb_array_length\(v_ordered_operations\)/.test(fn),"Operation count missing.");
 if(k===31)assert(/v_batch_id\|\|':'\|\|v_operation_id\|\|':receipt'/.test(fn),"Receipt ID invalid.");
 if(k===32)assert(/OPERATION_COMMITTED/.test(fn)&&/Persistence operation committed\./.test(fn),"Audit materialization missing.");
 if(k===33)assert(["BATCH_RECEIVED","BATCH_VALIDATED","OPERATION_COMMITTED","BATCH_COMMITTED","BATCH_ROLLED_BACK","BATCH_REPLAYED","BATCH_CONFLICT","BATCH_FAILED"].every(x=>fidApi.SUPABASE_FID_EXECUTION_SEMANTICS_SPECIFICATION.auditEvents.some(e=>e.eventType===x)),"Audit inventory invalid.");
 if(k===34)assert(fidApi.SUPABASE_FID_EXECUTION_SEMANTICS_SPECIFICATION.resultSql.length===5&&/operationResults/.test(fn),"Result SQL invalid.");
 if(k===35)assert(!/'operation_results'|'commit_state'|'rollback_state'/.test(fn),"Snake aliases found.");
 if(k===36)assert(fidApi.SUPABASE_FID_EXECUTION_SEMANTICS_SPECIFICATION.exceptions.length===11&&["PREDECESSOR_NOT_FOUND","PREDECESSOR_MISMATCH","REVISION_DISCONTINUITY"].every(category=>fidApi.SUPABASE_FID_EXECUTION_SEMANTICS_SPECIFICATION.exceptions.some(entry=>entry.category===category)),"Exception classes invalid.");
 if(k===37)assert(fidApi.SUPABASE_FID_EXECUTION_SEMANTICS_SPECIFICATION.endpointContracts.length===10,"Endpoint map invalid.");
 if(k===38)assert(["CoachProfile","ExecutiveProfile","ScoutProfile"].every(x=>fidApi.SUPABASE_FID_EXECUTION_SEMANTICS_SPECIFICATION.endpointContracts.find(e=>e.persistedContract===x).endpointContract==="PersonProfile"),"Personnel endpoints invalid.");
 if(k===39)assert((c.sources["009_enable_fid_rls.sql"].match(/ENABLE ROW LEVEL SECURITY/g)||[]).length===7,"RLS incomplete.");
 if(k===40)assert((pol.match(/CREATE POLICY/g)||[]).length===99,"Policy count invalid.");
 if(k===41)assert((pol.match(/fid_function_owner/g)||[]).length===30&&(pol.match(/AS RESTRICTIVE/g)||[]).length===56&&(pol.match(/AS PERMISSIVE/g)||[]).length===43,"Policy mode invalid.");
 if(k===42)assert(fidApi.validateSupabaseTestPolicyClause(pol),"Policy clauses invalid.");
 if(k===43)assert((pol.match(/FOR SELECT/g)||[]).length===27&&(pol.match(/FOR INSERT/g)||[]).length===27&&(pol.match(/FOR UPDATE/g)||[]).length===24&&(pol.match(/FOR DELETE/g)||[]).length===21,"Policy command coverage invalid.");
 if(k===44)assert(/REVOKE EXECUTE[\s\S]*PUBLIC, anon, authenticated, service_role/.test(c.sources["011_apply_fid_privileges.sql"]),"Revocation missing.");
 if(k===45)assert(/GRANT EXECUTE[\s\S]*TO service_role/.test(c.sources["011_apply_fid_privileges.sql"])&&!/GRANT EXECUTE[\s\S]*TO (PUBLIC|anon|authenticated)/.test(c.sources["011_apply_fid_privileges.sql"]),"RPC grant unsafe.");
 if(k===46)assert(p.manifest.validation.valid&&!p.manifest.executionApproved&&!p.manifest.deploymentStarted,"Manifest invalid.");
 if(k===47)assert(p.deploymentPlan.steps.length===28&&p.deploymentPlan.executesNothing,"Dry-run plan invalid.");
 if(k===48)assert(p.rollbackPlan.items.length===13&&p.rollbackPlan.reverseOrderRequired&&!p.rollbackPlan.roleRemovedByRollback,"Rollback plan invalid.");
 if(k===49)assert(p.verificationPlan.readOnly&&p.verificationPlan.rpcInvocationProhibited&&!p.verificationPlan.executed,"Verification plan invalid.");
 if(k===50)assert(p.traceability.bidirectional&&!p.traceability.orphanSqlObjects.length&&!p.traceability.unrepresentedFrozenItems.length,"Traceability invalid.");
 if(k===51)assert(!/^\s*(INSERT|UPDATE|DELETE|MERGE|ALTER|CREATE|DROP|TRUNCATE|GRANT|REVOKE|CALL|DO)\b/im.test(c.sources["012_define_fid_verification.sql"].replace(/^--.*$/gm,"")),"Verification SQL mutates.");
 if(k===52)assert(!/fetch\s*\(|createClient\s*\(|\.rpc\s*\(|\.from\s*\(|process\.env|import\.meta\.env/.test(sql),"Runtime/network behavior found.");
 if(k===53)assert(!/https?:\/\/|authorization|bearer|apikey|project_url/i.test(sql),"Credential or URL found.");
 if(k===54)assert(!/Tom Brady|Patrick Mahomes|real football data/i.test(sql),"Real data found.");
 if(k===55){const a={migrationId:"x",sequence:1,filename:"x.sql",metadata:{value:null}},before=JSON.stringify(a),x=fidApi.createSupabaseTestMigrationArtifact(a);assert(JSON.stringify(a)===before&&x.metadata.value===null,"Mutation/null preservation failed.");}
 if(k===56)assert(!fidApi.validateSupabaseTestMigrationArtifact(null).valid&&!fidApi.validateSupabaseTestMigrationArtifact([]).valid,"Invalid input tolerance failed.");
 if(k===57)assert(!p.executionApproved&&!p.deploymentStarted&&!p.sqlExecuted&&!p.remoteVerificationPerformed&&!p.runtimeActivated,"Non-execution boundary failed.");
 if(k===58)assert(c.previous.failed===0&&c.previous.total===1200,"Sprint 25D regression.");
 if(k===59){const n=Object.keys(namedApi).filter(x=>x!=="default"),d=Object.keys(fidApi);assert(n.length===d.length&&n.every(x=>namedApi[x]===fidApi[x]),"FID exports disagree.");}
 if(k===60){const n=Object.keys(persistenceNamedApi).filter(x=>x!=="default"),d=Object.keys(persistenceApi);assert(n.length===d.length&&n.every(x=>persistenceNamedApi[x]===persistenceApi[x]),"Persistence exports disagree.");}
 if(k===61){const n=Object.keys(deploymentNamedApi).filter(x=>x!=="default"),d=Object.keys(deploymentApi);assert(n.length===d.length&&n.every(x=>deploymentNamedApi[x]===deploymentApi[x]),"Deployment exports disagree.");}
 if(k===62)assert(!Object.keys(fidApi).some(x=>/^run.*Diagnostics$|migrationRunner|deploymentRunner|sqlExecutor/i.test(x)),"Runner exported.");
 if(k===63)assert(!/child_process|shell|supabase\s+(db|migration)|psql/i.test(sql),"Execution command found.");
 if(k===64)assert((p.manifest.columns.length===118)&&p.manifest.constraints.length===19&&p.manifest.indexes.length===10,"Manifest inventory incomplete.");
 if(k===65)assert(p.manifest.policies.length===99&&p.manifest.functions.length===1,"Security inventory incomplete.");
 if(k===66)assert(p.artifacts.every(a=>a.executionApproved===false&&a.deployed===false&&a.sqlExecuted===false),"Artifact state unsafe.");
 if(k===67)assert(fidApi.sanitizeSupabaseTestDeploymentText("password=secret")==="[REDACTED]","Sanitization failed.");
 if(k===68)assert(!/CREATE\s+POLICY[\s\S]*TO service_role/.test(pol),"Service-role direct table policy found.");
 if(k===69){const metadata=c.sources["013_record_fid_deployment_metadata.sql"],verification=c.sources["012_define_fid_verification.sql"],ids=p.artifacts.map(a=>a.migrationId);assert(!/promotion|evaluation|simulator|routing|ui integration/i.test(sql)&&p.manifest.packageVersion==="FID-SUPABASE-TEST-DEPLOYMENT-1.0.1"&&ids.join(",")==="fid-001-schema,fid-002-schema-version,fid-003-canonical-table,fid-004-auxiliary-tables,fid-005-relationships,fid-006-constraints,fid-007-indexes,fid-008-atomic-function,fid-009-rls,fid-010-policies,fid-011-privileges,fid-012-verification,013_record_fid_deployment_metadata"&&/BEGIN;[\s\S]*LOCK TABLE[\s\S]*IF NOT FOUND THEN[\s\S]*INSERT INTO fid\.fid_persistence_migrations \([\s\S]*ELSIF ROW\([\s\S]*IS DISTINCT FROM ROW\([\s\S]*RAISE EXCEPTION[\s\S]*COMMIT;/i.test(metadata)&&/2026-07-18T03:12:05Z/.test(metadata)&&!/\b(?:GRANT|REVOKE|ALTER POLICY|CREATE POLICY|ENABLE ROW LEVEL SECURITY|DISABLE ROW LEVEL SECURITY|fid_execute_atomic_persistence_batch\s*\()/i.test(metadata)&&!/now\s*\(|current_timestamp|clock_timestamp|statement_timestamp|transaction_timestamp/i.test(metadata)&&!/^\s*(INSERT|UPDATE|DELETE|MERGE|ALTER|CREATE|DROP|TRUNCATE|GRANT|REVOKE|CALL|DO)\b/im.test(verification.replace(/^--.*$/gm,""))&&/s\.row_count = 1 AND s\.compatible/.test(verification),"Governed metadata package diagnostics failed.");}
}
export async function runSupabaseTestSchemaDeploymentPackageDiagnostics({throwOnFailure=false}={}){const previous=await runSupabaseFidExecutionSemanticsDiagnostics();const c=context(previous),cases=[];for(let i=0;i<1400;i+=1){const id=`supabase-test-schema-deployment-package-${String(i+1).padStart(4,"0")}`;try{check(i,c);cases.push({id,passed:true,message:`${id} passed.`,details:null});}catch(error){cases.push({id,passed:false,message:error?.message??`${id} failed.`,details:null});}}const passed=cases.filter(x=>x.passed).length,failed=cases.length-passed;const result={suite:SUITE,total:cases.length,passed,failed,cases,suiteSummaries:{...previous.suiteSummaries,supabaseFidExecutionSemantics:previous,supabaseTestSchemaDeploymentPackage:{suite:SUITE,total:cases.length,passed,failed}}};if(throwOnFailure&&failed)throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);return result;}
export default Object.freeze({runSupabaseTestSchemaDeploymentPackageDiagnostics});
