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
function variance(xs){
  if(xs.length<2) return null;
  const m=mean(xs);
  return xs.reduce((a,b)=>a+(b-m)**2,0)/(xs.length-1);
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
function perspective(value,side){
  if(!finite(value)||!side) return null;
  return side==="HOME"?n(value):-n(value);
}
function decisionFeatureRecord(decision,team){
  const side=sideFor(decision?.game,team);
  if(!side) return null;
  const prediction=predictNFLCandidate(generatedModel.modelId,{
    pregame:{
      matchupEdge:decision?.pregame?.matchupEdge,
      evidenceQuality:decision?.pregame?.evidenceQuality
    }
  },generatedModel.parameters);

  const d=decision?.pregame?.dimensions??{};
  const context=decision?.pregame?.context??{};
  const teamRest=side==="HOME"?decision?.game?.homeRest:decision?.game?.awayRest;
  const opponentRest=side==="HOME"?decision?.game?.awayRest:decision?.game?.homeRest;

  return Object.freeze({
    gameId:decision?.game?.gameId??null,
    season:decision?.game?.season??null,
    week:decision?.game?.week??null,
    gameType:decision?.game?.gameType??null,
    team,side,
    teamMatchupEdge:perspective(decision?.pregame?.matchupEdge,side),
    absoluteMatchupEdge:finite(decision?.pregame?.matchupEdge)?Math.abs(n(decision.pregame.matchupEdge)):null,
    evidenceQuality:finite(decision?.pregame?.evidenceQuality)?n(decision.pregame.evidenceQuality):null,
    expectedTeamMargin:side==="HOME"?prediction.expectedHomeMargin:-prediction.expectedHomeMargin,
    restDifferential:finite(teamRest)&&finite(opponentRest)?n(teamRest)-n(opponentRest):null,
    overallStrength:perspective(d?.overallStrength,side),
    passMatchup:perspective(d?.passMatchup,side),
    rushMatchup:perspective(d?.rushMatchup,side),
    recentForm:perspective(d?.recentForm,side),
    specialTeams:perspective(d?.specialTeams,side),
    protectionPressure:perspective(d?.protectionPressure,side),
    explosivePlay:perspective(d?.explosivePlay,side),
    redZone:perspective(d?.redZone,side),
    homeField:finite(context?.homeField)?n(context.homeField):null,
  });
}

const decisionByGame=new Map();
for(const row of generatedNFLHistoricalDecisionDataset){
  const id=row?.game?.gameId;
  if(id) decisionByGame.set(id,row);
}

const cohort=readJsonl(COHORT);
const relevant=cohort.filter(r=>["TREATED","CONTROL_CANDIDATE"].includes(r?.classification));
const joined=[];
let missingDecision=0,sideMismatch=0;
for(const row of relevant){
  const decision=decisionByGame.get(row?.identity?.gameId);
  if(!decision){ missingDecision++; continue; }
  const feature=decisionFeatureRecord(decision,row?.identity?.team);
  if(!feature){ sideMismatch++; continue; }
  joined.push(Object.freeze({
    classification:row.classification,
    questionableCount:row?.availability?.questionableCount??0,
    ...feature
  }));
}

const treated=joined.filter(r=>r.classification==="TREATED");
const broadControls=joined.filter(r=>r.classification==="CONTROL_CANDIDATE");
const strictControls=broadControls.filter(r=>(r.questionableCount??0)===0);
const questionableOnlyControls=broadControls.filter(r=>(r.questionableCount??0)>0);

const numericFeatures=[
  "teamMatchupEdge","absoluteMatchupEdge","evidenceQuality","expectedTeamMargin","restDifferential",
  "overallStrength","passMatchup","rushMatchup","recentForm","specialTeams",
  "protectionPressure","explosivePlay","redZone"
];

function featureValues(rows,key){
  return rows.map(r=>r[key]).filter(finite).map(n);
}
function balanceReport(controlRows){
  const features={};
  for(const key of numericFeatures){
    const t=featureValues(treated,key),c=featureValues(controlRows,key);
    features[key]={
      treatedN:t.length,controlN:c.length,
      treatedMean:mean(t),controlMean:mean(c),
      standardizedMeanDifference:smd(t,c),
      absoluteSMD:finite(smd(t,c))?Math.abs(smd(t,c)):null
    };
  }
  const bySeason={};
  for(const season of [2022,2023,2024]){
    bySeason[season]={
      treated:treated.filter(r=>r.season===season).length,
      controls:controlRows.filter(r=>r.season===season).length
    };
  }
  const bySide={
    HOME:{treated:treated.filter(r=>r.side==="HOME").length,controls:controlRows.filter(r=>r.side==="HOME").length},
    AWAY:{treated:treated.filter(r=>r.side==="AWAY").length,controls:controlRows.filter(r=>r.side==="AWAY").length}
  };
  const smds=Object.values(features).map(x=>x.absoluteSMD).filter(finite);
  return {
    controlCount:controlRows.length,
    features,
    bySeason,bySide,
    maxAbsoluteSMD:smds.length?Math.max(...smds):null,
    featuresAtOrBelowPoint10:smds.filter(x=>x<=0.10).length,
    featuresAtOrBelowPoint20:smds.filter(x=>x<=0.20).length,
    evaluatedFeatureCount:smds.length
  };
}

const broad=balanceReport(broadControls);
const strict=balanceReport(strictControls);

console.log(JSON.stringify({
  contractVersion:"FIE-NFL-HISTORICAL-AVAILABILITY-TREATED-CONTROL-COMPARABILITY-REPORT-1.0.0",
  sprint:"2.18.11-RC1",
  mode:"READ_ONLY",
  canonicalModel:{
    modelId:generatedModel?.modelId??null,
    modelVersion:generatedModel?.modelVersion??null,
    productionAuthorityGranted:generatedModel?.productionAuthorityGranted===true,
    parameters:generatedModel?.parameters??null
  },
  cohort:{
    sourceRecords:cohort.length,
    treatedExpected:187,
    treatedJoined:treated.length,
    broadControlExpected:230,
    broadControlsJoined:broadControls.length,
    strictNoQuestionableControls:strictControls.length,
    questionableOnlyControls:questionableOnlyControls.length,
    missingDecisionRecordCount:missingDecision,
    sideMismatchCount:sideMismatch
  },
  broadControlComparability:broad,
  strictControlComparability:strict,
  interpretationBoundary:{
    standardizedMeanDifferenceIsDiagnosticOnly:true,
    broadControlsAuthorizedForMatching:false,
    strictControlsAuthorizedForMatching:false,
    matchedCohortConstructed:false,
    causalTargetDefined:false,
    fittingAuthorized:false
  },
  safeguards:{
    outcomesNotUsedForComparability:true,
    learnedWeightsCreated:false,
    calibrationExecuted:false,
    decisionModelMutated:false,
    teamStrengthMutated:false,
    pickemScoringMutated:false,
    databaseMutated:false
  }
},null,2));
