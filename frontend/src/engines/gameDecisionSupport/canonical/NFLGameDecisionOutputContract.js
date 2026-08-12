export const NFL_GAME_DECISION_OUTPUT_CONTRACT = "NFLGameDecisionOutput";
export const NFL_GAME_DECISION_OUTPUT_VERSION = "NFL-GAME-DECISION-OUTPUT-1.0.0";

const finiteOrNull = value => Number.isFinite(Number(value)) ? Number(value) : null;
const clamp = (value,min,max) => Math.min(max,Math.max(min,value));

export function createNFLGameDecisionOutput({
  game={}, favorite=null, homeWinProbability=null, expectedHomeMargin=null,
  confidence=null, confidenceBand=null, model={}, evidence={}, generatedAt=null
}={}) {
  const probability=finiteOrNull(homeWinProbability);
  const margin=finiteOrNull(expectedHomeMargin);
  if(probability===null || probability<=0 || probability>=1)
    throw new Error("Canonical Game Decision output requires probability strictly between 0 and 1.");
  if(margin===null) throw new Error("Canonical Game Decision output requires finite expected home margin.");

  return {
    contract:NFL_GAME_DECISION_OUTPUT_CONTRACT,
    version:NFL_GAME_DECISION_OUTPUT_VERSION,
    game:{
      gameId:game.gameId||null,
      season:Number.isFinite(Number(game.season))?Number(game.season):null,
      week:Number.isFinite(Number(game.week))?Number(game.week):null,
      awayTeam:game.awayTeam||null,
      homeTeam:game.homeTeam||null
    },
    favorite,
    homeWinProbability:clamp(probability,.01,.99),
    awayWinProbability:clamp(1-probability,.01,.99),
    expectedHomeMargin:margin,
    confidence:finiteOrNull(confidence),
    confidenceBand:confidenceBand||null,
    model:{
      id:model.id||null, version:model.version||null,
      fittedRecords:Number.isFinite(Number(model.fittedRecords))?Number(model.fittedRecords):null,
      status:model.status||null,
      promotionEvidenceVersion:model.promotionEvidenceVersion||null
    },
    evidence:{
      matchupEdge:finiteOrNull(evidence.matchupEdge),
      evidenceQuality:finiteOrNull(evidence.evidenceQuality)
    },
    generatedAt
  };
}

export function isNFLGameDecisionOutput(value){
  return Boolean(value &&
    value.contract===NFL_GAME_DECISION_OUTPUT_CONTRACT &&
    value.version===NFL_GAME_DECISION_OUTPUT_VERSION &&
    Number.isFinite(value.homeWinProbability) &&
    Number.isFinite(value.expectedHomeMargin));
}
