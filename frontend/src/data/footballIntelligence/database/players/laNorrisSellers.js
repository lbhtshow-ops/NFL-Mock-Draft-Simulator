import { createFootballPlayerRecord } from "../createFootballPlayerRecord";
import { prospectIds } from "../../registry/prospectIds";
import { getPlayerTraitSummary } from "../../../../engines/PlayerTraitEngine";
import { getPlayerEvaluationSummary } from "../../../../engines/PlayerEvaluationEngine";
import { getAthleticSummary } from "../../../../engines/AthleticIntelligenceEngine";
import { getFootballIQSummary } from "../../../../engines/FootballIQEngine";
import { getSchemeFitSummary } from "../../../../engines/SchemeFitEngine";
import { getProductionSummary } from "../../../../engines/ProductionEngine";

const playerId = prospectIds.LANORRIS_SELLERS;

export const laNorrisSellers = createFootballPlayerRecord({
  playerId,

  identity: {
    playerName: "LaNorris Sellers",
    position: "QB",
    school: "South Carolina",
    classYear: "Junior",
    age: 21,
    measurements: {
      height: `6'3"`,
      weight: 240,
      armLength: null,
      handSize: null,
      wingspan: null,
    },
  },

  rankings: {
    overall: 5,
    position: 2,
    consensus: 5,
    tier: "Elite",
    projection: "Top 10",
  },

    intelligence: {
    traits: getPlayerTraitSummary(playerId),

    evaluation: getPlayerEvaluationSummary({
      id: playerId,
      rank: 5,
      position: "QB",
      name: "LaNorris Sellers",
    }),

    athletics: getAthleticSummary({ id: playerId }),

    footballIQ: getFootballIQSummary({ id: playerId }),

    schemeFit: getSchemeFitSummary({ id: playerId }),

    production: getProductionSummary({ id: playerId }),
  },

  analytics: {
    athleticScore: 94,
    footballIQScore: 88,
    productionScore: 89,
    schemeFitScore: 91,
    traitScore: 92,
    overallPlayerScore: 92,
  },

  scouting: {
    summary:
      "Dynamic quarterback prospect with rare size, athleticism, arm talent, and playmaking ability. Offers high-end upside as a dual-threat franchise quarterback if his processing and consistency continue to develop.",
    strengths: [
      "Rare size and athleticism",
      "High-level rushing threat",
      "Strong arm talent",
      "Creative off-platform ability",
      "High developmental upside",
    ],
    weaknesses: [
      "Processing consistency still developing",
      "Needs continued refinement as a rhythm passer",
    ],
    comparison: "High-upside dual-threat quarterback",
    ceiling: "Franchise dual-threat quarterback",
    floor: "Developmental NFL starter",
  },

  character: {
    leadership: 90,
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

export default laNorrisSellers;