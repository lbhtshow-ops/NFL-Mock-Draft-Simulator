// src/data/footballIntelligence/footballIntelligenceRegistry.js

import { ravensTeamProfile } from "./teams/ravens";

import { jesseMinter } from "./coaches/jesseMinter";

import { ericDeCosta } from "./executives/ericDeCosta";
import { ozzieNewsome } from "./executives/ozzieNewsome";

import { executiveRelationships } from "./relationships/executiveRelationships";

export const footballIntelligenceRegistry = {
  teams: {
    BAL: ravensTeamProfile,
  },

  coaches: {
    jesseMinter,
  },

  executives: {
    ericDeCosta,
    ozzieNewsome,
  },

  relationships: {
    executives: executiveRelationships,
  },
};

export function getTeamProfile(teamAbbr) {
  return footballIntelligenceRegistry.teams[teamAbbr] || null;
}

export function getCoachProfile(coachId) {
  return footballIntelligenceRegistry.coaches[coachId] || null;
}

export function getExecutiveProfile(executiveId) {
  return footballIntelligenceRegistry.executives[executiveId] || null;
}

export function getExecutiveRelationships(executiveId) {
  return footballIntelligenceRegistry.relationships.executives.filter(
    (relationship) =>
      relationship.fromEntityId === executiveId ||
      relationship.toEntityId === executiveId
  );
}