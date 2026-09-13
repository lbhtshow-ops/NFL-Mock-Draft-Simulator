import {
  createNFLAvailabilitySignal,
  NFL_AVAILABILITY_AUTHORITY,
  NFL_AVAILABILITY_SIGNAL_CLASSES,
} from "../../signals/NFLAvailabilitySignalContract.js";

export const NFLVERSE_CURRENT_ROSTER_PROVIDER_ID = "nflverse-current-rosters";
export const NFLVERSE_CURRENT_DEPTH_CHART_PROVIDER_ID = "nflverse-current-depth-charts";

const clean = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const integerOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
};

const normalizeTeam = (value) => clean(value)?.toUpperCase() || null;
const normalizeGameType = (value) => clean(value)?.toUpperCase() || "REG";

function matchesRosterScope(row, { season, week, gameType, team } = {}) {
  const expectedSeason = integerOrNull(season);
  const expectedWeek = integerOrNull(week);
  const expectedTeam = normalizeTeam(team);
  const expectedGameType = normalizeGameType(gameType);

  const rowSeason = integerOrNull(row?.season);
  const rowWeek = integerOrNull(row?.week);
  const rowTeam = normalizeTeam(row?.team);
  const rowGameType = normalizeGameType(row?.game_type || row?.gameType);

  if (expectedSeason != null && rowSeason != null && rowSeason !== expectedSeason) return false;
  if (expectedWeek != null && rowWeek != null && rowWeek !== expectedWeek) return false;
  if (expectedTeam && rowTeam && rowTeam !== expectedTeam) return false;
  if (expectedGameType && rowGameType && rowGameType !== expectedGameType) return false;

  return true;
}

function canonicalPlayerId(row) {
  return clean(row?.gsis_id || row?.gsisId);
}

function providerPlayerId(row) {
  return clean(row?.espn_id || row?.espnId || row?.gsis_id || row?.gsisId);
}

function playerNameFromRoster(row) {
  return clean(
    row?.full_name ||
    row?.player_name ||
    row?.playerName ||
    [row?.first_name, row?.last_name].filter(Boolean).join(" ")
  );
}

function playerNameFromDepth(row) {
  return clean(row?.player_name || row?.playerName || row?.full_name);
}

function rosterObservedAt(row, explicitObservedAt) {
  return clean(
    row?.last_modified_date ||
    row?.last_modified ||
    row?.updated_at ||
    row?.updated ||
    row?.timestamp ||
    explicitObservedAt
  );
}

function canonicalRosterStatus(row) {
  // IMPORTANT:
  // nflverse `status` is the semantic roster state (e.g. ACT).
  // `status_description_abbr` may contain opaque provider codes (e.g. A01).
  // Do not promote those opaque codes into canonical roster status.
  return clean(row?.status || row?.roster_status || row?.rosterStatus);
}

function rosterPosition(row) {
  return clean(row?.position || row?.depth_chart_position);
}

function depthObservedAt(row, explicitObservedAt) {
  return clean(row?.dt || row?.timestamp || row?.updated_at || explicitObservedAt);
}

function depthPosition(row) {
  return clean(
    row?.pos_abb ||
    row?.pos_name ||
    row?.position ||
    row?.depth_chart_position
  );
}

function depthRank(row) {
  return integerOrNull(
    row?.pos_rank ??
    row?.depth_chart_rank ??
    row?.depthRank
  );
}

