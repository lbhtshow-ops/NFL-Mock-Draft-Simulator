import fs from "node:fs";
const path = new URL("./runGovernedSportradarNFLMultiSignalAvailability.mjs", import.meta.url);
const source = fs.readFileSync(path, "utf8");
const tests = [
 ["minimum-request-spacing-1250ms", /SPORTRADAR_MIN_REQUEST_INTERVAL_MS\s*=\s*1250/.test(source)],
 ["parallel-provider-fetch-removed", !/Promise\.all\(\[json\(depthUrl\),json\(txUrl\),json\(injuryUrl\)\]\)/.test(source)],
 ["bounded-429-retries", /SPORTRADAR_MAX_429_RETRIES\s*=\s*2/.test(source)],
 ["bounded-backoff-defined", /SPORTRADAR_429_BACKOFF_MS\s*=\s*\[2500,\s*5000\]/.test(source)],
 ["retry-after-supported", /retry-after/.test(source)],
 ["explicit-rate-limit-exhausted-classification", /SPORTRADAR_RATE_LIMIT_EXHAUSTED/.test(source)],
 ["non-429-http-fail-closed", /r\.status !== 429/.test(source)],
 ["dry-run-preserved", /--dry-run/.test(source) && /Research Repository was not mutated/.test(source)],
 ["execute-write-preserved", /--execute-write/.test(source)],
 ["database-write-gate-preserved", /executeWrite&&!databaseUrl/.test(source)],
 ["api-key-gate-preserved", /SPORTRADAR_NFL_API_KEY is required/.test(source)],
 ["canonical-roster-adapter-preserved", /adaptSportradarTeamRosterPayload/.test(source)],
 ["canonical-transaction-adapter-preserved", /adaptSportradarDailyTransactionsPayload/.test(source)],
 ["canonical-depth-adapter-preserved", /adaptSportradarWeeklyDepthChartsPayload/.test(source)],
 ["canonical-injury-adapter-preserved", /adaptSportradarWeeklyInjuriesPayload/.test(source)],
 ["research-repository-service-preserved", /createNFLAvailabilityResearchRepositoryService/.test(source)],
];
const results=tests.map(([name,passed])=>({name,passed}));
const passed=results.filter(x=>x.passed).length, failed=results.length-passed;
console.log(JSON.stringify({suite:"Sportradar Trial Rate-Limit Safety V1 Diagnostics",passed,failed,tests:results},null,2));
if(failed) process.exitCode=1;
