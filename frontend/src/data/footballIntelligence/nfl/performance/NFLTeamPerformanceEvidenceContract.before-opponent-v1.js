export const NFL_TEAM_PERFORMANCE_EVIDENCE_CONTRACT =
  "NFLTeamPerformanceEvidence";

export const NFL_TEAM_PERFORMANCE_EVIDENCE_VERSION =
  "NFL-TEAM-PERFORMANCE-EVIDENCE-1.0.0";

export const NFL_TEAM_PERFORMANCE_EVIDENCE_SOURCE =
  "nflverse-play-by-play";

function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function zeroToOneOrNull(value) {
  const number = finiteOrNull(value);
  return number === null ? null : Math.max(0, Math.min(1, number));
}

function nonNegativeInteger(value) {
  const number = finiteOrNull(value);
  return number === null ? 0 : Math.max(0, Math.trunc(number));
}

export function createNFLTeamPerformanceEvidence({
  teamAbbreviation,
  season,
  throughWeek = null,
  gamesPlayed = 0,
  offensivePlays = 0,
  defensivePlays = 0,
  offense = {},
  defense = {},
  recentForm = null,
  source = NFL_TEAM_PERFORMANCE_EVIDENCE_SOURCE,
  sourceUrl = null,
  generatedAt = null,
} = {}) {
  if (typeof teamAbbreviation !== "string" || !teamAbbreviation.trim()) {
    throw new Error("NFL Team Performance Evidence requires teamAbbreviation.");
  }

  const normalizedSeason =
    Number.isInteger(Number(season)) ? Number(season) : null;

  if (!normalizedSeason) {
    throw new Error("NFL Team Performance Evidence requires a numeric season.");
  }

  return {
    contract: NFL_TEAM_PERFORMANCE_EVIDENCE_CONTRACT,
    version: NFL_TEAM_PERFORMANCE_EVIDENCE_VERSION,
    teamAbbreviation: teamAbbreviation.trim().toUpperCase(),
    season: normalizedSeason,
    throughWeek:
      throughWeek === null ? null : nonNegativeInteger(throughWeek),

    sample: {
      gamesPlayed: nonNegativeInteger(gamesPlayed),
      offensivePlays: nonNegativeInteger(offensivePlays),
      defensivePlays: nonNegativeInteger(defensivePlays),
    },

    offense: {
      epaPerPlay: finiteOrNull(offense.epaPerPlay),
      successRate: zeroToOneOrNull(offense.successRate),
      passEpaPerPlay: finiteOrNull(offense.passEpaPerPlay),
      rushEpaPerPlay: finiteOrNull(offense.rushEpaPerPlay),
    },

    defense: {
      epaAllowedPerPlay: finiteOrNull(defense.epaAllowedPerPlay),
      successRateAllowed: zeroToOneOrNull(defense.successRateAllowed),
      passEpaAllowedPerPlay: finiteOrNull(defense.passEpaAllowedPerPlay),
      rushEpaAllowedPerPlay: finiteOrNull(defense.rushEpaAllowedPerPlay),
    },

    recentForm:
      recentForm && typeof recentForm === "object"
        ? {
            weeks: Array.isArray(recentForm.weeks) ? recentForm.weeks : [],
            offenseEpaPerPlay: finiteOrNull(recentForm.offenseEpaPerPlay),
            defenseEpaAllowedPerPlay: finiteOrNull(
              recentForm.defenseEpaAllowedPerPlay
            ),
            netEpaPerPlay: finiteOrNull(recentForm.netEpaPerPlay),
          }
        : null,

    provenance: {
      source,
      sourceUrl,
      generatedAt,
    },
  };
}

export function isNFLTeamPerformanceEvidence(value) {
  return Boolean(
    value &&
      value.contract === NFL_TEAM_PERFORMANCE_EVIDENCE_CONTRACT &&
      value.version === NFL_TEAM_PERFORMANCE_EVIDENCE_VERSION &&
      typeof value.teamAbbreviation === "string" &&
      Number.isInteger(value.season)
  );
}

export default {
  NFL_TEAM_PERFORMANCE_EVIDENCE_CONTRACT,
  NFL_TEAM_PERFORMANCE_EVIDENCE_VERSION,
  NFL_TEAM_PERFORMANCE_EVIDENCE_SOURCE,
  createNFLTeamPerformanceEvidence,
  isNFLTeamPerformanceEvidence,
};
