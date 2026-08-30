import fs from "node:fs";
import path from "node:path";
import {
  completeHistoricalCanonicalPositionModelInput,
} from "../src/engines/playerEvaluation/nfl/HistoricalCanonicalNFLInputCompletionService.js";
import {
  executeHistoricalCanonicalPositionModel,
} from "../src/engines/playerEvaluation/nfl/HistoricalCanonicalPositionModelExecutor.js";

function arg(name, fallback=null){
 const i=process.argv.indexOf(`--${name}`);
 return i>=0 ? process.argv[i+1] : fallback;
}
const input=arg("input");
const output=arg("output");
const reportPath=arg("report");
if(!input||!output||!reportPath){
 console.error("Required: --input --output --report");
 process.exit(2);
}

const rows=fs.readFileSync(input,"utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);

const family=(p)=>{
 if(p==="QB") return "QB";
 if(["RB","FB"].includes(p)) return "RB";
 if(["WR","TE"].includes(p)) return "RECEIVER";
 if(["DL","EDGE"].includes(p)) return "DEFENSIVE_LINE";
 if(p==="LB") return "LB";
 if(["CB","S"].includes(p)) return "SECONDARY";
 if(["OT","IOL"].includes(p)) return "OFFENSIVE_LINE";
 return null;
};

const quotas={QB:3,RB:3,RECEIVER:4,DEFENSIVE_LINE:4,LB:3,SECONDARY:4,OFFENSIVE_LINE:4};
const selected=[];
for(const fam of Object.keys(quotas)){
 const candidates=rows
  .filter(r=>family(r.normalizedPosition)===fam)
  .filter(r=>(r.readyScoreFieldCount??0)>=3)
  .sort((a,b)=>{
   const ka=`${a.season}-${String(a.week).padStart(2,"0")}-${a.team}-${a.playerId}`;
   const kb=`${b.season}-${String(b.week).padStart(2,"0")}-${b.team}-${b.playerId}`;
   return ka.localeCompare(kb);
  });
 selected.push(...candidates.slice(0,quotas[fam]));
}

const records=[];
let deterministic=0,available=0,finiteQuality=0,finiteRoster=0;
const failures=[];
for(const r of selected){
 const player={
  playerId:r.playerId,
  id:r.playerId,
  position:r.normalizedPosition,
  identity:{
   playerId:r.playerId,
   position:r.normalizedPosition,
   team:r.team,
   experience:r.historicalExperience,
  },
  roster:{
   status:r.historicalRosterStatus,
   experience:r.historicalExperience,
  },
 };
 const completed=completeHistoricalCanonicalPositionModelInput({
  player,
  asOf:r.asOf,
  completedHistoricalInput:r,
 });
 if(completed.status!=="READY_FOR_POSITION_MODEL"){
  failures.push({playerId:r.playerId,stage:"INPUT_ADAPTER",reason:completed.reason});
  records.push({...r,executionStatus:"UNAVAILABLE",reason:completed.reason});
  continue;
 }
 const one=executeHistoricalCanonicalPositionModel({player,context:completed.context});
 const two=executeHistoricalCanonicalPositionModel({player,context:completed.context});
 const same=JSON.stringify(one.evaluation)===JSON.stringify(two.evaluation);
 deterministic+=same?1:0;
 if(one.status==="AVAILABLE") available++;
 const q=one.evaluation?.playerQuality ?? one.evaluation?.score ?? null;
 const rv=one.evaluation?.rosterValue ?? null;
 if(Number.isFinite(q)) finiteQuality++;
 if(Number.isFinite(rv)) finiteRoster++;
 if(!same) failures.push({playerId:r.playerId,stage:"DETERMINISM",reason:"REPEAT_OUTPUT_MISMATCH"});
 records.push({
  contractVersion:"FIE-NFL-HISTORICAL-CONTROLLED-POSITION-MODEL-EXECUTION-RECORD-1.0.0",
  season:r.season,week:r.week,team:r.team,playerId:r.playerId,position:r.normalizedPosition,
  family:family(r.normalizedPosition),asOf:r.asOf,
  readyScoreFieldCount:r.readyScoreFieldCount,
  scores:completed.scores,
  missingScoreFields:completed.missingScoreFields,
  executionStatus:one.status,
  executionReason:one.reason,
  deterministicRepeat:same,
  evaluation:one.evaluation,
 });
}

fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,records.map(r=>JSON.stringify(r)).join("\n")+"\n","utf8");

const byFamily={};
for(const r of records){
 byFamily[r.family]??={selected:0,available:0,deterministic:0};
 byFamily[r.family].selected++;
 byFamily[r.family].available+=r.executionStatus==="AVAILABLE"?1:0;
 byFamily[r.family].deterministic+=r.deterministicRepeat?1:0;
}

const report={
 contractVersion:"FIE-NFL-HISTORICAL-CONTROLLED-POSITION-MODEL-EXECUTION-REPORT-1.0.0",
 sprint:"9D.1C2B2C10",
 requestedCohortSize:25,
 selectedCohortSize:selected.length,
 quotas,
 byFamily,
 availableExecutions:available,
 deterministicRepeatCount:deterministic,
 finitePlayerQualityCount:finiteQuality,
 finiteRosterValueCount:finiteRoster,
 failures,
 prospectCarryoverUsed:false,
 currentIndexLookupUsed:false,
 currentRosterLookupUsed:false,
 currentRecognitionLookupUsed:false,
 full606ScoringExecuted:false,
 historicalSnapshotsGenerated:false,
 datasetMutated:false,
 calibrationExecuted:false,
 learnedWeights:null,
};
fs.writeFileSync(reportPath,JSON.stringify(report,null,2),"utf8");
console.log(JSON.stringify(report,null,2));
