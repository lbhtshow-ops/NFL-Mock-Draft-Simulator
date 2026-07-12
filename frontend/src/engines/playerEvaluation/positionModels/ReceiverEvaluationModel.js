function clampScore(value, minimum = 35, maximum = 95) {
  return Math.max(minimum, Math.min(maximum, Math.round(value)));
}

function getTargetEarningScore(performance) {
  const gamesTracked = performance?.gamesTracked || 0;
  const targets = performance?.targets || 0;

  if (gamesTracked <= 0) return null;

  const targetsPerGame = targets / gamesTracked;

  return clampScore(45 + targetsPerGame * 5);
}

function getReceivingEfficiencyScore(performance) {
  const targets = performance?.targets || 0;
  const receivingYards = performance?.receivingYards || 0;

  if (targets <= 0) return null;

  const yardsPerTarget = receivingYards / targets;

  return clampScore(50 + (yardsPerTarget - 7) * 6);
}

function getCatchReliabilityScore(performance) {
  const targets = performance?.targets || 0;
  const receptions = performance?.receptions || 0;

  if (targets <= 0) return null;

  const catchRate = receptions / targets;

  return clampScore(50 + (catchRate - 0.6) * 120);
}

function getExplosiveProductionScore(performance) {
  const receptions = performance?.receptions || 0;
  const receivingYards = performance?.receivingYards || 0;

  if (receptions <= 0) return null;

  const yardsPerReception = receivingYards / receptions;

  return clampScore(50 + (yardsPerReception - 11) * 5);
}

function getTouchdownProductionScore(performance) {
  const targets = performance?.targets || 0;
  const receivingTDs = performance?.receivingTDs || 0;

  if (targets <= 0) return null;

  const touchdownRate = receivingTDs / targets;

  return clampScore(50 + touchdownRate * 450);
}

function getReceiverPerformanceScore(performance) {
  if (!performance) {
    return {
      available: false,
      score: null,
      components: {},
    };
  }

  const targetEarningScore = getTargetEarningScore(performance);
  const receivingEfficiencyScore = getReceivingEfficiencyScore(performance);
  const catchReliabilityScore = getCatchReliabilityScore(performance);
  const explosiveProductionScore = getExplosiveProductionScore(performance);
  const touchdownProductionScore = getTouchdownProductionScore(performance);

  const components = [
    { key: "targetEarning", score: targetEarningScore, weight: 0.25 },
    { key: "receivingEfficiency", score: receivingEfficiencyScore, weight: 0.25 },
    { key: "catchReliability", score: catchReliabilityScore, weight: 0.2 },
    { key: "explosiveProduction", score: explosiveProductionScore, weight: 0.2 },
    { key: "touchdownProduction", score: touchdownProductionScore, weight: 0.1 },
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
      targetEarningScore,
      receivingEfficiencyScore,
      catchReliabilityScore,
      explosiveProductionScore,
      touchdownProductionScore,
    },
  };
}

function getReceiverOutlook(playerQuality, position) {
  if (playerQuality >= 86) return position === "TE" ? "Elite TE" : "Elite WR1";
  if (playerQuality >= 80) return position === "TE" ? "High-End Starting TE" : "High-End Starting WR";
  if (playerQuality >= 74) return position === "TE" ? "Quality Starting TE" : "Quality Starting WR";
  if (playerQuality >= 66) return position === "TE" ? "Functional Starter / TE2" : "WR2 / WR3 Contributor";
  if (playerQuality >= 58) return "Rotational Receiver";

  return "Replacement-Level Receiver";
}

export function evaluateReceiver(player, context = {}) {
  const {
    statusScore = 50,
    experienceScore = 50,
    usageScore = null,
    recognitionScore = null,
    performanceProfile = null,
  } = context;

  const position = player?.identity?.position || player?.position || "WR";
  const receiverPerformance = getReceiverPerformanceScore(performanceProfile);
  const performanceScore = receiverPerformance.score;

  let receiverQuality;

  if (
    typeof performanceScore === "number" &&
    typeof usageScore === "number" &&
    typeof recognitionScore === "number"
  ) {
    receiverQuality = Math.round(
      statusScore * 0.08 +
        experienceScore * 0.07 +
        usageScore * 0.18 +
        performanceScore * 0.55 +
        recognitionScore * 0.12
    );
  } else if (
    typeof performanceScore === "number" &&
    typeof usageScore === "number"
  ) {
    receiverQuality = Math.round(
      statusScore * 0.1 +
        experienceScore * 0.1 +
        usageScore * 0.2 +
        performanceScore * 0.6
    );
  } else if (typeof performanceScore === "number") {
    receiverQuality = Math.round(
      statusScore * 0.15 + experienceScore * 0.1 + performanceScore * 0.75
    );
  } else if (typeof usageScore === "number") {
    receiverQuality = Math.round(
      statusScore * 0.15 + experienceScore * 0.1 + usageScore * 0.75
    );
  } else {
    receiverQuality = Math.round(statusScore * 0.7 + experienceScore * 0.3);
  }

  receiverQuality = clampScore(receiverQuality);

  return {
    positionModel: "ReceiverEvaluationModel",
    playerQuality: receiverQuality,
    rosterValue: receiverQuality,
    starterOutlook: getReceiverOutlook(receiverQuality, position),
    longTermAnswer: receiverQuality >= 80,

    performanceEvaluation: {
      available: receiverPerformance.available,
      performanceScore,
      components: receiverPerformance.components,
    },

    notes: [
      "Receiver evaluated using target earning, receiving efficiency, catch reliability, explosive production, and touchdown production.",
      "This model supports WR and TE until tight end receives its own specialized model.",
    ],
  };
}

export default {
  evaluateReceiver,
};