export function createAthleticProfile({
  playerId = null,
  playerName = "",
  position = "",

  measurements = {
    height: null,
    weight: null,
    armLength: null,
    handSize: null,
    wingspan: null,
  },

  testing = {
    fortyYardDash: null,
    tenYardSplit: null,
    verticalJump: null,
    broadJump: null,
    threeCone: null,
    shortShuttle: null,
    benchPress: null,
  },

  scores = {
    speed: null,
    explosiveness: null,
    agility: null,
    strength: null,
    sizeAdjustedAthleticism: null,
    overallAthleticScore: null,
  },

  strengths = [],
  limitations = [],
  notes = "",

  source = "LBHT Research",
  confidence = 0,
  lastUpdated = null,
} = {}) {
  return {
    playerId,
    playerName,
    position,
    measurements,
    testing,
    scores,
    strengths,
    limitations,
    notes,
    source,
    confidence,
    lastUpdated,
  };
}

export default createAthleticProfile;