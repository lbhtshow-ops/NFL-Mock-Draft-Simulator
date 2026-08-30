// src/engines/TeamContextEngine.js

import { getTeamContext } from "../data/footballIntelligence/teamContext/teamContextIndex";

const teamNameToId = {
  Ravens: "BAL",
};

const normalizePosition = (position) => {
  if (position === "DE") return "EDGE";
  if (position === "DT") return "DL";
  return position;
};

export function getCurrentTeamNeed(position, team) {
  if (!position || !team) return 5;

  const teamId = teamNameToId[team?.name] || team?.abbreviation;
  const normalizedPosition = normalizePosition(position);

  if (teamId) {
    const context = getTeamContext(teamId);

    const urgentNeed = context.urgentNeeds?.find(
      (need) => need.position === normalizedPosition
    );

    if (urgentNeed) {
      return Math.max(1, urgentNeed.priority);
    }

    const futureNeed = context.futureNeeds?.find(
      (need) => need.position === normalizedPosition
    );

    if (futureNeed) {
      return Math.max(1, futureNeed.priority * 0.75);
    }
  }

  const rawNeed = team[position.toLowerCase()];

  if (typeof rawNeed === "number") {
    return rawNeed;
  }

  return 5;
}

export function getCurrentNeedMultiplier(position, team) {
  const need = getCurrentTeamNeed(position, team);

  if (need >= 9) return 1.18;
  if (need >= 8) return 1.14;
  if (need >= 7) return 1.1;
  if (need >= 6) return 1.05;
  if (need <= 2) return 0.9;
  if (need <= 3) return 0.95;

  return 1;
}

export function getTeamContextSummary(teamId) {
  return getTeamContext(teamId);
}