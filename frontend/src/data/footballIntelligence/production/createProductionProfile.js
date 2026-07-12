export function createProductionProfile({
  playerId = null,
  playerName = "",
  position = "",

  statistics = {
    passing: {},
    rushing: {},
    receiving: {},
    defense: {},
  },

  productionScores = {
    consistency: null,
    efficiency: null,
    explosiveness: null,
    situationalProduction: null,
    overallProductionScore: null,
  },

  strengths = [],
  concerns = [],

  notes = "",

  source = "LBHT Research",
  confidence = 0,
  lastUpdated = null,
} = {}) {
  return {
    playerId,
    playerName,
    position,

    statistics,

    productionScores,

    strengths,

    concerns,

    notes,

    source,

    confidence,

    lastUpdated,
  };
}

export default createProductionProfile;