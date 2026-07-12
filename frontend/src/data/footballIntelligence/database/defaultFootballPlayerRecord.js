import { createFootballPlayerRecord } from "./createFootballPlayerRecord";

export const defaultFootballPlayerRecord = createFootballPlayerRecord({
  playerId: null,

  identity: {
    playerName: "Unknown Prospect",
    position: "",
    school: "",
    classYear: "",
    age: null,

    measurements: {
      height: null,
      weight: null,
      armLength: null,
      handSize: null,
      wingspan: null,
    },
  },

  rankings: {
    overall: null,
    position: null,
    consensus: null,
    tier: null,
    projection: null,
  },

  intelligence: {
    traits: null,
    evaluation: null,
    athletics: null,
    footballIQ: null,
    schemeFit: null,
    production: null,
    consensus: null,
    recommendations: null,
  },

  analytics: {
    athleticScore: null,
    footballIQScore: null,
    productionScore: null,
    schemeFitScore: null,
    traitScore: null,
    overallPlayerScore: null,
  },

  scouting: {
    summary: "",
    strengths: [],
    weaknesses: [],
    comparison: null,
    ceiling: null,
    floor: null,
    notes: [],
  },

  character: {
    leadership: null,
    competitiveness: null,
    coachability: null,
    workEthic: null,
    communication: null,
    discipline: null,
    notes: "",
  },

  medical: {
    durability: null,
    injuryHistory: [],
    availability: null,
    riskLevel: null,
    notes: "",
  },

  research: {
    notes: [],
    sources: [],
    lastReviewed: null,
  },

  metadata: {
    confidence: 0,
    sources: [],
    version: 1,
    createdAt: null,
    lastUpdated: null,
    status: "missing",
  },
});

export default defaultFootballPlayerRecord;