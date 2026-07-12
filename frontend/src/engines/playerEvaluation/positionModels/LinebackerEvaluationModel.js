function clampScore(value, minimum = 35, maximum = 95) {
  return Math.max(minimum, Math.min(maximum, Math.round(value)));
}

function getTackleProductionScore(performance) {
  const gamesTracked = performance?.gamesTracked || 0;
  const tackles = performance?.tackles || 0;

  if (gamesTracked <= 0) return null;

  const tacklesPerGame = tackles / gamesTracked;

  return clampScore(45 + tacklesPerGame * 7);
}

function getPressureContributionScore(performance) {
  const gamesTracked = performance?.gamesTracked || 0;
  const sacks = performance?.sacks || 0;

  if (gamesTracked <= 0) return null;

  const sacksPerGame = sacks / gamesTracked;

  return clampScore(45 + sacksPerGame * 30);
}

function getCoveragePlaymakingScore(performance) {
  const defensiveInterceptions =
    performance?.defensiveInterceptions || 0;

  return clampScore(50 + defensiveInterceptions * 5);
}

function getLinebackerPerformanceScore(performance) {
  if (!performance) {
    return {
      available: false,
      score: null,
      components: {},
    };
  }

  const tackleProductionScore =
    getTackleProductionScore(performance);

  const pressureContributionScore =
    getPressureContributionScore(performance);

  const coveragePlaymakingScore =
    getCoveragePlaymakingScore(performance);

  const components = [
    {
      key: "tackleProduction",
      score: tackleProductionScore,
      weight: 0.45,
    },
    {
      key: "pressureContribution",
      score: pressureContributionScore,
      weight: 0.25,
    },
    {
      key: "coveragePlaymaking",
      score: coveragePlaymakingScore,
      weight: 0.3,
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
      tackleProductionScore,
      pressureContributionScore,
      coveragePlaymakingScore,
    },
  };
}

function getLinebackerOutlook(playerQuality) {
  if (playerQuality >= 86) return "Elite Linebacker";
  if (playerQuality >= 80) return "High-End Starting Linebacker";
  if (playerQuality >= 74) return "Quality Starting Linebacker";
  if (playerQuality >= 66) return "Functional Starter / Rotational Linebacker";
  if (playerQuality >= 58) return "Rotational Linebacker";

  return "Replacement-Level Linebacker";
}

export function evaluateLinebacker(player, context = {}) {
  const {
    statusScore = 50,
    experienceScore = 50,
    usageScore = null,
    recognitionScore = null,
    performanceProfile = null,
  } = context;

  const linebackerPerformance =
    getLinebackerPerformanceScore(performanceProfile);

  const performanceScore = linebackerPerformance.score;

  let linebackerQuality;

  if (
    typeof performanceScore === "number" &&
    typeof usageScore === "number" &&
    typeof recognitionScore === "number"
  ) {
    linebackerQuality = Math.round(
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
    linebackerQuality = Math.round(
      statusScore * 0.1 +
        experienceScore * 0.1 +
        usageScore * 0.28 +
        performanceScore * 0.52
    );
  } else if (typeof performanceScore === "number") {
    linebackerQuality = Math.round(
      statusScore * 0.15 +
        experienceScore * 0.1 +
        performanceScore * 0.75
    );
  } else if (typeof usageScore === "number") {
    linebackerQuality = Math.round(
      statusScore * 0.15 +
        experienceScore * 0.1 +
        usageScore * 0.75
    );
  } else {
    linebackerQuality = Math.round(
      statusScore * 0.65 + experienceScore * 0.35
    );
  }

  linebackerQuality = clampScore(linebackerQuality);

  return {
    positionModel: "LinebackerEvaluationModel",
    playerQuality: linebackerQuality,
    rosterValue: linebackerQuality,
    starterOutlook: getLinebackerOutlook(linebackerQuality),
    longTermAnswer: linebackerQuality >= 80,

    performanceEvaluation: {
      available: linebackerPerformance.available,
      performanceScore,
      components: linebackerPerformance.components,
    },

    notes: [
      "Linebackers are evaluated using tackle production, pressure contribution, coverage playmaking, usage, and recognition.",
      "Future versions should include run-stop rate, missed tackle rate, coverage targets, yards allowed, pass-rush win rate, and role-specific alignment data.",
    ],
  };
}

export default {
  evaluateLinebacker,
};