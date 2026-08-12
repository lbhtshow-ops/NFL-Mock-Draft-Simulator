import { getProspectCarryoverEvaluation } from "../ProspectCarryoverEvaluationEngine.js";

function clampScore(value, minimum = 35, maximum = 95) {
  return Math.max(minimum, Math.min(maximum, Math.round(value)));
}

function getRushingEfficiencyScore(performance) {
  const carries = performance?.carries || 0;
  const rushingYards = performance?.rushingYards || 0;

  if (carries <= 0) return null;

  const yardsPerCarry = rushingYards / carries;

  return clampScore(55 + (yardsPerCarry - 4.0) * 12);
}

function getRushingValueScore(performance) {
  const carries = performance?.carries || 0;
  const rushingEPA = performance?.rushingEPA || 0;

  if (carries <= 0) return null;

  const epaPerCarry = rushingEPA / carries;

  return clampScore(60 + epaPerCarry * 120);
}

function getFirstDownProductionScore(performance) {
  const carries = performance?.carries || 0;
  const rushingFirstDowns = performance?.rushingFirstDowns || 0;

  if (carries <= 0) return null;

  const firstDownRate = rushingFirstDowns / carries;

  return clampScore(50 + (firstDownRate - 0.2) * 180);
}

function getTouchdownProductionScore(performance) {
  const carries = performance?.carries || 0;
  const rushingTDs = performance?.rushingTDs || 0;

  if (carries <= 0) return null;

  const touchdownRate = rushingTDs / carries;

  return clampScore(50 + touchdownRate * 500);
}

function getReceivingContributionScore(performance) {
  const targets = performance?.targets || 0;
  const receptions = performance?.receptions || 0;
  const receivingYards = performance?.receivingYards || 0;
  const receivingTDs = performance?.receivingTDs || 0;

  if (targets <= 0 && receptions <= 0) return 45;

  const catchRate = targets > 0 ? receptions / targets : 0;

  return clampScore(
    45 + receivingYards / 35 + receivingTDs * 3 + catchRate * 15
  );
}

function getBallSecurityScore(performance) {
  const carries = performance?.carries || 0;
  const receptions = performance?.receptions || 0;
  const fumbles = performance?.fumbles || 0;
  const fumblesLost = performance?.fumblesLost || 0;

  const touches = carries + receptions;

  if (touches <= 0) return null;

  const fumbleRate = fumbles / touches;
  const lostFumbleRate = fumblesLost / touches;

  return clampScore(88 - fumbleRate * 900 - lostFumbleRate * 1200);
}

function getWorkloadScore(performance) {
  const gamesTracked = performance?.gamesTracked || 0;
  const carries = performance?.carries || 0;
  const receptions = performance?.receptions || 0;

  if (gamesTracked <= 0) return null;

  const touchesPerGame = (carries + receptions) / gamesTracked;

  return clampScore(45 + touchesPerGame * 2);
}

function getRunningBackPerformanceScore(performance) {
  if (!performance) {
    return {
      available: false,
      score: null,
      components: {},
    };
  }

  const rushingEfficiencyScore = getRushingEfficiencyScore(performance);
  const rushingValueScore = getRushingValueScore(performance);
  const firstDownProductionScore =
    getFirstDownProductionScore(performance);
  const touchdownProductionScore =
    getTouchdownProductionScore(performance);
  const receivingContributionScore =
    getReceivingContributionScore(performance);
  const ballSecurityScore = getBallSecurityScore(performance);
  const workloadScore = getWorkloadScore(performance);

  const components = [
    { key: "rushingEfficiency", score: rushingEfficiencyScore, weight: 0.25 },
    { key: "rushingValue", score: rushingValueScore, weight: 0.2 },
    {
      key: "firstDownProduction",
      score: firstDownProductionScore,
      weight: 0.15,
    },
    {
      key: "receivingContribution",
      score: receivingContributionScore,
      weight: 0.15,
    },
    { key: "ballSecurity", score: ballSecurityScore, weight: 0.1 },
    {
      key: "touchdownProduction",
      score: touchdownProductionScore,
      weight: 0.05,
    },
    { key: "workload", score: workloadScore, weight: 0.1 },
  ];

  const availableComponents = components.filter(
    (component) => typeof component.score === "number"
  );

  if (availableComponents.length === 0) {
    return {
      available: false,
      score: null,
      components: {},
    };
  }

  const totalWeight = availableComponents.reduce(
    (sum, component) => sum + component.weight,
    0
  );

  const weightedScore = availableComponents.reduce(
    (sum, component) => sum + component.score * component.weight,
    0
  );

  return {
    available: true,
    score: clampScore(weightedScore / totalWeight),
    components: {
      rushingEfficiencyScore,
      rushingValueScore,
      firstDownProductionScore,
      touchdownProductionScore,
      receivingContributionScore,
      ballSecurityScore,
      workloadScore,
    },
  };
}