export function adaptNFLVerseCurrentRosterRows(
  rows = [],
  {
    season,
    week,
    gameType = "REG",
    team = null,
    observedAt = null,
    sourceUrl = null,
  } = {},
) {
  if (!Array.isArray(rows)) {
    throw new Error("nflverse roster rows must be an array.");
  }

  const signals = [];

  for (const row of rows) {
    if (!matchesRosterScope(row, { season, week, gameType, team })) continue;

    const resolvedSeason = integerOrNull(row?.season) ?? integerOrNull(season);
    const resolvedWeek = integerOrNull(row?.week) ?? integerOrNull(week);
    const resolvedTeam = normalizeTeam(row?.team || team);
    const resolvedObservedAt = rosterObservedAt(row, observedAt);

    if (!resolvedSeason || !resolvedWeek || !resolvedTeam || !resolvedObservedAt) {
      continue;
    }

    try {
      signals.push(
        createNFLAvailabilitySignal({
          signalClass: NFL_AVAILABILITY_SIGNAL_CLASSES.ROSTER_STATUS,
          authority: NFL_AVAILABILITY_AUTHORITY.ROSTER,
          season: resolvedSeason,
          week: resolvedWeek,
          gameType: row?.game_type || gameType,
          team: resolvedTeam,
          playerId: canonicalPlayerId(row),
          playerName: playerNameFromRoster(row),
          position: rosterPosition(row),
          observedAt: resolvedObservedAt,
          effectiveAt: clean(row?.effective_at || row?.effectiveAt),
          source: NFLVERSE_CURRENT_ROSTER_PROVIDER_ID,
          sourceUrl,
          rosterStatus: canonicalRosterStatus(row),
          providerPlayerId: providerPlayerId(row),
          metadata: {
            provider: "nflverse",
            evidenceType: "CURRENT_ROSTER",
            espnId: clean(row?.espn_id || row?.espnId),
            gsisId: clean(row?.gsis_id || row?.gsisId),
            depthChartPosition: clean(row?.depth_chart_position),
            providerStatusDescriptionAbbr: clean(row?.status_description_abbr),
            sourceWeek: integerOrNull(row?.week),
            sourceGameType: clean(row?.game_type),
          },
        }),
      );
    } catch {
      // Invalid provider rows are ignored rather than weakening the canonical contract.
    }
  }

  return signals;
}

export function adaptNFLVerseCurrentDepthChartRows(
  rows = [],
  {
    season,
    week,
    gameType = "REG",
    team = null,
    observedAt = null,
    sourceUrl = null,
  } = {},
) {
  if (!Array.isArray(rows)) {
    throw new Error("nflverse depth-chart rows must be an array.");
  }

  const signals = [];

  for (const row of rows) {
    const rowTeam = normalizeTeam(row?.team || team);
    if (team && rowTeam !== normalizeTeam(team)) continue;

    const resolvedSeason = integerOrNull(row?.season) ?? integerOrNull(season);
    const resolvedWeek = integerOrNull(row?.week) ?? integerOrNull(week);
    const resolvedObservedAt = depthObservedAt(row, observedAt);

    if (!resolvedSeason || !resolvedWeek || !rowTeam || !resolvedObservedAt) {
      continue;
    }

    try {
      signals.push(
        createNFLAvailabilitySignal({
          signalClass: NFL_AVAILABILITY_SIGNAL_CLASSES.DEPTH_CHART,
          authority: NFL_AVAILABILITY_AUTHORITY.ROLE,
          season: resolvedSeason,
          week: resolvedWeek,
          gameType,
          team: rowTeam,
          playerId: canonicalPlayerId(row),
          playerName: playerNameFromDepth(row),
          position: depthPosition(row),
          observedAt: resolvedObservedAt,
          effectiveAt: clean(row?.effective_at || row?.effectiveAt),
          source: NFLVERSE_CURRENT_DEPTH_CHART_PROVIDER_ID,
          sourceUrl,
          depthPosition: depthPosition(row),
          depthRank: depthRank(row),
          providerPlayerId: providerPlayerId(row),
          metadata: {
            provider: "nflverse",
            evidenceType: "CURRENT_DEPTH_CHART",
            espnId: clean(row?.espn_id || row?.espnId),
            gsisId: clean(row?.gsis_id || row?.gsisId),
            positionGroup: clean(row?.pos_grp),
            positionName: clean(row?.pos_name),
            positionSlot: clean(row?.pos_slot),
            sourceTimestamp: clean(row?.dt),
          },
        }),
      );
    } catch {
      // Invalid provider rows are ignored rather than weakening the canonical contract.
    }
  }

  return signals;
}
