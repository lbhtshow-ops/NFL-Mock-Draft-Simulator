import {
  createNFLTeamPerformanceEvidence,
} from "./NFLTeamPerformanceEvidenceContract.js";

function numeric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeTeam(value) {
  return typeof value === "string" && value.trim()
    ? value.trim().toUpperCase()
    : null;
}

function validCompetitivePlay(row) {
  const playType = String(row?.play_type || row?.playType || "").toLowerCase();

  if (playType !== "pass" && playType !== "run") return false;

  if (
    String(row?.no_play || "").toLowerCase() === "1" ||
    row?.no_play === true
  ) {
    return false;
  }

  return numeric(row?.epa) !== null;
}

function successValue(row) {
  const explicit = numeric(row?.success);

  if (explicit !== null) return explicit > 0 ? 1 : 0;

  const epa = numeric(row?.epa);
  return epa !== null && epa > 0 ? 1 : 0;
}

function newAggregate(team) {
  return {
    team,
    offense: {
      plays: 0,
      epa: 0,
      successes: 0,
      passPlays: 0,
      passEpa: 0,
      rushPlays: 0,
      rushEpa: 0,
    },
    defense: {
      plays: 0,
      epaAllowed: 0,
      successesAllowed: 0,
      passPlays: 0,
      passEpaAllowed: 0,
      rushPlays: 0,
      rushEpaAllowed: 0,
    },
    specialTeams: {
      plays: 0,
      epa: 0,
      fieldGoalPlays: 0,
      puntPlays: 0,
      kickoffPlays: 0,
      extraPointPlays: 0,
    },
    gameIds: new Set(),
    games: new Map(),
    weekBuckets: new Map(),
  };
}

function normalizeSeasonType(row) {
  const value = String(
    row?.season_type ||
    row?.seasonType ||
    row?.game_type ||
    row?.gameType ||
    ""
  ).toUpperCase();

  if (value.includes("POST")) return "POST";
  if (value.includes("REG")) return "REG";

  const week = Number(row?.week);

  // nflverse commonly numbers postseason weeks beyond the regular-season range.
  if (Number.isFinite(week) && week > 18) return "POST";

  return "REG";
}

function phaseAllowed(row, phaseScope) {
  const phase = normalizeSeasonType(row);

  if (phaseScope === "REGULAR") return phase === "REG";
  if (phaseScope === "POSTSEASON") return phase === "POST";

  return true;
}

function registerGame(aggregate, {
  gameId,
  week,
  opponent,
  phase,
}) {
  if (!gameId || !opponent) return;

  const key = String(gameId);

  if (!aggregate.games.has(key)) {
    aggregate.games.set(key, {
      gameId: key,
      week:
        Number.isFinite(Number(week))
          ? Number(week)
          : null,
      opponent,
      phase,
    });
  }
}

function getWeekBucket(aggregate, week) {
  const key = Number.isFinite(Number(week)) ? Number(week) : 0;

  if (!aggregate.weekBuckets.has(key)) {
    aggregate.weekBuckets.set(key, {
      week: key,
      offensePlays: 0,
      offenseEpa: 0,
      defensePlays: 0,
      defenseEpaAllowed: 0,
    });
  }

  return aggregate.weekBuckets.get(key);
}

function safeRate(total, count) {
  return count > 0 ? total / count : null;
}

function summarizeRecentForm(aggregate, window = 5) {
  const weeks = [...aggregate.weekBuckets.values()]
    .filter((bucket) => bucket.week > 0)
    .sort((a, b) => a.week - b.week)
    .slice(-window);

  if (!weeks.length) return null;

  const offensePlays = weeks.reduce((sum, week) => sum + week.offensePlays, 0);
  const offenseEpa = weeks.reduce((sum, week) => sum + week.offenseEpa, 0);
  const defensePlays = weeks.reduce((sum, week) => sum + week.defensePlays, 0);
  const defenseEpa = weeks.reduce(
    (sum, week) => sum + week.defenseEpaAllowed,
    0
  );

  const offenseEpaPerPlay = safeRate(offenseEpa, offensePlays);
  const defenseEpaAllowedPerPlay = safeRate(defenseEpa, defensePlays);

  return {
    weeks: weeks.map((week) => week.week),
    offenseEpaPerPlay,
    defenseEpaAllowedPerPlay,
    netEpaPerPlay:
      offenseEpaPerPlay !== null && defenseEpaAllowedPerPlay !== null
        ? offenseEpaPerPlay - defenseEpaAllowedPerPlay
        : null,
  };
}

function isSpecialTeamsPlay(row) {
  const explicit = numeric(row?.special) ?? numeric(row?.special_teams_play);
  if (explicit !== null && explicit > 0) return true;
  const playType = String(row?.play_type || row?.playType || "").toLowerCase();
  return ["field_goal", "punt", "kickoff", "extra_point"].includes(playType);
}

function incrementSpecialType(aggregate, row) {
  const playType = String(row?.play_type || row?.playType || "").toLowerCase();
  if (playType === "field_goal") aggregate.specialTeams.fieldGoalPlays += 1;
  else if (playType === "punt") aggregate.specialTeams.puntPlays += 1;
  else if (playType === "kickoff") aggregate.specialTeams.kickoffPlays += 1;
  else if (playType === "extra_point") aggregate.specialTeams.extraPointPlays += 1;
}

function registerScheduleContextForRow({ row, offenseTeam, defenseTeam, offense, defense, week }) {
  const gameId = row?.game_id || row?.gameId || null;
  if (!gameId) return;
  offense.gameIds.add(String(gameId)); defense.gameIds.add(String(gameId));
  const phase = normalizeSeasonType(row);
  registerGame(offense, { gameId, week, opponent: defenseTeam, phase });
  registerGame(defense, { gameId, week, opponent: offenseTeam, phase });
}

