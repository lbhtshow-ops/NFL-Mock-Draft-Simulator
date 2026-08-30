import fs from "node:fs";
import {createHash} from "node:crypto";
import declaration from "../persistence/deployment/CanonicalProspectIdentifier017c8StaticReviewDeclaration.js";
import authorization from "../persistence/deployment/CanonicalProspectIdentifier017c8ExecutionAuthorization.js";
import snapshots from "../persistence/deployment/CanonicalProspectIdentifier017c8StaticReviewSnapshots.js";
import {evaluateCanonicalProspectIdentifier017c8StaticReview as evaluate} from "../persistence/deployment/CanonicalProspectIdentifier017c8StaticReviewEvaluator.js";

const read=(path)=>fs.readFileSync(new URL(path,import.meta.url),"utf8");
const hash=(value)=>createHash("sha256").update(value).digest("hex").toUpperCase();
const assert=(value,message)=>{if(!value)throw new Error(message);};
const sql017c8=read("../persistence/deployment/review/017c8_supabase_function_owner_deployment_capability_read_only_preflight_distinct_order_correction.sql");
const sql017c7=read("../persistence/deployment/review/017c7_supabase_function_owner_deployment_capability_read_only_preflight_correction.sql");
const migration014=read("../persistence/deployment/sql/014_create_fid_identifier_issuance_transaction.sql");
const reconciliation017c5=read("../persistence/deployment/review/017c5_failed_migration_014_read_only_commit_state_reconciliation_postgresql_correction.sql");
const migrations=fs.readdirSync(new URL("../persistence/deployment/sql/",import.meta.url)).filter((name)=>/^\d{3}_.*\.sql$/.test(name)).sort();
const expected017c8=sql017c7.replace("SPRINT 17C.8 SUPABASE FUNCTION-OWNER DEPLOYMENT CAPABILITY PREFLIGHT CORRECTION. READ-ONLY.","SPRINT 17C.10 SUPABASE FUNCTION-OWNER CAPABILITY PREFLIGHT DISTINCT/ORDER CORRECTION. READ-ONLY.").replace(")\nSELECT DISTINCT expected.role_name,", "), distinct_roles AS (\n  SELECT DISTINCT role_name\n  FROM relevant_roles\n)\nSELECT expected.role_name,").replace("FROM relevant_roles AS expected\nLEFT JOIN pg_catalog.pg_roles AS role_record","FROM distinct_roles AS expected\nLEFT JOIN pg_catalog.pg_roles AS role_record");
const withoutComments=sql017c8.replace(/--[^\r\n]*/g,"");
const structural=withoutComments.replace(/'(?:''|[^'])*'/g,"''");
const statements=withoutComments.split(";").map((statement)=>statement.trim()).filter(Boolean);
const mutation=/\b(insert|update|delete|merge|copy|truncate|create|alter|drop|comment|grant|revoke|set|reset|do|call|execute|prepare|begin|commit|rollback|vacuum|analyze|refresh|reindex|cluster|lock)\b/i;
const locking=/\bFOR\s+(?:UPDATE|NO\s+KEY\s+UPDATE|SHARE|KEY\s+SHARE)\b|\bpg_(?:try_)?advisory_(?:xact_)?lock\b/i;
const reservedAlias=/\bAS\s+(?:constraint|select|where|group|order|limit|offset|values|with|recursive|returning|window|over|case|when|then|else|end)\b/i;
const catalogCalls=[...new Set([...structural.matchAll(/pg_catalog\.([a-z_]+)\s*\(/gi)].map((match)=>match[1]))].sort();
const allowedCalls=["current_database","current_setting","has_schema_privilege","pg_has_role","to_regnamespace","to_regrole"].sort();
const capabilities=["current_role_exact AND session_role_exact AND set_capability","deployment_schema_usage","deployment_schema_create","owner_schema_usage","owner_schema_create","membership_governance_capability","inherit_option","set_option","admin_option"];
const balanced=(value)=>{let depth=0;for(const character of value){if(character==="(")depth+=1;if(character===")")depth-=1;if(depth<0)return false;}return depth===0;};
const evidence={
  projectId:declaration.exactTarget.projectId,
  preflight017c8Hash:hash(sql017c8),preflight017c7Hash:hash(sql017c7),migration014Hash:hash(migration014),reconciliation017c5Hash:hash(reconciliation017c5),
  intendedDeltaOnly:sql017c8.replace(/\r\n/g,"\n")===expected017c8.replace(/\r\n/g,"\n"),
  postgresql17Compatible:/distinct_roles\s+AS\s*\(\s*SELECT DISTINCT role_name\s+FROM relevant_roles\s*\)/i.test(sql017c8)&&/FROM distinct_roles AS expected[\s\S]*ORDER BY expected\.role_name COLLATE "C";/i.test(sql017c8)&&(sql017c8.match(/SELECT DISTINCT/gi)??[]).length===1&&(sql017c8.match(/\bUNION ALL\b/gi)??[]).length===1&&!/\bINTERSECT\b|\bEXCEPT\b|(?:COUNT|SUM|AVG|MIN|MAX)\s*\(\s*DISTINCT/i.test(structural)&&!reservedAlias.test(structural)&&balanced(structural),
  readOnly:statements.every((statement)=>/^(SELECT|WITH)\b/i.test(statement))&&!mutation.test(structural)&&!locking.test(structural)&&JSON.stringify(catalogCalls)===JSON.stringify(allowedCalls),
  capabilityComplete:capabilities.every((token)=>sql017c8.includes(token)),
  sanitized:!/\b(pg_authid|pg_shadow|password|passwd|secret|token|credential|connection[_ ]?string|hostname|url|candidate|reservation|ledger|idempotency|payload|audit|prosrc|pg_get_functiondef)\b/i.test(structural),
  inventoryExact:migrations.length===14&&migrations.every((name,index)=>name.startsWith(`${String(index+1).padStart(3,"0")}_`)),migration015Absent:!migrations.some((name)=>name.startsWith("015_")),
  noReviewEffects:Object.values(declaration.effects).every((value)=>value===false||value===0),
};
const result=evaluate(declaration,authorization,evidence);
const tests=[
  ["protected-hashes",()=>assert(evidence.preflight017c8Hash===declaration.artifact.sha256&&evidence.preflight017c7Hash===declaration.protected.preflight017c7Sha256&&evidence.migration014Hash===declaration.protected.migration014Sha256&&evidence.reconciliation017c5Hash===declaration.protected.reconciliation017c5Sha256,"hash")],
  ["authoritative-state",()=>assert(declaration.authoritativeState.migration014State==="MIGRATION_014_FULLY_ROLLED_BACK"&&!declaration.authoritativeState.migration014Applied,"state")],
  ["exact-delta",()=>assert(evidence.intendedDeltaOnly,"delta")],
  ["inner-distinct",()=>assert(/SELECT DISTINCT role_name\s+FROM relevant_roles/i.test(sql017c8),"distinct")],
  ["outer-columns",()=>assert(/SELECT expected\.role_name,[\s\S]*FROM distinct_roles AS expected/i.test(sql017c8),"columns")],
  ["outer-order",()=>assert(/FROM distinct_roles AS expected[\s\S]*ORDER BY expected\.role_name COLLATE "C";/i.test(sql017c8),"order")],
  ["sqlstate-42p10-regression",()=>assert(!/SELECT DISTINCT expected\.role_name/i.test(sql017c8),"42P10")],
  ["distinct-sites",()=>assert((sql017c8.match(/SELECT DISTINCT/gi)??[]).length===1&&!/(?:COUNT|SUM|AVG|MIN|MAX)\s*\(\s*DISTINCT/i.test(structural),"distinct sites")],
  ["compound-sites",()=>assert((sql017c8.match(/\bUNION ALL\b/gi)??[]).length===1&&!/\bINTERSECT\b|\bEXCEPT\b/i.test(structural),"compound")],
  ["order-sites",()=>assert((sql017c8.match(/\bORDER BY\b/gi)??[]).length===2&&(sql017c8.match(/\bCOLLATE\b/gi)??[]).length===2,"orders")],
  ["alias-scope",()=>assert(/FROM distinct_roles AS expected[\s\S]*ORDER BY expected\.role_name/i.test(sql017c8),"scope")],
  ["reserved-alias",()=>assert(!reservedAlias.test(structural)&&!/\bconstraint\./i.test(structural),"alias")],
  ["recursive-termination",()=>assert(sql017c8.includes("visited_roles")&&sql017c8.includes("NOT membership.roleid=ANY(path.visited_roles)"),"recursion")],
  ["postgresql17",()=>assert(evidence.postgresql17Compatible,"postgresql")],
  ["statement-prefixes",()=>assert(statements.every((statement)=>/^(SELECT|WITH)\b/i.test(statement)),"prefix")],
  ["read-only",()=>assert(evidence.readOnly,"read-only")],
  ["function-allowlist",()=>assert(JSON.stringify(catalogCalls)===JSON.stringify(allowedCalls),"calls")],
  ["no-locks",()=>assert(!locking.test(structural),"locks")],
  ["no-role-change",()=>assert(!/\b(?:SET|RESET|GRANT|REVOKE|ALTER\s+ROLE|CREATE\s+ROLE)\b/i.test(structural),"roles")],
  ["no-rpc-uuid",()=>assert(!/\bgen_random_uuid\s*\(|\bfid_execute_prospect_identifier_issuance_transaction\s*\(/i.test(structural),"invocation")],
  ["identity-binding",()=>assert(sql017c8.includes("CURRENT_USER='postgres'")&&sql017c8.includes("SESSION_USER='postgres'")&&sql017c8.includes("current_role_exact AND session_role_exact AND set_capability"),"identity")],
  ["role-schema-existence",()=>assert(["owner_role_oid IS NULL","deployment_role_oid IS NULL","fid_schema_oid IS NULL"].every((token)=>sql017c8.includes(token)),"existence")],
  ["schema-capabilities",()=>assert(evidence.capabilityComplete,"capabilities")],
  ["membership-not-enough",()=>assert(!/\(member_capability\s+AND[\s\S]{0,100}ownership_transfer_capability/i.test(sql017c8),"membership")],
  ["admin-separate",()=>assert(sql017c8.includes("(deployment_role_superuser OR admin_capability) AS membership_governance_capability"),"admin")],
  ["sanitized",()=>assert(evidence.sanitized,"sanitization")],
  ["negative-42p10",()=>assert(snapshots.distinctWithExternalOrderExpression.authorizedExecutions===0,"negative distinct")],
  ["negative-compound",()=>assert(snapshots.compoundExpressionOrder.authorizedExecutions===0,"negative compound")],
  ["negative-alias",()=>assert(snapshots.aliasOutOfScope.authorizedExecutions===0&&!snapshots.wrongCurrentUser.transferCapable,"negative alias")],
  ["false-positive",()=>assert(!snapshots.membershipWithoutSet.transferCapable&&!snapshots.schemaCapabilityMissing.transferCapable&&!snapshots.positiveCapability.migration014ExecutionAuthorized,"false positive")],
  ["authorization-scope",()=>assert(authorization.scope.executionCount===1&&authorization.scope.completeSanitizedResultCaptureRequired&&authorization.scope.mandatoryStopAfterExecution,"authorization")],
  ["prohibitions",()=>assert(Object.values(authorization.prohibited).every(Boolean),"prohibitions")],
  ["second-execution",()=>assert(snapshots.secondExecution.authorizedExecutions===0,"second")],
  ["inventory",()=>assert(evidence.inventoryExact&&evidence.migration015Absent,"inventory")],
  ["ready",()=>assert(result.status==="READY_FOR_CONTROLLED_017C8_READ_ONLY_PREFLIGHT_EXECUTION"&&result.preflight017c8ExecutionAuthorized&&!result.preflight017c7ExecutionAuthorized&&!result.preflight017c6ExecutionAuthorized&&!result.migration014ExecutionAuthorized&&result.blockers.length===0,"ready")],
  ["no-effects",()=>assert(result.databaseOperationsDuringReview===0&&result.networkDatabaseConnectionsDuringReview===0,"effects")],
];

let passed=0;
for(const [name,test] of tests){try{test();passed+=1;console.log(`PASS ${name}`);}catch(error){console.error(`FAIL ${name}: ${error.message}`);}}
console.log(`017c8 static review diagnostics: ${passed}/${tests.length}`);
if(passed!==tests.length)globalThis.process.exitCode=1;
