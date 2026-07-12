import { buildFootballIntelligenceProfile } from "../data/footballIntelligence/services/FootballIntelligenceService";

function buildEmptyIntelligence(playerId = null) {
  return {
    available: false,
    playerId,

    profile: {
      bio: null,
      rankings: null,
      metadata: null,
    },

    intelligence: {
      traits: null,
      evaluation: null,
      athletics: null,
      footballIQ: null,
      schemeFit: null,
      production: null,
      consensus: null,
      recommendations: null,
    },

    analytics: null,
    scouting: null,
    research: null,
    metadata: null,
    record: null,

    traits: null,
    evaluation: null,
    athletics: null,
    footballIQ: null,
    schemeFit: null,
    production: null,
    consensus: null,
    recommendations: null,
  };
}

export function buildProspectIntelligence(player) {
  const footballIntelligence = buildFootballIntelligenceProfile(player);

  if (!footballIntelligence?.available) {
    return buildEmptyIntelligence();
  }

  const intelligence = {
    traits: footballIntelligence.intelligence?.traits || null,
    evaluation: footballIntelligence.intelligence?.evaluation || null,
    athletics: footballIntelligence.intelligence?.athletics || null,
    footballIQ: footballIntelligence.intelligence?.footballIQ || null,
    schemeFit: footballIntelligence.intelligence?.schemeFit || null,
    production: footballIntelligence.intelligence?.production || null,
    consensus: footballIntelligence.intelligence?.consensus || null,
    recommendations:
      footballIntelligence.intelligence?.recommendations || null,
  };

  return {
    available: true,
    playerId: footballIntelligence.playerId,

    profile: footballIntelligence.profile,

    intelligence,

    analytics: footballIntelligence.analytics || null,
    scouting: footballIntelligence.scouting || null,
    research: footballIntelligence.research || null,
    metadata: footballIntelligence.metadata || null,
    record: footballIntelligence.record || null,

    traits: intelligence.traits,
    evaluation: intelligence.evaluation,
    athletics: intelligence.athletics,
    footballIQ: intelligence.footballIQ,
    schemeFit: intelligence.schemeFit,
    production: intelligence.production,
    consensus: intelligence.consensus,
    recommendations: intelligence.recommendations,
  };
}

export default {
  buildProspectIntelligence,
};