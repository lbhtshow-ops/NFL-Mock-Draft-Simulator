import { createSchemeFitProfile } from "./createSchemeFitProfile.js";

export const defaultSchemeFitProfile = createSchemeFitProfile({
  playerId: null,

  offensiveSchemes: [],

  defensiveSchemes: [],

  roleFits: [],

  versatility: {
    score: null,
    notes: "",
  },

  strengths: [],

  concerns: [],

  notes: "No scheme fit profile available yet.",

  source: "LBHT Research",
  confidence: 0,
  lastUpdated: null,
});

export default defaultSchemeFitProfile;
