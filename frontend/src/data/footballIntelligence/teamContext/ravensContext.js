// src/data/footballIntelligence/teamContext/ravensContext.js

export const ravensContext = {
  teamId: "BAL",

  snapshot: "pre_draft",

  lastUpdated: "2026-06-19",

  competitiveWindow: "contending",

  teamDirection: "win_now",

  rosterStrengths: [
    {
      position: "QB",
      label: "Quarterback",
      confidence: 10,
      reason: "Franchise quarterback in place.",
    },
    {
      position: "TE",
      label: "Tight end",
      confidence: 9,
      reason: "High-end talent and depth at tight end.",
    },
    {
      position: "LB",
      label: "Linebacker",
      confidence: 9,
      reason: "Strong second-level defensive identity.",
    },
    {
      position: "S",
      label: "Safety",
      confidence: 8,
      reason: "Reliable backend talent and versatility.",
    },
  ],

  rosterWeaknesses: [
    {
      position: "IOL",
      label: "Interior offensive line",
      severity: 10,
      reason: "Immediate need for interior protection and run-game stability.",
    },
    {
      position: "DL",
      label: "Defensive line",
      severity: 8,
      reason: "Depth and long-term succession planning are concerns.",
    },
    {
      position: "EDGE",
      label: "Edge rusher",
      severity: 8,
      reason: "Pass-rush depth and future upside remain priorities.",
    },
    {
      position: "CB",
      label: "Cornerback",
      severity: 7,
      reason: "Cornerback depth is valuable in a pass-heavy league.",
    },
  ],

  urgentNeeds: [
    {
      position: "IOL",
      label: "Interior offensive line",
      priority: 10,
      starterNeeded: true,
      longTermNeed: true,
      reason: "Highest-priority need entering the draft context.",
    },
    {
      position: "DL",
      label: "Defensive line",
      priority: 8,
      starterNeeded: false,
      longTermNeed: true,
      reason: "Rotational depth and future replacement planning matter.",
    },
    {
      position: "EDGE",
      label: "Edge rusher",
      priority: 8,
      starterNeeded: false,
      longTermNeed: true,
      reason: "Ravens identity values pressure players and defensive depth.",
    },
    {
      position: "CB",
      label: "Cornerback",
      priority: 7,
      starterNeeded: false,
      longTermNeed: true,
      reason: "Depth and matchup flexibility remain important.",
    },
  ],

  futureNeeds: [
    {
      position: "OT",
      label: "Offensive tackle",
      priority: 7,
      reason: "Long-term premium position planning.",
    },
    {
      position: "WR",
      label: "Wide receiver",
      priority: 6,
      reason: "Additional explosiveness and long-term depth are useful.",
    },
    {
      position: "RB",
      label: "Running back",
      priority: 4,
      reason: "Depth and succession planning only.",
    },
    {
      position: "S",
      label: "Safety",
      priority: 4,
      reason: "Depth planning behind current strength.",
    },
  ],

  freeAgentLosses: [],

  keyAdditions: [],

  injuries: [],

  contractConcerns: [],

  positionalDepthScores: {
    QB: 10,
    RB: 7,
    WR: 7,
    TE: 9,
    OT: 7,
    IOL: 4,
    EDGE: 6,
    DL: 5,
    LB: 9,
    CB: 6,
    S: 8,
  },

  draftCapital: {
    extraPicks: [],
    missingPicks: [],
    notes:
      "Draft capital will eventually be pulled from the draft pick ownership system.",
  },

  notes:
    "Initial manually maintained Ravens pre-draft context. This will eventually be generated from roster, transaction, contract, and depth chart data.",
};