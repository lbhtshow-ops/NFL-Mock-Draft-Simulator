function clampScore(value, minimum = 35, maximum = 95) {
  return Math.max(minimum, Math.min(maximum, Math.round(value)));
}

function getUsageFoundationScore(usageScore) {
  if (typeof usageScore !== "number") return null;
  return usageScore;
}

function getExperienceStabilityScore(player) {
  const experience =
    player?.identity?.experience ??
    player?.experience ??
    null;

  if (typeof experience !== "number") return 50;
  if (experience <= 1) return 58;
  if (experience <= 3) return 66;
  if (experience <= 8) return 74;
  if (experience <= 12) return 68;

  return 58;
}

function getOffensiveLineOutlook(playerQuality, position) {
  if (playerQuality >= 86) return `Elite ${position}`;
  if (playerQuality >= 80) return `High-End Starting ${position}`;
  if (playerQuality >= 74) return `Quality Starting ${position}`;
  if (playerQuality >= 66) return `Functional Starter / Swing ${position}`;
  if (playerQuality >= 58) return `Depth Offensive Lineman`;

  return `Replacement-Level ${position}`;
}

export function evaluateOffensiveLine(player, context = {}) {
  const {
    statusScore = 50,
    usageScore = null,
    recognitionScore = null,
  } = context;

  const position =
    player?.identity?.position ||
    player?.position ||
    "OL";

  const usageFoundationScore =
    getUsageFoundationScore(usageScore);

  const experienceStabilityScore =
    getExperienceStabilityScore(player);

  let offensiveLineQuality;

  if (
    typeof usageFoundationScore === "number" &&
    typeof recognitionScore === "number"
  ) {
    offensiveLineQuality = Math.round(
      statusScore * 0.12 +
        experienceStabilityScore * 0.18 +
        usageFoundationScore * 0.45 +
        recognitionScore * 0.25
    );
  } else if (typeof usageFoundationScore === "number") {
    offensiveLineQuality = Math.round(
      statusScore * 0.15 +
        experienceStabilityScore * 0.25 +
        usageFoundationScore * 0.6
    );
  } else {
    offensiveLineQuality = Math.round(
      statusScore * 0.55 + experienceStabilityScore * 0.45
    );
  }

  offensiveLineQuality = clampScore(offensiveLineQuality);

  return {
    positionModel: "OffensiveLineEvaluationModel",
    playerQuality: offensiveLineQuality,
    rosterValue: offensiveLineQuality,
    starterOutlook: getOffensiveLineOutlook(
      offensiveLineQuality,
      position
    ),
    longTermAnswer: offensiveLineQuality >= 80,

    performanceEvaluation: {
      available: false,
      performanceScore: null,
      components: {
        usageFoundationScore,
        experienceStabilityScore,
        recognitionScore,
      },
    },

    notes: [
      "Offensive linemen are evaluated separately from skill-position production.",
      "Current V1 uses usage foundation, experience stability, status, and recognition.",
      "Future versions should include pressures allowed, sacks allowed, penalties, pass-blocking efficiency, run-blocking grade, and assignment reliability.",
      "Snap volume is treated as a foundation signal, not proof of high-end offensive line quality.",
    ],
  };
}

export default {
  evaluateOffensiveLine,
};