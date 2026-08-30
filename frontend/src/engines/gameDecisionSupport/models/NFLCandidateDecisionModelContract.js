
export const NFL_CANDIDATE_MODEL_STATUS = "RESEARCH_ONLY";
export function validateCandidatePrediction(p={}) {
  const errors=[];
  if(!p.modelId) errors.push("modelId is required");
  if(!Number.isFinite(p.expectedHomeMargin)) errors.push("expectedHomeMargin must be finite");
  if(!(p.homeWinProbability>0&&p.homeWinProbability<1)) errors.push("homeWinProbability must be between 0 and 1");
  if(p.status!==NFL_CANDIDATE_MODEL_STATUS) errors.push("candidate status must remain RESEARCH_ONLY");
  return {valid:errors.length===0,errors};
}
