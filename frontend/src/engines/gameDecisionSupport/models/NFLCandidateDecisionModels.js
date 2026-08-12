
import {NFL_CANDIDATE_MODEL_STATUS} from "./NFLCandidateDecisionModelContract.js";
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const logistic=x=>1/(1+Math.exp(-x));
const n=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
export const NFL_CANDIDATE_MODEL_IDS=Object.freeze([
"BASELINE_HOME_FIELD","MATCHUP_EDGE_LINEAR","MATCHUP_EDGE_LOGISTIC","QUALITY_WEIGHTED_MATCHUP"]);
function f(r,k,d=0){return n((r?.pregame||r?.features||{})[k],d);}
export function predictNFLCandidate(modelId,record,parameters={}){
  const edge=f(record,"matchupEdge",0), quality=clamp(f(record,"evidenceQuality",.5),0,1);
  const hfa=n(parameters.homeFieldPoints,1.5), scale=n(parameters.edgeScale,1);
  let margin;
  if(modelId==="BASELINE_HOME_FIELD") margin=hfa;
  else if(modelId==="MATCHUP_EDGE_LINEAR"||modelId==="MATCHUP_EDGE_LOGISTIC") margin=hfa+edge*scale;
  else if(modelId==="QUALITY_WEIGHTED_MATCHUP") margin=hfa+edge*quality*scale;
  else throw new Error(`Unknown candidate model: ${modelId}`);
  const probability=clamp(logistic(margin/n(parameters.probabilityScale,6.5)),.01,.99);
  return {contract:"NFLCandidateDecisionPrediction",version:"1.0.0",status:NFL_CANDIDATE_MODEL_STATUS,
    modelId,expectedHomeMargin:margin,homeWinProbability:probability,predictedWinner:probability>=.5?"HOME":"AWAY"};
}
