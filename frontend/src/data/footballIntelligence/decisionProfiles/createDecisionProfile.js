export function createDecisionProfile({
  profileId = "",
  name = "",
  role = "",
  currentTeam = "",

  draftPhilosophy = {
    summary: "",
    coreBeliefs: [],
    preferredPositions: [],
    avoidedProfiles: [],
    riskTolerance: "medium",
  },

  evaluationWeights = {
    playerGrade: 25,
    schemeFit: 20,
    teamNeed: 15,
    footballIQ: 15,
    production: 10,
    athleticism: 10,
    consensusValue: 5,
  },

  riskPenalties = {
    lowFootballIQ: {
      round1: 18,
      round2: 10,
      round3: 5,
    },
    lowCharacter: {
      round1: 20,
      round2: 12,
      round3: 6,
    },
    highMedicalRisk: {
      round1: 22,
      round2: 14,
      round3: 7,
    },
  },

  transactionStyle = {
    tradeUpFrequency: "medium",
    tradeDownFrequency: "medium",
    veteranTradeFrequency: "medium",
    freeAgencyAggression: "medium",
    compPickPriority: "medium",
  },

  metadata = {
    sources: [],
    confidence: 0,
    lastUpdated: null,
    status: "active",
  },
} = {}) {
  return {
    profileId,
    name,
    role,
    currentTeam,
    draftPhilosophy,
    evaluationWeights,
    riskPenalties,
    transactionStyle,
    metadata,
  };
}

export default createDecisionProfile;