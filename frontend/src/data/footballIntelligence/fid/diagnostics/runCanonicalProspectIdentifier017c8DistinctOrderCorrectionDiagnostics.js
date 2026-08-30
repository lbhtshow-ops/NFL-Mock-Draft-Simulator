import fs from "node:fs";
import {createHash} from "node:crypto";
import failureRecord from "../persistence/deployment/CanonicalProspectIdentifier017c7ExecutionFailureRecord.js";
import review from "../persistence/deployment/CanonicalProspectIdentifier017c8DistinctOrderCorrectionReview.js";
import snapshots from "../persistence/deployment/CanonicalProspectIdentifier017c8DistinctOrderCorrectionSnapshots.js";
import {evaluateCanonicalProspectIdentifier017c8DistinctOrderCorrection as evaluate} from "../persistence/deployment/CanonicalProspectIdentifier017c8DistinctOrderCorrectionEvaluator.js";

const read=(path)=>fs.readFileSync(new URL(path,import.meta.url),"utf8");
const hash=(value)=>createHash("sha256").update(value).digest("hex").toUpperCase();
const assert=(value,message)=>{if(!value)throw new Error(message);};
const sql017c7=read("../persistence/deployment/review/017c7_supabase_function_owner_deployment_capability_read_only_preflight_correction.sql");
const sql017c8=read("../persistence/deployment/review/017c8_supabase_function_owner_deployment_capability_read_only_preflight_distinct_order_correction.sql");
const migration014=read("../persistence/deployment/sql/014_create_fid_identifier_issuance_transaction.sql");
const migrations=fs.readdirSync(new URL("../persistence/deployment/sql/",import.meta.url)).filter((name)=>/^\d{3}_.*\.sql$/.test(name)).sort();
const expected017c8=sql017c7
  .replace("SPRINT 17C.8 SUPABASE FUNCTION-OWNER DEPLOYMENT CAPABILITY PREFLIGHT CORRECTION. READ-ONLY.","SPRINT 17C.10 SUPABASE FUNCTION-OWNER CAPABILITY PREFLIGHT DISTINCT/ORDER CORRECTION. READ-ONLY.")
  .replace(")\nSELECT DISTINCT expected.role_name,", "), distinct_roles AS (\n  SELECT DISTINCT role_name\n  FROM relevant_roles\n)\nSELECT expected.role_name,")
  .replace("FROM relevant_roles AS expected\nLEFT JOIN pg_catalog.pg_roles AS role_record", "FROM distinct_roles AS expected\nLEFT JOIN pg_catalog.pg_roles AS role_record");
