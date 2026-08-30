
import fs from "node:fs";
import { evaluateHistoricalCanonicalNFLPlayer } from "../src/engines/teamIntelligence/strength/calibration/playerEvidence/NFLHistoricalCanonicalPlayerEvaluationService.js";
const load=p=>fs.existsSync(p)?fs.readFileSync(p,"utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse):[];
const bundles=load("./data/calibration/historical/v1/historical-player-evaluation-bundles-v1.jsonl");
const snaps=load("./data/calibration/historical/v1/historical-snap-counts-resolved.jsonl");
const observations=load("./data/calibration/historical/v1/observations.jsonl");
const get=(r,ks)=>{for(const k of ks)if(r?.[k]!=null)return r[k];return null};
const game=new Map();
for(const r of observations){const s=Number(get(r,["season"])),w=Number(get(r,["week"])),t=String(get(r,["team","teamAbbreviation"])||"").toUpperCase(),g=get(r,["gameId","game_id","gameRef"]);
 if(Number.isInteger(s)&&Number.isInteger(w)&&t&&g){const k=`${s}:${w}:${t}`;if(!game.has(k))game.set(k,new Set());game.get(k).add(String(g));}}
const snapIdx=new Map();
for(const r of snaps){const p=get(r,["playerId","player_id","gsis_id","canonicalPlayerId"]),s=Number(get(r,["season"]));if(!p||!Number.isInteger(s))continue;const k=`${p}:${s}`;if(!snapIdx.has(k))snapIdx.set(k,[]);snapIdx.get(k).push(r);}
const c={targets:bundles.length,canonicalCaliberAvailable:0,validHistoricalSnapshots:0,partialBecauseGameIdentity:0,unavailable:0}, samples=[];
for(const b of bundles){const ids=[...(game.get(`${b.season}:${b.week}:${String(b.team||"").toUpperCase()}`)||[])],g=ids.length===1?ids[0]:null;
 const e=evaluateHistoricalCanonicalNFLPlayer({bundle:b,supplementalSnapRows:snapIdx.get(`${b.playerId}:${b.season}`)||[],gameId:g});
 if(e?.canonicalCaliber?.available)c.canonicalCaliberAvailable++;
 if(e?.snapshotValidation?.valid&&e?.snapshot?.status==="AVAILABLE")c.validHistoricalSnapshots++;
 else if(e?.canonicalCaliber?.available&&e?.snapshotValidation?.errors?.includes("GAME_ID_REQUIRED"))c.partialBecauseGameIdentity++;
 else c.unavailable++;
 if(Number.isFinite(e?.canonicalCaliber?.caliberGrade)&&samples.length<10)samples.push({season:b.season,week:b.week,team:b.team,playerId:b.playerId,position:b.position,gameId:g,
   status:e.status,caliber:e.canonicalCaliber.caliberGrade,confidence:e.canonicalCaliber.confidence,readiness:e.canonicalCaliber.readiness,snapshotValid:e.snapshotValidation?.valid,snapshotErrors:e.snapshotValidation?.errors||[]});}
console.log(JSON.stringify({audit:"HISTORICAL_CANONICAL_PLAYER_EVALUATION_BATCH_READINESS",mode:"READ_ONLY",counts:c,
 rates:{canonicalCaliberCoverage:c.targets?c.canonicalCaliberAvailable/c.targets:0,validSnapshotCoverage:c.targets?c.validHistoricalSnapshots/c.targets:0},
 firstAvailable:samples,safeguards:{sourceFilesMutated:false,outputDatasetWritten:false,currentRatingBackfillUsed:false,targetWeekEvidenceUsed:false,
 futureEvidenceUsed:false,currentRecognitionUsed:false,learnedWeightsCreated:false,calibrationExecuted:false}},null,2));
