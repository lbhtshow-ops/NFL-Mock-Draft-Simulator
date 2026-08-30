import {evaluateNFLDecisionModelPromotionGate,detectEmpiricallyIndistinguishableCandidates} from "./NFLDecisionModelPromotionGate.js";
export function buildNFLDecisionModelValidationReport(experiments=[]){
 const ids=[...new Set(experiments.flatMap(e=>e.candidates.map(c=>c.modelId)))].filter(x=>x!=="BASELINE_HOME_FIELD");
 return{contract:"NFLDecisionModelValidationReport",version:"1.0.0",status:"RESEARCH_ONLY",holdoutSeasons:experiments.map(e=>e.holdoutSeason),indistinguishableCandidates:detectEmpiricallyIndistinguishableCandidates(experiments),promotionGates:ids.map(candidateId=>evaluateNFLDecisionModelPromotionGate({experiments,candidateId})),productionAuthorityGranted:false};
}
