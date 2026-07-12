// src/engines/FootballIdentityEngine.js

import {
  footballIdentityProfiles,
  defaultFootballIdentityProfile,
} from "../data/footballIdentityDatabase";

import { resolveFootballIntelligence } from "./FootballIntelligenceResolver";

export function getFootballIdentity(teamAbbr) {
  if (!teamAbbr) return defaultFootballIdentityProfile;

  const resolvedIntelligence = resolveFootballIntelligence(teamAbbr);

  if (resolvedIntelligence) {
  return {
    ...defaultFootballIdentityProfile,

    meta: {
      ...defaultFootballIdentityProfile.meta,
      teamAbbr,
      teamName: resolvedIntelligence.team.teamName,
      dataConfidence: 4,
      notes:
        "Generated from Football Intelligence Resolver using team, GM, coach, and relationship data.",
    },

    organization: {
      ...defaultFootballIdentityProfile.organization,
      generalManager: resolvedIntelligence.generalManager?.name || "",
    },

    coaching: {
      ...defaultFootballIdentityProfile.coaching,
      headCoach: resolvedIntelligence.headCoach?.name || "",
    },

    positionPreferences: {
      ...defaultFootballIdentityProfile.positionPreferences,

      EDGE: 8,
      DL: 8,
      CB: 8,
      S: 7,
      LB: 7,
      OT: 7,
      IOL: 6,
      WR: 6,
      QB: 5,
      TE: 5,
      RB: 4,
    },
  };
}

  return footballIdentityProfiles[teamAbbr] || defaultFootballIdentityProfile;
}

export function getPositionPreference(teamAbbr, position) {
  const identity = getFootballIdentity(teamAbbr);

  return identity.positionPreferences?.[position] || 5;
}

export function getArchetypeFitBonus(teamAbbr, player) {
  const identity = getFootballIdentity(teamAbbr);

  if (!player?.archetype) return 1;

  const archetypePreference =
    identity.archetypePreferences?.[player.position]?.[player.archetype] || 5;

  if (archetypePreference >= 8) {
    return 1.04;
  }

  if (archetypePreference <= 3) {
    return 0.98;
  }

  return 1;
}