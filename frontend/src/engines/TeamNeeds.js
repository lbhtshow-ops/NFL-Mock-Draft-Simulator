import { getTeamContext } from "../data/footballIntelligence/teamContext/teamContextIndex";

export const defaultTeamNeeds = {
  tier1: [],
  tier2: [],
  tier3: [],
  avoidEarly: ["RB", "LB", "S"],
};

export const teamNeeds = {
  Ravens: {
    tier1: ["DE", "CB"],
    tier2: ["OT", "WR", "IOL"],
    tier3: ["TE", "S", "DT"],
    avoidEarly: ["RB", "LB"],
  },

  Rams: {
    tier1: ["QB", "OT", "CB"],
    tier2: ["WR", "DE", "TE"],
    tier3: ["IOL", "DT", "S"],
    avoidEarly: ["RB", "LB"],
  },

  Steelers: {
    tier1: ["OT", "IOL", "CB"],
    tier2: ["WR", "DE", "DT"],
    tier3: ["S", "LB", "TE"],
    avoidEarly: ["RB"],
  },
};

const teamNameToId = {
  Ravens: "BAL",
};

const normalizePosition = (position) => {
  if (position === "DE") return "EDGE";
  if (position === "DT") return "DL";
  return position;
};

export const getTeamNeeds = (team) => {
  return teamNeeds[team?.name] || defaultTeamNeeds;
};

export const getNeedMultiplier = (position, team) => {
  const teamId = teamNameToId[team?.name];
  const normalizedPosition = normalizePosition(position);

  if (teamId) {
    const context = getTeamContext(teamId);

    const urgentNeed = context.urgentNeeds?.find(
      (need) => need.position === normalizedPosition
    );

    if (urgentNeed) {
      if (urgentNeed.priority >= 9) return 1.35;
      if (urgentNeed.priority >= 7) return 1.25;
      return 1.15;
    }

    const futureNeed = context.futureNeeds?.find(
      (need) => need.position === normalizedPosition
    );

    if (futureNeed) {
      if (futureNeed.priority >= 7) return 1.18;
      if (futureNeed.priority >= 5) return 1.08;
      return 1.03;
    }
  }

  const needs = getTeamNeeds(team);

  if (needs.tier1.includes(position)) return 1.35;
  if (needs.tier2.includes(position)) return 1.18;
  if (needs.tier3.includes(position)) return 1.08;
  if (needs.avoidEarly.includes(position)) return 0.82;

  return 1;
};