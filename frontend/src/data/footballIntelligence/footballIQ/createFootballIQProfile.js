export function createFootballIQProfile({
  playerId = null,
  playerName = "",
  position = "",

  mentalProcessing = {
    processingSpeed: null,
    playRecognition: null,
    anticipation: null,
    decisionMaking: null,
    situationalAwareness: null,
  },

  footballCharacter = {
    leadership: null,
    communication: null,
    coachability: null,
    competitiveToughness: null,
    discipline: null,
  },

  scores = {
    processing: null,
    instincts: null,
    awareness: null,
    leadership: null,
    overallFootballIQ: null,
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
    mentalProcessing,
    footballCharacter,
    scores,
    strengths,
    concerns,
    notes,
    source,
    confidence,
    lastUpdated,
  };
}

export default createFootballIQProfile;