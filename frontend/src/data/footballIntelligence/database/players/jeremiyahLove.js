import { createFootballPlayerRecord } from "../createFootballPlayerRecord";
import { prospectIds } from "../../registry/prospectIds";

const playerId = prospectIds.JEREMIYAH_LOVE;

export const jeremiyahLove = createFootballPlayerRecord({
  playerId,

  identity: {
    playerName: "Jeremiyah Love",
    position: "RB",
    school: "Notre Dame",
    classYear: "Junior",
    age: 21,
    measurements: {
      height: `6'0"`,
      weight: 215,
      armLength: null,
      handSize: null,
      wingspan: null,
    },
  },

  rankings: {
    overall: 9,
    position: 1,
    consensus: 9,
    tier: "Blue Chip",
    projection: "Round 1",
  },

  analytics: {
    athleticScore: 93,
    footballIQScore: 88,
    productionScore: 91,
    schemeFitScore: 90,
    traitScore: 91,
    overallPlayerScore: 91,
  },

  scouting: {
    summary:
      "Explosive running back prospect with big-play ability, burst, contact balance, and three-down upside. Projects as a dynamic offensive weapon with feature-back potential.",
    strengths: [
      "Explosive burst",
      "Big-play ability",
      "Strong contact balance",
      "Useful receiving upside",
      "Dynamic open-field ability",
    ],
    weaknesses: [
      "Running back positional value may affect draft slot",
      "Pass protection consistency can continue improving",
    ],
    comparison: "Explosive three-down NFL running back",
    ceiling: "Pro Bowl caliber offensive weapon",
    floor: "High-quality rotational running back",
  },

  character: {
    leadership: 84,
    competitiveness: 92,
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
    confidence: 0.8,
    sources: ["LBHT Scouting", "LBHT Film Study"],
    version: 1,
    createdAt: "2026-07-03",
    lastUpdated: "2026-07-03",
    status: "active",
  },
});

export default jeremiyahLove;