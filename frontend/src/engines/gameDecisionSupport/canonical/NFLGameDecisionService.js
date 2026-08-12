import {evaluateNFLGameDecisionV1} from "./NFLGameDecisionModelV1.js";
export function getNFLGameDecision({game,matchupIntelligence,generatedAt=null}={}){
  return evaluateNFLGameDecisionV1({game,matchupIntelligence,generatedAt});
}
export default {getNFLGameDecision};
