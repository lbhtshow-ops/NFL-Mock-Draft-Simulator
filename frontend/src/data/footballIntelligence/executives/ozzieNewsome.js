// src/data/footballIntelligence/executives/ozzieNewsome.js

export const ozzieNewsome = {
  id: "ozzieNewsome",
  name: "Ozzie Newsome",
  currentTeam: null,
  currentRole: "Former Executive Vice President & General Manager",

  ravensTenure: {
    team: "BAL",
    roles: [
      {
        role: "Vice President of Player Personnel",
        years: "1996-2001",
      },
      {
        role: "General Manager",
        years: "2002-2018",
      },
    ],
  },

  executiveIdentity: {
    draftAndDevelop: {
      value: 10,
      confidence: 9,
      evidence: [
        "Built the Ravens through long-term draft investment and internal development.",
        "Served as the foundational personnel executive for the franchise from its beginning in Baltimore.",
      ],
    },

    scoutingEmphasis: {
      value: 10,
      confidence: 9,
      evidence: [
        "Known for a strong personnel and scouting background.",
        "Oversaw Baltimore's player acquisition structure for more than two decades.",
      ],
    },

    organizationalContinuity: {
      value: 10,
      confidence: 9,
      evidence: [
        "Eric DeCosta developed under Newsome before succeeding him as general manager.",
      ],
    },
  },

  influenceTree: {
    influencedExecutives: ["ericDeCosta"],
    organizationLegacy: "Baltimore Ravens",
  },

  sourceTracking: {
    sources: [
      "Baltimore Ravens official history",
      "Baltimore Ravens official front office references",
    ],
    confidence: 8,
    lastReviewed: "2026-06-19",
  },
};