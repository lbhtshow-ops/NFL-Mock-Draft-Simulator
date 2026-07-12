// src/data/footballIdentityDatabase.js

// src/data/footballIdentityDatabase.js

export const defaultFootballIdentityProfile = {
  meta: {
    teamAbbr: "DEFAULT",
    teamName: "Default Team",
    lastUpdated: null,
    dataConfidence: 1,
    notes: "",
  },

  organization: {
    owner: "",
    generalManager: "",
    frontOfficeStability: 5,
    analyticsUsage: 5,
    draftAndDevelop: 5,
    tradeAggressiveness: 5,
    freeAgencyAggressiveness: 5,
    capDiscipline: 5,
  },

  frontOffice: {
    gmName: "",
    gmTenureYears: 0,
    gmFirstTimeRole: false,
    gmBackground: "",
    employmentHistory: [],
    primaryMentors: [],
    influenceTree: [],
    transactionHistory: {
      draftPicks: [],
      freeAgentSignings: [],
      trades: [],
    },
    inferredTendencies: {
      basedOnMentors: false,
      basedOnPriorOrganizations: false,
      confidence: 1,
      notes: "",
    },
  },

  coaching: {
    headCoach: "",
    offensiveCoordinator: "",
    defensiveCoordinator: "",
    headCoachBackground: "",
    offensiveScheme: "",
    defensiveScheme: "",
    offensiveSystemFamily: "",
    defensiveSystemFamily: "",
    coachingContinuity: 5,
    playCallerContinuity: 5,
  },

  coachingTree: {
    headCoachTree: "",
    offensiveCoordinatorTree: "",
    defensiveCoordinatorTree: "",
    headCoachFirstTimeRole: false,
    headCoachMentors: [],
    coordinatorMentors: [],
    priorOrganizations: [],
    inferredTendencies: {
      basedOnMentors: false,
      basedOnPriorOrganizations: false,
      confidence: 1,
      notes: "",
    },
  },

  offensiveIdentity: {
    passRate: 5,
    runRate: 5,
    motionUsage: 5,
    playActionUsage: 5,
    rpoUsage: 5,
    qbRunUsage: 5,
    tempo: 5,
    explosivePlayPreference: 5,
    physicalRunGame: 5,
  },

  defensiveIdentity: {
    blitzRate: 5,
    pressurePreference: 5,
    manCoverageUsage: 5,
    zoneCoverageUsage: 5,
    singleHighUsage: 5,
    twoHighUsage: 5,
    runDefenseEmphasis: 5,
    versatilityPreference: 5,
  },

  draftPhilosophy: {
    premiumPositionWeight: 5,
    athleticismWeight: 5,
    productionWeight: 5,
    agePreference: 5,
    leadershipWeight: 5,
    developmentTolerance: 5,
    medicalRiskTolerance: 5,
    characterRiskTolerance: 5,
    tradeUpFrequency: 5,
    tradeDownFrequency: 5,
  },

  scoutingPhilosophy: {
    productionVsTraits: 5,
    athleticTestingWeight: 5,
    filmWeight: 5,
    seniorBowlWeight: 5,
    combineWeight: 5,
    proDayWeight: 5,
    positionalVersatility: 5,
    smallSchoolTolerance: 5,
  },

  developmentPhilosophy: {
    rookiePatience: 5,
    lateRoundDevelopment: 5,
    redshirtPreference: 5,
    veteranBridgePreference: 5,
    positionalCrossTraining: 5,
  },

  rosterConstruction: {
    competitiveWindow: "neutral",
    qbSituation: "unknown",
    rosterAge: 5,
    capFlexibility: 5,
    homegrownCore: 5,
    veteranReliance: 5,
    positionalSpendingAggression: 5,
  },

  positionPreferences: {
    QB: 5,
    RB: 5,
    WR: 5,
    TE: 5,
    OT: 5,
    IOL: 5,
    EDGE: 5,
    DL: 5,
    LB: 5,
    CB: 5,
    S: 5,
  },

  archetypePreferences: {},

  relationshipGraph: {
    executives: [],
    coaches: [],
    mentors: [],
    organizations: [],
  },

  sourceTracking: {
    organizationSources: [],
    frontOfficeSources: [],
    coachingSources: [],
    tendencySources: [],
    draftSources: [],
    rosterSources: [],
    transactionSources: [],
    relationshipSources: [],
  },
};

export const footballIdentityProfiles = {
  DEFAULT: defaultFootballIdentityProfile,
};