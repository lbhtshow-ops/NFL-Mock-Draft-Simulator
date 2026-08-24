import {
  evaluateNFLGameDecisionV1,
  getNFLCanonicalGameDecisionModelConfig,
} from "./NFLGameDecisionModelV1.js";

import {
  applyNFLPlayerImpactDecisionInfluenceV1,
} from "./NFLPlayerImpactDecisionInfluenceV1.js";

export function getNFLGameDecision({
  game,
  matchupIntelligence,
  generatedAt = null,
} = {}) {
  const config = getNFLCanonicalGameDecisionModelConfig();
  const applied = applyNFLPlayerImpactDecisionInfluenceV1({
    matchupIntelligence,
    modelParameters: config.parameters,
  });

  const decision = evaluateNFLGameDecisionV1({
    game,
    matchupIntelligence: applied.matchupIntelligence,
    generatedAt,
  });

  return {
    ...decision,
    decisionInfluence: {
      playerImpact: applied.influence,
      canonicalMatchupEdge: Number(matchupIntelligence?.matchupEdge),
      effectiveMatchupEdge: applied.effectiveMatchupEdge,
      matchupEdgeDelta: applied.matchupEdgeDelta,
    },
  };
}

export default { getNFLGameDecision };
