import { createFootballPlayerRecord } from "../createFootballPlayerRecord";
import { prospectIds } from "../../registry/prospectIds";

const playerId = prospectIds.TJ_PARKER;

export const tjParker = createFootballPlayerRecord({
  playerId,

  identity: {
    playerName: "T.J. Parker",
    position: "EDGE",
    school: "Clemson",
    classYear: "Junior",
    age: 21,
    measurements: {
      height: `6'3"`,
      weight: 265,
      armLength: null,
      handSize: null,
      wingspan: null,
    },
  },

  rankings: {
    overall: 7,
    position: 1,
    consensus: 7,
    tier: "Elite",
    projection: "Top 15",
  },

  analytics: {
    athleticScore: 91,
    footballIQScore: 88,
    productionScore: 92,
    schemeFitScore: 91,
    traitScore: 92,
    overallPlayerScore: 92,
  },

  scouting: {
    summary:
      "Explosive edge defender with strong pass-rush upside, physicality, and disruptive ability. Projects as a high-impact front-seven defender with three-down potential.",
    strengths: [
      "Explosive first step",
      "Strong pass-rush upside",
      "Physical edge presence",
      "Disruptive backfield ability",
      "High motor",
    ],
    weaknesses: [
      "Can continue developing counter moves",
      "Run-fit discipline can keep improving",
    ],
    comparison: "Impact NFL edge defender",
    ceiling: "Pro Bowl caliber pass rusher",
    floor: "Starting edge defender",
  },

  character: {
    leadership: 86,
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
    confidence: 0.83,
    sources: ["LBHT Scouting", "LBHT Film Study"],
    version: 1,
    createdAt: "2026-07-03",
    lastUpdated: "2026-07-03",
    status: "active",
  },
});

export default tjParker;