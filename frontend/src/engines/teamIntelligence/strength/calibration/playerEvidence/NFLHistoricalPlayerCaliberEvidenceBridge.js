export function projectHistoricalPlayerCaliberEvidence({identityResult,evaluationResult,asOf}={}){
  if(identityResult?.status!=="RESOLVED"){
    return Object.freeze({status:"UNAVAILABLE",playerId:null,caliber:null,confidence:null,asOf:asOf??null,reason:"PLAYER_IDENTITY_NOT_RESOLVED"});
  }
  if(evaluationResult?.status!=="AVAILABLE" || !Number.isFinite(evaluationResult?.caliber)){
    return Object.freeze({status:"UNAVAILABLE",playerId:identityResult.canonicalPlayerId,caliber:null,confidence:null,asOf:asOf??null,reason:"HISTORICAL_CALIBER_NOT_AVAILABLE"});
  }
  return Object.freeze({
    status:"AVAILABLE",playerId:identityResult.canonicalPlayerId,
    caliber:evaluationResult.caliber,
    confidence:Number.isFinite(evaluationResult.confidence)?evaluationResult.confidence:null,
    asOf:asOf??null,
    modelVersion:evaluationResult.modelVersion??null,
    provenance:evaluationResult.provenance??null
  });
}
