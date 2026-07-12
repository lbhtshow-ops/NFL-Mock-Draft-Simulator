export const defaultTeamAIProfile = {
  teamBuildingStyle: "balanced",
  competitiveWindow: "middle",
  aggression: 5,
  bpaPreference: 6,
  needPreference: 6,
  tradeUpWillingness: 5,
  tradeDownWillingness: 5,
  premiumPickProtection: 6,
  futurePickValue: 5,

  positionalPriorities: {
    QB: 8,
    RB: 4,
    WR: 7,
    TE: 5,
    OT: 8,
    IOL: 6,
    DE: 8,
    DT: 7,
    LB: 5,
    CB: 8,
    S: 5,
  },

  earlyRoundAvoid: [],
  draftNotes: [],
};

export const teamAIProfiles = {
  Ravens: {
    ...defaultTeamAIProfile,
    teamBuildingStyle: "best-player-available",
    competitiveWindow: "contender",
    aggression: 6,
    bpaPreference: 9,
    needPreference: 6,
    tradeDownWillingness: 8,
    premiumPickProtection: 7,
    positionalPriorities: {
      ...defaultTeamAIProfile.positionalPriorities,
      DE: 9,
      CB: 9,
      OT: 8,
      WR: 7,
      IOL: 7,
    },
    draftNotes: [
      "Values best player available.",
      "Comfortable trading back.",
      "Prioritizes premium positions and roster depth."
    ],
  },

  Rams: {
    ...defaultTeamAIProfile,
    teamBuildingStyle: "aggressive",
    competitiveWindow: "contender",
    aggression: 8,
    bpaPreference: 7,
    needPreference: 7,
    tradeUpWillingness: 8,
    tradeDownWillingness: 4,
    premiumPickProtection: 5,
    futurePickValue: 3,
    positionalPriorities: {
      ...defaultTeamAIProfile.positionalPriorities,
      QB: 8,
      WR: 8,
      DE: 8,
      OT: 7,
      CB: 7,
    },
    draftNotes: [
      "More willing to move aggressively.",
      "Values immediate impact.",
      "Less protective of future picks."
    ],
  },

  Steelers: {
    ...defaultTeamAIProfile,
    teamBuildingStyle: "physical-conservative",
    competitiveWindow: "middle",
    aggression: 4,
    bpaPreference: 7,
    needPreference: 7,
    tradeUpWillingness: 4,
    tradeDownWillingness: 5,
    premiumPickProtection: 9,
    positionalPriorities: {
      ...defaultTeamAIProfile.positionalPriorities,
      OT: 9,
      IOL: 8,
      CB: 8,
      DE: 8,
      WR: 7,
    },
    draftNotes: [
      "Protective of premium picks.",
      "Leans toward physical roster building.",
      "Less likely to make aggressive trades."
    ],
  },
};

export const getTeamAIProfile = (team) => {
  return teamAIProfiles[team?.name] || defaultTeamAIProfile;
};