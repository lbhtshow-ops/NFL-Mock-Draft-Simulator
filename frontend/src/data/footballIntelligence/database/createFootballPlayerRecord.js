// src/data/footballIntelligence/database/createFootballPlayerRecord.js

export function createFootballPlayerRecord({
  playerId = null,

  identity = {
    playerName: "",
    position: "",
    school: "",
    classYear: "",
    age: null,
    birthDate: null,

    measurements: {
      height: null,
      weight: null,
      armLength: null,
      handSize: null,
      wingspan: null,
    },
  },

  /*
   * careerContext stores factual information about where the player
   * currently is in his football career.
   *
   * It should not contain scouting opinions, projections, grades,
   * or product-specific decisions.
   */
  careerContext = {
    competition: {
      level: null,
      league: null,
      division: null,
      conference: null,
    },

    careerStage: null,

    currentTeam: {
      teamId: null,
      abbreviation: null,
      name: null,
    },

    draft: {
      draftClass: null,
      status: null,
      draftYear: null,
      round: null,
      overallPick: null,
    },

    experience: {
      yearsExperience: null,
      yearsAtCurrentLevel: null,
      seasonsPlayed: [],
    },

    roster: {
      status: null,
      rookie: null,
      starter: null,
    },

    activeSeason: null,

    previousLevels: [],
  },

  rankings = {
    overall: null,
    position: null,
    consensus: null,
    tier: null,
    projection: null,
  },

  intelligence = {
    traits: null,
    evaluation: null,
    athletics: null,
    footballIQ: null,
    schemeFit: null,
    production: null,
    recognition: null,
    durability: null,
    development: null,
    competition: null,
    translation: null,
    usage: null,
    consensus: null,
    recommendations: null,
  },

  analytics = {
    athleticScore: null,
    footballIQScore: null,
    productionScore: null,
    schemeFitScore: null,
    traitScore: null,
    overallPlayerScore: null,
  },

  scouting = {
    summary: "",
    strengths: [],
    weaknesses: [],
    comparison: null,
    ceiling: null,
    floor: null,
    notes: [],
  },

  character = {
    leadership: null,
    competitiveness: null,
    coachability: null,
    workEthic: null,
    communication: null,
    discipline: null,
    notes: "",
  },

  medical = {
    durability: null,
    injuryHistory: [],
    availability: null,
    riskLevel: null,
    notes: "",
  },

  research = {
    notes: [],
    sources: [],
    lastReviewed: null,
  },

  metadata = {
    confidence: 0,
    sources: [],
    frameworkVersion: "1.0.0",
    recordVersion: "1.0.0",
    dataVersion: null,
    createdAt: null,
    lastUpdated: null,
    status: "active",
  },
} = {}) {
  return {
    playerId,
    identity,
    careerContext,
    rankings,
    intelligence,
    analytics,
    scouting,
    character,
    medical,
    research,
    metadata,
  };
}

export default createFootballPlayerRecord;