import { createSportradarNFLAvailabilityProviderAdapter } from "../src/data/footballIntelligence/nfl/availability/providers/sportradar/SportradarNFLAvailabilityProviderAdapter.js";
const args=process.argv.slice(2); const get=(n)=>{const i=args.indexOf(n);return i>=0?args[i+1]:null};
const season=Number(get("--season")); const week=Number(get("--week")); const gameType=(get("--game-type")||"REG").toUpperCase();
if(!Number.isInteger(season)||!Number.isInteger(week)){console.error("Usage: node scripts/probeSportradarNFLAvailability.mjs --season 2026 --week 1");process.exit(2);}
const adapter=createSportradarNFLAvailabilityProviderAdapter();
const result=await adapter.acquire({season,week,gameType});
console.log(JSON.stringify({available:result.available,reason:result.reason||null,observedAt:result.observedAt||null,sourceUrl:result.sourceUrl||null,recordCount:result.records?.length||0,teams:[...new Set((result.records||[]).map(r=>r.team))].sort(),sample:(result.records||[]).slice(0,3)},null,2));
