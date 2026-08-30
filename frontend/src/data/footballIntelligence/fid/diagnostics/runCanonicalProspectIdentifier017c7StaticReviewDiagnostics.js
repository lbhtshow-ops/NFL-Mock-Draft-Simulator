import fs from "node:fs";
import { createHash } from "node:crypto";
import declaration from "../persistence/deployment/CanonicalProspectIdentifier017c7StaticReviewDeclaration.js";
import authorization from "../persistence/deployment/CanonicalProspectIdentifier017c7ExecutionAuthorization.js";
import snapshots from "../persistence/deployment/CanonicalProspectIdentifier017c7StaticReviewSnapshots.js";
import { evaluateCanonicalProspectIdentifier017c7StaticReview as evaluate } from "../persistence/deployment/CanonicalProspectIdentifier017c7StaticReviewEvaluator.js";

const read = (path) => fs.readFileSync(new URL(path,import.meta.url),"utf8");
const hash = (value) => createHash("sha256").update(value).digest("hex").toUpperCase();
const assert = (value,message) => { if (!value) throw new Error(message); };
const sql017c7 = read("../persistence/deployment/review/017c7_supabase_function_owner_deployment_capability_read_only_preflight_correction.sql");
const sql017c6 = read("../persistence/deployment/review/017c6_supabase_function_owner_deployment_capability_read_only_preflight.sql");
const migration014 = read("../persistence/deployment/sql/014_create_fid_identifier_issuance_transaction.sql");
const reconciliation017c5 = read("../persistence/deployment/review/017c5_failed_migration_014_read_only_commit_state_reconciliation_postgresql_correction.sql");
const migrations = fs.readdirSync(new URL("../persistence/deployment/sql/",import.meta.url)).filter((name) => /^\d{3}_.*\.sql$/.test(name)).sort();
const withoutComments = sql017c7.replace(/--[^\r\n]*/g,"");
const structural = withoutComments.replace(/'(?:''|[^'])*'/g,"''");
const statements = withoutComments.split(";").map((statement) => statement.trim()).filter(Boolean);
const mutation = /\b(insert|update|delete|merge|truncate|copy|create|alter|drop|comment|grant|revoke|set|reset|do|call|execute|prepare|vacuum|analyze|refresh|reindex|cluster|begin|commit|rollback|savepoint|lock)\b/i;
const locking = /\bFOR\s+(?:UPDATE|NO\s+KEY\s+UPDATE|SHARE|KEY\s+SHARE)\b|\bpg_(?:try_)?advisory_(?:xact_)?lock\b/i;
const forbiddenAlias = /\bAS\s+(?:constraint|select|where|group|order|limit|offset|values|with|recursive|returning|window|over|case|when|then|else|end)\b/i;
const blockPrefix = (sql) => sql.slice(0,sql.indexOf("-- BLOCK E:")).replace(/^-- SPRINT[^\r\n]*/m,"-- VERSION_HEADER").replace(/\r\n/g,"\n");
const calledCatalogFunctions = [...new Set([...structural.matchAll(/pg_catalog\.([a-z_]+)\s*\(/gi)].map((match) => match[1]))].sort();
const allowedCatalogFunctions = ["current_database","current_setting","has_schema_privilege","pg_has_role","to_regnamespace","to_regrole"].sort();
const coverageTokens = [
  "DIRECT_MEMBERSHIP_ABSENT", "INTERMEDIATE_MEMBERSHIP_PATH", "member_capability", "inherited_usage_capability", "set_capability",
  "inherit_option", "set_option", "admin_option", "membership_governance_capability", "deployment_schema_usage", "deployment_schema_create",
  "owner_schema_usage", "owner_schema_create", "TARGET_OWNER_ROLE_MISSING", "DEPLOYMENT_ROLE_MISSING", "FID_SCHEMA_MISSING",
  "EXECUTION_IDENTITY_MISMATCH", "MEMBERSHIP_PATH_WITHOUT_EFFECTIVE_SET", "OWNERSHIP_CAPABILITY_UNRESOLVED", "ownership_transfer_capability",
];
const balanced = (value) => {
  let depth=0;
  for(const character of value){if(character==="(")depth+=1;if(character===")")depth-=1;if(depth<0)return false;}
  return depth===0;
};
const evidence = {
  projectId: declaration.exactTarget.projectId,
  preflight017c7Hash: hash(sql017c7),
  preflight017c6Hash: hash(sql017c6),
  migration014Hash: hash(migration014),
  reconciliation017c5Hash: hash(reconciliation017c5),
  intendedDeltaOnly: blockPrefix(sql017c6) === blockPrefix(sql017c7) && sql017c7.includes("current_role_exact") && sql017c7.includes("deployment_schema_usage") && sql017c7.includes("owner_schema_usage"),
  readOnlySafe: statements.every((statement) => /^(SELECT|WITH)\b/i.test(statement)) && !mutation.test(structural) && !locking.test(structural) && JSON.stringify(calledCatalogFunctions) === JSON.stringify(allowedCatalogFunctions),
  postgresql17Compatible: ["pg_catalog.pg_roles","pg_catalog.pg_auth_members","inherit_option","set_option","admin_option","'MEMBER WITH ADMIN OPTION'","pg_catalog.to_regrole","pg_catalog.to_regnamespace","pg_catalog.has_schema_privilege"].every((token) => sql017c7.includes(token)) && balanced(structural) && !forbiddenAlias.test(structural) && !/ORDER\s+BY\s+(?:CASE|pg_catalog\.)/i.test(structural),
  identitiesBound: sql017c7.includes("CURRENT_USER='postgres' AS current_role_exact") && sql017c7.includes("SESSION_USER='postgres' AS session_role_exact") && sql017c7.includes("current_role_exact AND session_role_exact AND set_capability"),
  coverageComplete: coverageTokens.every((token) => sql017c7.includes(token)),
  sanitized: !/\b(pg_authid|pg_shadow|password|passwd|secret|token|credential|connection[_ ]?string|hostname|url|environment|candidate|reservation|ledger|idempotency|payload|audit|prosrc|pg_get_functiondef)\b/i.test(structural),
  inventoryExact: migrations.length===14 && migrations.every((name,index) => name.startsWith(`${String(index+1).padStart(3,"0")}_`)),
  migration015Absent: !migrations.some((name) => name.startsWith("015_")),
  noReviewEffects: Object.values(declaration.effects).every((value) => value===false || value===0),
};
const result = evaluate(declaration,authorization,evidence);
const tests = [
  ["protected-hashes",()=>assert(evidence.preflight017c7Hash===declaration.artifact.sha256&&evidence.preflight017c6Hash===declaration.protected.preflight017c6Sha256&&evidence.migration014Hash===declaration.protected.migration014Sha256&&evidence.reconciliation017c5Hash===declaration.protected.reconciliation017c5Sha256,"hash")],
  ["authoritative-state",()=>assert(declaration.authoritativeState.migration014State==="MIGRATION_014_FULLY_ROLLED_BACK"&&!declaration.authoritativeState.migration014Applied,"state")],
  ["intended-delta",()=>assert(evidence.intendedDeltaOnly,"delta")],
  ["statement-prefixes",()=>assert(statements.every((statement)=>/^(SELECT|WITH)\b/i.test(statement)),"prefix")],
  ["no-mutation",()=>assert(evidence.readOnlySafe,"mutation")],
  ["called-function-allowlist",()=>assert(JSON.stringify(calledCatalogFunctions)===JSON.stringify(allowedCatalogFunctions),"functions")],
  ["no-locks",()=>assert(!locking.test(structural),"locks")],
  ["no-role-change",()=>assert(!/\b(?:SET|RESET|GRANT|REVOKE|ALTER\s+ROLE|CREATE\s+ROLE)\b/i.test(structural),"role change")],
  ["no-rpc-or-uuid",()=>assert(!/\bgen_random_uuid\s*\(|\bfid_execute_prospect_identifier_issuance_transaction\s*\(/i.test(structural),"invocation")],
  ["postgresql17-catalogs",()=>assert(evidence.postgresql17Compatible,"catalog")],
  ["recursive-termination",()=>assert(sql017c7.includes("visited_roles")&&sql017c7.includes("NOT membership.roleid=ANY(path.visited_roles)"),"recursive")],
  ["admin-mode",()=>assert(sql017c7.includes("'MEMBER WITH ADMIN OPTION'"),"admin")],
  ["no-union-order-defect",()=>assert(!/ORDER\s+BY\s+(?:CASE|pg_catalog\.)/i.test(structural),"order")],
  ["no-reserved-alias",()=>assert(!forbiddenAlias.test(structural)&&!/\bconstraint\./i.test(structural),"alias")],
  ["identity-binding",()=>assert(evidence.identitiesBound,"identity")],
  ["role-and-schema-existence",()=>assert(sql017c7.includes("owner_role_oid IS NULL")&&sql017c7.includes("deployment_role_oid IS NULL")&&sql017c7.includes("fid_schema_oid IS NULL"),"existence")],
  ["schema-capabilities",()=>assert(["deployment_schema_usage","deployment_schema_create","owner_schema_usage","owner_schema_create"].every((token)=>sql017c7.includes(token)),"schema")],
  ["set-required",()=>assert(sql017c7.includes("current_role_exact AND session_role_exact AND set_capability"),"set")],
  ["admin-separate",()=>assert(sql017c7.includes("(deployment_role_superuser OR admin_capability) AS membership_governance_capability")&&!/admin_capability[\s\S]{0,100}AS ownership_transfer_capability/.test(sql017c7),"admin separation")],
  ["coverage",()=>assert(evidence.coverageComplete,"coverage")],
  ["sanitized",()=>assert(evidence.sanitized,"sanitization")],
  ["negative-project",()=>assert(snapshots.wrongProject.authorizedExecutions===0,"project")],
  ["negative-identity",()=>assert(!snapshots.currentUserMismatch.transferCapable&&!snapshots.sessionUserMismatch.transferCapable,"identity scenario")],
  ["negative-set",()=>assert(!snapshots.noSetCapability.transferCapable&&!snapshots.adminWithoutSet.transferCapable,"set scenario")],
  ["negative-schema",()=>assert(!snapshots.noDeploymentSchemaCreate.transferCapable&&!snapshots.noOwnerSchemaCreate.transferCapable,"schema scenario")],
  ["false-positive-prevention",()=>assert(!snapshots.completeTransferCapabilities.migrationDeploymentAuthorized,"false positive")],
  ["authorization-scope",()=>assert(authorization.scope.executionCount===1&&authorization.scope.completeSanitizedResultCaptureRequired&&authorization.scope.mandatoryStopAfterExecution,"authorization")],
  ["authorization-prohibitions",()=>assert(Object.values(authorization.prohibited).every(Boolean),"prohibitions")],
  ["second-execution-blocked",()=>assert(snapshots.secondExecution.authorizedExecutions===0,"second execution")],
  ["inventory",()=>assert(evidence.inventoryExact&&evidence.migration015Absent,"inventory")],
  ["ready",()=>assert(result.status==="READY_FOR_CONTROLLED_SUPABASE_OWNERSHIP_CAPABILITY_READ_ONLY_PREFLIGHT_EXECUTION"&&result.preflight017c7ExecutionAuthorized&&!result.preflight017c6ExecutionAuthorized&&!result.migration014ExecutionAuthorized&&result.blockers.length===0,"ready")],
  ["no-review-effects",()=>assert(result.databaseOperationsDuringReview===0&&result.networkDatabaseConnectionsDuringReview===0,"effects")],
];

let passed=0;
for(const [name,test] of tests){try{test();passed+=1;console.log(`PASS ${name}`);}catch(error){console.error(`FAIL ${name}: ${error.message}`);}}
console.log(`017c7 static review diagnostics: ${passed}/${tests.length}`);
if(passed!==tests.length)globalThis.process.exitCode=1;
