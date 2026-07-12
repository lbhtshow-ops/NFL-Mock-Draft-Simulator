import { createFootballPlayerRecord } from "../createFootballPlayerRecord";

import { prospectIds } from "../../registry/prospectIds";

const playerId = prospectIds.ARCH_MANNING;

export const archManning = createFootballPlayerRecord({
  playerId,

  identity: {
    playerName: "Arch Manning",
    position: "QB",
    school: "Texas",
    classYear: "Junior",
    age: 21,

    measurements: {
      height: `6'4"`,
      weight: 220,
      armLength: null,
      handSize: null,
      wingspan: null,
    },
  },

  rankings: {
    overall: 1,
    position: 1,
    consensus: 1,
    tier: "Elite",
    projection: "Top 3",
  },

  analytics: {
    athleticScore: 91,
    footballIQScore: 94,
    productionScore: 90,
    schemeFitScore: 93,
    traitScore: 92,
    overallPlayerScore: 94,
  },

  scouting: {
    summary:
      "Prototype franchise quarterback prospect with NFL size, arm talent, athletic ability, and advanced processing skills. Possesses the tools to become the centerpiece of an NFL offense.",
    strengths: [
      "Excellent arm talent",
      "Advanced football intelligence",
      "Athletic pocket movement",
      "Throws accurately on the move",
      "Natural leadership qualities",
    ],
    weaknesses: [
      "Needs continued collegiate development and experience",
      "Can improve anticipation against disguised coverages",
    ],
    comparison: "Franchise-caliber NFL quarterback",
    ceiling: "All-Pro franchise quarterback",
    floor: "Long-term NFL starter",
  },

  character: {
    leadership: 95,
    competitiveness: 93,
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
    sources: ["LBHT Scouting", "LBHT Film Study"],
  },

  metadata: {
    confidence: 0.87,
    sources: ["LBHT Scouting", "LBHT Film Study"],
    version: 1,
    createdAt: "2026-07-03",
    lastUpdated: "2026-07-03",
    status: "active",
  },
});

export default archManning;