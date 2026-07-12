import { createFootballPlayerRecord } from "../createFootballPlayerRecord";
import { prospectIds } from "../../registry/prospectIds";

const playerId = prospectIds.CALEB_LOMU;

export const calebLomu = createFootballPlayerRecord({
  playerId,

  identity: {
    playerName: "Caleb Lomu",
    position: "OT",
    school: "Utah",
    classYear: "Junior",
    age: 21,
    measurements: {
      height: `6'5"`,
      weight: 310,
      armLength: null,
      handSize: null,
      wingspan: null,
    },
  },

  rankings: {
    overall: 10,
    position: 3,
    consensus: 10,
    tier: "Blue Chip",
    projection: "Round 1",
  },

  analytics: {
    athleticScore: 90,
    footballIQScore: 87,
    productionScore: 89,
    schemeFitScore: 90,
    traitScore: 90,
    overallPlayerScore: 90,
  },

  scouting: {
    summary:
      "Athletic offensive tackle prospect with movement skills, pass protection upside, and long-term starter traits. Projects as a developmental tackle with high-level tools.",
    strengths: [
      "Good movement ability",
      "Pass protection upside",
      "Athletic tackle profile",
      "Scheme versatility",
      "Developmental upside",
    ],
    weaknesses: [
      "Needs continued strength development",
      "Can improve technical consistency",
    ],
    comparison: "Athletic developmental NFL tackle",
    ceiling: "Long-term starting left tackle",
    floor: "Swing tackle with starter upside",
  },

  character: {
    leadership: 83,
    competitiveness: 90,
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
    confidence: 0.78,
    sources: ["LBHT Scouting", "LBHT Film Study"],
    version: 1,
    createdAt: "2026-07-03",
    lastUpdated: "2026-07-03",
    status: "active",
  },
});

export default calebLomu;