import {
  createNFLAdvancedTeamMatchupEvidence,
} from "./NFLAdvancedTeamMatchupEvidenceContract.js";

function numeric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function flag(value) {
  const number = numeric(value);

  if (number !== null) return number > 0;

  return String(value || "")
    .trim()
    .toLowerCase() === "true";
}

function normalizeTeam(value) {
  return typeof value === "string" && value.trim()
    ? value.trim().toUpperCase()
    : null;
}

function phase(row) {
  const value = String(
    row?.season_type ||
      row?.game_type ||
      ""
  ).toUpperCase();

  if (value.includes("POST")) return "POST";
  if (value.includes("REG")) return "REG";

  const week = Number(row?.week);
  return Number.isFinite(week) && week > 18
    ? "POST"
    : "REG";
}

function phaseAllowed(row, scope) {
  const rowPhase = phase(row);

  if (scope === "REGULAR") {
    return rowPhase === "REG";
  }

  if (scope === "POSTSEASON") {
    return rowPhase === "POST";
  }

  return true;
}

function playType(row) {
  return String(
    row?.play_type || ""
  ).toLowerCase();
}

function isPass(row) {
  return playType(row) === "pass";
}

function isRun(row) {
  return playType(row) === "run";
}

function isCompetitivePlay(row) {
  if (!isPass(row) && !isRun(row)) {
    return false;
  }

  if (flag(row?.no_play)) {
    return false;
  }

  return true;
}

function pressureEvent(row) {
  // nflfastR PBP exposes sack and qb_hit fields.
  return flag(row?.sack) || flag(row?.qb_hit);
}

function success(row) {
  const explicit = numeric(row?.success);

  if (explicit !== null) {
    return explicit > 0;
  }

  const epa = numeric(row?.epa);
  return epa !== null && epa > 0;
}

function redZone(row) {
  const yardline100 = numeric(
    row?.yardline_100
  );

  return (
    yardline100 !== null &&
    yardline100 <= 20
  );
}

function newAggregate(team) {
  return {
    team,

    offense: {
      plays: 0,
      dropbacks: 0,
      pressureAllowed: 0,
      sacksAllowed: 0,

      passPlays: 0,
      explosivePasses: 0,

      rushPlays: 0,
      explosiveRushes: 0,

      redZonePlays: 0,
      redZoneEpa: 0,
      redZoneSuccess: 0,

      shotgun: 0,
      noHuddle: 0,
    },

    defense: {
      plays: 0,
      dropbacks: 0,
      pressureGenerated: 0,
      sacksGenerated: 0,

      passPlays: 0,
      explosivePassesAllowed: 0,

      rushPlays: 0,
      explosiveRushesAllowed: 0,

      redZonePlays: 0,
      redZoneEpaAllowed: 0,
      redZoneSuccessAllowed: 0,
    },
  };
}

function ratio(numerator, denominator) {
  return denominator > 0
    ? numerator / denominator
    : null;
}

