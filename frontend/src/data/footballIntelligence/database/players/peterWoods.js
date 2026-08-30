import { createFootballPlayerRecord } from "../createFootballPlayerRecord.js";

import { prospectIds } from "../../registry/prospectIds.js";

import { getPlayerTraitSummary } from "../../../../engines/PlayerTraitEngine.js";
import { getPlayerEvaluationSummary } from "../../../../engines/PlayerEvaluationEngine.js";
import { getAthleticSummary } from "../../../../engines/AthleticIntelligenceEngine.js";
import { getFootballIQSummary } from "../../../../engines/FootballIQEngine.js";
import { getSchemeFitSummary } from "../../../../engines/SchemeFitEngine.js";
import { getProductionSummary } from "../../../../engines/ProductionEngine.js";

const playerId = prospectIds.PETER_WOODS;

export const peterWoods = createFootballPlayerRecord({
  playerId,

  identity: {
    playerName: "Peter Woods",
    position: "DL",
    school: "Clemson",
    classYear: "Junior",
    age: 21,

    measurements: {
      height: `6'3"`,
      weight: 315,
      armLength: null,
      handSize: null,
      wingspan: null,
    },
  },

  rankings: {
    overall: 3,
    position: 1,
    consensus: 3,
    tier: "Blue Chip",
    projection: "Top 5",
  },

  intelligence: {
    traits: getPlayerTraitSummary(playerId),
    evaluation: getPlayerEvaluationSummary({
      id: playerId,
      rank: 3,
      position: "DL",
      name: "Peter Woods",
    }),
    athletics: getAthleticSummary({ id: playerId }),
    footballIQ: getFootballIQSummary({ id: playerId }),
    schemeFit: getSchemeFitSummary({ id: playerId }),
    production: getProductionSummary({ id: playerId }),
  },

  analytics: {
    athleticScore: 90,
    footballIQScore: 90,
    productionScore: 89,
    schemeFitScore: 91,
    traitScore: 90,
    overallPlayerScore: 91,
  },

  scouting: {
    summary:
      "Powerful interior defensive lineman with strong run-defense ability, disruptive first-step quickness, and starter-level upside as his pass-rush plan continues to develop.",
    strengths: [
      "Powerful interior defender",
      "Strong run defender",
      "Disruptive first step",
    ],
    weaknesses: [
      "Can improve pad level consistency",
      "Pass rush plan still developing",
    ],
    comparison: "High-impact interior defensive lineman",
    ceiling: "Pro Bowl caliber defensive lineman",
    floor: "Quality rotational defensive tackle",
  },

  character: {
    leadership: 87,
    competitiveness: 95,
    coachability: 93,
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
    sources: ["LBHT Film Study", "LBHT Scouting"],
  },

  metadata: {
    confidence: 0.9,
    sources: ["LBHT Scouting", "LBHT Film Study"],
    version: 1,
    createdAt: "2026-06-30",
    lastUpdated: "2026-06-30",
    status: "active",
  },
});

export default peterWoods;