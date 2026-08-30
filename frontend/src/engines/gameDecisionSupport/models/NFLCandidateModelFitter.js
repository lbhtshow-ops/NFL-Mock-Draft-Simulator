
import {predictNFLCandidate} from "./NFLCandidateDecisionModels.js";
const margin=r=>Number(r?.outcome?.homeScore)-Number(r?.outcome?.awayScore);
const mae=(records,id,p)=>records.reduce((s,r)=>s+Math.abs(predictNFLCandidate(id,r,p).expectedHomeMargin-margin(r)),0)/records.length;
export function fitNFLCandidateModel({modelId,trainingRecords=[]}={}){
 if(!trainingRecords.length) throw new Error("trainingRecords are required");
 if(modelId==="BASELINE_HOME_FIELD"){
   const h=trainingRecords.reduce((s,r)=>s+margin(r),0)/trainingRecords.length;
   return {modelId,status:"RESEARCH_ONLY",parameters:{homeFieldPoints:h,edgeScale:0,probabilityScale:6.5},trainingRecords:trainingRecords.length};
 }
 let best;
 for(let h=-1;h<=4;h+=.25) for(let e=.25;e<=4;e+=.25){
   const p={homeFieldPoints:h,edgeScale:e,probabilityScale:6.5}, score=mae(trainingRecords,modelId,p);
   if(!best||score<best.score) best={score,parameters:p};
 }
 return {modelId,status:"RESEARCH_ONLY",parameters:best.parameters,trainingRecords:trainingRecords.length,trainingMarginMAE:best.score};
}
