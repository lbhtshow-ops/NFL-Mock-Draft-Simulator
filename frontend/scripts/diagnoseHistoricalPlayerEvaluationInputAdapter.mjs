
import assert from "node:assert/strict";
import { adaptHistoricalPlayerEvaluationInput } from "../src/engines/teamIntelligence/strength/calibration/playerEvidence/NFLHistoricalPlayerEvaluationInputAdapter.js";
const bundle={contractVersion:"FIE-NFL-HISTORICAL-PLAYER-EVALUATION-EVIDENCE-BUNDLE-1.0.0",season:2024,week:4,team:"BAL",
 playerId:"historical-qb",position:"QB",asOf:"2024-09-20T12:00:00Z",kickoffAt:"2024-09-22T17:00:00Z",
 priorCurrentSeasonWeeklyStats:[
 {season:2024,week:1,playerId:"historical-qb",playerName:"Historical QB",team:"BAL",position:"QB",completions:20,attempts:30,passingYards:250,passingTDs:2,interceptions:0},
 {season:2024,week:2,playerId:"historical-qb",playerName:"Historical QB",team:"BAL",position:"QB",completions:22,attempts:32,passingYards:280,passingTDs:2,interceptions:1},
 {season:2024,week:3,playerId:"historical-qb",playerName:"Historical QB",team:"BAL",position:"QB",completions:18,attempts:28,passingYards:230,passingTDs:1,interceptions:0}],
 targetWeekIncluded:false,futureWeekIncluded:false,futureSeasonIncluded:false};
const snaps=[1,2,3,4].map((week,i)=>({season:2024,week,playerId:"historical-qb",playerName:"Historical QB",team:"BAL",position:"QB",offenseSnaps:60+i,offensePct:.95+i*.01}));
const r=adaptHistoricalPlayerEvaluationInput({bundle,supplementalSnapRows:snaps});
const tests=[]; const test=(name,fn)=>{try{fn();tests.push({name,passed:true})}catch(e){tests.push({name,passed:false,error:e.message})}};
test("adapter-available",()=>assert.equal(r.status,"AVAILABLE"));
test("temporal-safe",()=>assert.equal(r.evidence.temporallySafe,true));
test("three-performance-games",()=>assert.equal(r.evidence.performanceGameCount,3));
test("target-week-snap-excluded",()=>assert.equal(r.evidence.usageGameCount,3));
test("passing-yards-aggregated",()=>assert.equal(r.player.historicalEvaluationEvidence.performanceProfile.passingYards,760));
test("recognition-disabled",()=>assert.equal(r.player.historicalEvaluationEvidence.disableRecognition,true));
test("no-caliber-created",()=>assert.equal("caliber" in r,false));
test("no-player-quality-created",()=>assert.equal("playerQuality" in r,false));
const unsafe=adaptHistoricalPlayerEvaluationInput({bundle:{...bundle,targetWeekIncluded:true},supplementalSnapRows:snaps});
test("target-week-flag-fails-closed",()=>assert.equal(unsafe.status,"UNAVAILABLE"));
const future=adaptHistoricalPlayerEvaluationInput({bundle:{...bundle,asOf:"2024-09-23T12:00:00Z"}});
test("post-kickoff-asof-fails-closed",()=>assert.equal(future.status,"UNAVAILABLE"));
const passed=tests.filter(x=>x.passed).length,failed=tests.length-passed;
console.log(JSON.stringify({suite:"Historical Player Evaluation Input Adapter V1 Diagnostics",passed,failed,sample:r,tests},null,2));
if(failed)process.exitCode=1;
