import { createFootballPlayerRecord } from "../createFootballPlayerRecord.js";

import { prospectIds } from "../../registry/prospectIds.js";
import { getPlayerTraitSummary } from "../../../../engines/PlayerTraitEngine.js";
import { getPlayerEvaluationSummary } from "../../../../engines/PlayerEvaluationEngine.js";
import { getAthleticSummary } from "../../../../engines/AthleticIntelligenceEngine.js";
import { getFootballIQSummary } from "../../../../engines/FootballIQEngine.js";
import { getSchemeFitSummary } from "../../../../engines/SchemeFitEngine.js";
import { getProductionSummary } from "../../../../engines/ProductionEngine.js";

const playerId = prospectIds.FRANCIS_MAUIGOA;

export const francisMauigoa = createFootballPlayerRecord({
  playerId,

  identity: {
    playerName: "Francis Mauigoa",
    position: "OT",
    school: "Miami",
    classYear: "Junior",
    age: 22,

    measurements: {
      height: `6'6"`,
      weight: 330,
      armLength: null,
      handSize: null,
      wingspan: null,
    },
  },

  rankings: {
    overall: 4,
    position: 1,
    consensus: 4,
    tier: "Elite",
    projection: "Top 10",
  },

  intelligence: {
  traits: getPlayerTraitSummary(playerId),

  evaluation: getPlayerEvaluationSummary({
    id: playerId,
    rank: 4,
    position: "OT",
    name: "Francis Mauigoa",
  }),

  athletics: getAthleticSummary({ id: playerId }),

  footballIQ: getFootballIQSummary({ id: playerId }),

  schemeFit: getSchemeFitSummary({ id: playerId }),

  production: getProductionSummary({ id: playerId }),
},

  analytics: {
    athleticScore: 90,
    footballIQScore: 88,
    productionScore: 91,
    schemeFitScore: 92,
    traitScore: 92,
    overallPlayerScore: 93,
  },

  scouting: {
    summary:
      "Powerful offensive tackle prospect with elite size, movement ability, and high-end run blocking traits. Projects as a long-term starting tackle with Pro Bowl upside if his pass protection consistency continues to develop.",
    strengths: [
      "Elite size and frame",
      "Powerful run blocker",
      "High-level movement ability for his size",
      "Strong anchor potential",
      "Scheme-versatile tackle profile",
    ],
    weaknesses: [
      "Pass protection technique can continue improving",
      "Can become more consistent with hand placement",
    ],
    comparison: "High-upside franchise tackle",
    ceiling: "Pro Bowl caliber offensive tackle",
    floor: "Quality starting right tackle",
  },

  character: {
    leadership: 86,
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
    confidence: 0.82,
    sources: ["LBHT Scouting", "LBHT Film Study"],
    version: 1,
    createdAt: "2026-07-03",
    lastUpdated: "2026-07-03",
    status: "active",
  },
});

export default francisMauigoa;