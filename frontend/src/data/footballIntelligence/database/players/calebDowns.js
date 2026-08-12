import { createFootballPlayerRecord } from "../createFootballPlayerRecord.js";

import { prospectIds } from "../../registry/prospectIds.js";

import { getPlayerTraitSummary } from "../../../../engines/PlayerTraitEngine.js";
import { getPlayerEvaluationSummary } from "../../../../engines/PlayerEvaluationEngine.js";
import { getAthleticSummary } from "../../../../engines/AthleticIntelligenceEngine.js";
import { getFootballIQSummary } from "../../../../engines/FootballIQEngine.js";
import { getSchemeFitSummary } from "../../../../engines/SchemeFitEngine.js";
import { getProductionSummary } from "../../../../engines/ProductionEngine.js";

const playerId = prospectIds.CALEB_DOWNS;

export const calebDowns = createFootballPlayerRecord({
  playerId,

  identity: {
    playerName: "Caleb Downs",
    position: "S",
    school: "Ohio State",
    classYear: "Junior",
    age: 21,

    measurements: {
      height: `6'0"`,
      weight: 205,
      armLength: null,
      handSize: null,
      wingspan: null,
    },
  },

  rankings: {
    overall: 2,
    position: 1,
    consensus: 2,
    tier: "Blue Chip",
    projection: "Top 5",
  },

  intelligence: {
    traits: getPlayerTraitSummary(playerId),
    evaluation: getPlayerEvaluationSummary({
      id: playerId,
      rank: 2,
      position: "S",
      name: "Caleb Downs",
    }),
    athletics: getAthleticSummary({ id: playerId }),
    footballIQ: getFootballIQSummary({ id: playerId }),
    schemeFit: getSchemeFitSummary({ id: playerId }),
    production: getProductionSummary({ id: playerId }),
  },

  analytics: {
    athleticScore: 92,
    footballIQScore: 95,
    productionScore: 94,
    schemeFitScore: 93,
    traitScore: 94,
    overallPlayerScore: 94,
  },

  scouting: {
    summary:
      "Elite safety prospect with outstanding instincts, range, processing speed, and all-around defensive impact. Projects as a high-level defensive centerpiece with the versatility to align deep, in the box, or over the slot.",
    strengths: [
      "Elite football IQ and instincts",
      "Excellent range and pursuit angles",
      "High-level tackling reliability",
      "Versatile defensive alignment ability",
      "Immediate impact potential",
    ],
    weaknesses: [
      "Premium positional value may be debated because he plays safety",
      "Can continue adding functional strength for box-heavy usage",
    ],
    comparison: "High-impact modern NFL safety",
    ceiling: "All-Pro caliber defensive playmaker",
    floor: "Quality starting safety",
  },

  character: {
    leadership: 92,
    competitiveness: 95,
    coachability: 94,
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
    confidence: 0.88,
    sources: ["LBHT Scouting", "LBHT Film Study"],
    version: 1,
    createdAt: "2026-07-02",
    lastUpdated: "2026-07-02",
    status: "active",
  },
});

export default calebDowns;