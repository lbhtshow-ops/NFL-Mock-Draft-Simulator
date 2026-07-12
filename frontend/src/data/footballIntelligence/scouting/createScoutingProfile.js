export function createScoutingProfile({
  playerId = null,
  playerName = "",
  position = "",

  executiveSummary = "",

  synopsis = {
    position: "",
    school: "",
    height: null,
    weight: null,
    classYear: "",
    age: null,
  },

  projection = {
    overallGrade: null,
    roundGrade: null,
    consensusRank: null,
    positionRank: null,
    projection: null,
    ceiling: null,
    floor: null,
    risk: null,
  },

  strengths = [],
  developmentAreas = [],

  nflProjection = {
    yearOneRole: "",
    longTermProjection: "",
  },

  notes = "",

  source = "LBHT Scouting",
  confidence = 0,
  lastUpdated = null,
} = {}) {
  return {
    playerId,
    playerName,
    position,

    executiveSummary,

    synopsis,

    projection,

    strengths,

    developmentAreas,

    nflProjection,

    notes,

    source,
    confidence,
    lastUpdated,
  };
}

export default createScoutingProfile;