import generatedNFLHistoricalDecisionDataset from "../src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalDecisionDataset.js";
import { predictNFLCandidate } from "../src/engines/gameDecisionSupport/models/NFLCandidateDecisionModels.js";
import generatedModel from "../src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLCanonicalGameDecisionModelV1.js";

const FEATURE_KEYS=Object.freeze([
  "expectedTeamMargin","evidenceQuality","restDifferential","overallStrength",
  "passMatchup","rushMatchup","recentForm","specialTeams","explosivePlay","redZone"
]);

const finite=v=>v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v));
const n=v=>Number(v);
const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;

function variance(xs){
  if(xs.length<2)return null;
  const m=mean(xs);
  return xs.reduce((s,x)=>s+(x-m)**2,0)/(xs.length-1);
}
function sd(xs){
  const v=variance(xs);
  return finite(v)?Math.sqrt(v):null;
}
function percentile(xs,p){
  if(!xs.length)return null;
  const s=[...xs].sort((a,b)=>a-b);
  const i=(s.length-1)*p,l=Math.floor(i),h=Math.ceil(i);
  return l===h?s[l]:s[l]+(s[h]-s[l])*(i-l);
}
function smd(a,b){
  if(a.length<2||b.length<2)return null;
  const va=variance(a),vb=variance(b);
  if(!finite(va)||!finite(vb))return null;
  const pooled=Math.sqrt((va+vb)/2);
  if(!pooled)return mean(a)===mean(b)?0:null;
  return (mean(a)-mean(b))/pooled;
}
function sideFor(game,team){
  if(game?.homeTeam===team)return "HOME";
  if(game?.awayTeam===team)return "AWAY";
  return null;
}
function perspective(v,side){
  if(!finite(v)||!side)return null;
  return side==="HOME"?n(v):-n(v);
}

