import {
  hardenNFLPlayerEvaluation,
  NFL_PLAYER_EVALUATION_GOVERNANCE_VERSION,
} from "../playerEvaluation/nfl/NFLPlayerEvaluationGovernance.js";
import { adaptNFLPlayerEvaluationToCanonicalCaliber } from "../playerEvaluation/caliber/adapters/NFLPlayerCaliberAdapter.js";

const checks = {};
const failures = [];
const check = (name, condition) => {
  checks[name] = Boolean(condition);
  if (!condition) failures.push(name);
};

const player = {
  id: "nfl-player-1",
  name: "Fixture Player",
  position: "QB",
};

const richEvaluation = {
  playerQuality: 88,
  rosterValue: 84,
  playerTier: "elite",
  positionValue: 8,
  positionEvaluation: {
    model: "QuarterbackEvaluationModel",
    performanceEvaluation: {
      available: true,
      performanceScore: 82,
      sampleSize: { gamesTracked: 8, attempts: 260 },
    },
    recognitionEvaluation: {
      establishedCareerBaseline: 90,
    },
    notes: ["Fixture rationale"],
  },
  usage: {
    available: true,
    gamesTracked: 8,
    matchedBy: "canonicalPlayerId",
  },
  production: {
    available: true,
    gamesTracked: 8,
    matchedBy: "canonicalPlayerId",
  },
  recognition: {
    available: true,
    tier: "All-Pro",
    awards: ["fixture"],
    establishedCareerBaseline: 90,
  },
};

const hardened = hardenNFLPlayerEvaluation({ player, evaluation: richEvaluation });
const caliber = adaptNFLPlayerEvaluationToCanonicalCaliber({
  player,
  evaluation: hardened,
});

check("governance_version_present", hardened.governance?.contractVersion === NFL_PLAYER_EVALUATION_GOVERNANCE_VERSION);
check("quality_preserved_without_regrading", hardened.playerQuality === 88);
check("roster_value_preserved_without_regrading", hardened.rosterValue === 84);
check("quality_and_roster_value_remain_distinct", hardened.playerQuality !== hardened.rosterValue);
check("current_form_uses_explicit_position_performance", hardened.currentFormGrade === 82);
check("career_baseline_uses_explicit_established_baseline", hardened.careerBaselineGrade === 90);
check("confidence_is_evidence_coverage_based", hardened.evaluationConfidence === 1);
check("confidence_does_not_equal_quality", hardened.evaluationConfidence !== hardened.playerQuality / 100);
check("evidence_level_standardized", hardened.evidenceLevel === "VERY_STRONG");
check("readiness_available_for_rich_evidence", hardened.readiness === "AVAILABLE");
check("provenance_exposes_evidence_domains", hardened.evidenceRefs.length === 4);
check("versions_exposed", Boolean(hardened.versions?.evaluator && hardened.versions?.model && hardened.versions?.weights));
check("canonical_caliber_consumes_hardened_confidence", caliber.confidence === 1);
check("canonical_caliber_uses_quality_not_roster_value", caliber.caliberGrade === 88 && caliber.rosterValue === 84);

const sparseEvaluation = {
  playerQuality: 67,
  rosterValue: 67,
  playerTier: "replacementStarter",
  positionEvaluation: {
    model: "OffensiveLineEvaluationModel",
    notes: [],
  },
  usage: { available: true, gamesTracked: 3, matchedBy: "name" },
  production: { available: false, gamesTracked: 0, matchedBy: null },
  recognition: { available: false, awards: [] },
};
const sparse = hardenNFLPlayerEvaluation({ player: { ...player, position: "OT" }, evaluation: sparseEvaluation });
check("legacy_equal_roster_value_is_flagged", sparse.governance?.rosterValueSemantics === "LEGACY_EQUAL_TO_PLAYER_QUALITY");
check("legacy_equal_roster_value_limitation_exposed", sparse.governance?.limitations?.some((item) => item.includes("rosterValue equal to playerQuality")));
check("missing_current_form_remains_null", sparse.currentFormGrade === null);
check("missing_career_baseline_remains_null", sparse.careerBaselineGrade === null);
check("sparse_evidence_is_partial_not_fabricated", sparse.readiness === "PARTIAL" && sparse.evaluationConfidence > 0 && sparse.evaluationConfidence < 0.7);

const unavailable = hardenNFLPlayerEvaluation({ player, evaluation: {} });
check("unavailable_never_invents_quality", unavailable.available === false && unavailable.playerQuality == null);
check("unavailable_readiness_is_unavailable", unavailable.readiness === "UNAVAILABLE");

const passed = Object.values(checks).filter(Boolean).length;
const failed = failures.length;
console.log(JSON.stringify({
  suite: "NFL Player Evaluation Hardening",
  contractVersion: NFL_PLAYER_EVALUATION_GOVERNANCE_VERSION,
  status: failed === 0 ? "PASS" : "FAIL",
  passed,
  failed,
  checks,
  failures,
}, null, 2));
if (failed) process.exitCode = 1;