export function aggregateNFLVersePlayByPlay({
  rows = [],
  season,
  throughWeek = null,
  phaseScope = "ALL",
  sourceUrl = null,
  generatedAt = null,
} = {}) {
  const aggregateByTeam = new Map();

  const getAggregate = (team) => {
    if (!aggregateByTeam.has(team)) {
      aggregateByTeam.set(team, newAggregate(team));
    }

    return aggregateByTeam.get(team);
  };

  for (const row of rows) {
    if (!phaseAllowed(row, phaseScope)) continue;
    const rowSeason = Number(row?.season);
    if (Number.isFinite(rowSeason) && rowSeason !== Number(season)) continue;
    const week = Number(row?.week);
    if (throughWeek !== null && Number.isFinite(week) && week > Number(throughWeek)) continue;
    const offenseTeam = normalizeTeam(row?.posteam || row?.possession_team);
    const defenseTeam = normalizeTeam(row?.defteam || row?.defense_team);
    if (!offenseTeam || !defenseTeam) continue;
    const offense = getAggregate(offenseTeam);
    const defense = getAggregate(defenseTeam);
    registerScheduleContextForRow({ row, offenseTeam, defenseTeam, offense, defense, week });

    if (isSpecialTeamsPlay(row)) {
      const specialEpa = numeric(row?.epa);
      if (specialEpa !== null) {
        offense.specialTeams.plays += 1; offense.specialTeams.epa += specialEpa; incrementSpecialType(offense,row);
        defense.specialTeams.plays += 1; defense.specialTeams.epa -= specialEpa; incrementSpecialType(defense,row);
      }
      continue;
    }

    if (!validCompetitivePlay(row)) continue;
    const epa = numeric(row?.epa);
    if (epa === null) continue;
    const success = successValue(row);
    const playType = String(row?.play_type || row?.playType).toLowerCase();

    offense.offense.plays += 1;
    offense.offense.epa += epa;
    offense.offense.successes += success;

    defense.defense.plays += 1;
    defense.defense.epaAllowed += epa;
    defense.defense.successesAllowed += success;

    if (playType === "pass") {
      offense.offense.passPlays += 1;
      offense.offense.passEpa += epa;
      defense.defense.passPlays += 1;
      defense.defense.passEpaAllowed += epa;
    }

    if (playType === "run") {
      offense.offense.rushPlays += 1;
      offense.offense.rushEpa += epa;
      defense.defense.rushPlays += 1;
      defense.defense.rushEpaAllowed += epa;
    }

    const offenseWeek = getWeekBucket(offense, week);
    offenseWeek.offensePlays += 1;
    offenseWeek.offenseEpa += epa;

    const defenseWeek = getWeekBucket(defense, week);
    defenseWeek.defensePlays += 1;
    defenseWeek.defenseEpaAllowed += epa;
  }

  return [...aggregateByTeam.values()]
    .map((aggregate) =>
      createNFLTeamPerformanceEvidence({
        teamAbbreviation: aggregate.team,
        season,
        throughWeek,
        gamesPlayed: aggregate.gameIds.size,
        offensivePlays: aggregate.offense.plays,
        defensivePlays: aggregate.defense.plays,
        offense: {
          epaPerPlay: safeRate(aggregate.offense.epa, aggregate.offense.plays),
          successRate: safeRate(
            aggregate.offense.successes,
            aggregate.offense.plays
          ),
          passEpaPerPlay: safeRate(
            aggregate.offense.passEpa,
            aggregate.offense.passPlays
          ),
          rushEpaPerPlay: safeRate(
            aggregate.offense.rushEpa,
            aggregate.offense.rushPlays
          ),
        },
        defense: {
          epaAllowedPerPlay: safeRate(aggregate.defense.epaAllowed, aggregate.defense.plays),
          successRateAllowed: safeRate(aggregate.defense.successesAllowed, aggregate.defense.plays),
          passEpaAllowedPerPlay: safeRate(aggregate.defense.passEpaAllowed, aggregate.defense.passPlays),
          rushEpaAllowedPerPlay: safeRate(aggregate.defense.rushEpaAllowed, aggregate.defense.rushPlays),
        },
        specialTeams: {
          plays: aggregate.specialTeams.plays,
          epa: aggregate.specialTeams.epa,
          epaPerPlay: safeRate(aggregate.specialTeams.epa, aggregate.specialTeams.plays),
          fieldGoalPlays: aggregate.specialTeams.fieldGoalPlays,
          puntPlays: aggregate.specialTeams.puntPlays,
          kickoffPlays: aggregate.specialTeams.kickoffPlays,
          extraPointPlays: aggregate.specialTeams.extraPointPlays,
        },
        recentForm: summarizeRecentForm(aggregate),

        scheduleContext: {
          games: [...aggregate.games.values()]
            .sort((a, b) =>
              (a.week ?? 999) - (b.week ?? 999)
            ),
          regularSeasonGames:
            [...aggregate.games.values()]
              .filter((game) => game.phase === "REG")
              .length,
          postseasonGames:
            [...aggregate.games.values()]
              .filter((game) => game.phase === "POST")
              .length,
        },

        phaseScope,
        sourceUrl,
        generatedAt,
      })
    )
    .sort((a, b) =>
      a.teamAbbreviation.localeCompare(b.teamAbbreviation)
    );
}

export default aggregateNFLVersePlayByPlay;
