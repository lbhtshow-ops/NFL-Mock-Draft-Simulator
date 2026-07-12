import { createFootballPlayerRecord } from "../createFootballPlayerRecord";
import { prospectIds } from "../../registry/prospectIds";

const playerId = prospectIds.KADYN_PROCTOR;

export const kadynProctor = createFootballPlayerRecord({
  playerId,

  identity: {
    playerName: "Kadyn Proctor",
    position: "OT",
    school: "Alabama",
    classYear: "Junior",
    age: 21,
    measurements: {
      height: `6'7"`,
      weight: 360,
      armLength: null,
      handSize: null,
      wingspan: null,
    },
  },

  rankings: {
    overall: 6,
    position: 2,
    consensus: 6,
    tier: "Elite",
    projection: "Top 15",
  },

  analytics: {
    athleticScore: 88,
    footballIQScore: 87,
    productionScore: 90,
    schemeFitScore: 91,
    traitScore: 91,
    overallPlayerScore: 92,
  },

  scouting: {
    summary:
      "Massive offensive tackle prospect with rare size, power, and long-term starter upside. Projects as a physically dominant blocker with the tools to anchor an NFL offensive line.",
    strengths: [
      "Rare size and mass",
      "Powerful run blocker",
      "Strong anchor ability",
      "Difficult to move at the point of attack",
      "High-end physical tools",
    ],
    weaknesses: [
      "Can improve foot quickness against speed rushers",
      "Needs continued pass protection refinement",
    ],
    comparison: "Power-based franchise tackle",
    ceiling: "Pro Bowl caliber offensive tackle",
    floor: "Starting NFL tackle",
  },

  character: {
    leadership: 84,
    competitiveness: 91,
    coachability: 89,
    workEthic: null,
    notes:
      "Character profile will expand as the Character Intelligence Engine is developed.",
  },

  medical: {
    durability: null,
    injuryHistory: [],
    availability: null,
    notes: "Medical Intelligence Engine not connected yet.",
  },

  research: {
    notes: [],
    sources: ["LBHT Scouting", "LBHT Film Study"],
  },

  metadata: {
    confidence: 0.81,
    sources: ["LBHT Scouting", "LBHT Film Study"],
    version: 1,
    createdAt: "2026-07-03",
    lastUpdated: "2026-07-03",
    status: "active",
  },
});

export default kadynProctor;