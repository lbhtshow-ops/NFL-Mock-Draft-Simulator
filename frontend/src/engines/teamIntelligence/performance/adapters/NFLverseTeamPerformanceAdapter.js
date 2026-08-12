import { createNFLTeamPerformanceEvidence } from "../NFLTeamPerformanceEvidenceContract.js";
import { createNFLTeamPerformanceSourceAdapter } from "../NFLTeamPerformanceSourceAdapter.js";
import { defaultNFLTeamPerformanceMethodology } from "../NFLTeamPerformanceMethodologyContract.js";

export const NFLVERSE_TEAM_PERFORMANCE_ADAPTER_VERSION =
  "NFLVERSE-TEAM-PERFORMANCE-ADAPTER-1.0.0";

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function booleanish(value) {
  return value === true || value === 1 || value === "1";
}

function teamCode(value) {
  return typeof value === "string" && value.trim() ? value.trim().toUpperCase() : null;
}

function weekValue(row) {
  const week = number(row?.week);
  return Number.isInteger(week) ? week : null;
}

function playEligible(row, methodology) {
  if (!row || typeof row !== "object") return false;
  if (methodology.plays.excludeNoPlay && booleanish(row.no_play)) return false;
  if (methodology.plays.excludeQbKneels && booleanish(row.qb_kneel)) return false;
  if (methodology.plays.excludeQbSpikes && booleanish(row.qb_spike)) return false;
  return true;
}

function mean(values) {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) return null;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function successRate(rows) {
  const values = rows
    .map((row) => number(row.success))
    .filter((value) => value === 0 || value === 1);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function uniqueGames(rows) {
  return new Set(rows.map((row) => row.game_id).filter(Boolean)).size;
}

function aggregateSide(rows) {
  return {
    epaPerPlay: mean(rows.map((row) => number(row.epa))),
    successRate: successRate(rows),
    pointsPerDrive: null,
    explosivePlayRate: null,
    turnoverRate: null,
  };
}

function recentRows(rows, team, throughWeek, windowGames, side, methodology) {
  const relevant = rows.filter((row) =>
    playEligible(row, methodology) &&
    weekValue(row) !== null &&
    weekValue(row) <= throughWeek &&
    (side === "offense" ? teamCode(row.posteam) === team : teamCode(row.defteam) === team)
  );
  const weeks = [...new Set(relevant.map(weekValue))].sort((a, b) => b - a).slice(0, windowGames);
  return relevant.filter((row) => weeks.includes(weekValue(row)));
}

export function createNFLverseTeamPerformanceAdapter({
  datasetVersion = null,
  retrievedAt = null,
  sourceRefs = [],
  methodology = defaultNFLTeamPerformanceMethodology,
} = {}) {
  return createNFLTeamPerformanceSourceAdapter({
    provider: "NFLVERSE",
    dataset: "NFLVERSE_PLAY_BY_PLAY",
    methodology,
    metadata: {
      adapterVersion: NFLVERSE_TEAM_PERFORMANCE_ADAPTER_VERSION,
      datasetVersion,
      retrievedAt,
    },
    aggregate(rows = [], { team, season, throughWeek } = {}) {
      const abbreviation = teamCode(team);
      const requestedSeason = number(season);
      const requestedWeek = number(throughWeek);
      if (!abbreviation || !Number.isInteger(requestedSeason) || !Number.isInteger(requestedWeek)) {
        return null;
      }

      const scoped = (Array.isArray(rows) ? rows : []).filter((row) => {
        if (!playEligible(row, methodology)) return false;
        if (number(row.season) !== requestedSeason) return false;
        if (weekValue(row) === null || weekValue(row) > requestedWeek) return false;
        if (methodology.snapshot.regularSeasonOnlyByDefault && row.season_type && row.season_type !== "REG") return false;
        return teamCode(row.posteam) === abbreviation || teamCode(row.defteam) === abbreviation;
      });

      const offenseRows = scoped.filter((row) => teamCode(row.posteam) === abbreviation);
      const defenseRows = scoped.filter((row) => teamCode(row.defteam) === abbreviation);
      const recentOffense = recentRows(scoped, abbreviation, requestedWeek, methodology.recentForm.windowGames, "offense", methodology);

      const evidenceConfidence = null;

      return createNFLTeamPerformanceEvidence({
        teamAbbreviation: abbreviation,
        season: requestedSeason,
        throughWeek: requestedWeek,
        sample: {
          games: uniqueGames(scoped),
          offensivePlays: offenseRows.length,
          defensivePlays: defenseRows.length,
          drives: null,
        },
        offense: aggregateSide(offenseRows),
        defense: aggregateSide(defenseRows),
        specialTeams: { epaPerPlay: null },
        strengthOfSchedule: null,
        opponentAdjustedRating: null,
        recentForm: {
          windowGames: methodology.recentForm.windowGames,
          epaPerPlay: mean(recentOffense.map((row) => number(row.epa))),
          successRate: successRate(recentOffense),
          pointsPerDrive: null,
          decayModel: methodology.recentForm.weighting,
        },
        confidence: evidenceConfidence,
        freshness: {
          observedThrough: `${requestedSeason}-W${String(requestedWeek).padStart(2, "0")}`,
          retrievedAt,
          generatedAt: new Date().toISOString(),
        },
        provenance: {
          provider: "NFLVERSE",
          dataset: "NFLVERSE_PLAY_BY_PLAY",
          datasetVersion,
          methodology: methodology.version,
          sourceRefs,
        },
      });
    },
  });
}

export default {
  NFLVERSE_TEAM_PERFORMANCE_ADAPTER_VERSION,
  createNFLverseTeamPerformanceAdapter,
};
