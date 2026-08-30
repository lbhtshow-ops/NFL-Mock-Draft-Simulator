import { createFootballPlayerRecord } from "../createFootballPlayerRecord.js";
import { prospectIds } from "../../registry/prospectIds.js";

const playerId = prospectIds.RUEBEN_BAIN;

export const ruebenBain = createFootballPlayerRecord({
  playerId,

  identity: {
    playerName: "Rueben Bain Jr.",
    position: "EDGE",
    school: "Miami",
    classYear: "Junior",
    age: 22,
    measurements: {
      height: `6'3"`,
      weight: 275,
      armLength: null,
      handSize: null,
      wingspan: null,
    },
  },

  rankings: {
    overall: 8,
    position: 2,
    consensus: 8,
    tier: "Elite",
    projection: "Top 20",
  },

  analytics: {
    athleticScore: 89,
    footballIQScore: 89,
    productionScore: 91,
    schemeFitScore: 92,
    traitScore: 91,
    overallPlayerScore: 91,
  },

  scouting: {
    summary:
      "Powerful and productive edge defender with strong hands, toughness, and disruptive ability. Offers alignment versatility and projects as a reliable impact defender in multiple fronts.",
    strengths: [
      "Powerful edge-setter",
      "Strong hands",
      "Productive pass-rush profile",
      "Good front versatility",
      "Physical run defender",
    ],
    weaknesses: [
      "May not have elite bend compared to speed rushers",
      "Can continue expanding pass-rush counters",
    ],
    comparison: "Power-based NFL edge defender",
    ceiling: "High-level starting edge defender",
    floor: "Quality rotational front-seven defender",
  },

  character: {
    leadership: 87,
    competitiveness: 94,
    coachability: 90,
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
    confidence: 0.82,
    sources: ["LBHT Scouting", "LBHT Film Study"],
    version: 1,
    createdAt: "2026-07-03",
    lastUpdated: "2026-07-03",
    status: "active",
  },
});

export default ruebenBain;