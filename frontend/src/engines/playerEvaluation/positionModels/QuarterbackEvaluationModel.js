function clampScore(value, minimum = 35, maximum = 95) {
  return Math.max(minimum, Math.min(maximum, Math.round(value)));
}

function getPassingAttemptCount(performance) {
  return performance?.attempts || 0;
}

function getSampleSizeCap(attempts = 0) {
  if (attempts < 25) return 58;
  if (attempts < 75) return 64;
  if (attempts < 150) return 70;
  if (attempts < 300) return 76;

  return 95;
}

function getCompletionScore(performance) {
  const attempts = performance?.attempts || 0;
  const completions = performance?.completions || 0;

  if (attempts <= 0) return null;

  const completionPercentage = completions / attempts;

  return clampScore(50 + (completionPercentage - 0.6) * 200);
}

function getPassingEfficiencyScore(performance) {
  const attempts = performance?.attempts || 0;

  if (attempts <= 0) return null;

  const passingYards = performance?.passingYards || 0;
  const passingTDs = performance?.passingTDs || 0;
  const interceptions = performance?.interceptions || 0;

  const yardsPerAttempt = passingYards / attempts;
  const touchdownRate = passingTDs / attempts;
  const interceptionRate = interceptions / attempts;

  return clampScore(
    50 +
      (yardsPerAttempt - 6.5) * 6 +
      (touchdownRate - 0.035) * 220 -
      (interceptionRate - 0.025) * 220
  );
}

function getEPAValueScore(performance) {
  const attempts = performance?.attempts || 0;
  const passingEPA = performance?.passingEPA || 0;

  if (attempts <= 0) return null;

  const epaPerAttempt = passingEPA / attempts;

  return clampScore(60 + epaPerAttempt * 100);
}

function getTurnoverScore(performance) {
  const attempts = performance?.attempts || 0;

  if (attempts <= 0) return null;

  const interceptions = performance?.interceptions || 0;
  const fumblesLost = performance?.fumblesLost || 0;

  const turnoverRate =
    (interceptions + fumblesLost) / attempts;

  return clampScore(82 - turnoverRate * 700);
}

function getSackImpactScore(performance) {
  const attempts = performance?.attempts || 0;
  const sacksTaken = performance?.sacksTaken || 0;

  const dropbacks = attempts + sacksTaken;

  if (dropbacks <= 0) return null;

  const sackRate = sacksTaken / dropbacks;

  return clampScore(82 - sackRate * 400);
}

function getRushingValueScore(performance) {
  const carries = performance?.carries || 0;

  if (carries <= 0) return 50;

  const rushingYards = performance?.rushingYards || 0;
  const rushingTDs = performance?.rushingTDs || 0;
  const rushingFirstDowns =
    performance?.rushingFirstDowns || 0;
  const rushingEPA = performance?.rushingEPA || 0;

  return clampScore(
    48 +
      rushingYards / 60 +
      rushingTDs * 2 +
      rushingFirstDowns / 4 +
      rushingEPA
  );
}

function getQuarterbackPerformanceScore(performance) {
  if (!performance) {
    return {
      available: false,
      score: null,
      components: {},
    };
  }

  const completionScore = getCompletionScore(performance);
  const passingEfficiencyScore =
    getPassingEfficiencyScore(performance);
  const epaValueScore = getEPAValueScore(performance);
  const turnoverScore = getTurnoverScore(performance);
  const sackImpactScore = getSackImpactScore(performance);
  const rushingValueScore = getRushingValueScore(performance);

  const components = [
    {
      key: "passingEfficiency",
      score: passingEfficiencyScore,
      weight: 0.3,
    },
    {
      key: "epaValue",
      score: epaValueScore,
      weight: 0.25,
    },
    {
      key: "completion",
      score: completionScore,
      weight: 0.15,
    },
    {
      key: "turnover",
      score: turnoverScore,
      weight: 0.15,
    },
    {
      key: "sackImpact",
      score: sackImpactScore,
      weight: 0.1,
    },
    {
      key: "rushingValue",
      score: rushingValueScore,
      weight: 0.05,
    },
  ];

  const availableComponents = components.filter(
    (component) => typeof component.score === "number"
  );

  if (!availableComponents.length) {
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
    (sum, component) =>
      sum + component.score * component.weight,
    0
  );

  return {
    available: true,
    score: clampScore(weightedScore / totalWeight),
    components: {
      completionScore,
      passingEfficiencyScore,
      epaValueScore,
      turnoverScore,
      sackImpactScore,
      rushingValueScore,
    },
  };
}

