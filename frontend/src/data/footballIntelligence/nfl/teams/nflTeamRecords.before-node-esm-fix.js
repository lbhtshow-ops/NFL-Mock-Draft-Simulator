import { createNFLTeamRecord } from "./createNFLTeamRecord";

export const nflTeamRecords = {
  ARI: createNFLTeamRecord({
    teamId: "ari",
    abbreviation: "ARI",
    name: "Arizona Cardinals",
    city: "Arizona",
    conference: "NFC",
    division: "NFC West",

    ownership: {
      owner: "Michael Bidwill",
    },

    frontOffice: {
      generalManager: "Monti Ossenfort",
      assistantGeneralManager: null,
      president: null,
    },

    coachingStaff: {
      headCoach: "Jonathan Gannon",
      offensiveCoordinator: "Drew Petzing",
      defensiveCoordinator: "Nick Rallis",
    },

    offensiveIdentity: {
      system: "Balanced Spread",
      tendencies: ["Play Action", "RPO", "Quarterback Mobility"],
      notes:
        "Arizona's offense is built around spread spacing, quarterback mobility, and a balanced run-pass structure.",
    },

    defensiveIdentity: {
      system: "Multiple Front",
      tendencies: ["Disguise", "Pressure Looks", "Versatile Fronts"],
      notes:
        "Arizona's defensive identity emphasizes versatility, disguise, and front-seven flexibility.",
    },

    rosterBuilding: {
      competitiveWindow: "Rebuild Ascending",
      priorityPositions: ["OT", "EDGE", "CB", "WR", "DL"],
      notes:
        "Arizona is still building its long-term core and should prioritize premium positions and foundational starters.",
    },

    draftPhilosophy: {
      approach: "Balanced BPA + Need",
      riskTolerance: "Moderate",
      notes:
        "Arizona should balance high-end talent with long-term roster construction needs.",
    },

    metadata: {
      source: "LBHT Research",
      confidence: 0.75,
      lastUpdated: "2026-07-04",
      notes: "Initial NFL team intelligence record for architecture testing.",
    },
  }),
};

export function getNFLTeamRecord(abbreviation) {
  return nflTeamRecords[abbreviation] || null;
}

export default nflTeamRecords;