// src/data/footballIntelligence/coaches/jesseMinter.js

export const jesseMinter = {
  id: "jesseMinter",
  name: "Jesse Minter",
  currentTeam: "BAL",
  role: "Head Coach",

  background: {
    sideOfBall: "Defense",
    previousRole: "Defensive Coordinator",
    priorOrganizations: ["Baltimore Ravens", "Michigan", "Los Angeles Chargers"],
    notes:
      "Former Ravens defensive assistant who later became a successful defensive coordinator before returning to Baltimore as head coach.",
  },

  coachingTree: {
    primaryInfluences: ["Jim Harbaugh", "John Harbaugh"],
    systemFamily: "Harbaugh defensive tree",
    notes:
      "Profile should eventually account for both college and NFL defensive background, plus previous Ravens organizational familiarity.",
  },

  philosophy: {
    defensiveAggressiveness: 8,
    adaptability: 8,
    playerDevelopment: 7,
    cultureFit: 8,
    leadershipConfidence: 6,
  },

  rosterPreferences: {
    defensiveVersatility: 8,
    secondaryValue: 8,
    frontSevenValue: 8,
    footballIQ: 8,
    toughness: 8,
  },

  sourceTracking: {
    sources: [
      "Baltimore Ravens official coaches roster",
      "Baltimore Ravens 2026 coaching staff announcement",
    ],
    confidence: 7,
    lastReviewed: "2026-06-19",
  },
};