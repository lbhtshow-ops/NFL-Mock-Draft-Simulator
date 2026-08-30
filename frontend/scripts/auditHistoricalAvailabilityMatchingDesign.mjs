import fs from "node:fs";
import generatedNFLHistoricalDecisionDataset from "../src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalDecisionDataset.js";
import { predictNFLCandidate } from "../src/engines/gameDecisionSupport/models/NFLCandidateDecisionModels.js";
import generatedModel from "../src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLCanonicalGameDecisionModelV1.js";

const COHORT="./data/calibration/historical/v1/historical-availability-control-cohort-v1.jsonl";

function readJsonl(file){
  if(!fs.existsSync(file)) return [];
  return fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
}
const finite=v=>v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v));
const n=v=>Number(v);
const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;

function variance(xs){
  if(xs.length<2) return null;
  const m=mean(xs);
  return xs.reduce((s,x)=>s+(x-m)**2,0)/(xs.length-1);
}
function sd(xs){
  const v=variance(xs);
  return finite(v)?Math.sqrt(v):null;
}
function percentile(xs,p){
  if(!xs.length) return null;
  const s=[...xs].sort((a,b)=>a-b);
  const i=(s.length-1)*p,l=Math.floor(i),h=Math.ceil(i);
  return l===h?s[l]:s[l]+(s[h]-s[l])*(i-l);
}
function smd(a,b){
  if(a.length<2||b.length<2) return null;
  const va=variance(a),vb=variance(b);
  if(!finite(va)||!finite(vb)) return null;
  const pooled=Math.sqrt((va+vb)/2);
  if(!pooled) return mean(a)===mean(b)?0:null;
  return (mean(a)-mean(b))/pooled;
}
function sideFor(game,team){
  if(game?.homeTeam===team) return "HOME";
  if(game?.awayTeam===team) return "AWAY";
  return null;
}
function perspective(v,side){
  if(!finite(v)||!side) return null;
  return side==="HOME"?n(v):-n(v);
}

const FEATURE_KEYS=[
  "expectedTeamMargin","evidenceQuality","restDifferential","overallStrength",
  "passMatchup","rushMatchup","recentForm","specialTeams","explosivePlay","redZone"
];

function featureRecord(decision,team,classification,questionableCount){
  const side=sideFor(decision?.game,team);
  if(!side) return null;

  const edge=decision?.pregame?.matchupEdge;
  const quality=decision?.pregame?.evidenceQuality;
  if(!finite(edge)||!finite(quality)) return null;

  const prediction=predictNFLCandidate(generatedModel.modelId,{
    pregame:{matchupEdge:edge,evidenceQuality:quality}
  },generatedModel.parameters);

  const d=decision?.pregame?.dimensions??{};
  const teamRest=side==="HOME"?decision?.game?.homeRest:decision?.game?.awayRest;
  const oppRest=side==="HOME"?decision?.game?.awayRest:decision?.game?.homeRest;

  return Object.freeze({
    key:`${decision?.game?.gameId}:${team}`,
    gameId:decision?.game?.gameId??null,
    team,
    season:decision?.game?.season??null,
    week:decision?.game?.week??null,
    side,
    classification,
    questionableCount,
    expectedTeamMargin:side==="HOME"?prediction.expectedHomeMargin:-prediction.expectedHomeMargin,
    evidenceQuality:n(quality),
    restDifferential:finite(teamRest)&&finite(oppRest)?n(teamRest)-n(oppRest):null,
    overallStrength:perspective(d?.overallStrength,side),
    passMatchup:perspective(d?.passMatchup,side),
    rushMatchup:perspective(d?.rushMatchup,side),
    recentForm:perspective(d?.recentForm,side),
    specialTeams:perspective(d?.specialTeams,side),
    explosivePlay:perspective(d?.explosivePlay,side),
    redZone:perspective(d?.redZone,side),
  });
}

const decisionByGame=new Map();
for(const row of generatedNFLHistoricalDecisionDataset){
  if(row?.game?.gameId) decisionByGame.set(row.game.gameId,row);
}
const cohort=readJsonl(COHORT);
const joined=[];
let missingDecisionRecordCount=0,sideMismatchCount=0,missingFeatureRecordCount=0;

for(const row of cohort.filter(r=>["TREATED","CONTROL_CANDIDATE"].includes(r?.classification))){
  const decision=decisionByGame.get(row?.identity?.gameId);
  if(!decision){missingDecisionRecordCount++;continue;}
  const rec=featureRecord(decision,row?.identity?.team,row.classification,row?.availability?.questionableCount??0);
  if(!rec){sideMismatchCount++;continue;}
  if(FEATURE_KEYS.some(k=>!finite(rec[k]))){missingFeatureRecordCount++;continue;}
  joined.push(rec);
}

const treated=joined.filter(r=>r.classification==="TREATED");
const controls=joined.filter(r=>r.classification==="CONTROL_CANDIDATE");

