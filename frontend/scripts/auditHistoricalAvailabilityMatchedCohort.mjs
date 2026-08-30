import fs from "node:fs";
const FILE="./data/calibration/historical/v1/historical-availability-matched-cohort-v1.jsonl";
const rows=fs.existsSync(FILE)?fs.readFileSync(FILE,"utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse):[];
const reuse=new Map();
for(const r of rows)reuse.set(r?.control?.key,(reuse.get(r?.control?.key)??0)+1);
const violations={
  outcomePresent:rows.filter(r=>r?.safeguards?.outcomeJoined!==false).length,
  nonUnitPairWeight:rows.filter(r=>r?.pairWeight!==1).length,
  nonSelectedMode:rows.filter(r=>r?.matching?.mode!=="SAME_SEASON").length,
  nonSelectedMethod:rows.filter(r=>r?.matching?.method!=="NEAREST_WITH_REPLACEMENT").length,
  outsideCaliper:rows.filter(r=>Number(r?.matching?.distance)>Number(r?.matching?.caliper)).length
};
console.log(JSON.stringify({
  audit:"HISTORICAL_AVAILABILITY_MATCHED_COHORT",
  mode:"READ_ONLY",
  pairs:rows.length,
  uniqueControls:reuse.size,
  maximumControlReuse:reuse.size?Math.max(...reuse.values()):0,
  controlsReusedMoreThanOnce:[...reuse.values()].filter(v=>v>1).length,
  violations,
  boundary:{
    outcomesPresent:false,effectEstimated:false,causalEffectEstimationAuthorized:false,
    calibrationAuthorized:false
  },
  safeguards:{
    datasetMutated:false,learnedWeightsCreated:false,calibrationExecuted:false,
    teamStrengthMutated:false,decisionModelMutated:false,pickemScoringMutated:false
  }
},null,2));
