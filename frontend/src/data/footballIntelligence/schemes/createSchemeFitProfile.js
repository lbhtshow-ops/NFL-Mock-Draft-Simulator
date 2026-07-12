export function createSchemeFitProfile({
  playerId = null,
  playerName = "",
  position = "",

  offensiveSchemes = [],

  defensiveSchemes = [],

  roleFits = [],

  versatility = {
    score: null,
    notes: "",
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

    offensiveSchemes,

    defensiveSchemes,

    roleFits,

    versatility,

    strengths,

    concerns,

    notes,

    source,
    confidence,
    lastUpdated,
  };
}

export default createSchemeFitProfile;