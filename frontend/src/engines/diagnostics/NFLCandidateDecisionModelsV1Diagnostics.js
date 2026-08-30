
import {validateCandidatePrediction} from "../gameDecisionSupport/models/NFLCandidateDecisionModelContract.js";
import {predictNFLCandidate,NFL_CANDIDATE_MODEL_IDS} from "../gameDecisionSupport/models/NFLCandidateDecisionModels.js";
import {fitNFLCandidateModel} from "../gameDecisionSupport/models/NFLCandidateModelFitter.js";
import {evaluateNFLCandidateModel} from "../gameDecisionSupport/models/NFLCandidateModelEvaluator.js";
import {runNFLSeasonHoldoutExperiment} from "../gameDecisionSupport/models/NFLCandidateModelExperiment.js";

const tests=[];
const check=(name,fn)=>{try{fn();tests.push({name,passed:true})}catch(e){tests.push({name,passed:false,error:e.message})}};
const assert=(c,m)=>{if(!c)throw new Error(m)};
const rec=(season,edge,h,a,q=.8)=>({game:{season},pregame:{matchupEdge:edge,evidenceQuality:q},outcome:{homeScore:h,awayScore:a}});
const records=[rec(2024,4,27,20),rec(2024,-3,17,24),rec(2024,2,24,21),rec(2025,5,31,17),rec(2025,-4,14,28),rec(2025,1,23,20)];

check("four-research-candidates-exist",()=>assert(NFL_CANDIDATE_MODEL_IDS.length===4,"expected four candidates"));
check("prediction-contract-validates",()=>assert(validateCandidatePrediction(predictNFLCandidate("MATCHUP_EDGE_LINEAR",records[0],{})).valid,"prediction invalid"));
check("all-candidates-remain-research-only",()=>{for(const id of NFL_CANDIDATE_MODEL_IDS)assert(predictNFLCandidate(id,records[0],{}).status==="RESEARCH_ONLY","candidate promoted")});
check("baseline-can-fit",()=>assert(Number.isFinite(fitNFLCandidateModel({modelId:"BASELINE_HOME_FIELD",trainingRecords:records}).parameters.homeFieldPoints),"baseline fit failed"));
check("margin-candidate-can-fit",()=>assert(Number.isFinite(fitNFLCandidateModel({modelId:"MATCHUP_EDGE_LINEAR",trainingRecords:records}).parameters.edgeScale),"margin fit failed"));
check("evaluation-computes-required-metrics",()=>{
 const fit=fitNFLCandidateModel({modelId:"MATCHUP_EDGE_LINEAR",trainingRecords:records});
 const e=evaluateNFLCandidateModel({modelId:"MATCHUP_EDGE_LINEAR",records,parameters:fit.parameters});
 for(const k of ["winnerAccuracy","brierScore","logLoss","marginMAE"]) assert(Number.isFinite(e[k]),`${k} missing`);
});
check("calibration-retains-sample-count",()=>{
 const e=evaluateNFLCandidateModel({modelId:"BASELINE_HOME_FIELD",records,parameters:{homeFieldPoints:1.5}});
 assert(e.calibrationBins.reduce((s,b)=>s+b.count,0)===records.length,"calibration count mismatch");
});
check("season-holdout-is-separated",()=>{
 const x=runNFLSeasonHoldoutExperiment({records,holdoutSeason:2025});
 assert(x.trainingRecords===3&&x.holdoutRecords===3,"holdout leakage");
});
check("experiment-evaluates-all-candidates",()=>assert(runNFLSeasonHoldoutExperiment({records,holdoutSeason:2025}).candidates.length===4,"candidate missing"));
check("no-candidate-is-production-authority",()=>assert(runNFLSeasonHoldoutExperiment({records,holdoutSeason:2025}).status==="RESEARCH_ONLY","experiment promoted"));

const failed=tests.filter(t=>!t.passed);
console.log(JSON.stringify({suite:"NFL Candidate Decision Models & Empirical Evaluation V1 Diagnostics",passed:tests.length-failed.length,failed:failed.length,tests},null,2));
if(failed.length)process.exitCode=1;
