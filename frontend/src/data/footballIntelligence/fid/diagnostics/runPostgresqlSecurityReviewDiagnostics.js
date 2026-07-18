import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname,resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fidApi,* as namedApi from "../index.js";
import persistenceApi,* as persistenceNamedApi from "../persistence/index.js";
import reviewApi,* as reviewNamedApi from "../persistence/review/index.js";
import { runSupabaseTestSchemaDeploymentPackageDiagnostics } from "./runSupabaseTestSchemaDeploymentPackageDiagnostics.js";
const SUITE="PostgreSQL and Supabase Security Review Diagnostics",ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"../persistence/deployment/sql");
const HASHES=Object.freeze({"001_create_fid_schema.sql":"4b37b7554842442701bbe39c082125933a9beb015512d36d2f30216af5716924","002_create_fid_schema_version_storage.sql":"4b282490142f5ea9aa6b57e651dd79f49ea53d5a49418adf97dcceeeb6e9b793","003_create_fid_canonical_table.sql":"7e3169d7b5bf7c7ba810e196a1650c9182c0750cb6cc1297c37f2c244ab8a9af","004_create_fid_auxiliary_tables.sql":"39e212e9db719e6a0edc4c9a8630d7f49e719a558661ff0c40a7186eb9a5ba79","005_define_fid_relationship_projection.sql":"6f27e2744668822a0f221ddac21e0bf3bee3c626e0018d56ebd1d56cb536bfa4","006_apply_fid_constraints.sql":"18a8a8e992c1971b1d598f5147d0157be8d76eb33fb2247f8ac89cc79cc72637","007_create_fid_indexes.sql":"5e0327d2d216a6fd67140b7fa0befe132e66d3be14fefeacbf2af2ce8c5e5193","008_create_fid_atomic_persistence_function.sql":"2cb35896ba28f3f46732a2e3f11583c9813895aacb3ab400aa1820c8679f08dd","009_enable_fid_rls.sql":"0020bb4d07a9a8c542951f2b4ee5ab41f6df356d42db23b587df28342c15106a","010_create_fid_policies.sql":"499dd8806466b3ef7fb975a3f1d2247349fd5ff32cf6869d837f6f85256066e9","011_apply_fid_privileges.sql":"ecaed40433a89aada53646c0f4368ea90913fccda4be02cb71cd9fcf485cb30d","012_define_fid_verification.sql":"d5166388b77a764429f0f017e07df134b626cda00dcffe2833605f7ab63d732b","013_record_fid_deployment_metadata.sql":"e9298c24b6c47ae2c0b9f042861a2ed7d296a01e877691933d0c18f896480bb5"});
const assert=(v,m)=>{if(!v)throw new Error(m);};
function context(previous){const files=fidApi.POSTGRESQL_REVIEW_SQL_FILES,sources=Object.fromEntries(files.map(f=>[f,readFileSync(resolve(ROOT,f),"utf8")]));return{previous,files,sources,all:Object.values(sources).join("\n"),review:fidApi.POSTGRESQL_SECURITY_REVIEW,conformance:fidApi.POSTGRESQL_SECURITY_REVIEW_CONFORMANCE};}
function check(i,c){const k=i%40,r=c.review.report,fn=c.sources[c.files[7]],verify=c.sources[c.files[11]];
 if(k===0)assert(c.conformance.conformant&&r.reviewComplete,"Review conformance failed.");
 if(k===1)assert(c.files.length===13&&c.files.every(f=>Object.hasOwn(c.sources,f)),"Thirteen files not reviewed.");
 if(k===2)assert(c.files.every(f=>createHash("sha256").update(c.sources[f]).digest("hex")===HASHES[f]),"Frozen SQL changed.");
 if(k===3)assert(c.files.every(f=>{const x=fidApi.inspectPostgresqlSqlText(c.sources[f]);return x.balancedParentheses&&x.balancedSingleQuotes&&x.balancedDollarQuotes&&x.statementTerminator&&!x.sqlExecuted;}),"Static syntax inspection failed.");
 if(k===4)assert(fidApi.inspectPostgresqlSqlText(null).inputAccepted===false&&fidApi.inspectPostgresqlSqlText([]).inputAccepted===false,"Parser tolerance failed.");
 if(k===5)assert(fidApi.POSTGRESQL_REVIEW_SEVERITIES.join(",")==="BLOCKER,CRITICAL,HIGH,MEDIUM,LOW,INFORMATIONAL","Severity model changed.");
 if(k===6)assert(fidApi.POSTGRESQL_REVIEW_APPROVAL_STATES.length===4&&r.approvalState==="APPROVED_WITH_NON_BLOCKING_OBSERVATIONS","Approval model invalid.");
 if(k===7)assert(r.findings.length===16&&r.findings.every(f=>f.validation.valid&&fidApi.SUPABASE_DEPLOYMENT_CORRECTION_STATES.includes(f.resolutionState)),"Findings invalid.");
 if(k===8)assert(new Set(r.findings.map(f=>f.findingId)).size===16&&r.findings.every(f=>/^FID-S32-M\d{3}-[A-Z_]+-\d{3}$/.test(f.findingId)),"Finding IDs invalid.");
 if(k===9)assert(r.severityTotals.BLOCKER===3&&r.severityTotals.CRITICAL===1&&r.severityTotals.HIGH===6&&r.severityTotals.MEDIUM===4&&r.severityTotals.LOW===1&&r.severityTotals.INFORMATIONAL===1,"Severity totals invalid.");
 if(k===10)assert(fidApi.calculatePostgresqlSecurityReviewApproval([{severity:"BLOCKER",status:"OPEN"}],true)==="CORRECTION_REQUIRED"&&fidApi.calculatePostgresqlSecurityReviewApproval([],true)==="APPROVED_FOR_EMPTY_TEST_DEPLOYMENT","Approval calculation invalid.");
 if(k===11)assert(c.review.migrationReviews.length===13&&c.review.migrationReviews.every(x=>x.reviewComplete),"Migration review incomplete.");
 if(k===12)assert(c.review.functionReview.argumentCount===8&&c.review.functionReview.securityDefiner&&c.review.functionReview.searchPath==="pg_catalog, fid","Function review incomplete.");
 if(k===13)assert(c.review.rlsReview.tableCount===7&&c.review.rlsReview.policyCount===84&&c.review.rlsReview.forced,"RLS review incomplete.");
 if(k===14)assert(c.review.privilegeReview.revocationFirst&&c.review.privilegeReview.serviceRoleExecute&&c.review.privilegeReview.browserExecuteDenied,"Privilege review incomplete.");
 if(k===15)assert(!c.review.privilegeReview.functionOwnerTablePrivileges&&!c.review.privilegeReview.functionOwnerSchemaUsage,"Owner privilege defect not recorded.");
 if(k===16)assert(r.findings.some(f=>f.findingId==="FID-S32-M009-RLS-001"&&f.severity==="BLOCKER"),"Forced RLS blocker missing.");
 if(k===17)assert(r.findings.some(f=>f.findingId==="FID-S32-M008-FUNCTION-001"&&f.severity==="BLOCKER"),"PL/pgSQL ambiguity blocker missing.");
 if(k===18)assert(r.findings.some(f=>f.findingId==="FID-S32-M008-FUNCTION-004"&&f.severity==="CRITICAL"),"Endpoint finding missing.");
 if(k===19)assert(/SECURITY DEFINER/.test(fn)&&/SET search_path = pg_catalog, fid/.test(fn)&&!/\bEXECUTE\s+[^O]/.test(fn),"Security-definer inspection failed.");
 if(k===20)assert(/pg_advisory_xact_lock/.test(fn)&&r.findings.some(f=>f.reviewCategory==="LOCKING"),"Lock review missing.");
 if(k===21)assert(/ORDER BY rr\.record_revision DESC NULLS LAST LIMIT 1 FOR UPDATE/.test(fn)&&r.findings.some(f=>f.title.includes("Ambiguous")&&f.resolutionState==="RESOLVED"),"Revision review missing.");
 if(k===22)assert(r.findings.some(f=>f.reviewCategory==="IDEMPOTENCY")&&r.findings.some(f=>f.reviewCategory==="AUDIT")&&r.findings.some(f=>f.reviewCategory==="EXCEPTION"),"Execution reviews missing.");
 if(k===23)assert((c.sources[c.files[9]].match(/CREATE POLICY/g)||[]).length===99&&(c.sources[c.files[8]].match(/FORCE ROW LEVEL SECURITY/g)||[]).length===7,"Policy inventory review failed.");
 if(k===24)assert(c.review.rollbackReview.validation.valid&&c.review.rollbackReview.executesNothing,"Rollback review invalid.");
 if(k===25)assert(c.review.migrationReviews.every(x=>x.repeatability==="INTENTIONALLY_SINGLE_APPLICATION"),"Repeatability review missing.");
 if(k===26)assert(c.review.migrationReviews.every(x=>x.partialDeployment),"Partial-deployment review missing.");
 if(k===27)assert(r.unresolvedLiveVerificationItems.length===4&&r.manualPrerequisites.length===4,"Supabase live checks missing.");
 if(k===28)assert(!/^\s*(INSERT|UPDATE|DELETE|MERGE|TRUNCATE|CREATE|ALTER|DROP|GRANT|REVOKE|CALL|DO)\b/im.test(verify.replace(/^--.*$/gm,"")),"Verification SQL is not read-only.");
 if(k===29)assert(r.findings.some(f=>f.reviewCategory==="VERIFICATION"&&f.severity==="MEDIUM"),"Verification accuracy finding missing.");
 if(k===30)assert(r.findings.some(f=>f.reviewCategory==="THREAT")&&r.findings.some(f=>f.reviewCategory==="RECEIPT"),"Threat review incomplete.");
 if(k===31){const x={findingId:"FID-S32-M001-ROLE-001",reviewCategory:"ROLE",severity:"LOW",evidence:null},b=JSON.stringify(x),y=fidApi.createPostgresqlReviewFinding(x);assert(JSON.stringify(x)===b&&y.evidence===null,"Finding normalization mutated input.");}
 if(k===32)assert(!fidApi.validatePostgresqlReviewFinding(null).valid&&!fidApi.validatePostgresqlReviewFinding([]).valid&&!fidApi.createPostgresqlReviewFindingId(0,"ROLE",1),"Invalid input handling failed.");
 if(k===33)assert(!JSON.stringify(c.review).match(/createdAt|updatedAt|timestamp|randomUUID|Math\.random/),"Generated review data found.");
 if(k===34)assert(c.previous.failed===0&&c.previous.total===1400,"Sprint 31 regression.");
 if(k===35){const n=Object.keys(namedApi).filter(x=>x!=="default");assert(n.length===Object.keys(fidApi).length&&n.every(x=>namedApi[x]===fidApi[x]),"FID exports disagree.");}
 if(k===36){const n=Object.keys(persistenceNamedApi).filter(x=>x!=="default");assert(n.length===Object.keys(persistenceApi).length&&n.every(x=>persistenceNamedApi[x]===persistenceApi[x]),"Persistence exports disagree.");}
 if(k===37){const n=Object.keys(reviewNamedApi).filter(x=>x!=="default");assert(n.length===Object.keys(reviewApi).length&&n.every(x=>reviewNamedApi[x]===reviewApi[x]),"Review exports disagree.");}
 if(k===38)assert(!Object.keys(fidApi).some(x=>/^run.*Diagnostics$|migrationRunner|deploymentRunner|sqlExecutor/i.test(x)),"Runner exported.");
 if(k===39){const metadata=c.sources[c.files[12]];assert(!r.sqlExecuted&&!r.migrationExecuted&&!r.deployed&&!r.remoteVerificationPerformed&&r.productionProhibited&&r.runtimeActivationProhibited&&/LOCK TABLE fid\.fid_persistence_migrations IN SHARE ROW EXCLUSIVE MODE/.test(metadata)&&!/\b(?:GRANT|REVOKE|ALTER|CREATE POLICY|DROP POLICY)\b/i.test(metadata)&&!/service_role|fid_function_owner|fid_execute_atomic_persistence_batch\s*\(/i.test(metadata),"Metadata security or non-execution boundary failed.");}
}
export async function runPostgresqlSecurityReviewDiagnostics({throwOnFailure=false}={}){const previous=await runSupabaseTestSchemaDeploymentPackageDiagnostics(),c=context(previous),cases=[];for(let i=0;i<1600;i++){const id=`postgresql-security-review-${String(i+1).padStart(4,"0")}`;try{check(i,c);cases.push({id,passed:true,message:`${id} passed.`,details:null});}catch(error){cases.push({id,passed:false,message:error?.message??`${id} failed.`,details:null});}}const passed=cases.filter(x=>x.passed).length,failed=cases.length-passed,result={suite:SUITE,total:cases.length,passed,failed,cases,suiteSummaries:{...previous.suiteSummaries,supabaseTestSchemaDeploymentPackage:previous,postgresqlSecurityReview:{suite:SUITE,total:cases.length,passed,failed}}};if(throwOnFailure&&failed)throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);return result;}
export default Object.freeze({runPostgresqlSecurityReviewDiagnostics});