export function aggregateNFLAdvancedMatchupEvidence({
  rows = [],
  season,
  throughWeek = null,
  phaseScope = "ALL",
  sourceUrl = null,
  generatedAt = null,
} = {}) {
  const teams = new Map();

  const get = (team) => {
    if (!teams.has(team)) {
      teams.set(team, newAggregate(team));
    }

    return teams.get(team);
  };

  for (const row of rows) {
    if (!phaseAllowed(row, phaseScope)) {
      continue;
    }

    const rowSeason = Number(row?.season);

    if (
      Number.isFinite(rowSeason) &&
      rowSeason !== Number(season)
    ) {
      continue;
    }

    const week = Number(row?.week);

    if (
      throughWeek !== null &&
      Number.isFinite(week) &&
      week > Number(throughWeek)
    ) {
      continue;
    }

    if (!isCompetitivePlay(row)) {
      continue;
    }

    const offenseTeam =
      normalizeTeam(row?.posteam);
    const defenseTeam =
      normalizeTeam(row?.defteam);

    if (!offenseTeam || !defenseTeam) {
      continue;
    }

    const offense = get(offenseTeam);
    const defense = get(defenseTeam);

    const type = playType(row);
    const yards =
      numeric(row?.yards_gained) ?? 0;
    const epa =
      numeric(row?.epa) ?? 0;

    offense.offense.plays += 1;
    defense.defense.plays += 1;

    if (flag(row?.shotgun)) {
      offense.offense.shotgun += 1;
    }

    if (flag(row?.no_huddle)) {
      offense.offense.noHuddle += 1;
    }

    if (type === "pass") {
      offense.offense.passPlays += 1;
      defense.defense.passPlays += 1;

      offense.offense.dropbacks += 1;
      defense.defense.dropbacks += 1;

      if (pressureEvent(row)) {
        offense.offense.pressureAllowed += 1;
        defense.defense.pressureGenerated += 1;
      }

      if (flag(row?.sack)) {
        offense.offense.sacksAllowed += 1;
        defense.defense.sacksGenerated += 1;
      }

      if (yards >= 20) {
        offense.offense.explosivePasses += 1;
        defense.defense.explosivePassesAllowed += 1;
      }
    }

    if (type === "run") {
      offense.offense.rushPlays += 1;
      defense.defense.rushPlays += 1;

      if (yards >= 10) {
        offense.offense.explosiveRushes += 1;
        defense.defense.explosiveRushesAllowed += 1;
      }
    }

    if (redZone(row)) {
      offense.offense.redZonePlays += 1;
      offense.offense.redZoneEpa += epa;
      offense.offense.redZoneSuccess +=
        success(row) ? 1 : 0;

      defense.defense.redZonePlays += 1;
      defense.defense.redZoneEpaAllowed += epa;
      defense.defense.redZoneSuccessAllowed +=
        success(row) ? 1 : 0;
    }
  }

  return [...teams.values()]
    .map((aggregate) =>
      createNFLAdvancedTeamMatchupEvidence({
        team: aggregate.team,
        season,
        throughWeek,
        phaseScope,

        sample: {
          offensiveDropbacks:
            aggregate.offense.dropbacks,
          defensiveDropbacks:
            aggregate.defense.dropbacks,
          offensivePlays:
            aggregate.offense.plays,
          defensivePlays:
            aggregate.defense.plays,
          redZoneOffensivePlays:
            aggregate.offense.redZonePlays,
          redZoneDefensivePlays:
            aggregate.defense.redZonePlays,
        },

        offense: {
          pressureAllowedRate:
            ratio(
              aggregate.offense.pressureAllowed,
              aggregate.offense.dropbacks
            ),
          sackAllowedRate:
            ratio(
              aggregate.offense.sacksAllowed,
              aggregate.offense.dropbacks
            ),

          explosivePassRate:
            ratio(
              aggregate.offense.explosivePasses,
              aggregate.offense.passPlays
            ),
          explosiveRushRate:
            ratio(
              aggregate.offense.explosiveRushes,
              aggregate.offense.rushPlays
            ),

          redZoneEpaPerPlay:
            ratio(
              aggregate.offense.redZoneEpa,
              aggregate.offense.redZonePlays
            ),
          redZoneSuccessRate:
            ratio(
              aggregate.offense.redZoneSuccess,
              aggregate.offense.redZonePlays
            ),
        },

        defense: {
          pressureGeneratedRate:
            ratio(
              aggregate.defense.pressureGenerated,
              aggregate.defense.dropbacks
            ),
          sackGeneratedRate:
            ratio(
              aggregate.defense.sacksGenerated,
              aggregate.defense.dropbacks
            ),

          explosivePassAllowedRate:
            ratio(
              aggregate.defense.explosivePassesAllowed,
              aggregate.defense.passPlays
            ),
          explosiveRushAllowedRate:
            ratio(
              aggregate.defense.explosiveRushesAllowed,
              aggregate.defense.rushPlays
            ),

          redZoneEpaAllowedPerPlay:
            ratio(
              aggregate.defense.redZoneEpaAllowed,
              aggregate.defense.redZonePlays
            ),
          redZoneSuccessRateAllowed:
            ratio(
              aggregate.defense.redZoneSuccessAllowed,
              aggregate.defense.redZonePlays
            ),
        },

        tendencies: {
          passRate:
            ratio(
              aggregate.offense.passPlays,
              aggregate.offense.plays
            ),
          shotgunRate:
            ratio(
              aggregate.offense.shotgun,
              aggregate.offense.plays
            ),
          noHuddleRate:
            ratio(
              aggregate.offense.noHuddle,
              aggregate.offense.plays
            ),
        },

        provenance: {
          source:
            "nflverse-play-by-play",
          sourceUrl,
          generatedAt,
        },
      })
    )
    .sort(
      (a, b) =>
        a.team.localeCompare(b.team)
    );
}

export default {
  aggregateNFLAdvancedMatchupEvidence,
};
