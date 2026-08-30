import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createFieDecisionProductionComposition } from "../../../services/fieDecisionApi/productionComposition.mjs";
import { createFieResearchRepositoryAvailabilityRuntime } from "../../../services/fieDecisionApi/researchRepositoryAvailability.mjs";

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,"../../..");
let passed=0;
async function check(name,fn){await fn();passed+=1;console.log(`PASS ${passed}: ${name}`);}

const repositoryService={async readTeamWeek(){return {status:"NOT_FOUND",artifact:null,source:null,observations:[]};}};
const runtime=createFieResearchRepositoryAvailabilityRuntime({repositoryService});
await check("repository service readTeamWeek injection configures canonical availability runtime",async()=>assert.equal(runtime.configured,true));

const calls=[];
const fakeRuntime={configured:true,async loadForMatchup(args){calls.push({type:"availability",args});return{status:"READY",teams:[]};},invalidateTeamAvailability(){return{status:"NOT_CACHED",invalidated:false};}};
const fakeBuild=async args=>{calls.push({type:"matchup",args});return{matchupEdge:4};};
const fakeDecision=async args=>{calls.push({type:"decision",args});return{favorite:"BUF"};};
const production=createFieDecisionProductionComposition({availabilityRuntime:fakeRuntime,buildMatchupIntelligence:fakeBuild,getDecision:fakeDecision,normalizeTeam:v=>String(v||"").trim().toUpperCase()});
await production.buildMatchup({gameId:1001,season:2026,week:1,awayTeam:"bal",homeTeam:"buf",gameType:"REG"});
await check("shared composition loads availability before matchup build",async()=>assert.deepEqual(calls.slice(0,2).map(x=>x.type),["availability","matchup"]));
await check("shared composition normalizes both matchup teams",async()=>assert.deepEqual(calls[0].args.teams,["BAL","BUF"]));
await check("shared composition exposes canonical decision dependency",async()=>assert.equal(production.getDecision,fakeDecision));
await check("shared composition prohibits provider-specific reasoning",async()=>assert.equal(production.governance.providerSpecificReasoningAuthorized,false));

const server=fs.readFileSync(path.join(root,"services/fieDecisionApi/server.mjs"),"utf8");
const runner=fs.readFileSync(path.join(root,"scripts/runGovernedSportradarNFLMultiSignalAvailability.mjs"),"utf8");
await check("Decision API server consumes shared production composition",async()=>{assert.match(server,/createFieDecisionProductionComposition/);assert.match(server,/production\.buildMatchup/);});
await check("temporary provider runner uses existing persistence-refresh binding",async()=>assert.match(runner,/persistNFLAvailabilityBundleWithLiveRefresh/));
await check("runner supplies shared canonical production dependencies",async()=>{assert.match(runner,/availabilityRuntime:production\.availabilityRuntime/);assert.match(runner,/buildMatchup:production\.buildMatchup/);assert.match(runner,/getDecision:production\.getDecision/);});
await check("runner reads provider-neutral canonical schedule repository",async()=>assert.match(runner,/createNFLCanonicalScheduleRepositoryService/));
await check("runner reuses its persistence repository service for refresh reads",async()=>assert.match(runner,/availabilityRepositoryService:service/));
await check("runner does not authorize provider-specific reasoning",async()=>assert.match(runner,/providerSpecificReasoningAuthorized:false/));
await check("F2 wiring adds no Pick'em runtime dependency",async()=>assert.doesNotMatch(server+runner,/lbht-pickem|pickem-fie-decision-bridge/i));
console.log(`NFLProductionRefreshCompositionF2Diagnostics: ${passed}/${passed} passed`);
