function clampScore(value, minimum = 35, maximum = 95) {
  return Math.max(minimum, Math.min(maximum, Math.round(value)));
}

function getBallProductionScore(performance) {
  const defensiveInterceptions =
    performance?.defensiveInterceptions || 0;

  return clampScore(50 + defensiveInterceptions * 6);
}

function getTackleSupportScore(performance) {
  const gamesTracked = performance?.gamesTracked || 0;
  const tackles = performance?.tackles || 0;

  if (gamesTracked <= 0) return null;

  const tacklesPerGame = tackles / gamesTracked;

  return clampScore(45 + tacklesPerGame * 6);
}

function getPressureContributionScore(performance) {
  const gamesTracked = performance?.gamesTracked || 0;
  const sacks = performance?.sacks || 0;

  if (gamesTracked <= 0) return null;

  const sacksPerGame = sacks / gamesTracked;

  return clampScore(45 + sacksPerGame * 25);
}

function getSecondaryPerformanceScore(performance) {
  if (!performance) {
    return {
      available: false,
      score: null,
      components: {},
    };
  }

  const ballProductionScore = getBallProductionScore(performance);
  const tackleSupportScore = getTackleSupportScore(performance);
  const pressureContributionScore =
    getPressureContributionScore(performance);

  const components = [
    { key: "ballProduction", score: ballProductionScore, weight: 0.4 },
    { key: "tackleSupport", score: tackleSupportScore, weight: 0.4 },
    {
      key: "pressureContribution",
      score: pressureContributionScore,
      weight: 0.2,
    },
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
      ballProductionScore,
      tackleSupportScore,
      pressureContributionScore,
    },
  };
}

function getSecondaryOutlook(playerQuality, position) {
  if (playerQuality >= 86) return `Elite ${position}`;
  if (playerQuality >= 80) return `High-End Starting ${position}`;
  if (playerQuality >= 74) return `Quality Starting ${position}`;
  if (playerQuality >= 66) return `Functional Starter / Rotational ${position}`;
  if (playerQuality >= 58) return `Rotational Defensive Back`;

  return `Replacement-Level ${position}`;
}

export function evaluateSecondary(player, context = {}) {
  const {
    statusScore = 50,
    experienceScore = 50,
    usageScore = null,
    recognitionScore = null,
    performanceProfile = null,
  } = context;

  const position =
    player?.identity?.position ||
    player?.position ||
    "DB";

  const secondaryPerformance =
    getSecondaryPerformanceScore(performanceProfile);

  const performanceScore = secondaryPerformance.score;

  let secondaryQuality;

  if (
    typeof performanceScore === "number" &&
    typeof usageScore === "number" &&
    typeof recognitionScore === "number"
  ) {
    secondaryQuality = Math.round(
      statusScore * 0.08 +
        experienceScore * 0.07 +
        usageScore * 0.25 +
        performanceScore * 0.48 +
        recognitionScore * 0.12
    );
  } else if (
    typeof performanceScore === "number" &&
    typeof usageScore === "number"
  ) {
    secondaryQuality = Math.round(
      statusScore * 0.1 +
        experienceScore * 0.1 +
        usageScore * 0.28 +
        performanceScore * 0.52
    );
  } else if (typeof performanceScore === "number") {
    secondaryQuality = Math.round(
      statusScore * 0.15 +
        experienceScore * 0.1 +
        performanceScore * 0.75
    );
  } else if (typeof usageScore === "number") {
    secondaryQuality = Math.round(
      statusScore * 0.15 +
        experienceScore * 0.1 +
        usageScore * 0.75
    );
  } else {
    secondaryQuality = Math.round(
      statusScore * 0.65 + experienceScore * 0.35
    );
  }

  secondaryQuality = clampScore(secondaryQuality);

  return {
    positionModel: "SecondaryEvaluationModel",
    playerQuality: secondaryQuality,
    rosterValue: secondaryQuality,
    starterOutlook: getSecondaryOutlook(secondaryQuality, position),
    longTermAnswer: secondaryQuality >= 80,

    performanceEvaluation: {
      available: secondaryPerformance.available,
      performanceScore,
      components: secondaryPerformance.components,
    },

    notes: [
      "Defensive backs are evaluated using ball production, tackling/support production, pressure contribution, usage, and recognition.",
      "This model supports CB and S until cornerback and safety receive separate specialized models.",
      "Future versions should include targets allowed, yards allowed, completion rate allowed, passer rating allowed, alignment, man/zone role, missed tackle rate, and safety deployment context.",
    ],
  };
}

export default {
  evaluateSecondary,
};