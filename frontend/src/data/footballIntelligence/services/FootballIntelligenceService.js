import { resolveFootballPlayer } from "../resolver/FootballIntelligenceResolver";

import { getPlayerTraitSummary } from "../../../engines/PlayerTraitEngine";
import { getPlayerEvaluationSummary } from "../../../engines/PlayerEvaluationEngine";
import { getAthleticSummary } from "../../../engines/AthleticIntelligenceEngine";
import { getFootballIQSummary } from "../../../engines/FootballIQEngine";
import { getSchemeFitSummary } from "../../../engines/SchemeFitEngine";
import { getProductionSummary } from "../../../engines/ProductionEngine";

function buildEnginePlayerInput(footballPlayer) {
  return {
    id: footballPlayer.id,
    playerId: footballPlayer.id,
    canonicalId: footballPlayer.id,
    prospectId: footballPlayer.id,
    name: footballPlayer.identity?.playerName,
    player: footballPlayer.identity?.playerName,
    position: footballPlayer.identity?.position,
    school: footballPlayer.identity?.school,
    rank: footballPlayer.rankings?.overall,
    careerContext: footballPlayer.careerContext || null,
  };
}

export function buildFootballIntelligenceProfile(player) {
  const footballPlayer = resolveFootballPlayer(player);

  if (!footballPlayer) {
    return {
      available: false,
      playerId: null,
      profile: null,
      careerContext: null,
      intelligence: null,
      analytics: null,
      scouting: null,
      research: null,
      metadata: null,
      record: null,
    };
  }

  const enginePlayerInput = buildEnginePlayerInput(footballPlayer);

  const intelligence = {
    traits:
      footballPlayer.intelligence?.traits ||
      getPlayerTraitSummary(footballPlayer.id),

    evaluation:
      footballPlayer.intelligence?.evaluation ||
      getPlayerEvaluationSummary(enginePlayerInput),

    athletics:
      footballPlayer.intelligence?.athletics ||
      getAthleticSummary(enginePlayerInput),

    footballIQ:
      footballPlayer.intelligence?.footballIQ ||
      getFootballIQSummary(enginePlayerInput),

    schemeFit:
      footballPlayer.intelligence?.schemeFit ||
      getSchemeFitSummary(enginePlayerInput),

    production:
      footballPlayer.intelligence?.production ||
      getProductionSummary(enginePlayerInput),

    recognition: footballPlayer.intelligence?.recognition || null,
    durability: footballPlayer.intelligence?.durability || null,
    development: footballPlayer.intelligence?.development || null,
    competition: footballPlayer.intelligence?.competition || null,
    translation: footballPlayer.intelligence?.translation || null,
    usage: footballPlayer.intelligence?.usage || null,

    consensus: footballPlayer.intelligence?.consensus || null,
    recommendations:
      footballPlayer.intelligence?.recommendations || null,
  };

  return {
    available: true,
    playerId: footballPlayer.id,

    profile: {
      bio: footballPlayer.identity || null,
      careerContext: footballPlayer.careerContext || null,
      rankings: footballPlayer.rankings || null,
      metadata: footballPlayer.metadata || null,
    },

    careerContext: footballPlayer.careerContext || null,

    intelligence,
    analytics: footballPlayer.analytics || null,
    scouting: footballPlayer.scouting || null,
    research: footballPlayer.research || null,
    metadata: footballPlayer.metadata || null,
    record: footballPlayer.record || null,
  };
}

export default {
  buildFootballIntelligenceProfile,
};