const pooled=[...treated,...controls];
const scaling={};
for(const key of FEATURE_KEYS){
  const vals=pooled.map(r=>r[key]).filter(finite).map(n);
  scaling[key]={mean:mean(vals),sd:sd(vals)};
}
function z(v,key){
  const s=scaling[key];
  if(!finite(v)||!finite(s?.sd)||s.sd===0) return 0;
  return (n(v)-s.mean)/s.sd;
}
function distance(a,b){
  const diffs=FEATURE_KEYS.map(k=>z(a[k],k)-z(b[k],k));
  return Math.sqrt(diffs.reduce((sum,x)=>sum+x*x,0)/diffs.length);
}
function candidatePool(t,mode){
  if(mode==="SAME_SEASON_SIDE") return controls.filter(c=>c.season===t.season&&c.side===t.side);
  if(mode==="SAME_SEASON") return controls.filter(c=>c.season===t.season);
  throw new Error(`Unknown mode ${mode}`);
}
function nearestControl(record,pool,excludeKey=null){
  let best=null;
  for(const c of pool){
    if(excludeKey && c.key===excludeKey) continue;
    const d=distance(record,c);
    if(!best||d<best.distance||(d===best.distance&&c.key<best.control.key)){
      best={control:c,distance:d};
    }
  }
  return best;
}

function empiricalThresholds(mode){
  const ds=[];
  for(const c of controls){
    const pool=mode==="SAME_SEASON_SIDE"
      ? controls.filter(x=>x.season===c.season&&x.side===c.side)
      : controls.filter(x=>x.season===c.season);
    const nearest=nearestControl(c,pool,c.key);
    if(nearest) ds.push(nearest.distance);
  }
  return {
    referenceCount:ds.length,
    p50:percentile(ds,.50),
    p75:percentile(ds,.75),
    p90:percentile(ds,.90),
    p95:percentile(ds,.95),
  };
}

const thresholds={
  SAME_SEASON_SIDE:empiricalThresholds("SAME_SEASON_SIDE"),
  SAME_SEASON:empiricalThresholds("SAME_SEASON"),
};

function matchingWithReplacement(mode,caliper){
  const pairs=[];
  for(const t of treated){
    const pool=candidatePool(t,mode);
    const nearest=nearestControl(t,pool);
    if(nearest&&finite(nearest.distance)&&nearest.distance<=caliper){
      pairs.push({treated:t,control:nearest.control,distance:nearest.distance});
    }
  }
  return pairs;
}

function matchingWithoutReplacement(mode,caliper){
  // Greedy but order-stabilized by hardest-to-match first (largest nearest distance),
  // then deterministic key tie-break. This avoids letting easy cases consume scarce controls first.
  const ranked=treated.map(t=>{
    const nearest=nearestControl(t,candidatePool(t,mode));
    return {treated:t,nearestDistance:nearest?.distance??Infinity};
  }).sort((a,b)=>b.nearestDistance-a.nearestDistance||a.treated.key.localeCompare(b.treated.key));

  const used=new Set(),pairs=[];
  for(const item of ranked){
    const pool=candidatePool(item.treated,mode).filter(c=>!used.has(c.key));
    const nearest=nearestControl(item.treated,pool);
    if(nearest&&finite(nearest.distance)&&nearest.distance<=caliper){
      used.add(nearest.control.key);
      pairs.push({treated:item.treated,control:nearest.control,distance:nearest.distance});
    }
  }
  return pairs;
}

function balanceFromPairs(pairs){
  const tRows=pairs.map(p=>p.treated),cRows=pairs.map(p=>p.control);
  const features={};
  for(const key of FEATURE_KEYS){
    const tv=tRows.map(r=>r[key]).filter(finite).map(n);
    const cv=cRows.map(r=>r[key]).filter(finite).map(n);
    const s=smd(tv,cv);
    features[key]={
      treatedMean:mean(tv),
      matchedControlMean:mean(cv),
      standardizedMeanDifference:s,
      absoluteSMD:finite(s)?Math.abs(s):null,
    };
  }
  const abs=Object.values(features).map(x=>x.absoluteSMD).filter(finite);
  return {
    features,
    maxAbsoluteSMD:abs.length?Math.max(...abs):null,
    meanAbsoluteSMD:abs.length?mean(abs):null,
    featuresAtOrBelowPoint10:abs.filter(x=>x<=.10).length,
    featuresAtOrBelowPoint20:abs.filter(x=>x<=.20).length,
    evaluatedFeatureCount:abs.length,
  };
}

