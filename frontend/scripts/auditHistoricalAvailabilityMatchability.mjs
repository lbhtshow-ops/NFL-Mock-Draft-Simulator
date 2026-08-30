import fs from "node:fs";
import generatedNFLHistoricalDecisionDataset from "../src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalDecisionDataset.js";
import { predictNFLCandidate } from "../src/engines/gameDecisionSupport/models/NFLCandidateDecisionModels.js";
import generatedModel from "../src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLCanonicalGameDecisionModelV1.js";

const COHORT="./data/calibration/historical/v1/historical-availability-control-cohort-v1.jsonl";

function readJsonl(file){
  if(!fs.existsSync(file)) return [];
  return fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
}
const finite=(v)=>v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v));
const n=(v)=>Number(v);
const mean=(xs)=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
function sd(xs){
  if(xs.length<2) return null;
  const m=mean(xs);
  return Math.sqrt(xs.reduce((s,x)=>s+(x-m)**2,0)/(xs.length-1));
}
function percentile(xs,p){
  if(!xs.length) return null;
  const s=[...xs].sort((a,b)=>a-b);
  const idx=(s.length-1)*p;
  const lo=Math.floor(idx),hi=Math.ceil(idx);
  return lo===hi?s[lo]:s[lo]+(s[hi]-s[lo])*(idx-lo);
}
function sideFor(game,team){
  if(game?.homeTeam===team) return "HOME";
  if(game?.awayTeam===team) return "AWAY";
  return null;
}
function perspective(value,side){
  if(!finite(value)||!side) return null;
  return side==="HOME"?n(value):-n(value);
}
function buildFeatureRecord(decision,team,classification,questionableCount){
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
    gameId:decision?.game?.gameId??null,
    season:decision?.game?.season??null,
    week:decision?.game?.week??null,
    team,
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

const FEATURE_KEYS=[
  "expectedTeamMargin","evidenceQuality","restDifferential","overallStrength",
  "passMatchup","rushMatchup","recentForm","specialTeams","explosivePlay","redZone"
];

const decisionByGame=new Map();
for(const row of generatedNFLHistoricalDecisionDataset){
  if(row?.game?.gameId) decisionByGame.set(row.game.gameId,row);
}
const cohort=readJsonl(COHORT);
const relevant=cohort.filter(r=>["TREATED","CONTROL_CANDIDATE"].includes(r?.classification));

const joined=[];
let missingDecisionRecordCount=0,sideMismatchCount=0,missingFeatureRecordCount=0;
for(const row of relevant){
  const decision=decisionByGame.get(row?.identity?.gameId);
  if(!decision){missingDecisionRecordCount++;continue;}
  const record=buildFeatureRecord(
    decision,row?.identity?.team,row?.classification,row?.availability?.questionableCount??0
  );
  if(!record){sideMismatchCount++;continue;}
  if(FEATURE_KEYS.some(k=>!finite(record[k]))){missingFeatureRecordCount++;continue;}
  joined.push(record);
}

const treated=joined.filter(r=>r.classification==="TREATED");
const broadControls=joined.filter(r=>r.classification==="CONTROL_CANDIDATE");

const pooled=[...treated,...broadControls];
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
  return Math.sqrt(diffs.reduce((s,x)=>s+x*x,0)/diffs.length);
}
function controlsFor(t,mode){
  if(mode==="SAME_SEASON_SIDE"){
    return broadControls.filter(c=>c.season===t.season&&c.side===t.side);
  }
  if(mode==="SAME_SEASON"){
    return broadControls.filter(c=>c.season===t.season);
  }
  return broadControls;
}
function nearestFor(record,pool,excludeSelf=false){
  let best=null;
  for(const c of pool){
    if(excludeSelf && c.gameId===record.gameId && c.team===record.team) continue;
    const d=distance(record,c);
    if(!best||d<best.distance) best={control:c,distance:d};
  }
  return best;
}

// Build an empirical reference from control-to-control nearest-neighbor distances
// within the strict same-season+side strata.
const controlReferenceDistances=[];
for(const c of broadControls){
  const pool=broadControls.filter(x=>x.season===c.season&&x.side===c.side);
  const nearest=nearestFor(c,pool,true);
  if(nearest) controlReferenceDistances.push(nearest.distance);
}
const referenceThresholds={
  p50:percentile(controlReferenceDistances,.50),
  p75:percentile(controlReferenceDistances,.75),
  p90:percentile(controlReferenceDistances,.90),
  p95:percentile(controlReferenceDistances,.95),
};

