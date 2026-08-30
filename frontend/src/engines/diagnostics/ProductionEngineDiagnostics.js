// src/engines/diagnostics/ProductionEngineDiagnostics.js

import productionProfiles from "../../data/footballIntelligence/production/productionProfiles.js";
import defaultProductionProfile from "../../data/footballIntelligence/production/defaultProductionProfile.js";
import {
  PRODUCTION_COMPATIBILITY_EXCEPTION,
  getCanonicalProductionIntelligenceResult,
  getProductionProfile,
  getProductionSummary,
  getProductionIntelligenceResult,
} from "../ProductionEngine.js";

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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function same(left, right, message) {
  assert(JSON.stringify(left) === JSON.stringify(right), message);
}

function player(playerId, position = "QB") {
  return {
    playerId,
    identity: { position },
    careerContext: {
      competition: { level: "FBS" },
      careerStage: "DRAFT_PROSPECT",
      experience: { seasonsPlayed: [2025] },
    },
  };
}

const compatibilitySnapshots = Object.freeze([
  Object.freeze({ id: "2026-arch-manning", position: "QB", scores: Object.freeze({ consistency: 87, efficiency: 91, explosiveness: 90, situationalProduction: 88, overallProductionScore: 89 }), confidence: 0.87, source: "LBHT Film Study", lastUpdated: "2026-07-03" }),
  Object.freeze({ id: "2026-peter-woods", position: "DL", scores: Object.freeze({ consistency: 89, efficiency: 88, explosiveness: 90, situationalProduction: 91, overallProductionScore: 89 }), confidence: 0.9, source: "LBHT Film Study", lastUpdated: "2026-07-03" }),
  Object.freeze({ id: "2026-caleb-downs", position: "S", scores: Object.freeze({ consistency: 94, efficiency: 93, explosiveness: 91, situationalProduction: 95, overallProductionScore: 94 }), confidence: 0.88, source: "LBHT Film Study", lastUpdated: "2026-07-04" }),
  Object.freeze({ id: "2026-francis-mauigoa", position: "OT", scores: Object.freeze({ consistency: 91, efficiency: 90, explosiveness: 92, situationalProduction: 91, overallProductionScore: 91 }), confidence: 0.84, source: "LBHT Film Study", lastUpdated: "2026-07-03" }),
  Object.freeze({ id: "diagnostic-missing-production", position: "QB", scores: null, confidence: 0, source: null, lastUpdated: null }),
]);

const compatibilityChecks = [];
function compatibilityCheck(id, run) { compatibilityChecks.push({ id, run }); }

