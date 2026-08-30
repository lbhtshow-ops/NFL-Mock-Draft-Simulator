import pg from "pg";
import { createPostgresResearchRepositoryAdapter } from "../src/data/researchRepository/persistence/postgres/createPostgresResearchRepositoryAdapter.js";
import { createNFLAvailabilityResearchRepositoryService } from "../src/data/footballIntelligence/nfl/availability/research/NFLAvailabilityResearchRepositoryService.js";
import { createNFLMultiSignalAvailabilityResearchBundle } from "../src/data/footballIntelligence/nfl/availability/research/NFLMultiSignalAvailabilityResearchCapture.js";
import { adaptSportradarTeamRosterPayload } from "../src/data/footballIntelligence/nfl/availability/providers/sportradar/SportradarNFLRosterStatusAdapter.js";
import { adaptSportradarDailyTransactionsPayload } from "../src/data/footballIntelligence/nfl/availability/providers/sportradar/SportradarNFLTransactionAdapter.js";
import { adaptSportradarWeeklyDepthChartsPayload } from "../src/data/footballIntelligence/nfl/availability/providers/sportradar/SportradarNFLDepthChartAdapter.js";
import { adaptSportradarWeeklyInjuriesPayload } from "../src/data/footballIntelligence/nfl/availability/providers/sportradar/SportradarNFLAvailabilityProviderAdapter.js";
import { createNFLAvailabilitySignal, NFL_AVAILABILITY_AUTHORITY, NFL_AVAILABILITY_SIGNAL_CLASSES } from "../src/data/footballIntelligence/nfl/availability/signals/NFLAvailabilitySignalContract.js";
import { persistNFLAvailabilityBundleWithLiveRefresh } from "../src/engines/gameDecisionSupport/refresh/NFLLiveAvailabilityPersistenceRefreshBinding.js";
import { createNFLCanonicalScheduleRepositoryService } from "../src/engines/gameDecisionSupport/schedule/NFLCanonicalScheduleRepositoryService.js";
import { createFieDecisionProductionComposition } from "../services/fieDecisionApi/productionComposition.mjs";
const { Pool } = pg;
const args = process.argv.slice(2); const val = f => { const i=args.lastIndexOf(f); return i>=0?args[i+1]:null; };
const season=Number(val("--season")); const week=Number(val("--week")); const gameType=String(val("--game-type")||"PRE").toUpperCase();
const teams=[...new Set(String(val("--teams")||val("--team")||"").split(",").map(x=>x.trim().toUpperCase()).filter(Boolean))];
const dryRun=args.includes("--dry-run"), executeWrite=args.includes("--execute-write");
if (!Number.isInteger(season)||!Number.isInteger(week)||week<1) throw new Error("Valid --season and --week are required.");
if (!teams.length) throw new Error("At least one --team or comma-separated --teams value is required.");
if (dryRun===executeWrite) throw new Error("Choose exactly one: --dry-run or --execute-write.");
const apiKey=process.env.SPORTRADAR_NFL_API_KEY; if(!apiKey) throw new Error("SPORTRADAR_NFL_API_KEY is required.");
const databaseUrl=process.env.RESEARCH_REPOSITORY_DATABASE_URL; if(executeWrite&&!databaseUrl) throw new Error("RESEARCH_REPOSITORY_DATABASE_URL is required for writes.");
const root="https://api.sportradar.com/nfl/official/trial/v7/en"; const headers={accept:"application/json","x-api-key":apiKey};
const SPORTRADAR_MIN_REQUEST_INTERVAL_MS = 1250;
const SPORTRADAR_MAX_429_RETRIES = 2;
const SPORTRADAR_429_BACKOFF_MS = [2500, 5000];
let lastSportradarRequestStartedAt = 0;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function json(url){
  for (let attempt = 0; ; attempt += 1) {
    const waitMs = Math.max(0, SPORTRADAR_MIN_REQUEST_INTERVAL_MS - (Date.now() - lastSportradarRequestStartedAt));
    if (waitMs > 0) await sleep(waitMs);
    lastSportradarRequestStartedAt = Date.now();
    const r = await fetch(url,{headers});
    if (r.ok) return await r.json();
    if (r.status !== 429) throw new Error(`SPORTRADAR_HTTP_${r.status}:${url}`);
    if (attempt >= SPORTRADAR_MAX_429_RETRIES) {
      throw new Error(`SPORTRADAR_RATE_LIMIT_EXHAUSTED:HTTP_429:attempts=${attempt + 1}:${url}`);
    }
    const retryAfterSeconds = Number(r.headers.get("retry-after"));
    const backoffMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? Math.max(SPORTRADAR_MIN_REQUEST_INTERVAL_MS, retryAfterSeconds * 1000)
      : SPORTRADAR_429_BACKOFF_MS[attempt];
    console.warn(`Sportradar HTTP 429; bounded retry ${attempt + 1}/${SPORTRADAR_MAX_429_RETRIES} after ${backoffMs}ms.`);
    await sleep(backoffMs);
  }
}
const now=new Date(); const et=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now).filter(p=>p.type!=="literal").map(p=>[p.type,p.value]));
const teamsUrl=`${root}/league/teams.json`; const teamPayload=await json(teamsUrl); const catalog=Array.isArray(teamPayload?.teams)?teamPayload.teams:[];
const selected=catalog.filter(t=>teams.includes(String(t.alias||"").toUpperCase())); const missing=teams.filter(a=>!selected.some(t=>t.alias===a)); if(missing.length) throw new Error(`Unknown team aliases: ${missing.join(",")}`);
const depthUrl=`${root}/seasons/${season}/${gameType}/${week}/depth_charts.json`; const txUrl=`${root}/league/${et.year}/${et.month}/${et.day}/transactions.json`; const injuryUrl=`${root}/seasons/${season}/${gameType}/${week}/injuries.json`;
const depthPayload=await json(depthUrl); const txPayload=await json(txUrl); const injuryPayload=await json(injuryUrl);
let signals=[];
signals.push(...adaptSportradarWeeklyDepthChartsPayload(depthPayload,{season,week,gameType,sourceUrl:depthUrl,now:now.toISOString()}).filter(s=>teams.includes(s.team)));
signals.push(...adaptSportradarDailyTransactionsPayload(txPayload,{season,week,gameType,sourceUrl:txUrl,now:now.toISOString()}).filter(s=>teams.includes(s.team)));
for(const team of selected){ const url=`${root}/teams/${team.id}/full_roster.json`; const payload=await json(url); signals.push(...adaptSportradarTeamRosterPayload(payload,{season,week,gameType,sourceUrl:url,now:now.toISOString()})); }
const injuries=adaptSportradarWeeklyInjuriesPayload(injuryPayload,{season,week,gameType,sourceUrl:injuryUrl,now:now.toISOString()}).filter(r=>teams.includes(r.team));
for(const r of injuries){ signals.push(createNFLAvailabilitySignal({signalClass:NFL_AVAILABILITY_SIGNAL_CLASSES.OFFICIAL_INJURY_REPORT,authority:NFL_AVAILABILITY_AUTHORITY.OFFICIAL,season:r.season,week:r.week,gameType:r.gameType,team:r.team,playerId:r?.player?.playerId,playerName:r?.player?.playerName,position:r?.player?.position,observedAt:r?.provenance?.modifiedAt||now.toISOString(),source:r?.provenance?.source||"sportradar-nfl-v7",sourceUrl:r?.provenance?.sourceUrl,status:r?.status?.report,practiceStatus:r?.status?.practice,injury:r?.injury?.primary,providerPlayerId:r?.provenance?.providerPlayerId,providerTeamId:r?.provenance?.providerTeamId,estimatedReturnDate:r?.provenance?.estimatedReturnDate})); }
const bundle=createNFLMultiSignalAvailabilityResearchBundle(signals,{checkedAt:now.toISOString()});
const counts=Object.fromEntries(bundle.summary.signalClasses.map(c=>[c,signals.filter(s=>s.signalClass===c).length]));
console.log(`Selected scope: season=${season}, gameType=${gameType}, week=${week}, teams=${teams.join(",")}`); console.log(`Signals: ${signals.length} ${JSON.stringify(counts)}`); console.log(`Recorded observations: ${bundle.summary.observationCount}`); console.log(`Evidence artifacts: ${bundle.summary.artifactCount}`);
if(dryRun){ console.log("DRY RUN COMPLETE — Research Repository was not mutated."); process.exit(0); }
const pool=new Pool({connectionString:databaseUrl,ssl:{rejectUnauthorized:false},max:4,application_name:"lbht-fie-sportradar-multisignal-availability"});
try { const pre=await pool.query("select current_database() database_name, to_regclass('public.research_sources') research_sources, to_regclass('public.research_sessions') research_sessions, to_regclass('public.recorded_observations') recorded_observations, to_regclass('public.evidence_artifacts') evidence_artifacts"); const s=pre.rows[0]||{}; const miss=["research_sources","research_sessions","recorded_observations","evidence_artifacts"].filter(k=>!s[k]); if(miss.length) throw new Error(`Research Repository preflight missing: ${miss.join(",")}`); console.log(`PostgreSQL preflight: connected database=${s.database_name}`);
const adapter=createPostgresResearchRepositoryAdapter({pool,options:{allowSoftDelete:true,allowArchive:true,allowHardDelete:false}});
const service=createNFLAvailabilityResearchRepositoryService({adapter});
const scheduleService=createNFLCanonicalScheduleRepositoryService({pool});
const schedule=await scheduleService.readWeek({season,week,gameType});
if(schedule.status!=="SUCCESS") throw new Error(`Canonical schedule unavailable: ${schedule.status}`);

const production=createFieDecisionProductionComposition({
  availabilityRepositoryService:service,
});

const binding=await persistNFLAvailabilityBundleWithLiveRefresh({
  repositoryService:service,
  bundle,
  season,
  week,
  gameType,
  teams,
  scheduleRecords:schedule.records,
  asOf:now.toISOString(),
  provenance:{
    acquisitionBoundary:"GOVERNED_LIVE_AVAILABILITY_PROVIDER",
    providerSpecificReasoningAuthorized:false,
  },
  availabilityRuntime:production.availabilityRuntime,
  buildMatchup:production.buildMatchup,
  getDecision:production.getDecision,
});

const result=binding.persistence;
console.log(`Observation writes: ${result.observationWrites}`);
console.log(`Artifact writes: ${result.artifactWrites}`);
console.log(`Session writes: ${result.sessionWrites}`);
console.log(`Unchanged team/week artifacts: ${result.unchangedArtifacts}`);
console.log(`Persistence status: ${result.status}`);
for(const t of result.teamResults) console.log(`Team ${t.team}: ${t.status}`);
console.log(`Canonical schedule records: ${schedule.records.length}`);
console.log(`Live refresh processed: ${binding.summary.refreshProcessed}`);
console.log(`Live refresh unchanged: ${binding.summary.unchanged}`);
console.log(`Live refresh executions: ${binding.summary.refreshExecutions}`);
console.log(`Live refresh failures: ${binding.summary.refreshFailed}`);
for(const t of binding.teamResults){
  const executionStatuses=(t.refresh?.results||[]).map(x=>x.execution?.status).filter(Boolean);
  if(executionStatuses.length) console.log(`Refresh ${t.team}: ${executionStatuses.join(",")}`);
}
if(result.failures.length||binding.summary.refreshFailed>0){
  if(result.failures.length) console.error(JSON.stringify(result.failures,null,2));
  process.exitCode=1;
}
} finally { await pool.end(); }
