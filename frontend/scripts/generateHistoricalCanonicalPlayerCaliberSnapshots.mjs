import fs from "node:fs";
import path from "node:path";
import {completeHistoricalCanonicalPositionModelInput} from "../src/engines/playerEvaluation/nfl/HistoricalCanonicalNFLInputCompletionService.js";
import {executeHistoricalCanonicalPositionModel} from "../src/engines/playerEvaluation/nfl/HistoricalCanonicalPositionModelExecutor.js";
import {createCanonicalHistoricalCaliberSnapshot} from "../src/engines/playerEvaluation/nfl/HistoricalCanonicalPlayerCaliberSnapshotService.js";
import {validateNFLHistoricalPlayerCaliberSnapshot} from "../src/engines/teamIntelligence/strength/calibration/playerEvidence/NFLHistoricalPlayerCaliberSnapshotContract.js";

function arg(name,fallback=null){
 const i=process.argv.indexOf(`--${name}`);
 return i>=0?process.argv[i+1]:fallback;
}
const input=arg("input"), observationsPath=arg("observations"), output=arg("output"), reportPath=arg("report");
if(!input||!observationsPath||!output||!reportPath){
 console.error("Required: --input --observations --output --report");process.exit(2);
}
const rows=fs.readFileSync(input,"utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const observations=fs.readFileSync(observationsPath,"utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const gameIndex=new Map();
for(const o of observations){
 const k=`${o.season}|${o.week}|${o.team}`;
 if(o.gameId && !gameIndex.has(k)) gameIndex.set(k,o.gameId);
}

const snapshots=[]; const audit=[]; const failures=[];
const counts={targets:rows.length,eligible:0,executed:0,deterministic:0,available:0,unavailable:0,valid:0};
const byPosition={}; const byConfidenceBand={};
function band(v){
 if(v>=.9)return "VERY_STRONG";
 if(v>=.7)return "STRONG";
 if(v>=.5)return "MODERATE";
 if(v>0)return "LIMITED";
 return "NONE";
}

for(const r of rows){
 const temporallySafe=Boolean(r.asOf && r.kickoffAt && Date.parse(r.asOf)<Date.parse(r.kickoffAt));
 const eligible=
  (r.readyScoreFieldCount??0)>=3 &&
  Boolean(r.normalizedPosition) &&
  temporallySafe;

 if(!eligible){
  counts.unavailable++;
  audit.push({
   playerId:r.playerId,season:r.season,week:r.week,team:r.team,
   eligible:false,reason:"C11_ELIGIBILITY_GATE_NOT_MET",
   readyScoreFieldCount:r.readyScoreFieldCount??0,
   position:r.normalizedPosition||null,temporallySafe,
  });
  continue;
 }
 counts.eligible++;

 const player={
  playerId:r.playerId,id:r.playerId,position:r.normalizedPosition,
  identity:{playerId:r.playerId,position:r.normalizedPosition,team:r.team,experience:r.historicalExperience},
  roster:{status:r.historicalRosterStatus,experience:r.historicalExperience},
 };
 const completed=completeHistoricalCanonicalPositionModelInput({
  player,asOf:r.asOf,completedHistoricalInput:r,
 });
 if(completed.status!=="READY_FOR_POSITION_MODEL"){
  counts.unavailable++;failures.push({playerId:r.playerId,stage:"INPUT",reason:completed.reason});continue;
 }
 const one=executeHistoricalCanonicalPositionModel({player,context:completed.context});
 const two=executeHistoricalCanonicalPositionModel({player,context:completed.context});
 if(one.status!=="AVAILABLE"){
  counts.unavailable++;failures.push({playerId:r.playerId,stage:"MODEL",reason:one.reason});continue;
 }
 counts.executed++;
 const same=JSON.stringify(one.evaluation)===JSON.stringify(two.evaluation);
 if(same)counts.deterministic++;

 const gameId=gameIndex.get(`${r.season}|${r.week}|${r.team}`)||null;
 const result=createCanonicalHistoricalCaliberSnapshot({
  player,target:r,rawPositionEvaluation:one.evaluation,
  completedCanonicalInput:completed,deterministicRepeat:same,gameId,
 });
 const validation=validateNFLHistoricalPlayerCaliberSnapshot(result.snapshot);
 if(validation.valid)counts.valid++;
 if(result.snapshot.status==="AVAILABLE"){
  counts.available++;
  const p=result.snapshot.position||"UNKNOWN";byPosition[p]=(byPosition[p]||0)+1;
  const b=band(result.snapshot.confidence);byConfidenceBand[b]=(byConfidenceBand[b]||0)+1;
 }else{
  counts.unavailable++;
 }
 snapshots.push(result.snapshot);
 audit.push({
  playerId:r.playerId,season:r.season,week:r.week,team:r.team,
  eligible:true,readyScoreFieldCount:r.readyScoreFieldCount,
  deterministicRepeat:same,gameId,
  modelStatus:one.status,snapshotStatus:result.snapshot.status,
  caliber:result.snapshot.caliber,confidence:result.snapshot.confidence,
  modelVersion:result.snapshot.modelVersion,
  validation,
  canonicalReadiness:result.canonicalCaliber?.readiness||null,
  missingEvidence:result.canonicalCaliber?.missingEvidence||[],
 });
 if(!validation.valid) failures.push({playerId:r.playerId,stage:"SNAPSHOT_VALIDATION",reason:validation.errors});
}

fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,snapshots.map(x=>JSON.stringify(x)).join("\n")+(snapshots.length?"\n":""),"utf8");
const duplicateKeyCount=(()=>{
 const seen=new Set();let dup=0;
 for(const x of snapshots){
  const k=`${x.season}|${x.week}|${x.team}|${x.playerId}`;
  if(seen.has(k))dup++;else seen.add(k);
 }
 return dup;
})();
const report={
 contractVersion:"FIE-NFL-HISTORICAL-CANONICAL-CALIBER-SNAPSHOT-GENERATION-REPORT-1.0.0",
 sprint:"9D.1C2B2C11",
 targetCount:counts.targets,
 eligibleTargetCount:counts.eligible,
 executedTargetCount:counts.executed,
 deterministicRepeatCount:counts.deterministic,
 availableSnapshotCount:counts.available,
 unavailableTargetOrSnapshotCount:counts.unavailable,
 validSnapshotCount:counts.valid,
 duplicateSnapshotKeyCount:duplicateKeyCount,
 byPosition,
 byConfidenceBand,
 failures,
 canonicalCaliberSourceField:"playerQuality",
 rosterValueUsedAsCaliber:false,
 prospectCarryoverUsed:false,
 currentIndexLookupUsed:false,
 currentRosterLookupUsed:false,
 currentRecognitionLookupUsed:false,
 all606ForcedScoringExecuted:false,
 calibrationExecuted:false,
 learnedWeights:null,
 datasetMutated:false,
 auditRecords:audit.length,
};
fs.writeFileSync(reportPath,JSON.stringify(report,null,2),"utf8");
const auditPath=reportPath.replace(/\.json$/,"-audit.jsonl");
fs.writeFileSync(auditPath,audit.map(x=>JSON.stringify(x)).join("\n")+"\n","utf8");
console.log(JSON.stringify(report,null,2));