function getEvidenceLevel({
  hasPerformance,
  hasUsage,
  attempts,
}) {
  if (hasPerformance && attempts >= 300 && hasUsage) {
    return "strong";
  }

  if (hasPerformance && attempts >= 150) {
    return "moderate";
  }

  if (hasPerformance || hasUsage) {
    return "limited";
  }

  return "minimal";
}

function getUnprovenQuality({
  statusScore,
  experienceScore,
  usageScore,
  currentPerformanceScore,
  evidenceLevel,
}) {
  let quality;

  if (
    typeof currentPerformanceScore === "number" &&
    typeof usageScore === "number"
  ) {
    quality = Math.round(
      currentPerformanceScore * 0.72 +
        usageScore * 0.16 +
        statusScore * 0.07 +
        experienceScore * 0.05
    );
  } else if (typeof currentPerformanceScore === "number") {
    quality = Math.round(
      currentPerformanceScore * 0.85 +
        statusScore * 0.08 +
        experienceScore * 0.07
    );
  } else if (typeof usageScore === "number") {
    quality = Math.round(
      usageScore * 0.75 +
        statusScore * 0.15 +
        experienceScore * 0.1
    );
  } else {
    quality = Math.round(
      statusScore * 0.25 +
        experienceScore * 0.25 +
        42 * 0.5
    );
  }

  if (evidenceLevel === "minimal") {
    quality = Math.min(quality, 58);
  }

  if (evidenceLevel === "limited") {
    quality = Math.min(quality, 70);
  }

  return clampScore(quality);
}

function getEstablishedPlayerQuality({
  establishedCareerBaseline,
  currentPerformanceScore,
}) {
  if (typeof establishedCareerBaseline !== "number") {
    return null;
  }

  if (typeof currentPerformanceScore !== "number") {
    return establishedCareerBaseline;
  }

  /*
   * Established players should not lose their proven status
   * because of one weaker or injury-affected performance window.
   * Current performance can pull the estimate down, but gradually.
   */
  const blendedQuality =
    establishedCareerBaseline * 0.7 +
    currentPerformanceScore * 0.3;

  let baselineFloor = establishedCareerBaseline - 3;

  if (currentPerformanceScore < 70) {
    baselineFloor = establishedCareerBaseline - 5;
  }

  if (currentPerformanceScore < 60) {
    baselineFloor = establishedCareerBaseline - 8;
  }

  return clampScore(
    Math.max(blendedQuality, baselineFloor)
  );
}

function getTrajectory({
  currentPerformanceScore,
  establishedPlayerQuality,
  evidenceLevel,
}) {
  if (evidenceLevel === "minimal") {
    return "Unproven";
  }

  if (typeof currentPerformanceScore !== "number") {
    return "Insufficient Performance Data";
  }

  if (typeof establishedPlayerQuality !== "number") {
    if (currentPerformanceScore >= 82) return "Emerging";
    if (currentPerformanceScore >= 70) return "Stable";

    return "Developing";
  }

  const difference =
    currentPerformanceScore - establishedPlayerQuality;

  if (difference >= 6) return "Above Career Baseline";
  if (difference >= -4) return "Near Career Baseline";
  if (difference >= -10) return "Below Career Baseline";

  return "Significantly Below Career Baseline";
}

function getStarterOutlook({
  playerQuality,
  establishedPlayerQuality,
  recognitionSummary,
  evidenceLevel,
}) {
  const hasEstablishedFranchiseProfile =
    typeof establishedPlayerQuality === "number" &&
    establishedPlayerQuality >= 82 &&
    recognitionSummary?.provenEliteCeiling;

  if (hasEstablishedFranchiseProfile) {
    return "Franchise QB";
  }

  if (evidenceLevel === "minimal") {
    if (playerQuality >= 58) return "Backup / Spot Starter";
    return "Replacement-Level QB";
  }

  if (playerQuality >= 86) return "Franchise QB";
  if (playerQuality >= 80) return "High-End Starter";
  if (playerQuality >= 74) return "Quality Starter";
  if (playerQuality >= 66) return "Bridge Starter";
  if (playerQuality >= 58) return "Backup / Spot Starter";

  return "Replacement-Level QB";
}

