import { createSchemeFitProfile } from "./createSchemeFitProfile";

export const schemeFitProfiles = {
  "2026-peter-woods": createSchemeFitProfile({
    playerId: "2026-peter-woods",
    playerName: "Peter Woods",
    position: "DL",

    primaryRoles: [
      {
        role: "3-Tech Penetrating DT",
        fit: 5,
      },
      {
        role: "4i Defensive End",
        fit: 5,
      },
      {
        role: "5-Tech Defensive End",
        fit: 4,
      },
      {
        role: "0-Tech Nose Tackle",
        fit: 3,
      },
      {
        role: "Wide-9 Edge",
        fit: 2,
      },
    ],

    bestSystems: [
      {
        team: "Ravens",
        fit: 5,
      },
      {
        team: "Eagles",
        fit: 5,
      },
      {
        team: "Lions",
        fit: 4,
      },
      {
        team: "Bills",
        fit: 4,
      },
      {
        team: "49ers",
        fit: 4,
      },
    ],

    idealCoordinatorTraits: [
      "Aggressive Front",
      "One-Gap System",
      "Penetrating Interior DL",
      "Heavy Stunt Usage",
      "Attack-Oriented Front",
    ],

    worstFits: [
      "Two-Gap Read-and-React",
      "Wide-9 Edge Alignment",
      "Space-Eating Nose Tackle",
    ],

    scores: {
      roleFit: 95,
      schemeVersatility: 90,
      frontVersatility: 91,
      positionalFlexibility: 88,
      overallSchemeFit: 91,
    },

    notes:
      "Projects best as an attacking interior defensive lineman capable of aligning across multiple fronts while creating penetration and interior disruption.",

    source: "LBHT Scouting",
    confidence: 0.9,
    lastUpdated: "2026-06-30",
  }),
};

export default schemeFitProfiles;