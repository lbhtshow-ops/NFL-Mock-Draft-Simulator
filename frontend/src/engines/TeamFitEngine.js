// src/engines/TeamFitEngine.js

import { getPositionValue } from "./PositionValues";
import { getNeedMultiplier } from "./TeamNeeds";
import { getCurrentNeedMultiplier } from "./TeamContextEngine";
import { getTierMultiplier } from "./PlayerTiers";
import { getDerivedPositionNeed } from "./DerivedTeamNeedsEngine";

import {
  getArchetypeFitBonus,
  getPositionPreference,
} from "./FootballIdentityEngine";

function getTeamAbbreviation(team) {
  if (typeof team === "string") return team;

  return (
    team?.abbreviation ||
    team?.abbr ||
    team?.team ||
    team?.id ||
    team?.name ||
    "UNKNOWN"
  );
}

function getPickRound(pick) {
  return pick?.round || pick?.draft_pick?.round || 1;
}

function convertNeedScoreToMultiplier(needScore) {
  if (typeof needScore !== "number") {
    return null;
  }

  return 1 + (needScore - 5) * 0.08;
}

function getBestNeedMultiplier(position, teamAbbreviation) {
  const derivedNeedScore = getDerivedPositionNeed(
    position,
    teamAbbreviation
  );

  if (typeof derivedNeedScore === "number") {
    return {
      needMultiplier: convertNeedScoreToMultiplier(derivedNeedScore),
      derivedNeedScore,
      needSource: "derivedRoster",
    };
  }

  return {
    needMultiplier: getNeedMultiplier(position, teamAbbreviation),
    derivedNeedScore: null,
    needSource: "staticFallback",
  };
}

export function getTeamFitMultiplier({
  evaluatedPlayer,
  team,
  teamAIProfile,
  pick,
  positionsDrafted,
}) {
  const teamAbbreviation = getTeamAbbreviation(team);
  const position = evaluatedPlayer?.position || "UNKNOWN";

  const positionValue = getPositionValue(position);

  const {
    needMultiplier,
    derivedNeedScore,
    needSource,
  } = getBestNeedMultiplier(position, teamAbbreviation);

  const currentNeedMultiplier = getCurrentNeedMultiplier(
    position,
    teamAbbreviation
  );

  const tierMultiplier = getTierMultiplier(evaluatedPlayer);

  const positionPreference = getPositionPreference(
    teamAbbreviation,
    position
  );

  const positionPreferenceMultiplier =
    1 + (positionPreference - 5) * 0.04;

  const archetypeMultiplier = getArchetypeFitBonus(
    teamAbbreviation,
    evaluatedPlayer
  );

  let duplicatePositionMultiplier = 1;

  if (positionsDrafted?.has(position.toLowerCase())) {
    const isPremiumPosition = [
      "QB",
      "WR",
      "OT",
      "DE",
      "DT",
      "EDGE",
      "CB",
    ].includes(position);

    duplicatePositionMultiplier =
      isPremiumPosition && teamAIProfile?.bpaPreference >= 8
        ? 0.65
        : 0.35;
  }

  const roundMultiplier = getPickRound(pick) >= 4 ? 0.96 : 1;

  return {
    positionValue,

    needMultiplier,
    derivedNeedScore,
    needSource,

    currentNeedMultiplier,
    tierMultiplier,
    positionPreferenceMultiplier,
    archetypeMultiplier,
    duplicatePositionMultiplier,
    roundMultiplier,
  };
}