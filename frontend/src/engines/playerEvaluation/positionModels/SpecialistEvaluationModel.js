function clampScore(value, minimum = 35, maximum = 95) {
  return Math.max(minimum, Math.min(maximum, Math.round(value)));
}

function getSpecialistOutlook(playerQuality, position) {
  if (playerQuality >= 86) return `Elite ${position}`;
  if (playerQuality >= 80) return `High-End ${position}`;
  if (playerQuality >= 74) return `Quality Starting ${position}`;
  if (playerQuality >= 66) return `Functional ${position}`;
  if (playerQuality >= 58) return `Replacement-Level ${position}`;

  return `Unproven ${position}`;
}

export function evaluateSpecialist(player, context = {}) {
  const {
    statusScore = 50,
    experienceScore = 50,
    usageScore = null,
    recognitionScore = null,
  } = context;

  const position =
    player?.identity?.position ||
    player?.position ||
    "Specialist";

  let specialistQuality;

  if (
    typeof usageScore === "number" &&
    typeof recognitionScore === "number"
  ) {
    specialistQuality = Math.round(
      statusScore * 0.15 +
        experienceScore * 0.15 +
        usageScore * 0.45 +
        recognitionScore * 0.25
    );
  } else if (typeof usageScore === "number") {
    specialistQuality = Math.round(
      statusScore * 0.2 +
        experienceScore * 0.2 +
        usageScore * 0.6
    );
  } else {
    specialistQuality = Math.round(
      statusScore * 0.6 + experienceScore * 0.4
    );
  }

  specialistQuality = clampScore(specialistQuality);

  return {
    positionModel: "SpecialistEvaluationModel",
    playerQuality: specialistQuality,
    rosterValue: specialistQuality,
    starterOutlook: getSpecialistOutlook(specialistQuality, position),
    longTermAnswer: specialistQuality >= 80,

    performanceEvaluation: {
      available: false,
      performanceScore: null,
      components: {
        statusScore,
        experienceScore,
        usageScore,
        recognitionScore,
      },
    },

    notes: [
      "Specialists are evaluated separately from offensive and defensive position players.",
      "K, P, and LS are currently excluded from Team Needs display.",
      "Future versions should include field goal accuracy, extra point accuracy, kickoff value, punt efficiency, hang time, placement, long snap accuracy, and specialist-specific availability.",
    ],
  };
}

export default {
  evaluateSpecialist,
};