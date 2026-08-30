import { getTeamAIProfile } from "./TeamProfiles";
import { evaluatePlayer } from "./PlayerEvaluationEngine";
import { buildProspectIntelligence } from "./ProspectIntelligenceEngine";
import { getTeamFitMultiplier } from "./TeamFitEngine";
import { explainDraftDecision } from "./ExplainabilityEngine";

function getNumber(value, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

function getConsensusValue(player) {
  const rank = player?.rank || player?.rankings?.overall || 999;

  if (rank <= 3) return 96;
  if (rank <= 5) return 94;
  if (rank <= 10) return 91;
  if (rank <= 15) return 88;
  if (rank <= 25) return 84;
  if (rank <= 40) return 80;
  if (rank <= 75) return 74;

  return 68;
}

function getIntelligenceScore(prospectIntelligence) {
  const evaluation = prospectIntelligence?.intelligence?.evaluation?.data || {};
  const athletics = prospectIntelligence?.intelligence?.athletics?.data?.scores || {};
  const footballIQ = prospectIntelligence?.intelligence?.footballIQ?.data?.scores || {};
  const production = prospectIntelligence?.intelligence?.production?.data?.productionScores || {};
  const schemeFit = prospectIntelligence?.intelligence?.schemeFit?.data?.versatility || {};

  const evaluationScore = getNumber(evaluation.overallGrade || evaluation.grade, 80);
  const athleticScore = getNumber(athletics.overallAthleticScore, 80);
  const footballIQScore = getNumber(footballIQ.overallFootballIQ, 80);
  const productionScore = getNumber(production.overallProductionScore, 80);
  const schemeFitScore = getNumber(schemeFit.score, 80);

  return Math.round(
    evaluationScore * 0.35 +
      footballIQScore * 0.18 +
      productionScore * 0.17 +
      schemeFitScore * 0.17 +
      athleticScore * 0.13
  );
}

function getTeamFitScore({ fit, teamPriorityMultiplier }) {
  return (
    50 *
    fit.positionValue *
    fit.needMultiplier *
    fit.currentNeedMultiplier *
    fit.tierMultiplier *
    teamPriorityMultiplier *
    fit.positionPreferenceMultiplier *
    fit.duplicatePositionMultiplier *
    fit.archetypeMultiplier *
    fit.roundMultiplier
  );
}

function stableHash(value) {
  const text = String(value || "");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function deterministicVariance({ player, team, pick }) {
  const seed = [
    team?.id || team?.name || "team",
    pick?.id || pick?.draft_pick?.pick_number || "pick",
    player?.id || player?.name || "player",
  ].join("|");
  const normalized = stableHash(seed) / 0xffffffff;
  return 0.97 + normalized * 0.06;
}

export const scorePlayerForTeam = ({ player, team, pick, positionsDrafted, teamAIProfile: suppliedTeamAIProfile }) => {
  const teamAIProfile = suppliedTeamAIProfile || getTeamAIProfile(team);
  const prospectIntelligence = buildProspectIntelligence(player);

  const evaluatedPlayer = {
    ...evaluatePlayer(player),
    prospectIntelligence,
  };

  const fit = getTeamFitMultiplier({
    evaluatedPlayer,
    team,
    teamAIProfile,
    pick,
    positionsDrafted,
  });

  const positionPriority = teamAIProfile?.positionalPriorities?.[evaluatedPlayer.position] || 5;
  const teamPriorityMultiplier = 1 + (positionPriority - 5) * 0.08;
  const intelligenceScore = getIntelligenceScore(prospectIntelligence);
  const consensusValue = getConsensusValue(player);
  const teamFitScore = getTeamFitScore({ fit, teamPriorityMultiplier });

  const decisionScore =
    intelligenceScore * 0.52 +
    teamFitScore * 0.33 +
    consensusValue * 0.15;

  // Draft simulations need some organizational variation, but the same inputs must
  // remain reproducible. Use a stable, bounded variance instead of Math.random().
  const varianceFactor = deterministicVariance({ player, team, pick });
  const finalScore = decisionScore * varianceFactor;

  return {
    score: finalScore,
    decisionScore,
    intelligenceScore,
    teamFitScore,
    consensusValue,
    varianceFactor,
    fit,
    teamAIProfile,
    prospectIntelligence,
    explanation: explainDraftDecision({
      player,
      team,
      evaluation: evaluatedPlayer,
      fit,
      prospectIntelligence,
    }),
  };
};

export const buildTeamDraftBoard = ({ players, team, pick, positionsDrafted, teamAIProfile }) => {
  return [...players]
    .map((player) => {
      const result = scorePlayerForTeam({ player, team, pick, positionsDrafted, teamAIProfile });

      return {
        ...player,
        prospectIntelligence: result.prospectIntelligence,
        teamDraftScore: result.score,
        decisionScore: result.decisionScore,
        intelligenceScore: result.intelligenceScore,
        teamFitScore: result.teamFitScore,
        consensusValue: result.consensusValue,
        varianceFactor: result.varianceFactor,
        draftFit: result.fit,
        draftTeamProfile: result.teamAIProfile,
        draftExplanation: result.explanation,
      };
    })
    .sort((a, b) => b.teamDraftScore - a.teamDraftScore);
};
