import { createNFLPlayerRecord } from "./createNFLPlayerRecord";

export function normalizeNFLRosterPlayer(rawPlayer = {}) {
  return createNFLPlayerRecord({
    playerId:
  rawPlayer.playerId ||
  rawPlayer.player_id ||
  rawPlayer.id ||
  `${rawPlayer.team}-${
    rawPlayer.name ||
    rawPlayer.playerName ||
    rawPlayer.player_name
  }-${rawPlayer.position}`
    .toLowerCase()
    .replaceAll(" ", "-"),

identity: {
  playerId:
    rawPlayer.playerId ||
    rawPlayer.player_id ||
    rawPlayer.id ||
    null,

  playerName:
    rawPlayer.name ||
    rawPlayer.playerName ||
    rawPlayer.player_name ||
    null,

  position: rawPlayer.position || null,
  team: rawPlayer.team || null,
  age: rawPlayer.age || null,

  experience:
    rawPlayer.experience ??
    rawPlayer.years_exp ??
    null,
},

    roster: {
  status: rawPlayer.status || "Active",
  rosterPhase: rawPlayer.rosterPhase || null,
  depthChartRole: rawPlayer.depthChartRole || null,
  depthChartRank: rawPlayer.depthChartRank || null,
  starter: rawPlayer.starter ?? null,
  rosterRole: rawPlayer.rosterRole || null,
},

    contract: {
      contractStatus: rawPlayer.contractStatus || null,
      yearsRemaining: rawPlayer.yearsRemaining || null,
      freeAgencyYear: rawPlayer.freeAgencyYear || null,
    },

    performance: {
      overallGrade: rawPlayer.overallGrade || null,
      productionScore: rawPlayer.productionScore || null,
      efficiencyScore: rawPlayer.efficiencyScore || null,
      trend: rawPlayer.trend || null,
    },

    availability: {
      status: rawPlayer.availabilityStatus || "Available",
      injuryRisk: rawPlayer.injuryRisk || null,
      durabilityScore: rawPlayer.durabilityScore || null,
    },

    evaluation: {
      playerTier: rawPlayer.playerTier || "unknown",
      rosterValue: rawPlayer.rosterValue || null,
      replacementDifficulty: rawPlayer.replacementDifficulty || null,
      developmentTrajectory: rawPlayer.developmentTrajectory || null,
    },

    metadata: {
      source: rawPlayer.source || "External Roster Import",
      confidence: rawPlayer.confidence || 0.5,
      lastUpdated: rawPlayer.lastUpdated || null,
      notes: rawPlayer.notes || "",
    },
  });
}

export default normalizeNFLRosterPlayer;