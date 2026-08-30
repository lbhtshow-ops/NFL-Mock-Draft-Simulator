import {
  getNFLTeamIntelligenceResult,
} from "../../../engines/teamIntelligence/CanonicalNFLTeamIntelligenceEngine.js";
import {
  buildNFLTeamStrength,
} from "../../../engines/teamIntelligence/NFLTeamPriorAndStrengthEngine.js";
import {
  buildNFLPerformanceIndexes,
  getNFLTeamPerformanceEvidenceForSeason,
  getNFLTeamPerformanceEvidenceRecordsForSeason,
} from "../nfl/performance/NFLTeamPerformanceEvidenceRegistry.js";
import {
  evaluateNFLMatchupIntelligence,
} from "../../../engines/matchupIntelligence/NFLMatchupIntelligenceEngine.js";
import {
  getNFLAdvancedTeamMatchupEvidence,
} from "../nfl/matchup/NFLAdvancedMatchupEvidenceRegistry.js";
import {
  defaultNFLRuntimeCanonicalTeamAvailabilityProvider,
} from "../../../engines/teamIntelligence/availability/NFLRuntimeCanonicalTeamAvailabilityProvider.js";

function performanceEvidenceForTargetSeason(team, targetSeason) {
  const current = getNFLTeamPerformanceEvidenceForSeason(
    team, targetSeason, { phaseScope: "ALL" }
  );
  const record = current || getNFLTeamPerformanceEvidenceForSeason(
    team, targetSeason - 1, { phaseScope: "ALL" }
  );
  if (!record) return null;

  const peers = getNFLTeamPerformanceEvidenceRecordsForSeason(
    record.season, { phaseScope: "ALL" }
  );
  const indexes = buildNFLPerformanceIndexes(record, peers);

  return {
    sourceSeason: record.season,
    sourceMode: record.season === targetSeason ? "CURRENT_SEASON" : "PRIOR_SEASON",
    offense: {
      epaPerPlay: record.offense?.epaPerPlay ?? null,
      successRate: record.offense?.successRate ?? null,
      passEpaPerPlay: record.offense?.passEpaPerPlay ?? null,
      rushEpaPerPlay: record.offense?.rushEpaPerPlay ?? null,
    },
    defense: {
      epaPerPlay: record.defense?.epaAllowedPerPlay ?? null,
      successRate: record.defense?.successRateAllowed ?? null,
      passEpaPerPlay: record.defense?.passEpaAllowedPerPlay ?? null,
      rushEpaPerPlay: record.defense?.rushEpaAllowedPerPlay ?? null,
    },
    recentFormIndex: indexes.recentForm ?? null,
    specialTeamsIndex: indexes.specialTeams ?? null,
    provenance: record.provenance || null,
  };
}

function canonicalMatchupTeamInput(team, {
  season,
  week,
  availabilityWeek = week,
  gameType = "REG",
  availabilityResolver = undefined,
  availabilityProvider = defaultNFLRuntimeCanonicalTeamAvailabilityProvider,
} = {}) {
  const base = getNFLTeamIntelligenceResult(team, {
    season,
    throughWeek: week,
    availabilityProvider,
  });
  const strength = buildNFLTeamStrength({
    team,
    targetSeason: season,
    phaseScope: "ALL",
  });
  const performance = performanceEvidenceForTargetSeason(team, season);
  const strengthSource = strength.current || strength.prior || null;

  return {
    ...base,
    overallStrength: strength.overallStrength,
    confidence: strength.confidence,
    confidenceKnown: strength.confidenceKnown,
    components: {
      ...(base.components || {}),
      offense: strengthSource?.offenseIndex ?? null,
      defense: strengthSource?.defenseIndex ?? null,
      specialTeams: strengthSource?.specialTeamsIndex ?? null,
      recentForm: strengthSource?.recentFormIndex ?? null,
      opponentAdjusted: strengthSource?.opponentAdjustedIndex ?? null,
    },
    performance,
    matchupRuntimeEvidence: {
      teamStrength: strength,
      performance,
      availabilityWeek,
      gameType,
      availabilityResolverConnected: typeof availabilityResolver === "function",
      availabilityProviderConnected: Boolean(availabilityProvider?.resolve),
      availabilityScoringAuthorized: false,
      quarterbackScoringAuthorized: false,
      playerImpactScoringAuthorized: false,
    },
  };
}

export function buildNFLMatchupIntelligenceProfile({
  gameId = null,
  season,
  week,
  awayTeam,
  homeTeam,
  availabilityWeek = week,
  gameType = "REG",
  availabilityResolver = undefined,
  availabilityProvider = defaultNFLRuntimeCanonicalTeamAvailabilityProvider,
  context = {},
} = {}) {
  const awayIntelligence = canonicalMatchupTeamInput(awayTeam, {
    season, week, availabilityWeek, gameType, availabilityResolver, availabilityProvider,
  });
  const homeIntelligence = canonicalMatchupTeamInput(homeTeam, {
    season, week, availabilityWeek, gameType, availabilityResolver, availabilityProvider,
  });

  const awayAdvanced = getNFLAdvancedTeamMatchupEvidence(awayTeam, {
    season,
    throughWeek: week,
  });
  const homeAdvanced = getNFLAdvancedTeamMatchupEvidence(homeTeam, {
    season,
    throughWeek: week,
  });

  return evaluateNFLMatchupIntelligence({
    gameId,
    season,
    week,
    awayTeam,
    homeTeam,
    awayIntelligence: {
      ...awayIntelligence,
      advancedMatchupEvidence: awayAdvanced,
    },
    homeIntelligence: {
      ...homeIntelligence,
      advancedMatchupEvidence: homeAdvanced,
    },
    context,
  });
}

export default { buildNFLMatchupIntelligenceProfile };
