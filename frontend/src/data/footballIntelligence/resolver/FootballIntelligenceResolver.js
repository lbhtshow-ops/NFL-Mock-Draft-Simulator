// src/data/footballIntelligence/resolver/FootballIntelligenceResolver.js

import { resolveProspect } from "../registry";
import {
  getFootballPlayer,
  getFootballPlayerIdentity,
  getFootballPlayerCareerContext,
  getFootballPlayerIntelligence,
  getFootballPlayerAnalytics,
  getFootballPlayerScouting,
  getFootballPlayerMetadata,
} from "../database/FootballIntelligenceDatabaseManager";
import { getResearchRecord } from "../metadata/researchRecords";
import { getPlayerIntelligenceProfile } from "../intelligence/playerIntelligenceProfiles";

export function resolveFootballPlayer(player) {
  const prospect = resolveProspect(player);

  if (!prospect) {
    return null;
  }

  const prospectId =
    prospect.canonicalId ||
    prospect.playerId ||
    prospect.prospectId ||
    prospect.id;

  const footballPlayerRecord = getFootballPlayer(prospectId);

  const researchRecord = getResearchRecord(prospectId);
  const intelligenceProfile = getPlayerIntelligenceProfile(prospectId);

  return {
    id: prospectId,

    record: footballPlayerRecord,

    identity: {
      ...prospect,
      ...getFootballPlayerIdentity(prospectId),
    },

    careerContext: getFootballPlayerCareerContext(prospectId),

    rankings: footballPlayerRecord.rankings,

    intelligence: getFootballPlayerIntelligence(prospectId),

    analytics: getFootballPlayerAnalytics(prospectId),

    scouting: getFootballPlayerScouting(prospectId),

    metadata: getFootballPlayerMetadata(prospectId),

    research: researchRecord,

    legacyIntelligence: intelligenceProfile,
  };
}

export default {
  resolveFootballPlayer,
};