function treatedMatchability(mode){
  const rows=[];
  for(const t of treated){
    const pool=controlsFor(t,mode);
    const nearest=nearestFor(t,pool,false);
    rows.push({
      gameId:t.gameId,team:t.team,season:t.season,side:t.side,
      candidateCount:pool.length,
      nearestDistance:nearest?.distance??null,
      nearestControlGameId:nearest?.control?.gameId??null,
      nearestControlTeam:nearest?.control?.team??null
    });
  }
  const distances=rows.map(r=>r.nearestDistance).filter(finite);
  const thresholdCounts={};
  for(const [name,thr] of Object.entries(referenceThresholds)){
    thresholdCounts[name]=finite(thr)?rows.filter(r=>finite(r.nearestDistance)&&r.nearestDistance<=thr).length:null;
  }
  return {
    treatedCount:rows.length,
    treatedWithAtLeastOneCandidate:rows.filter(r=>r.candidateCount>0).length,
    treatedWithoutCandidate:rows.filter(r=>r.candidateCount===0).length,
    nearestDistanceDistribution:{
      min:distances.length?Math.min(...distances):null,
      p25:percentile(distances,.25),
      p50:percentile(distances,.50),
      p75:percentile(distances,.75),
      p90:percentile(distances,.90),
      p95:percentile(distances,.95),
      max:distances.length?Math.max(...distances):null,
    },
    treatedWithinEmpiricalControlNNThreshold:thresholdCounts,
    worstTen:[...rows].filter(r=>finite(r.nearestDistance)).sort((a,b)=>b.nearestDistance-a.nearestDistance).slice(0,10),
  };
}

function univariateCommonSupport(){
  const report={};
  for(const key of FEATURE_KEYS){
    const cv=broadControls.map(r=>r[key]).filter(finite).map(n);
    const min=cv.length?Math.min(...cv):null,max=cv.length?Math.max(...cv):null;
    const outside=treated.filter(r=>finite(r[key])&&(n(r[key])<min||n(r[key])>max)).length;
    report[key]={controlMin:min,controlMax:max,treatedOutsideControlRange:outside,treatedInsideControlRange:treated.length-outside};
  }
  return report;
}

const exactSeasonSide=treatedMatchability("SAME_SEASON_SIDE");
const sameSeason=treatedMatchability("SAME_SEASON");

console.log(JSON.stringify({
  contractVersion:"FIE-NFL-HISTORICAL-AVAILABILITY-MATCHABILITY-REPORT-1.0.0",
  sprint:"2.18.12-RC1",
  mode:"READ_ONLY",
  cohort:{
    sourceRecords:cohort.length,
    treatedJoined:treated.length,
    broadControlsJoined:broadControls.length,
    missingDecisionRecordCount,
    sideMismatchCount,
    missingFeatureRecordCount
  },
  featureSpace:{
    keys:FEATURE_KEYS,
    scaling:"POOLED_Z_SCORE",
    distance:"ROOT_MEAN_SQUARED_STANDARDIZED_EUCLIDEAN",
    outcomesUsed:false
  },
  empiricalControlNearestNeighborReference:{
    stratum:"SAME_SEASON_SIDE",
    controlReferenceCount:controlReferenceDistances.length,
    thresholds:referenceThresholds
  },
  univariateCommonSupport:univariateCommonSupport(),
  sameSeasonSideMatchability:exactSeasonSide,
  sameSeasonMatchability:sameSeason,
  interpretationBoundary:{
    referenceThresholdsAreDiagnosticNotAuthorizedCalipers:true,
    candidatePoolIsBroadControlPool:true,
    matchedCohortConstructed:false,
    forcedMatchingProhibited:true,
    causalTargetDefined:false,
    fittingAuthorized:false
  },
  safeguards:{
    outcomesNotUsedForDistance:true,
    learnedWeightsCreated:false,
    calibrationExecuted:false,
    decisionModelMutated:false,
    teamStrengthMutated:false,
    pickemScoringMutated:false,
    databaseMutated:false
  }
},null,2));
