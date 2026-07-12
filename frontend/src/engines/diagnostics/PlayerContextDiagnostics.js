// src/engines/diagnostics/PlayerContextDiagnostics.js

import { resolvePlayerContext } from "../context/PlayerContextResolver";
import {
  resolveEvidenceTransition,
  blendProspectAndNFLScores,
} from "../context/EvidenceTransitionEngine";

const diagnosticPlayers = [
  {
    label: "Draft Prospect",
    player: {
      playerId: "diagnostic-prospect",
      identity: {
        playerName: "Diagnostic Prospect",
        position: "QB",
        school: "Test University",
      },
      careerContext: {
        competition: {
          level: "FBS",
          league: "NCAA",
          division: "FBS",
          conference: "SEC",
        },
        careerStage: "DRAFT_PROSPECT",
        draft: {
          draftClass: 2027,
          status: "PROSPECT",
        },
        experience: {
          yearsExperience: 0,
          seasonsPlayed: [2025, 2026],
        },
        roster: {
          rookie: false,
          starter: true,
          status: "ACTIVE",
        },
      },
    },
    evidence: {},
  },

  {
    label: "Rookie Before NFL Snaps",
    player: {
      playerId: "diagnostic-rookie-pre-nfl",
      identity: {
        playerName: "Diagnostic Rookie",
        position: "QB",
      },
      careerContext: {
        competition: {
          level: "NFL",
          league: "NFL",
        },
        careerStage: "ROOKIE",
        currentTeam: {
          abbreviation: "BAL",
        },
        experience: {
          yearsExperience: 0,
          seasonsPlayed: [],
        },
        roster: {
          rookie: true,
          starter: false,
          status: "ACTIVE",
        },
      },
    },
    evidence: {
      nflGamesPlayed: 0,
      nflStarts: 0,
      nflSnaps: 0,
      nflSeasonsWithEvidence: 0,
    },
  },

  {
    label: "Rookie With NFL Evidence",
    player: {
      playerId: "diagnostic-rookie-active",
      identity: {
        playerName: "Diagnostic Active Rookie",
        position: "RB",
      },
      careerContext: {
        competition: {
          level: "NFL",
          league: "NFL",
        },
        careerStage: "ROOKIE",
        currentTeam: {
          abbreviation: "ARI",
        },
        experience: {
          yearsExperience: 0,
          seasonsPlayed: [2026],
        },
        roster: {
          rookie: true,
          starter: true,
          status: "ACTIVE",
        },
      },
    },
    evidence: {
      nflGamesPlayed: 12,
      nflStarts: 8,
      nflSnaps: 425,
      nflSeasonsWithEvidence: 1,
    },
  },

  {
    label: "Young NFL Player",
    player: {
      playerId: "diagnostic-young-pro",
      identity: {
        playerName: "Diagnostic Young Pro",
        position: "WR",
      },
      careerContext: {
        competition: {
          level: "NFL",
          league: "NFL",
        },
        careerStage: "YOUNG_NFL_PLAYER",
        currentTeam: {
          abbreviation: "CAR",
        },
        experience: {
          yearsExperience: 2,
          seasonsPlayed: [2024, 2025],
        },
        roster: {
          rookie: false,
          starter: true,
          status: "ACTIVE",
        },
      },
    },
    evidence: {
      nflGamesPlayed: 30,
      nflStarts: 24,
      nflSnaps: 1450,
      nflSeasonsWithEvidence: 2,
    },
  },

  {
    label: "Established NFL Veteran",
    player: {
      playerId: "diagnostic-veteran",
      identity: {
        playerName: "Diagnostic Veteran",
        position: "QB",
      },
      careerContext: {
        competition: {
          level: "NFL",
          league: "NFL",
        },
        careerStage: "NFL_VETERAN",
        currentTeam: {
          abbreviation: "BAL",
        },
        experience: {
          yearsExperience: 8,
          seasonsPlayed: [
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
          ],
        },
        roster: {
          rookie: false,
          starter: true,
          status: "ACTIVE",
        },
      },
    },
    evidence: {
      nflGamesPlayed: 110,
      nflStarts: 103,
      nflSnaps: 6500,
      nflSeasonsWithEvidence: 8,
    },
  },
];

function runSingleDiagnostic({
  label,
  player,
  evidence,
}) {
  const context = resolvePlayerContext(player);

  const transition = resolveEvidenceTransition(player, {
    ...evidence,
    playerContext: context,
  });

  const blendedScore = blendProspectAndNFLScores({
    prospectScore: 88,
    nflScore: 76,
    transition,
  });

  return {
    label,
    playerId: context.playerId,
    position: context.position,
    competitionLevel: context.competition?.level,
    careerStage: context.careerStage,
    evaluationPath: context.evaluationPath,
    evidenceProfile: context.evidenceProfile,
    sampleStrength: context.sampleStrength,
    transitionStage: transition.transitionStage,
    prospectEvidenceRole:
      transition.prospectEvidenceRole,
    prospectWeight:
      transition.weights?.prospect ?? null,
    nflWeight:
      transition.weights?.nfl ?? null,
    blendedScore: blendedScore.score,
    blendReason: blendedScore.reason,
    missingContext: context.missingContext,
    contextConfidence: context.contextConfidence,
  };
}

export function runPlayerContextDiagnostics() {
  return diagnosticPlayers.map(runSingleDiagnostic);
}

export function printPlayerContextDiagnostics() {
  const results = runPlayerContextDiagnostics();

  console.table(results);

  return results;
}

export default {
  runPlayerContextDiagnostics,
  printPlayerContextDiagnostics,
};