function clampScore(value, minimum = 35, maximum = 95) {
  return Math.max(minimum, Math.min(maximum, Math.round(value)));
}

function getPassRushProductionScore(performance) {
  const gamesTracked = performance?.gamesTracked || 0;
  const sacks = performance?.sacks || 0;

  if (gamesTracked <= 0) return null;

  const sacksPerGame = sacks / gamesTracked;

  return clampScore(50 + sacksPerGame * 35);
}

function getRunDefenseInvolvementScore(performance) {
  const gamesTracked = performance?.gamesTracked || 0;
  const tackles = performance?.tackles || 0;

  if (gamesTracked <= 0) return null;

  const tacklesPerGame = tackles / gamesTracked;

  return clampScore(45 + tacklesPerGame * 8);
}

function getDefensiveDisruptionScore(performance) {
  const sacks = performance?.sacks || 0;
  const defensiveInterceptions =
    performance?.defensiveInterceptions || 0;

  return clampScore(50 + sacks * 2.5 + defensiveInterceptions * 4);
}

function getDefensiveLinePerformanceScore(performance) {
  if (!performance) {
    return {
      available: false,
      score: null,
      components: {},
    };
  }

  const passRushProductionScore =
    getPassRushProductionScore(performance);

  const runDefenseInvolvementScore =
    getRunDefenseInvolvementScore(performance);

  const defensiveDisruptionScore =
    getDefensiveDisruptionScore(performance);

  const components = [
    {
      key: "passRushProduction",
      score: passRushProductionScore,
      weight: 0.4,
    },
    {
      key: "runDefenseInvolvement",
      score: runDefenseInvolvementScore,
      weight: 0.3,
    },
    {
      key: "defensiveDisruption",
      score: defensiveDisruptionScore,
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
      passRushProductionScore,
      runDefenseInvolvementScore,
      defensiveDisruptionScore,
    },
  };
}

function getDefensiveLineOutlook(playerQuality, position) {
  if (playerQuality >= 86) return `Elite ${position}`;
  if (playerQuality >= 80) return `High-End Starting ${position}`;
  if (playerQuality >= 74) return `Quality Starting ${position}`;
  if (playerQuality >= 66) return `Functional Starter / Rotational ${position}`;
  if (playerQuality >= 58) return `Rotational Defensive Front Player`;

  return `Replacement-Level ${position}`;
}

export function evaluateDefensiveLine(player, context = {}) {
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
    "DL";

  const defensiveLinePerformance =
    getDefensiveLinePerformanceScore(performanceProfile);

  const performanceScore = defensiveLinePerformance.score;

  let defensiveLineQuality;

  if (
    typeof performanceScore === "number" &&
    typeof usageScore === "number" &&
    typeof recognitionScore === "number"
  ) {
    defensiveLineQuality = Math.round(
      statusScore * 0.08 +
        experienceScore * 0.07 +
        usageScore * 0.22 +
        performanceScore * 0.51 +
        recognitionScore * 0.12
    );
  } else if (
    typeof performanceScore === "number" &&
    typeof usageScore === "number"
  ) {
    defensiveLineQuality = Math.round(
      statusScore * 0.1 +
        experienceScore * 0.1 +
        usageScore * 0.25 +
        performanceScore * 0.55
    );
  } else if (typeof performanceScore === "number") {
    defensiveLineQuality = Math.round(
      statusScore * 0.15 +
        experienceScore * 0.1 +
        performanceScore * 0.75
    );
  } else if (typeof usageScore === "number") {
    defensiveLineQuality = Math.round(
      statusScore * 0.15 +
        experienceScore * 0.1 +
        usageScore * 0.75
    );
  } else {
    defensiveLineQuality = Math.round(
      statusScore * 0.65 + experienceScore * 0.35
    );
  }

  defensiveLineQuality = clampScore(defensiveLineQuality);

  return {
    positionModel: "DefensiveLineEvaluationModel",
    playerQuality: defensiveLineQuality,
    rosterValue: defensiveLineQuality,
    starterOutlook: getDefensiveLineOutlook(
      defensiveLineQuality,
      position
    ),
    longTermAnswer: defensiveLineQuality >= 80,

    performanceEvaluation: {
      available: defensiveLinePerformance.available,
      performanceScore,
      components: defensiveLinePerformance.components,
    },

    notes: [
      "Defensive front players are evaluated using pass-rush production, run-defense involvement, disruption, usage, and recognition.",
      "This model supports DL and EDGE until interior and edge-specific submodels are separated.",
      "Future versions should include pressures, QB hits, tackles for loss, pass-rush win rate, run-stop rate, and double-team context.",
    ],
  };
}

export default {
  evaluateDefensiveLine,
};