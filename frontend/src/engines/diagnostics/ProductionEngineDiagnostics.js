// src/engines/diagnostics/ProductionEngineDiagnostics.js

import {
  getProductionIntelligenceResult,
} from "../ProductionEngine";

const diagnosticPlayers = [
  {
    label: "Arch Manning",
    player: {
      playerId: "2026-arch-manning",
      identity: {
        playerName: "Arch Manning",
        position: "QB",
        school: "Texas",
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
          seasonsPlayed: [2025],
        },

        roster: {
          rookie: false,
          starter: true,
          status: "ACTIVE",
        },
      },
    },
  },

  {
    label: "Caleb Downs",
    player: {
      playerId: "2026-caleb-downs",
      identity: {
        playerName: "Caleb Downs",
        position: "S",
        school: "Ohio State",
      },
      careerContext: {
        competition: {
          level: "FBS",
          league: "NCAA",
          division: "FBS",
          conference: "BIG TEN",
        },

        careerStage: "DRAFT_PROSPECT",

        draft: {
          draftClass: 2027,
          status: "PROSPECT",
        },

        experience: {
          yearsExperience: 0,
          seasonsPlayed: [2025],
        },

        roster: {
          rookie: false,
          starter: true,
          status: "ACTIVE",
        },
      },
    },
  },

  {
    label: "Jeremiyah Love",
    player: {
      playerId: "2026-jeremiyah-love",
      identity: {
        playerName: "Jeremiyah Love",
        position: "RB",
        school: "Notre Dame",
      },
      careerContext: {
        competition: {
          level: "FBS",
          league: "NCAA",
          division: "FBS",
        },

        careerStage: "DRAFT_PROSPECT",

        draft: {
          draftClass: 2026,
          status: "PROSPECT",
        },

        experience: {
          yearsExperience: 0,
          seasonsPlayed: [2025],
        },

        roster: {
          rookie: false,
          starter: true,
          status: "ACTIVE",
        },
      },
    },
  },

  {
    label: "Missing Production Profile",
    player: {
      playerId: "diagnostic-missing-production",
      identity: {
        playerName: "Missing Production Player",
        position: "QB",
        school: "Test University",
      },
      careerContext: {
        competition: {
          level: "FBS",
          league: "NCAA",
        },

        careerStage: "DRAFT_PROSPECT",

        experience: {
          yearsExperience: 0,
          seasonsPlayed: [],
        },
      },
    },
  },
];

function runSingleDiagnostic({
  label,
  player,
}) {
  const result =
    getProductionIntelligenceResult(player);

  return {
    label,

    playerId: result.playerId,

    available: result.available,

    dataState: result.dataState,

    score: result.score,

    confidence: result.confidence,

    evidenceLevel: result.evidenceLevel,

    competitionLevel:
      result.competitionLevel,

    careerStage:
      result.careerStage,

    positiveFactors:
      result.explanation
        ?.positiveFactors?.length || 0,

    limitingFactors:
      result.explanation
        ?.limitingFactors?.length || 0,

    missingEvidence:
      result.missingEvidence?.length || 0,

    source:
      result.sources?.[0] || null,

    modelVersion:
      result.versions?.model || null,
  };
}

export function runProductionEngineDiagnostics() {
  return diagnosticPlayers.map(
    runSingleDiagnostic
  );
}

export function printProductionEngineDiagnostics() {
  const results =
    runProductionEngineDiagnostics();

  console.table(results);

  return results;
}

export default {
  runProductionEngineDiagnostics,
  printProductionEngineDiagnostics,
};