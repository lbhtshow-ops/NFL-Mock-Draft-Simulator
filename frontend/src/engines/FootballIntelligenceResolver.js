// src/engines/FootballIntelligenceResolver.js

import {
  getTeamProfile,
  getCoachProfile,
  getExecutiveProfile,
  getExecutiveRelationships,
} from "../data/footballIntelligence/footballIntelligenceRegistry";

export function resolveFootballIntelligence(teamAbbr) {
  const team = getTeamProfile(teamAbbr);

  if (!team) {
    return null;
  }

  const generalManager = getExecutiveProfile(
    team.currentLeadership.generalManagerId
  );

  const headCoach = getCoachProfile(team.currentLeadership.headCoachId);

  const executiveRelationships = generalManager
    ? getExecutiveRelationships(generalManager.id)
    : [];

  return {
    team,
    generalManager,
    headCoach,
    executiveRelationships,
  };
}