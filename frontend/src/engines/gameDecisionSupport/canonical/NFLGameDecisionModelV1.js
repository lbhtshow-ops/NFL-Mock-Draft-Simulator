import {predictNFLCandidate} from "../models/NFLCandidateDecisionModels.js";
import generatedModel from "../../../data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLCanonicalGameDecisionModelV1.js";
import {createNFLGameDecisionOutput} from "./NFLGameDecisionOutputContract.js";

export const NFL_CANONICAL_GAME_DECISION_MODEL_ID = "QUALITY_WEIGHTED_MATCHUP";
export const NFL_CANONICAL_GAME_DECISION_MODEL_VERSION = "NFL-GAME-DECISION-MODEL-V1.0.0";

function confidenceBand(value){
  if(!Number.isFinite(value)) return "UNKNOWN";
  if(value>=.80) return "HIGH";
  if(value>=.65) return "MODERATE";
  return "LOW";
}

export function getNFLCanonicalGameDecisionModelConfig(){
  if(!generatedModel) throw new Error("Canonical NFL Game Decision Model V1 has not been promoted. Run promoteNFLGameDecisionModelV1.mjs.");
  if(generatedModel.modelId!==NFL_CANONICAL_GAME_DECISION_MODEL_ID) throw new Error(`Unexpected canonical model id: ${generatedModel.modelId}`);
  if(generatedModel.productionAuthorityGranted!==true) throw new Error("Canonical model exists but production authority is not granted.");
  return generatedModel;
}

export function evaluateNFLGameDecisionV1({game={},matchupIntelligence={},generatedAt=null}={}){
  const config=getNFLCanonicalGameDecisionModelConfig();
  const prediction=predictNFLCandidate(config.modelId,{
    pregame:{
      matchupEdge:matchupIntelligence.matchupEdge,
      evidenceQuality:matchupIntelligence.evidenceQuality
    }
  },config.parameters);

  const favorite=prediction.homeWinProbability>=.5 ? game.homeTeam||null : game.awayTeam||null;
  const confidence=Math.abs(prediction.homeWinProbability-.5)*2;

  return createNFLGameDecisionOutput({
    game,favorite,
    homeWinProbability:prediction.homeWinProbability,
    expectedHomeMargin:prediction.expectedHomeMargin,
    confidence,confidenceBand:confidenceBand(confidence),
    model:{
      id:config.modelId,version:config.modelVersion,fittedRecords:config.fittedRecords,
      status:"PRODUCTION_AUTHORITY",promotionEvidenceVersion:config.promotionEvidenceVersion
    },
    evidence:{
      matchupEdge:matchupIntelligence.matchupEdge,
      evidenceQuality:matchupIntelligence.evidenceQuality
    },
    generatedAt
  });
}
