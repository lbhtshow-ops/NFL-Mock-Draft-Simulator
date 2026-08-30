import fs from "node:fs";
import path from "node:path";
const target = path.resolve("scripts/syncNFLVersePlayerAvailabilityToResearchRepository.mjs");
const source = fs.readFileSync(target, "utf8");
const tests = [
 ["project-url-normalizer-present", source.includes("function normalizeSupabaseProjectUrl")],
 ["rest-v1-suffix-normalized", source.includes("/rest\\/v1") || source.includes("/rest\/v1")],
 ["https-required", source.includes('parsed.protocol !== "https:"')],
 ["query-and-hash-removed", source.includes('parsed.search = ""') && source.includes('parsed.hash = ""')],
 ["unexpected-path-rejected", source.includes("must be the Supabase project base URL")],
 ["dedicated-url-preserved", source.includes("RESEARCH_REPOSITORY_SUPABASE_URL")],
 ["dedicated-service-key-preserved", source.includes("RESEARCH_REPOSITORY_SUPABASE_SERVICE_ROLE_KEY")],
 ["explicit-write-gate-preserved", source.includes("--execute-write")],
 ["controlled-team-week-gate-preserved", source.includes("Controlled first-write mode requires both --week and --team")],
 ["canonical-adapter-reused", source.includes("createSupabaseResearchRepositoryAdapter")],
];
const results=tests.map(([name,passed])=>({name,passed:Boolean(passed)}));
console.log(JSON.stringify({suite:"Research Repository Supabase URL Correction V1 Diagnostics",passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length,tests:results},null,2));
if(results.some(x=>!x.passed)) process.exitCode=1;