function featureRecord(decision,team,classification,questionableCount){
  const side=sideFor(decision?.game,team);
  if(!side)return null;

  const edge=decision?.pregame?.matchupEdge;
  const quality=decision?.pregame?.evidenceQuality;
  if(!finite(edge)||!finite(quality))return null;

  const prediction=predictNFLCandidate(generatedModel.modelId,{
    pregame:{matchupEdge:edge,evidenceQuality:quality}
  },generatedModel.parameters);

  const d=decision?.pregame?.dimensions??{};
  const teamRest=side==="HOME"?decision?.game?.homeRest:decision?.game?.awayRest;
  const oppRest=side==="HOME"?decision?.game?.awayRest:decision?.game?.homeRest;

  return Object.freeze({
    key:`${decision?.game?.gameId}:${team}`,
    gameId:decision?.game?.gameId??null,
    team,season:decision?.game?.season??null,week:decision?.game?.week??null,side,
    classification,questionableCount,
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

function nearest(record,pool,distance){
  let best=null;
  for(const c of pool){
    const d=distance(record,c);
    if(!best||d<best.distance||(d===best.distance&&c.key<best.control.key)){
      best={control:c,distance:d};
    }
  }
  return best;
}

export function buildHistoricalAvailabilityMatchedCohort({
  cohortRows=[],
  selectorReport=null,
  estimandReport=null,
}={}){
  if(selectorReport?.decision!=="SELECTED_FOR_CAUSAL_ESTIMAND_DESIGN"){
    throw new Error("Matching specification is not selected.");
  }
  if(estimandReport?.decision!=="ESTIMAND_DEFINED_FOR_MATCHED_COHORT_CONSTRUCTION"){
    throw new Error("Causal estimand is not authorized for matched cohort construction.");
  }

  const spec=selectorReport?.candidate?.specification??{};
  if(spec.mode!=="SAME_SEASON"||spec.method!=="NEAREST_WITH_REPLACEMENT"||spec.caliperLabel!=="p75"){
    throw new Error("Unexpected matching specification.");
  }
  const caliper=n(spec.caliper);
  if(!finite(caliper))throw new Error("Selected caliper is invalid.");

  const decisionByGame=new Map();
  for(const row of generatedNFLHistoricalDecisionDataset){
    if(row?.game?.gameId)decisionByGame.set(row.game.gameId,row);
  }

  const joined=[];
  let missingDecisionRecordCount=0,sideMismatchCount=0,missingFeatureRecordCount=0;
  for(const row of cohortRows.filter(r=>["TREATED","CONTROL_CANDIDATE"].includes(r?.classification))){
    const decision=decisionByGame.get(row?.identity?.gameId);
    if(!decision){missingDecisionRecordCount++;continue;}
    const rec=featureRecord(
      decision,row?.identity?.team,row?.classification,row?.availability?.questionableCount??0
    );
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
  const z=(v,key)=>{
    const s=scaling[key];
    if(!finite(v)||!finite(s?.sd)||s.sd===0)return 0;
    return (n(v)-s.mean)/s.sd;
  };
  const distance=(a,b)=>{
    const diffs=FEATURE_KEYS.map(k=>z(a[k],k)-z(b[k],k));
    return Math.sqrt(diffs.reduce((sum,x)=>sum+x*x,0)/diffs.length);
  };

  const pairs=[];
  const unmatched=[];
  for(const t of treated){
    const pool=controls.filter(c=>c.season===t.season);
    const match=nearest(t,pool,distance);
    if(match&&finite(match.distance)&&match.distance<=caliper){
      pairs.push(Object.freeze({
        contract:"NFLHistoricalAvailabilityMatchedPair",
        contractVersion:"FIE-NFL-HISTORICAL-AVAILABILITY-MATCHED-PAIR-1.0.0",
        pairId:`pair:${t.key}=>${match.control.key}`,
        pairWeight:1,
        treated:Object.freeze({
          key:t.key,gameId:t.gameId,team:t.team,season:t.season,week:t.week,side:t.side,
          pregameFeatures:Object.freeze(Object.fromEntries(FEATURE_KEYS.map(k=>[k,t[k]])))
        }),
        control:Object.freeze({
          key:match.control.key,gameId:match.control.gameId,team:match.control.team,
          season:match.control.season,week:match.control.week,side:match.control.side,
          pregameFeatures:Object.freeze(Object.fromEntries(FEATURE_KEYS.map(k=>[k,match.control[k]])))
        }),
        matching:Object.freeze({
          mode:spec.mode,method:spec.method,caliperLabel:spec.caliperLabel,caliper,
          distance:match.distance,withReplacement:true
        }),
        estimand:Object.freeze({
          id:estimandReport?.estimand?.estimandId??null,
          family:estimandReport?.estimand?.estimandFamily??null,
          orientation:estimandReport?.estimand?.effectScale?.orientation??null
        }),
        safeguards:Object.freeze({
          outcomeJoined:false,effectEstimated:false,learnedWeightsCreated:false,
          calibrationExecuted:false,teamStrengthMutated:false,decisionModelMutated:false,
          pickemScoringMutated:false
        })
      }));
    }else{
      unmatched.push(Object.freeze({
        key:t.key,gameId:t.gameId,team:t.team,season:t.season,week:t.week,side:t.side,
        nearestDistance:match?.distance??null,
        reason:match?"OUTSIDE_SELECTED_CALIPER":"NO_SAME_SEASON_CONTROL"
      }));
    }
  }

  const reuse=new Map();
  for(const p of pairs)reuse.set(p.control.key,(reuse.get(p.control.key)??0)+1);

  const balance={};
  for(const key of FEATURE_KEYS){
    const tv=pairs.map(p=>p.treated.pregameFeatures[key]).map(n);
    const cv=pairs.map(p=>p.control.pregameFeatures[key]).map(n);
    const s=smd(tv,cv);
    balance[key]=Object.freeze({standardizedMeanDifference:s,absoluteSMD:finite(s)?Math.abs(s):null});
  }
  const abs=Object.values(balance).map(x=>x.absoluteSMD).filter(finite);

  const report=Object.freeze({
    contractVersion:"FIE-NFL-HISTORICAL-AVAILABILITY-MATCHED-COHORT-REPORT-1.0.0",
    sprint:"2.18.16-RC1",
    source:{
      selectorSprint:selectorReport?.sprint??null,
      estimandSprint:estimandReport?.sprint??null
    },
    matchingSpecification:Object.freeze({...spec}),
    cohort:{
      treatedAvailable:treated.length,
      matchedPairCount:pairs.length,
      unmatchedTreatedCount:unmatched.length,
      uniqueControlsUsed:reuse.size,
      maximumControlReuse:reuse.size?Math.max(...reuse.values()):0,
      controlsReusedMoreThanOnce:[...reuse.values()].filter(v=>v>1).length,
      missingDecisionRecordCount,sideMismatchCount,missingFeatureRecordCount
    },
    expectedReconciliation:{
      expectedTreatedAvailable:187,
      expectedMatchedPairs:131,
      expectedUnmatchedTreated:56,
      expectedUniqueControls:76,
      expectedMaximumControlReuse:7
    },
    reconciliation:{
      treatedAvailableMatches:treated.length===187,
      matchedPairCountMatches:pairs.length===131,
      unmatchedTreatedCountMatches:unmatched.length===56,
      uniqueControlsMatches:reuse.size===76,
      maximumControlReuseMatches:(reuse.size?Math.max(...reuse.values()):0)===7,
      pairIdsUnique:new Set(pairs.map(p=>p.pairId)).size===pairs.length,
      noOutcomesPresent:pairs.every(p=>p?.safeguards?.outcomeJoined===false)
    },
    balance:{
      features:Object.freeze(balance),
      maxAbsoluteSMD:abs.length?Math.max(...abs):null,
      meanAbsoluteSMD:abs.length?mean(abs):null,
      featuresAtOrBelowPoint10:abs.filter(v=>v<=.10).length,
      featuresAtOrBelowPoint20:abs.filter(v=>v<=.20).length,
      evaluatedFeatureCount:abs.length
    },
    unmatched:Object.freeze(unmatched),
    readiness:{
      matchedCohortConstructible:
        treated.length===187&&pairs.length===131&&unmatched.length===56&&reuse.size===76&&
        (reuse.size?Math.max(...reuse.values()):0)===7&&
        new Set(pairs.map(p=>p.pairId)).size===pairs.length&&
        missingDecisionRecordCount===0&&sideMismatchCount===0&&missingFeatureRecordCount===0&&
        abs.length===FEATURE_KEYS.length&&Math.max(...abs)<=.10,
      outcomeJoinAuthorized:false,
      causalEffectEstimationAuthorized:false,
      inferentialClaimsAuthorized:false,
      calibrationAuthorized:false
    },
    safeguards:{
      outcomesRead:false,matchedCohortContainsOutcomes:false,effectEstimated:false,
      unmatchedTreatedForcedIntoSupport:false,learnedWeightsCreated:false,
      calibrationExecuted:false,teamStrengthMutated:false,decisionModelMutated:false,
      pickemScoringMutated:false,databaseMutated:false
    }
  });

  return Object.freeze({pairs:Object.freeze(pairs),report});
}

export { FEATURE_KEYS };