function getRunningBackOutlook(playerQuality) {
  if (playerQuality >= 86) return "Elite Feature Back";
  if (playerQuality >= 80) return "High-End Feature Back";
  if (playerQuality >= 74) return "Quality Starter";
  if (playerQuality >= 66) return "Committee Starter";
  if (playerQuality >= 58) return "Rotational Back";

  return "Replacement-Level RB";
}

function getCareerStageAdjustment(player) {
  const experience = player?.identity?.experience;

  if (typeof experience !== "number") return 0;

  if (experience <= 1) return 2;
  if (experience <= 4) return 3;
  if (experience <= 6) return 0;
  if (experience <= 8) return -3;

  return -6;
}

export function evaluateRunningBack(player, context = {}) {
  const {
    statusScore = 50,
    experienceScore = 50,
    usageScore = null,
    recognitionScore = null,
    performanceProfile = null,
  } = context;

  const runningBackPerformance =
    getRunningBackPerformanceScore(performanceProfile);

  const prospectCarryover = getProspectCarryoverEvaluation(player);

  const performanceScore = runningBackPerformance.score;
  const carryoverScore = prospectCarryover.carryoverScore;
  const careerStageAdjustment = getCareerStageAdjustment(player);

  let runningBackQuality;

  if (
    !runningBackPerformance.available &&
    prospectCarryover.available &&
    typeof carryoverScore === "number"
  ) {
    runningBackQuality = Math.round(
      statusScore * 0.08 +
        experienceScore * 0.07 +
        carryoverScore * 0.85
    );
  } else if (
    typeof performanceScore === "number" &&
    typeof usageScore === "number" &&
    typeof recognitionScore === "number"
  ) {
    runningBackQuality = Math.round(
      statusScore * 0.08 +
        experienceScore * 0.05 +
        usageScore * 0.17 +
        performanceScore * 0.58 +
        recognitionScore * 0.12
    );
  } else if (
    typeof performanceScore === "number" &&
    typeof usageScore === "number"
  ) {
    runningBackQuality = Math.round(
      statusScore * 0.1 +
        experienceScore * 0.08 +
        usageScore * 0.2 +
        performanceScore * 0.62
    );
  } else if (typeof performanceScore === "number") {
    runningBackQuality = Math.round(
      statusScore * 0.15 + experienceScore * 0.1 + performanceScore * 0.75
    );
  } else if (typeof usageScore === "number") {
    runningBackQuality = Math.round(
      statusScore * 0.15 + experienceScore * 0.1 + usageScore * 0.75
    );
  } else {
    runningBackQuality = Math.round(statusScore * 0.7 + experienceScore * 0.3);
  }

  runningBackQuality = clampScore(
    runningBackQuality + careerStageAdjustment
  );

  const starterOutlook = getRunningBackOutlook(runningBackQuality);

  return {
    positionModel: "RunningBackEvaluationModel",
    playerQuality: runningBackQuality,
    rosterValue: runningBackQuality,
    starterOutlook,
    longTermAnswer: runningBackQuality >= 80,

    performanceEvaluation: {
      available: runningBackPerformance.available,
      performanceScore,
      components: runningBackPerformance.components,
    },

    prospectCarryover: {
      available: prospectCarryover.available,
      carryoverScore,
      source: prospectCarryover.source,
      notes: prospectCarryover.notes || [],
    },

    careerStageAdjustment,

    notes: [
      "Running back evaluated using position-specific rushing efficiency and value metrics.",
      "Rookie backs without NFL production can use prospect carryover evaluation.",
      "Receiving contribution and ball security are included in the evaluation.",
      "Workload represents proven role but does not independently determine player quality.",
      "Career stage applies a small positional longevity adjustment.",
      "Recognition is used as supporting evidence rather than a permanent quality boost.",
    ],
  };
}

export default {
  evaluateRunningBack,
};