const withoutComments=sql017c8.replace(/--[^\r\n]*/g,"");
const structural=withoutComments.replace(/'(?:''|[^'])*'/g,"''");
const statements=withoutComments.split(";").map((statement)=>statement.trim()).filter(Boolean);
const mutation=/\b(insert|update|delete|merge|truncate|copy|create|alter|drop|comment|grant|revoke|set|reset|do|call|execute|prepare|vacuum|analyze|refresh|reindex|cluster|begin|commit|rollback|lock)\b/i;
const locking=/\bFOR\s+(?:UPDATE|NO\s+KEY\s+UPDATE|SHARE|KEY\s+SHARE)\b|\bpg_(?:try_)?advisory_(?:xact_)?lock\b/i;
const preservedTokens=["pg_catalog.pg_roles","pg_catalog.pg_auth_members","inherit_option","set_option","admin_option","'MEMBER WITH ADMIN OPTION'","current_role_exact AND session_role_exact AND set_capability","deployment_schema_usage","deployment_schema_create","owner_schema_usage","owner_schema_create","ownership_transfer_capability"];
const evidence={
  sqlstate:failureRecord.failure.sqlstate,
  failureLine:failureRecord.failure.line,
  resultSetsReturned:failureRecord.failure.resultSetsReturned,
  databaseMutations:failureRecord.effects.databaseMutations,
  preflight017c7Hash:hash(sql017c7),
  migration014Hash:hash(migration014),
  preflight017c8Hash:hash(sql017c8),
  exactNarrowCorrection:sql017c8.replace(/\r\n/g,"\n")===expected017c8.replace(/\r\n/g,"\n"),
  distinctOrderingCompatible:/distinct_roles\s+AS\s*\(\s*SELECT DISTINCT role_name\s+FROM relevant_roles\s*\)/i.test(sql017c8)&&/FROM distinct_roles AS expected[\s\S]*ORDER BY expected\.role_name COLLATE "C";/i.test(sql017c8)&&!/SELECT DISTINCT expected\.role_name/i.test(sql017c8),
  noEquivalentDefect:(sql017c8.match(/SELECT DISTINCT/gi)??[]).length===1&&(sql017c8.match(/\bUNION ALL\b/gi)??[]).length===1&&(sql017c8.match(/\bORDER BY\b/gi)??[]).length===2&&(sql017c8.match(/\bCOLLATE\b/gi)??[]).length===2&&!/\bINTERSECT\b|\bEXCEPT\b|(?:COUNT|SUM|AVG|MIN|MAX)\s*\(\s*DISTINCT/i.test(structural),
  coveragePreserved:preservedTokens.every((token)=>sql017c8.includes(token)),
  readOnly:statements.every((statement)=>/^(SELECT|WITH)\b/i.test(statement))&&!mutation.test(structural)&&!locking.test(structural),
  sanitized:!/\b(pg_authid|pg_shadow|password|passwd|secret|token|credential|connection[_ ]?string|hostname|url|candidate|reservation|ledger|idempotency|payload|audit)\b/i.test(structural),
  inventoryExact:migrations.length===14&&migrations.every((name,index)=>name.startsWith(`${String(index+1).padStart(3,"0")}_`)),
  migration015Absent:!migrations.some((name)=>name.startsWith("015_")),
  noReviewEffects:Object.values(review.permissions).every((value)=>value===false),
};
const result=evaluate(review,evidence);
const tests=[
  ["failure-record",()=>assert(evidence.sqlstate==="42P10"&&evidence.failureLine===34&&evidence.resultSetsReturned===0&&evidence.databaseMutations===0,"failure")],
  ["failure-line",()=>assert(sql017c7.split(/\r?\n/)[33]==='ORDER BY expected.role_name COLLATE "C";',"line")],
  ["protected-hashes",()=>assert(evidence.preflight017c7Hash===review.protected.preflight017c7Sha256&&evidence.migration014Hash===review.protected.migration014Sha256,"hash")],
  ["successor-hash",()=>assert(evidence.preflight017c8Hash===review.successor.sha256,"successor")],
  ["exact-correction",()=>assert(evidence.exactNarrowCorrection,"correction")],
  ["inner-distinct",()=>assert(/SELECT DISTINCT role_name\s+FROM relevant_roles/i.test(sql017c8),"inner distinct")],
  ["outer-order",()=>assert(/FROM distinct_roles AS expected[\s\S]*ORDER BY expected\.role_name COLLATE "C";/i.test(sql017c8),"outer order")],
  ["old-defect-absent",()=>assert(!/SELECT DISTINCT expected\.role_name/i.test(sql017c8),"old defect")],
  ["distinct-count",()=>assert((sql017c8.match(/SELECT DISTINCT/gi)??[]).length===1,"distinct count")],
  ["distinct-aggregate",()=>assert(!/(?:COUNT|SUM|AVG|MIN|MAX)\s*\(\s*DISTINCT/i.test(structural),"aggregate")],
  ["set-operations",()=>assert((sql017c8.match(/\bUNION ALL\b/gi)??[]).length===1&&!/\bINTERSECT\b|\bEXCEPT\b/i.test(structural),"set operation")],
  ["ordering-count",()=>assert((sql017c8.match(/\bORDER BY\b/gi)??[]).length===2&&(sql017c8.match(/\bCOLLATE\b/gi)??[]).length===2,"ordering")],
  ["recursive-union-safe",()=>assert(/\)\s*SELECT source_role[\s\S]*ORDER BY path\.path_depth, reached_role\.rolname COLLATE "C";/i.test(sql017c8),"recursive union")],
  ["no-equivalent-defect",()=>assert(evidence.noEquivalentDefect,"equivalent defect")],
  ["coverage-preserved",()=>assert(evidence.coveragePreserved,"coverage")],
  ["read-only",()=>assert(evidence.readOnly,"read-only")],
  ["sanitized",()=>assert(evidence.sanitized,"sanitized")],
  ["negative-original",()=>assert(!snapshots.originalDistinctCollatedOrder.executionAuthorized,"original")],
  ["negative-union",()=>assert(!snapshots.unionExpressionOrder.executionAuthorized,"union")],
  ["negative-alias",()=>assert(!snapshots.reservedAlias.executionAuthorized,"alias")],
  ["no-automatic-execution",()=>assert(!snapshots.distinctCteOuterCollatedOrder.executionAuthorized&&!result.preflight017c8ExecutionAuthorized,"execution")],
  ["inventory",()=>assert(evidence.inventoryExact&&evidence.migration015Absent,"inventory")],
  ["review-ready",()=>assert(result.status==="READY_FOR_017C8_READ_ONLY_PREFLIGHT_STATIC_REVIEW"&&result.blockers.length===0,"ready")],
  ["no-effects",()=>assert(result.databaseOperations===0&&result.networkDatabaseConnections===0,"effects")],
];

let passed=0;
for(const [name,test] of tests){try{test();passed+=1;console.log(`PASS ${name}`);}catch(error){console.error(`FAIL ${name}: ${error.message}`);}}
console.log(`017c8 DISTINCT/ORDER correction diagnostics: ${passed}/${tests.length}`);
if(passed!==tests.length)globalThis.process.exitCode=1;