function summarizePairs(mode,method,label,caliper,pairs){
  const reuse=new Map();
  for(const p of pairs) reuse.set(p.control.key,(reuse.get(p.control.key)??0)+1);
  const reuseValues=[...reuse.values()];
  const distances=pairs.map(p=>p.distance);
  const retainedKeys=new Set(pairs.map(p=>p.treated.key));
  const bySeason={};
  for(const season of [2022,2023,2024]){
    bySeason[season]={
      treatedAvailable:treated.filter(t=>t.season===season).length,
      treatedRetained:pairs.filter(p=>p.treated.season===season).length
    };
  }
  const bySide={
    HOME:{available:treated.filter(t=>t.side==="HOME").length,retained:pairs.filter(p=>p.treated.side==="HOME").length},
    AWAY:{available:treated.filter(t=>t.side==="AWAY").length,retained:pairs.filter(p=>p.treated.side==="AWAY").length},
  };
  return {
    specification:{mode,method,caliperLabel:label,caliper},
    treatedAvailable:treated.length,
    treatedRetained:pairs.length,
    treatedRetentionRate:treated.length?pairs.length/treated.length:null,
    treatedUnmatched:treated.length-pairs.length,
    uniqueControlsUsed:reuse.size,
    maximumControlReuse:reuseValues.length?Math.max(...reuseValues):0,
    controlsReusedMoreThanOnce:reuseValues.filter(x=>x>1).length,
    distance:{
      mean:mean(distances),
      p50:percentile(distances,.50),
      p90:percentile(distances,.90),
      max:distances.length?Math.max(...distances):null
    },
    balance:balanceFromPairs(pairs),
    bySeason,bySide,
    unmatchedWorstTen:treated
      .filter(t=>!retainedKeys.has(t.key))
      .map(t=>{
        const nearest=nearestControl(t,candidatePool(t,mode));
        return {gameId:t.gameId,team:t.team,season:t.season,side:t.side,nearestDistance:nearest?.distance??null};
      })
      .sort((a,b)=>(b.nearestDistance??-Infinity)-(a.nearestDistance??-Infinity))
      .slice(0,10),
  };
}

const specifications=[];
for(const mode of ["SAME_SEASON_SIDE","SAME_SEASON"]){
  for(const label of ["p75","p90","p95"]){
    const caliper=thresholds[mode][label];
    specifications.push(summarizePairs(
      mode,"NEAREST_WITH_REPLACEMENT",label,caliper,
      matchingWithReplacement(mode,caliper)
    ));
    specifications.push(summarizePairs(
      mode,"GREEDY_WITHOUT_REPLACEMENT_HARDEST_FIRST",label,caliper,
      matchingWithoutReplacement(mode,caliper)
    ));
  }
}

function rankSpec(a,b){
  // Governance-oriented ranking: prioritize strong post-match balance first,
  // then retention, then lower reuse, then tighter mean distance.
  const aGood=a.balance.maxAbsoluteSMD<=.10?0:a.balance.maxAbsoluteSMD<=.20?1:2;
  const bGood=b.balance.maxAbsoluteSMD<=.10?0:b.balance.maxAbsoluteSMD<=.20?1:2;
  return aGood-bGood
    || a.balance.maxAbsoluteSMD-b.balance.maxAbsoluteSMD
    || b.treatedRetentionRate-a.treatedRetentionRate
    || a.maximumControlReuse-b.maximumControlReuse
    || a.distance.mean-b.distance.mean;
}

const ranked=[...specifications].sort(rankSpec).map((x,i)=>({
  rank:i+1,
  ...x,
  selectionAuthorized:false
}));

console.log(JSON.stringify({
  contractVersion:"FIE-NFL-HISTORICAL-AVAILABILITY-MATCHING-DESIGN-REPORT-1.0.0",
  sprint:"2.18.13-RC1",
  mode:"READ_ONLY",
  cohort:{
    treatedJoined:treated.length,
    broadControlsJoined:controls.length,
    missingDecisionRecordCount,
    sideMismatchCount,
    missingFeatureRecordCount,
  },
  featureSpace:{
    keys:FEATURE_KEYS,
    scaling:"POOLED_Z_SCORE",
    distance:"ROOT_MEAN_SQUARED_STANDARDIZED_EUCLIDEAN",
    outcomesUsed:false,
  },
  empiricalCalipers:{
    SAME_SEASON_SIDE:thresholds.SAME_SEASON_SIDE,
    SAME_SEASON:thresholds.SAME_SEASON,
    status:"DIAGNOSTIC_CANDIDATE_CALIPERS_NOT_YET_AUTHORIZED",
  },
  evaluatedSpecificationCount:specifications.length,
  rankedSpecifications:ranked,
  selectionBoundary:{
    matchingSpecificationSelected:false,
    rankingIsDiagnosticOnly:true,
    rankingUsesOutcome:false,
    forcedMatchingProhibited:true,
    postMatchBalanceRequired:true,
    causalTargetDefined:false,
    fittingAuthorized:false,
  },
  safeguards:{
    outcomesNotReadForSelection:true,
    matchedDatasetPersisted:false,
    learnedWeightsCreated:false,
    calibrationExecuted:false,
    decisionModelMutated:false,
    teamStrengthMutated:false,
    pickemScoringMutated:false,
    databaseMutated:false,
  }
},null,2));