compatibilityCheck("public-exports", () => assert([getProductionProfile, getProductionSummary, getProductionIntelligenceResult, getCanonicalProductionIntelligenceResult].every((item) => typeof item === "function"), "Public export missing."));
compatibilityCheck("profile-lookups", () => compatibilitySnapshots.slice(0, 4).forEach(({ id, position }) => assert(getProductionProfile(player(id, position)) === productionProfiles[id], `${id} lookup changed.`)));
compatibilityCheck("summary-outputs", () => compatibilitySnapshots.slice(0, 4).forEach(({ id, position }) => { const summary = getProductionSummary(player(id, position)); const profile = productionProfiles[id]; assert(summary.available && summary.data === profile && summary.summary === profile.notes, `${id} summary changed.`); }));
compatibilityCheck("result-scores", () => compatibilitySnapshots.forEach(({ id, position, scores }) => assert(getProductionIntelligenceResult(player(id, position)).score === (scores?.overallProductionScore ?? null), `${id} score changed.`)));
compatibilityCheck("category-scores", () => compatibilitySnapshots.slice(0, 4).forEach(({ id, position, scores }) => same(getProductionIntelligenceResult(player(id, position)).rawData.profile.productionScores, scores, `${id} categories changed.`)));
compatibilityCheck("raw-profile-nesting", () => compatibilitySnapshots.slice(0, 4).forEach(({ id, position }) => assert(getProductionIntelligenceResult(player(id, position)).rawData.profile === productionProfiles[id], `${id} profile nesting changed.`)));
compatibilityCheck("confidence-values", () => compatibilitySnapshots.forEach(({ id, position, confidence }) => assert(getProductionIntelligenceResult(player(id, position)).confidence === confidence, `${id} confidence changed.`)));
compatibilityCheck("source-values", () => compatibilitySnapshots.forEach(({ id, position, source }) => assert((getProductionIntelligenceResult(player(id, position)).sources[0] ?? null) === source, `${id} source changed.`)));
compatibilityCheck("last-updated-values", () => compatibilitySnapshots.forEach(({ id, position, lastUpdated }) => assert(getProductionIntelligenceResult(player(id, position)).lastUpdated === lastUpdated, `${id} date changed.`)));
compatibilityCheck("strengths-preserved", () => compatibilitySnapshots.slice(0, 4).forEach(({ id, position }) => same(getProductionIntelligenceResult(player(id, position)).rawData.profile.strengths, productionProfiles[id].strengths, `${id} strengths changed.`)));
compatibilityCheck("concerns-preserved", () => compatibilitySnapshots.slice(0, 4).forEach(({ id, position }) => same(getProductionIntelligenceResult(player(id, position)).rawData.profile.concerns, productionProfiles[id].concerns, `${id} concerns changed.`)));
compatibilityCheck("notes-preserved", () => compatibilitySnapshots.slice(0, 4).forEach(({ id, position }) => assert(getProductionIntelligenceResult(player(id, position)).summary === productionProfiles[id].notes, `${id} notes changed.`)));
compatibilityCheck("missing-profile-preserved", () => { const missingPlayer = player("diagnostic-missing-production"); const result = getProductionIntelligenceResult(missingPlayer); assert(getProductionProfile(missingPlayer) === defaultProductionProfile && !result.available && result.score === null && result.dataState === "UNAVAILABLE", "Missing profile changed."); });
compatibilityCheck("quarterback-preparation-path", () => assert(getProductionIntelligenceResult(player("2026-arch-manning")).rawData.profile.statistics.offense.passing.attempts === 90, "Quarterback Production input changed."));
compatibilityCheck("adapter-score-usability", () => { const result = getProductionIntelligenceResult(player("2026-arch-manning")); assert(result.available && result.dataState === "AVAILABLE" && result.score === 89, "Adapter score prerequisites changed."); });
compatibilityCheck("quarterback-production-support", () => assert(getProductionIntelligenceResult(player("2026-arch-manning")).rawData.profile === productionProfiles["2026-arch-manning"], "Production support profile changed."));
compatibilityCheck("football-service-legacy-summary", () => assert(getProductionSummary(player("2026-peter-woods", "DL")).data.productionScores.overallProductionScore === 89, "Football service summary input changed."));
compatibilityCheck("executive-summary-legacy-score", () => assert(getProductionSummary(player("2026-caleb-downs", "S")).data.productionScores.overallProductionScore === 94, "Executive Summary score changed."));
compatibilityCheck("explainability-legacy-score", () => assert(getProductionSummary(player("2026-francis-mauigoa", "OT")).data.productionScores.overallProductionScore === 91, "Explainability score changed."));
compatibilityCheck("draft-board-legacy-score", () => assert(getProductionIntelligenceResult(player("2026-caleb-downs", "S")).rawData.profile.productionScores.overallProductionScore === 94, "Draft Board input changed."));
compatibilityCheck("draft-decision-legacy-score", () => assert(getProductionIntelligenceResult(player("2026-francis-mauigoa", "OT")).rawData.profile.productionScores.overallProductionScore === 91, "Draft Decision input changed."));
compatibilityCheck("canonical-invoked-once", () => assert(getProductionIntelligenceResult(player("2026-arch-manning")).rawData.canonicalInvocationCount === 1, "Canonical invocation count changed."));
compatibilityCheck("canonical-report-reused-once", () => { const rawData = getProductionIntelligenceResult(player("2026-arch-manning")).rawData; assert(rawData.canonicalResult.score === null && Object.keys(rawData).filter((key) => key === "canonicalResult").length === 1, "Canonical reporting duplicated."); });
compatibilityCheck("legacy-score-not-canonical", () => { const rawData = getProductionIntelligenceResult(player("2026-arch-manning")).rawData; assert(rawData.compatibilityException.canonicalDerivation === false && rawData.legacyModeledOutputDeclaration.canonicalDerivation === false && rawData.canonicalResult.score === null, "Legacy score claimed canonical."); });
compatibilityCheck("removal-condition", () => assert(PRODUCTION_COMPATIBILITY_EXCEPTION.removalCondition === "Remove after all active evaluation and Decision Support consumers have migrated to a governed Production replacement, or after an approved governed Production model supersedes the legacy declaration and compatibility snapshots approve the resulting behavior change.", "Removal condition changed."));
compatibilityCheck("no-transitional-scorer", () => { const rawData = getProductionIntelligenceResult(player("2026-arch-manning")).rawData; assert(rawData.profile.productionScores.overallProductionScore === rawData.legacyModeledOutputDeclaration.productionScores.overallProductionScore, "Compatibility score was recalculated."); });
compatibilityCheck("fixed-snapshots", () => compatibilitySnapshots.forEach(({ id, position, scores, confidence, source, lastUpdated }) => { const result = getProductionIntelligenceResult(player(id, position)); same({ score: result.score, confidence: result.confidence, source: result.sources[0] ?? null, lastUpdated: result.lastUpdated, categoryScores: result.rawData?.profile === defaultProductionProfile ? null : result.rawData?.profile?.productionScores ?? null }, { score: scores?.overallProductionScore ?? null, confidence, source, lastUpdated, categoryScores: scores }, `${id} snapshot changed.`); }));

export function runProductionCompatibilityDiagnostics() {
  const results = compatibilityChecks.map(({ id, run }) => {
    try { run(); return { id, passed: true, error: null }; }
    catch (error) { return { id, passed: false, error: error.message }; }
  });
  const passed = results.filter((entry) => entry.passed).length;
  return { suite: "ProductionCompatibilityDiagnostics", total: results.length, passed, failed: results.length - passed, compatibilitySnapshots: compatibilitySnapshots.length, results };
}

export default {
  runProductionEngineDiagnostics,
  printProductionEngineDiagnostics,
  runProductionCompatibilityDiagnostics,
};
