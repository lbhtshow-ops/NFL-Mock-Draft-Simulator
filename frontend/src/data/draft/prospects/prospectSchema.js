export const prospectSchemaV1 = {
  id: "",
  rank: null,

  bio: {
    name: "",
    position: "",
    school: "",
    age: null,
    height: "",
    weight: null,
    classYear: "",
  },

  rankings: {
    overall: null,
    position: null,
    consensus: null,
  },

  evaluation: {
    grade: null,
    tier: "",
    projection: "",
    archetype: "",
    comparison: "",
    floor: "",
    ceiling: "",
    readiness: "",
    development: "",
    risk: "",
    strengths: [],
    weaknesses: [],
    scoutingNotes: "",
  },

  traits: {
    overall: null,
    physical: {},
    technical: {},
    mental: {},
    competitive: {},
    positionSpecific: {},
  },

  athletics: {
    speed: null,
    explosiveness: null,
    agility: null,
    flexibility: null,
    playStrength: null,
    testing: {
      forty: null,
      tenSplit: null,
      vertical: null,
      broad: null,
      shuttle: null,
      threeCone: null,
      bench: null,
    },
  },

  intelligence: {
    footballIQ: null,
    processing: null,
    instincts: null,
    awareness: null,
    adaptability: null,
    notes: "",
  },

  schemeFit: {
    bestFits: [],
    concerns: [],
    roleProjection: "",
    positionVersatility: "",
  },

  metadata: {
    sources: [],
    confidence: null,
    lastUpdated: "",
    status: "draft",
  },
};