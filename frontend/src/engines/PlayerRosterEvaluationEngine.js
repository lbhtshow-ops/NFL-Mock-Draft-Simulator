import { getPlayerUsageProfile } from "./PlayerUsageIndex";
import { getPlayerPerformanceProfile } from "./PlayerPerformanceIndex";
import { getPlayerRecognitionSummary } from "./playerEvaluation/PlayerRecognitionEngine";
import { evaluateQuarterback } from "./playerEvaluation/positionModels/QuarterbackEvaluationModel";
import { evaluateRunningBack } from "./playerEvaluation/positionModels/RunningBackEvaluationModel";
import { evaluateReceiver } from "./playerEvaluation/positionModels/ReceiverEvaluationModel";
import { evaluateOffensiveLine } from "./playerEvaluation/positionModels/OffensiveLineEvaluationModel";
import { evaluateDefensiveLine } from "./playerEvaluation/positionModels/DefensiveLineEvaluationModel";
import { evaluateLinebacker } from "./playerEvaluation/positionModels/LinebackerEvaluationModel";
import { evaluateSecondary } from "./playerEvaluation/positionModels/SecondaryEvaluationModel";
import { evaluateSpecialist } from "./playerEvaluation/positionModels/SpecialistEvaluationModel";

const positionValueTiers = {
  QB: 8,
  OT: 7,
  EDGE: 7,
  CB: 7,
  WR: 6,
  DL: 6,
  IOL: 5,
  TE: 5,
  LB: 5,
  S: 5,
  RB: 4,
  FB: 3,
  K: 2,
  P: 2,
  LS: 1,
};

function getPlayerPosition(player = {}) {
  return player?.identity?.position || player?.position || "UNKNOWN";
}

function getPlayerExperience(player = {}) {
  return (
    player?.identity?.experience ??
    player?.experience ??
    player?.years_exp ??
    player?.yearsExp ??
    player?.roster?.experience ??
    player?.roster?.years_exp ??
    player?.roster?.yearsExp ??
    null
  );
}

function getPlayerStatus(player = {}) {
  return player?.roster?.status || player?.status || "";
}

function getStatusScore(player) {
  const status = getPlayerStatus(player);

  if (status === "ACT" || status === "Active") return 72;
  if (status.includes("RES")) return 55;
  if (status.includes("PRACTICE")) return 48;

  return 50;
}

function getExperienceScore(player) {
  const experience = getPlayerExperience(player);

  if (typeof experience !== "number") return 50;
  if (experience <= 1) return 58;
  if (experience <= 3) return 64;
  if (experience <= 8) return 70;
  if (experience <= 12) return 64;

  return 56;
}

function getPositionValue(player) {
  const position = getPlayerPosition(player);
  return positionValueTiers[position] || 4;
}

function getUsageScore(player) {
  const usageProfile = getPlayerUsageProfile(player);

  if (!usageProfile) return null;

  const totalSnaps = usageProfile.totalSnaps || 0;
  const gamesTracked = usageProfile.gamesTracked || 0;
  const maxWeeklySnapShare = usageProfile.maxWeeklySnapShare || 0;

  if (totalSnaps >= 900) return 92;
  if (totalSnaps >= 700) return 86;
  if (totalSnaps >= 500) return 80;
  if (totalSnaps >= 300) return 72;
  if (totalSnaps >= 150) return 64;

  if (gamesTracked >= 8 && maxWeeklySnapShare >= 0.5) return 60;
  if (totalSnaps > 0) return 55;

  return 48;
}

function getProductionScore(player) {
  const performance = getPlayerPerformanceProfile(player);

  if (!performance) return null;

  const position = getPlayerPosition(player);

  if (position === "QB") {
    return Math.min(
      95,
      Math.round(
        55 +
          performance.passingYards / 120 +
          performance.passingTDs * 1.8 -
          performance.interceptions * 1.2
      )
    );
  }

  if (["RB", "FB"].includes(position)) {
    return Math.min(
      92,
      Math.round(
        52 +
          performance.rushingYards / 80 +
          performance.rushingTDs * 2 +
          performance.receptions / 8
      )
    );
  }

  if (["WR", "TE"].includes(position)) {
    return Math.min(
      92,
      Math.round(
        52 +
          performance.receivingYards / 90 +
          performance.receivingTDs * 2 +
          performance.receptions / 10
      )
    );
  }

  if (["EDGE", "DL", "LB", "CB", "S"].includes(position)) {
    return Math.min(
      90,
      Math.round(
        52 +
          performance.sacks * 3 +
          performance.tackles / 15 +
          performance.defensiveInterceptions * 3
      )
    );
  }

  return null;
}

function getRecognitionScore(player) {
  const recognition = getPlayerRecognitionSummary(player);

  if (!recognition?.available) return null;

  return recognition.score ?? null;
}

function getGenericPlayerQuality(player) {
  const statusScore = getStatusScore(player);
  const experienceScore = getExperienceScore(player);
  const usageScore = getUsageScore(player);
  const productionScore = getProductionScore(player);
  const recognitionScore = getRecognitionScore(player);

  if (
    typeof usageScore === "number" &&
    typeof productionScore === "number" &&
    typeof recognitionScore === "number"
  ) {
    return Math.round(
      statusScore * 0.12 +
        experienceScore * 0.08 +
        usageScore * 0.4 +
        productionScore * 0.28 +
        recognitionScore * 0.12
    );
  }

  if (
    typeof usageScore === "number" &&
    typeof productionScore === "number"
  ) {
    return Math.round(
      statusScore * 0.15 +
        experienceScore * 0.1 +
        usageScore * 0.45 +
        productionScore * 0.3
    );
  }

  if (typeof usageScore === "number") {
    return Math.round(
      statusScore * 0.25 +
        experienceScore * 0.15 +
        usageScore * 0.6
    );
  }

  return Math.round(statusScore * 0.65 + experienceScore * 0.35);
}

