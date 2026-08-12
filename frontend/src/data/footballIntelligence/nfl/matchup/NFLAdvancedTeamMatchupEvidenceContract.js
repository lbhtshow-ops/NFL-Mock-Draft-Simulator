export const NFL_ADVANCED_TEAM_MATCHUP_EVIDENCE_CONTRACT =
  "NFLAdvancedTeamMatchupEvidence";

export const NFL_ADVANCED_TEAM_MATCHUP_EVIDENCE_VERSION =
  "NFL-ADVANCED-TEAM-MATCHUP-EVIDENCE-1.0.0";

function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function ratioOrNull(value) {
  const number = finiteOrNull(value);

  return number === null
    ? null
    : Math.max(0, Math.min(1, number));
}

function integer(value) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.max(0, Math.trunc(number))
    : 0;
}

export function createNFLAdvancedTeamMatchupEvidence({
  team,
  season,
  throughWeek = null,
  phaseScope = "ALL",
  sample = {},
  offense = {},
  defense = {},
  tendencies = {},
  provenance = {},
} = {}) {
  if (
    typeof team !== "string" ||
    !team.trim() ||
    !Number.isInteger(Number(season))
  ) {
    throw new Error(
      "Advanced Team Matchup Evidence requires team and season."
    );
  }

  return {
    contract:
      NFL_ADVANCED_TEAM_MATCHUP_EVIDENCE_CONTRACT,
    version:
      NFL_ADVANCED_TEAM_MATCHUP_EVIDENCE_VERSION,

    team: team.trim().toUpperCase(),
    season: Number(season),
    throughWeek:
      throughWeek === null
        ? null
        : integer(throughWeek),

    phaseScope:
      ["REGULAR", "POSTSEASON", "ALL"].includes(
        phaseScope
      )
        ? phaseScope
        : "ALL",

    sample: {
      offensiveDropbacks:
        integer(sample.offensiveDropbacks),
      defensiveDropbacks:
        integer(sample.defensiveDropbacks),
      offensivePlays:
        integer(sample.offensivePlays),
      defensivePlays:
        integer(sample.defensivePlays),
      redZoneOffensivePlays:
        integer(sample.redZoneOffensivePlays),
      redZoneDefensivePlays:
        integer(sample.redZoneDefensivePlays),
    },

    offense: {
      pressureAllowedRate:
        ratioOrNull(offense.pressureAllowedRate),
      sackAllowedRate:
        ratioOrNull(offense.sackAllowedRate),

      explosivePassRate:
        ratioOrNull(offense.explosivePassRate),
      explosiveRushRate:
        ratioOrNull(offense.explosiveRushRate),

      redZoneEpaPerPlay:
        finiteOrNull(offense.redZoneEpaPerPlay),
      redZoneSuccessRate:
        ratioOrNull(offense.redZoneSuccessRate),
    },

    defense: {
      pressureGeneratedRate:
        ratioOrNull(defense.pressureGeneratedRate),
      sackGeneratedRate:
        ratioOrNull(defense.sackGeneratedRate),

      explosivePassAllowedRate:
        ratioOrNull(
          defense.explosivePassAllowedRate
        ),
      explosiveRushAllowedRate:
        ratioOrNull(
          defense.explosiveRushAllowedRate
        ),

      redZoneEpaAllowedPerPlay:
        finiteOrNull(
          defense.redZoneEpaAllowedPerPlay
        ),
      redZoneSuccessRateAllowed:
        ratioOrNull(
          defense.redZoneSuccessRateAllowed
        ),
    },

    tendencies: {
      passRate:
        ratioOrNull(tendencies.passRate),
      shotgunRate:
        ratioOrNull(tendencies.shotgunRate),
      noHuddleRate:
        ratioOrNull(tendencies.noHuddleRate),
    },

    provenance: {
      source:
        provenance.source ||
        "nflverse-play-by-play",
      sourceUrl:
        provenance.sourceUrl || null,
      generatedAt:
        provenance.generatedAt || null,
    },
  };
}

export function isNFLAdvancedTeamMatchupEvidence(
  value
) {
  return Boolean(
    value &&
      value.contract ===
        NFL_ADVANCED_TEAM_MATCHUP_EVIDENCE_CONTRACT &&
      value.version ===
        NFL_ADVANCED_TEAM_MATCHUP_EVIDENCE_VERSION &&
      typeof value.team === "string" &&
      Number.isInteger(value.season)
  );
}

export default {
  NFL_ADVANCED_TEAM_MATCHUP_EVIDENCE_CONTRACT,
  NFL_ADVANCED_TEAM_MATCHUP_EVIDENCE_VERSION,
  createNFLAdvancedTeamMatchupEvidence,
  isNFLAdvancedTeamMatchupEvidence,
};
