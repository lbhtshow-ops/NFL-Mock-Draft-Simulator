import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const writer=fs.readFileSync(path.join(root,"scripts/syncNFLVersePlayerAvailabilityToResearchRepository.mjs"),"utf8");
const adapterPath=path.join(root,"src/data/researchRepository/persistence/postgres/createPostgresResearchRepositoryAdapter.js");
const adapter=fs.existsSync(adapterPath)?fs.readFileSync(adapterPath,"utf8"):"";
const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
const tests=[
 ["postgres-adapter-present",Boolean(adapter)],
 ["pg-runtime-dependency-present",Boolean(pkg.dependencies?.pg)],
 ["server-database-url-required",writer.includes("RESEARCH_REPOSITORY_DATABASE_URL")],
 ["no-supabase-rest-client-in-writer",!writer.includes("createClient(")&&!writer.includes("@supabase/supabase-js")],
 ["no-service-role-fallback",!writer.includes("SUPABASE_SERVICE_ROLE_KEY")],
 ["no-generic-database-url-fallback",!writer.includes("process.env.DATABASE_URL")],
 ["explicit-write-gate-preserved",writer.includes("--execute-write")],
 ["dry-run-preserved",writer.includes("--dry-run")],
 ["team-week-first-write-gate-preserved",writer.includes("Controlled first-write mode requires both --week and --team")],
 ["canonical-research-contracts-reused",adapter.includes("ResearchRepositoryPersistenceContract.js")],
 ["canonical-table-mapping-reused",adapter.includes("getSupabaseResearchTable")&&adapter.includes("getSupabaseResearchIdColumn")],
 ["hard-delete-disabled-in-writer",writer.includes("allowHardDelete: false")],
 ["pool-closed",writer.includes("await pool.end()")],
 ["postgres-preflight-present",writer.includes("PostgreSQL preflight")],
];
const out=tests.map(([name,passed])=>({name,passed}));
console.log(JSON.stringify({suite:"Research Repository Server Persistence Boundary V1 Diagnostics",passed:out.filter(x=>x.passed).length,failed:out.filter(x=>!x.passed).length,tests:out},null,2));
if(out.some(x=>!x.passed)) process.exitCode=1;
