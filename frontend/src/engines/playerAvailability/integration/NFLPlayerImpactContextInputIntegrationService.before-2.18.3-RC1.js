import rosterRows from "../../../data/footballIntelligence/nfl/rosters/sources/generatedNFLVerseRosterSource.json" with { type: "json" };
import snapRows from "../../../data/footballIntelligence/nfl/rosters/sources/generatedNFLVerseSnapCountsSource.json" with { type: "json" };

import { evaluateCanonicalNFLPlayer } from "../../playerEvaluation/nfl/CanonicalNFLPlayerEvaluationService.js";
import { resolveCanonicalPlayerCaliber } from "../../playerEvaluation/caliber/CanonicalPlayerCaliberService.js";
import { PLAYER_CALIBER_SUBJECT_KINDS } from "../../playerEvaluation/caliber/CanonicalPlayerCaliberContract.js";
import { TEAM_DEPENDENCY_LEVELS } from "../contracts/PlayerAvailabilityImpactContextContract.js";
import { resolveNFLPlayerAvailabilityImpactContext } from "../context/NFLPlayerAvailabilityImpactContextResolver.js";
import {
  createUnknownNFLTeamDependencyEvidence,
  NFL_TEAM_DEPENDENCY_STATES,
} from "./NFLTeamDependencyEvidenceContract.js";

export const NFL_PLAYER_IMPACT_INPUT_INTEGRATION_VERSION =
  "FIE-NFL-PLAYER-IMPACT-INPUT-INTEGRATION-1.0.0";

const normalizeName = (value = "") =>
  String(value)
    .toLowerCase()
    .replaceAll(".", "")
    .replaceAll("'", "")
    .replaceAll("-", " ")
    .replace(/\\s+/g, " ")
    .trim();

const upper = (value) =>
  typeof value === "string" && value.trim()
    ? value.trim().toUpperCase()
    : null;

function toEvaluationPlayer(row) {
  if (!row) return null;
  return {
    id: row.player_id || null,
    playerId: row.player_id || null,
    name: row.player_name || null,
    playerName: row.player_name || null,
    position: row.position || null,
    team: row.team || null,
    years_exp: row.years_exp ?? null,
    status: row.status || null,
    identity: {
      playerId: row.player_id || null,
      playerName: row.player_name || null,
      position: row.position || null,
      team: row.team || null,
      experience: row.years_exp ?? null,
    },
    roster: {
      status: row.status || null,
      experience: row.years_exp ?? null,
    },
  };
}

function findRosterRow({ playerName, team }) {
  const name = normalizeName(playerName);
  const code = upper(team);
  return rosterRows.find((row) =>
    normalizeName(row?.player_name) === name &&
    upper(row?.team) === code
  ) || null;
}

function resolveCaliber({ playerName, team }) {
  const row = findRosterRow({ playerName, team });
  if (!row) return { rosterRow: null, evaluation: null, caliber: null };
  const player = toEvaluationPlayer(row);
  const evaluation = evaluateCanonicalNFLPlayer(player);
  const caliber = resolveCanonicalPlayerCaliber({
    subjectKind: PLAYER_CALIBER_SUBJECT_KINDS.NFL_PLAYER,
    player,
    nflEvaluation: evaluation,
  });
  return { rosterRow: row, evaluation, caliber };
}

function usageForPlayer({ playerName, team, season }) {
  const name = normalizeName(playerName);
  const code = upper(team);
  const eligible = snapRows.filter((row) =>
    normalizeName(row?.player_name) === name &&
    upper(row?.team) === code &&
    Number.isInteger(Number(row?.season)) &&
    Number(row.season) <= Number(season)
  );
  if (!eligible.length) return null;
  const latestSeason = Math.max(...eligible.map((row) => Number(row.season)));
  const seasonRows = eligible.filter((row) => Number(row.season) === latestSeason);
  const average = (field) => {
    const values = seasonRows
      .map((row) => Number(row?.[field]))
      .filter((value) => Number.isFinite(value));
    if (!values.length) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };
  return {
    contract: "NFLPlayerUsageEvidence",
    version: "FIE-NFL-PLAYER-USAGE-EVIDENCE-1.0.0",
    season: latestSeason,
    gamesTracked: seasonRows.length,
    usage: {
      offenseSnapPct: average("offense_pct"),
      defenseSnapPct: average("defense_pct"),
      specialTeamsSnapPct: average("st_pct"),
    },
    provenance: {
      source: "generatedNFLVerseSnapCountsSource",
      basis: "MOST_RECENT_AVAILABLE_SEASON_AVERAGE",
      targetSeason: Number(season),
    },
  };
}

function dependencyLevel(evidence) {
  const value = evidence?.dependency || NFL_TEAM_DEPENDENCY_STATES.UNKNOWN;
  return TEAM_DEPENDENCY_LEVELS[value] || TEAM_DEPENDENCY_LEVELS.UNKNOWN;
}

export function resolveNFLPlayerImpactIntegratedInputs({
  canonicalAvailabilityPlayer,
  canonicalAvailabilityRoster = [],
  season,
  week,
  team,
  teamDependencyEvidence = null,
} = {}) {
  const playerName = canonicalAvailabilityPlayer?.player?.playerName || null;
  const replacement = canonicalAvailabilityRoster.find((candidate) =>
    candidate?.player?.playerId ===
    canonicalAvailabilityPlayer?.context?.replacementPlayerId
  ) || null;

  const preliminary = resolveNFLPlayerAvailabilityImpactContext({
    canonicalAvailabilityPlayer,
    canonicalAvailabilityRoster,
  });

  const replacementPlayerName =
    preliminary?.replacement?.playerName ||
    replacement?.player?.playerName ||
    null;

  const affected = resolveCaliber({ playerName, team });
  const replacementResolved = replacementPlayerName
    ? resolveCaliber({ playerName: replacementPlayerName, team })
    : { rosterRow: null, evaluation: null, caliber: null };

  const usage = usageForPlayer({ playerName, team, season });
  const dependency =
    teamDependencyEvidence ||
    createUnknownNFLTeamDependencyEvidence({
      season,
      week,
      team,
      playerId: canonicalAvailabilityPlayer?.player?.playerId || null,
      playerName,
    });

  const contextResolution = resolveNFLPlayerAvailabilityImpactContext({
    canonicalAvailabilityPlayer,
    canonicalAvailabilityRoster,
    canonicalCaliber: affected.caliber,
    replacementCaliber: replacementResolved.caliber,
    roleEvidence: usage,
    teamDependency: dependencyLevel(dependency),
  });

  return {
    contract: "NFLPlayerImpactIntegratedInputs",
    version: NFL_PLAYER_IMPACT_INPUT_INTEGRATION_VERSION,
    player: {
      playerId: canonicalAvailabilityPlayer?.player?.playerId || null,
      playerName,
      team: upper(team),
    },
    canonicalCaliber: affected.caliber,
    replacement: contextResolution?.replacement || null,
    replacementCaliber: replacementResolved.caliber,
    usageEvidence: usage,
    teamDependencyEvidence: dependency,
    contextResolution,
    readiness: contextResolution?.readiness || "UNAVAILABLE",
    missingDimensions: contextResolution?.missingDimensions || [],
    safeguards: {
      caliberInvented: false,
      usageInvented: false,
      teamDependencyInvented: false,
      directImpactScoringInvoked: false,
      predictionScoringInvoked: false,
    },
  };
}

export default {
  NFL_PLAYER_IMPACT_INPUT_INTEGRATION_VERSION,
  resolveNFLPlayerImpactIntegratedInputs,
};
