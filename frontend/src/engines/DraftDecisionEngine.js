import { buildFootballIntelligenceProfile } from "../data/footballIntelligence/services/FootballIntelligenceService";
import { defaultDecisionProfile } from "../data/footballIntelligence/decisionProfiles/defaultDecisionProfile";

function getScore(value, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

function getWeightedScore(score, weight) {
  return (getScore(score) * getScore(weight)) / 100;
}

function getPlayerGrade(playerProfile) {
  const evaluation = playerProfile?.intelligence?.evaluation?.data || {};
  return getScore(evaluation.grade || evaluation.overallGrade);
}

function getTraitScore(playerProfile) {
  const traits = playerProfile?.intelligence?.traits?.data?.traits || {};
  const values = Object.values(traits).filter((value) => typeof value === "number");

  if (values.length === 0) return 0;

  return Math.round(
    values.reduce((total, value) => total + value, 0) / values.length
  );
}

function getAthleticScore(playerProfile) {
  return getScore(
    playerProfile?.intelligence?.athletics?.data?.scores?.overallAthleticScore
  );
}

function getFootballIQScore(playerProfile) {
  return getScore(
    playerProfile?.intelligence?.footballIQ?.data?.scores?.overallFootballIQ
  );
}

function getProductionScore(playerProfile) {
  return getScore(
    playerProfile?.intelligence?.production?.data?.productionScores
      ?.overallProductionScore
  );
}

function getSchemeFitScore(playerProfile) {
  return getScore(
    playerProfile?.intelligence?.schemeFit?.data?.scores?.overallSchemeFit
  );
}

function getConsensusValue(playerProfile) {
  const consensusRank = playerProfile?.profile?.rankings?.consensus;

  if (!consensusRank) return 50;

  if (consensusRank <= 5) return 95;
  if (consensusRank <= 10) return 90;
  if (consensusRank <= 20) return 85;
  if (consensusRank <= 32) return 80;
  if (consensusRank <= 64) return 70;
  if (consensusRank <= 100) return 60;

  return 50;
}

function calculateRiskPenalty(playerProfile, decisionProfile, round = 1) {
  const penalties = decisionProfile?.riskPenalties || {};
  const roundKey = `round${round}`;

  const footballIQScore = getFootballIQScore(playerProfile);
  const medicalRisk = playerProfile?.record?.medical?.durability;
  const character = playerProfile?.record?.character || {};

  let penalty = 0;

  if (footballIQScore > 0 && footballIQScore < 70) {
    penalty += penalties.lowFootballIQ?.[roundKey] || 0;
  }

  if (
    getScore(character.leadership) > 0 &&
    getScore(character.leadership) < 70
  ) {
    penalty += penalties.lowCharacter?.[roundKey] || 0;
  }

  if (medicalRisk === "high") {
    penalty += penalties.highMedicalRisk?.[roundKey] || 0;
  }

  return penalty;
}

export function evaluateDraftDecision({
  player,
  decisionProfile = defaultDecisionProfile,
  round = 1,
} = {}) {
  const playerProfile = buildFootballIntelligenceProfile(player);

  if (!playerProfile?.available) {
    return {
      available: false,
      decisionScore: 0,
      recommendation: "Unavailable",
      reasons: ["No football intelligence profile available."],
      components: {},
    };
  }

  const weights = decisionProfile.evaluationWeights || {};

  const components = {
    playerGrade: getPlayerGrade(playerProfile),
    traits: getTraitScore(playerProfile),
    athleticism: getAthleticScore(playerProfile),
    footballIQ: getFootballIQScore(playerProfile),
    production: getProductionScore(playerProfile),
    schemeFit: getSchemeFitScore(playerProfile),
    consensusValue: getConsensusValue(playerProfile),
  };

  const weightedScore =
    getWeightedScore(components.playerGrade, weights.playerGrade) +
    getWeightedScore(components.schemeFit, weights.schemeFit) +
    getWeightedScore(components.footballIQ, weights.footballIQ) +
    getWeightedScore(components.production, weights.production) +
    getWeightedScore(components.athleticism, weights.athleticism) +
    getWeightedScore(components.consensusValue, weights.consensusValue);

  const riskPenalty = calculateRiskPenalty(playerProfile, decisionProfile, round);

  const decisionScore = Math.max(
    0,
    Math.round((weightedScore - riskPenalty) * 10) / 10
  );

  const recommendation =
    decisionScore >= 90
      ? "Strong Draft Recommendation"
      : decisionScore >= 80
      ? "Draft"
      : decisionScore >= 70
      ? "Consider"
      : "Pass";

  const reasons = [
    `Player grade: ${components.playerGrade}`,
    `Scheme fit: ${components.schemeFit}`,
    `Football IQ: ${components.footballIQ}`,
    `Production: ${components.production}`,
    `Athleticism: ${components.athleticism}`,
    `Consensus value: ${components.consensusValue}`,
    riskPenalty > 0 ? `Risk penalty: -${riskPenalty}` : "No major risk penalty",
  ];

  return {
    available: true,
    playerId: playerProfile.playerId,
    decisionScore,
    recommendation,
    components,
    riskPenalty,
    reasons,
  };
}

export default {
  evaluateDraftDecision,
};