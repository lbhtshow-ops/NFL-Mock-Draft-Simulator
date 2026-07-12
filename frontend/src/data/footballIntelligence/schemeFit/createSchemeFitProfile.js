export function createSchemeFitProfile({
  playerId = null,
  playerName = "",
  position = "",

  primaryRoles = [],
  bestSystems = [],
  idealCoordinatorTraits = [],
  worstFits = [],

  scores = {
    roleFit: null,
    schemeVersatility: null,
    frontVersatility: null,
    positionalFlexibility: null,
    overallSchemeFit: null,
  },

  notes = "",

  source = "LBHT Research",
  confidence = 0,
  lastUpdated = null,
} = {}) {
  return {
    playerId,
    playerName,
    position,
    primaryRoles,
    bestSystems,
    idealCoordinatorTraits,
    worstFits,
    scores,
    notes,
    source,
    confidence,
    lastUpdated,
  };
}

export default createSchemeFitProfile;