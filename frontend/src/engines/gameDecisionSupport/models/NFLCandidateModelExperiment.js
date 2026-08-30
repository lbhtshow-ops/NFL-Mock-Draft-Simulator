
import {NFL_CANDIDATE_MODEL_IDS} from "./NFLCandidateDecisionModels.js";
import {fitNFLCandidateModel} from "./NFLCandidateModelFitter.js";
import {evaluateNFLCandidateModel} from "./NFLCandidateModelEvaluator.js";
export function runNFLSeasonHoldoutExperiment({records=[],holdoutSeason}={}){
 const train=records.filter(r=>Number(r?.game?.season)!==Number(holdoutSeason));
 const hold=records.filter(r=>Number(r?.game?.season)===Number(holdoutSeason));
 if(!train.length||!hold.length) throw new Error("Both training and holdout records are required");
 return {contract:"NFLCandidateModelSeasonHoldoutExperiment",version:"1.0.0",status:"RESEARCH_ONLY",
 holdoutSeason,trainingRecords:train.length,holdoutRecords:hold.length,
 candidates:NFL_CANDIDATE_MODEL_IDS.map(modelId=>{const fit=fitNFLCandidateModel({modelId,trainingRecords:train});
 return {modelId,parameters:fit.parameters,training:fit,holdout:evaluateNFLCandidateModel({modelId,records:hold,parameters:fit.parameters})};})};
}
