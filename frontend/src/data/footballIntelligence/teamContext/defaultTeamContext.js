// src/data/footballIntelligence/teamContext/defaultTeamContext.js

export const defaultTeamContext = {
  teamId: "default",

  snapshot: "pre_draft",

  lastUpdated: "2026-06-19",

  competitiveWindow: "unknown",

  teamDirection: "unknown",

  rosterStrengths: [],

  rosterWeaknesses: [],

  urgentNeeds: [],

  futureNeeds: [],

  freeAgentLosses: [],

  keyAdditions: [],

  injuries: [],

  contractConcerns: [],

  positionalDepthScores: {},

  draftCapital: {
    extraPicks: [],
    missingPicks: [],
    notes: "",
  },

  notes:
    "Default team context used when no specific team context profile exists.",
};