function getPositionEvaluation(player) {
  const position = getPlayerPosition(player);
  const recognitionSummary = getPlayerRecognitionSummary(player);

  const context = {
    statusScore: getStatusScore(player),
    experienceScore: getExperienceScore(player),
    usageScore: getUsageScore(player),
    productionScore: getProductionScore(player),
    recognitionScore: recognitionSummary?.score ?? null,
    recognitionSummary,
    performanceProfile: getPlayerPerformanceProfile(player),
  };

  if (position === "QB") {
    return evaluateQuarterback(player, context);
  }

  if (position === "RB" || position === "FB") {
    return evaluateRunningBack(player, context);
  }

  if (position === "WR" || position === "TE") {
    return evaluateReceiver(player, context);
  }

  if (position === "OT" || position === "IOL") {
    return evaluateOffensiveLine(player, context);
  }

  if (position === "DL" || position === "EDGE") {
    return evaluateDefensiveLine(player, context);
  }

  if (position === "LB") {
    return evaluateLinebacker(player, context);
  }

  if (position === "CB" || position === "S") {
    return evaluateSecondary(player, context);
  }

  if (position === "K" || position === "P" || position === "LS") {
    return evaluateSpecialist(player, context);
  }

  const playerQuality = getGenericPlayerQuality(player);

  return {
    positionModel: "GenericPlayerEvaluationModel",
    playerQuality,
    rosterValue: playerQuality,
    starterOutlook: null,
    longTermAnswer: null,
    notes: [
      "Generic player evaluation model used until this position receives a dedicated model.",
    ],
  };
}

function getPlayerTier(playerQuality) {
  if (playerQuality >= 88) return "elite";
  if (playerQuality >= 80) return "highEndStarter";
  if (playerQuality >= 72) return "starter";
  if (playerQuality >= 65) return "replacementStarter";
  if (playerQuality >= 58) return "rotational";

  return "developmental";
}

function getReplacementDifficulty(player) {
  const positionValue = getPositionValue(player);

  if (positionValue >= 7) return "High";
  if (positionValue >= 5) return "Moderate";
  if (positionValue >= 3) return "Low";

  return "Specialist";
}

function getDevelopmentTrajectory(player) {
  const experience = getPlayerExperience(player);

  if (typeof experience !== "number") return "Unknown";
  if (experience <= 2) return "Developing";
  if (experience <= 8) return "Prime";
  if (experience <= 12) return "Veteran";

  return "Declining";
}

export function evaluateNFLRosterPlayer(player) {
  const usageProfile = getPlayerUsageProfile(player);
  const performanceProfile = getPlayerPerformanceProfile(player);
  const recognitionSummary = getPlayerRecognitionSummary(player);
  const positionEvaluation = getPositionEvaluation(player);

  const usageScore = getUsageScore(player);
  const productionScore = getProductionScore(player);
  const recognitionScore = getRecognitionScore(player);
  const playerQuality = positionEvaluation.playerQuality;
  const rosterValue = positionEvaluation.rosterValue;

  return {
    playerTier: getPlayerTier(playerQuality),
    playerQuality,
    rosterValue,
    positionValue: getPositionValue(player),
    replacementDifficulty: getReplacementDifficulty(player),
    developmentTrajectory: getDevelopmentTrajectory(player),

    positionEvaluation: {
      model: positionEvaluation.positionModel,
      starterOutlook: positionEvaluation.starterOutlook,
      longTermAnswer: positionEvaluation.longTermAnswer,
      performanceEvaluation: positionEvaluation.performanceEvaluation || null,
      recognitionEvaluation: positionEvaluation.recognitionEvaluation || null,
      prospectCarryover: positionEvaluation.prospectCarryover || null,
      notes: positionEvaluation.notes || [],
    },

    usage: {
      available: Boolean(usageProfile),
      usageScore,
      gamesTracked: usageProfile?.gamesTracked || 0,
      offenseSnaps: usageProfile?.offenseSnaps || 0,
      defenseSnaps: usageProfile?.defenseSnaps || 0,
      specialTeamsSnaps: usageProfile?.specialTeamsSnaps || 0,
      totalSnaps: usageProfile?.totalSnaps || 0,
      maxWeeklySnapShare: usageProfile?.maxWeeklySnapShare || 0,
      matchedBy: usageProfile?.matchedBy || null,
    },

    production: {
      available: Boolean(performanceProfile),
      productionScore,
      gamesTracked: performanceProfile?.gamesTracked || 0,
      matchedBy: performanceProfile?.matchedBy || null,
    },

    recognition: {
      available: Boolean(recognitionSummary?.available),
      recognitionScore,
      rawScore: recognitionSummary?.rawScore ?? 0,

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

      establishedCareerBaseline:
        recognitionSummary?.establishedCareerBaseline ?? null,

      tier: recognitionSummary?.tier || "No Major Recognition",
      awards: recognitionSummary?.awards || [],
      confidence: recognitionSummary?.confidence || 0,

      summary:
        recognitionSummary?.summary ||
        "No major recognition profile available.",
    },
  };
}

export default {
  evaluateNFLRosterPlayer,
};