function getRosterValue({
  playerQuality,
  currentPerformanceScore,
  trajectory,
}) {
  let rosterValue = playerQuality;

  if (
    trajectory === "Significantly Below Career Baseline" &&
    typeof currentPerformanceScore === "number"
  ) {
    rosterValue -= 2;
  }

  if (trajectory === "Above Career Baseline") {
    rosterValue += 1;
  }

  return clampScore(rosterValue);
}

export function evaluateQuarterback(player, context = {}) {
  const {
    statusScore = 50,
    experienceScore = 50,
    usageScore = null,
    recognitionSummary = null,
    performanceProfile = null,
  } = context;

  const performanceEvaluation =
    getQuarterbackPerformanceScore(performanceProfile);

  let currentPerformanceScore =
    performanceEvaluation.score;

  const attempts = getPassingAttemptCount(
    performanceProfile
  );

  const sampleSizeCap = getSampleSizeCap(attempts);

  if (
    typeof currentPerformanceScore === "number" &&
    attempts < 300
  ) {
    currentPerformanceScore = Math.min(
      currentPerformanceScore,
      sampleSizeCap
    );
  }

  const hasPerformance =
    typeof currentPerformanceScore === "number";

  const hasUsage =
    typeof usageScore === "number";

  const evidenceLevel = getEvidenceLevel({
    hasPerformance,
    hasUsage,
    attempts,
  });

  const establishedCareerBaseline =
    recognitionSummary?.establishedCareerBaseline ??
    null;

  const establishedPlayerQuality =
    getEstablishedPlayerQuality({
      establishedCareerBaseline,
      currentPerformanceScore,
    });

  const unprovenQuality = getUnprovenQuality({
    statusScore,
    experienceScore,
    usageScore,
    currentPerformanceScore,
    evidenceLevel,
  });

  const playerQuality =
    typeof establishedPlayerQuality === "number"
      ? establishedPlayerQuality
      : unprovenQuality;

  const trajectory = getTrajectory({
    currentPerformanceScore,
    establishedPlayerQuality,
    evidenceLevel,
  });

  const rosterValue = getRosterValue({
    playerQuality,
    currentPerformanceScore,
    trajectory,
  });

  const starterOutlook = getStarterOutlook({
    playerQuality,
    establishedPlayerQuality,
    recognitionSummary,
    evidenceLevel,
  });

  return {
    positionModel: "QuarterbackEvaluationModel",

    currentPerformanceScore,
    establishedPlayerQuality,
    playerQuality,
    rosterValue,
    trajectory,

    starterOutlook,
    longTermAnswer:
      playerQuality >= 80 &&
      evidenceLevel !== "minimal",

    performanceEvaluation: {
      available: performanceEvaluation.available,
      performanceScore: currentPerformanceScore,
      rawPerformanceScore: performanceEvaluation.score,
      evidenceLevel,
      components: performanceEvaluation.components,
      sampleSize: {
        gamesTracked:
          performanceProfile?.gamesTracked || 0,
        attempts,
        sampleSizeCap,
      },
    },

    recognitionEvaluation: {
      available: Boolean(recognitionSummary?.available),

      careerRecognitionScore:
        recognitionSummary?.careerRecognitionScore ?? null,

      recentRecognitionScore:
        recognitionSummary?.recentRecognitionScore ?? null,

      eliteSeasonCount:
        recognitionSummary?.eliteSeasonCount ?? 0,

      lastEliteSeason:
        recognitionSummary?.lastEliteSeason ?? null,

      provenEliteCeiling:
        recognitionSummary?.provenEliteCeiling || false,

      sustainedEliteRecognition:
        recognitionSummary?.sustainedEliteRecognition || false,

      establishedCareerBaseline,

      tier:
        recognitionSummary?.tier ||
        "No Major Recognition",
    },

    notes: [
      "Current performance, established quality, player quality, and roster value are evaluated separately.",
      "Current performance measures recent statistical play.",
      "Established player quality reflects a proven career baseline.",
      "Player quality estimates the quarterback's true present level.",
      "Roster value reflects current team value and trajectory.",
      "Small passing samples are capped to prevent backup quarterbacks from receiving inflated grades.",
    ],
  };
}

export default {
  evaluateQuarterback,
};