export function createNFLPlayerRecord({
  playerId,

  identity = {},
  roster = {},
  contract = {},
  performance = {},
  availability = {},
  evaluation = {},

  metadata = {},
} = {}) {
  return {
    playerId,

    identity: {
      playerName: identity.playerName || null,
      position: identity.position || null,
      team: identity.team || null,
      age: identity.age ?? null,
      experience: identity.experience ?? null,
    },

    roster: {
      status: roster.status || "Active",
      depthChartRole: roster.depthChartRole || null,
      depthChartRank: roster.depthChartRank ?? null,
      starter: roster.starter ?? null,
      rosterRole: roster.rosterRole || null,
    },

    contract: {
      contractStatus: contract.contractStatus || null,
      yearsRemaining: contract.yearsRemaining ?? null,
      freeAgencyYear: contract.freeAgencyYear ?? null,
    },

    performance: {
      overallGrade: performance.overallGrade ?? null,
      productionScore: performance.productionScore ?? null,
      efficiencyScore: performance.efficiencyScore ?? null,
      trend: performance.trend || null,
    },

    availability: {
      status: availability.status || "Available",
      injuryRisk: availability.injuryRisk ?? null,
      durabilityScore: availability.durabilityScore ?? null,
    },

    evaluation: {
      playerTier: evaluation.playerTier || null,
      rosterValue: evaluation.rosterValue ?? null,
      replacementDifficulty: evaluation.replacementDifficulty || null,
      developmentTrajectory: evaluation.developmentTrajectory || null,
    },

    metadata: {
      source: metadata.source || "LBHT Research",
      confidence: metadata.confidence ?? 0,
      lastUpdated: metadata.lastUpdated || null,
      notes: metadata.notes || "",
    },
  };
}

export default createNFLPlayerRecord;