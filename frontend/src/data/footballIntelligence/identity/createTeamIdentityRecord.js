export function createTeamIdentityRecord({
  teamId = "",
  teamName = "",
  abbreviation = "",

  ownership = {
    owner: "",
    ownerPhilosophy: "",
    spendingStyle: "",
    patienceLevel: "",
    riskTolerance: "",
  },

  frontOffice = {
    generalManager: "",
    assistantGM: "",
    president: "",
    draftPhilosophy: "",
    tradePhilosophy: "",
    freeAgencyPhilosophy: "",
    rosterConstructionStyle: "",
    historicalTendencies: [],
  },

  coaching = {
    headCoach: "",
    offensiveCoordinator: "",
    defensiveCoordinator: "",
    offensiveScheme: "",
    defensiveScheme: "",
    developmentStyle: "",
    gameManagementStyle: "",
  },

  tendencies = {
    offense: {
      passRate: null,
      runRate: null,
      playActionRate: null,
      rpoRate: null,
      motionRate: null,
      shotgunRate: null,
      underCenterRate: null,
      personnel11Rate: null,
      personnel12Rate: null,
      gapRunRate: null,
      zoneRunRate: null,
    },

    defense: {
      blitzRate: null,
      pressureRate: null,
      manCoverageRate: null,
      zoneCoverageRate: null,
      singleHighRate: null,
      twoHighRate: null,
      nickelRate: null,
      dimeRate: null,
      baseFront: "",
      frontVersatility: null,
    },
  },

  rosterBuilding = {
    priorityPositions: [],
    athleticThresholds: {},
    agePreferences: {},
    contractPreferences: {},
    compPickStrategy: "",
  },

  metadata = {
    sources: [],
    confidence: 0,
    lastUpdated: null,
    status: "active",
  },
} = {}) {
  return {
    teamId,
    teamName,
    abbreviation,
    ownership,
    frontOffice,
    coaching,
    tendencies,
    rosterBuilding,
    metadata,
  };
}

export default createTeamIdentityRecord;