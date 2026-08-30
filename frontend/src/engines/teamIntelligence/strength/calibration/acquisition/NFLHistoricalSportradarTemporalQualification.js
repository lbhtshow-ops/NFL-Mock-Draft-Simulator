import { normalizeNFLHistoricalProviderTeamCode } from "../playerEvidence/NFLHistoricalSportradarIdentityCrosswalk.js";

export const NFL_HISTORICAL_SPORTRADAR_TEMPORAL_CLASSIFICATIONS = Object.freeze({
  SAFE_PRIOR_CALENDAR_DATE: "SAFE_PRIOR_CALENDAR_DATE",
  SAME_DAY_AMBIGUOUS: "SAME_DAY_AMBIGUOUS",
  AFTER_KICKOFF_DATE: "AFTER_KICKOFF_DATE",
  MISSING_STATUS_DATE: "MISSING_STATUS_DATE",
  UNRESOLVED_KICKOFF: "UNRESOLVED_KICKOFF",
  INVALID_TEMPORAL_VALUE: "INVALID_TEMPORAL_VALUE",
});

export const NFL_HISTORICAL_SPORTRADAR_TEMPORAL_THRESHOLDS = Object.freeze({
  minimumStatusDateCoverage: 0.95,
  minimumKickoffResolvedRate: 0.95,
  minimumPregameSafeRate: 0.95,
});

const teamAlias = (value) =>
  normalizeNFLHistoricalProviderTeamCode(
    value?.alias ?? value?.abbreviation ?? value?.abbr ?? null
  );

export function buildNFLHistoricalSportradarKickoffMap(schedulePayload = {}) {
  const games = schedulePayload?.week?.games ?? schedulePayload?.games ?? [];
  const map = new Map();
  for (const game of games) {
    const kickoff = game?.scheduled ?? game?.scheduled_at ?? game?.start_time ?? null;
    const home = teamAlias(game?.home);
    const away = teamAlias(game?.away);
    if (home && kickoff) map.set(home, kickoff);
    if (away && kickoff) map.set(away, kickoff);
  }
  return Object.freeze({ games, map });
}

export function classifyNFLHistoricalSportradarTemporalEvidence(statusDate, kickoff) {
  const C = NFL_HISTORICAL_SPORTRADAR_TEMPORAL_CLASSIFICATIONS;
  if (!statusDate) return C.MISSING_STATUS_DATE;
  if (!kickoff) return C.UNRESOLVED_KICKOFF;
  const statusDay = String(statusDate).slice(0, 10);
  const kickoffDay = String(kickoff).slice(0, 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(statusDay) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(kickoffDay)
  ) return C.INVALID_TEMPORAL_VALUE;
  if (statusDay < kickoffDay) return C.SAFE_PRIOR_CALENDAR_DATE;
  if (statusDay === kickoffDay) return C.SAME_DAY_AMBIGUOUS;
  return C.AFTER_KICKOFF_DATE;
}

export function isNFLHistoricalSportradarSafePriorDate(statusDate, kickoff) {
  return (
    classifyNFLHistoricalSportradarTemporalEvidence(statusDate, kickoff) ===
    NFL_HISTORICAL_SPORTRADAR_TEMPORAL_CLASSIFICATIONS.SAFE_PRIOR_CALENDAR_DATE
  );
}

export function summarizeNFLHistoricalSportradarTemporalQualification({
  totalRecords = 0,
  recordsWithStatusDate = 0,
  kickoffResolvedRecords = 0,
  classificationCounts = {},
  thresholds = NFL_HISTORICAL_SPORTRADAR_TEMPORAL_THRESHOLDS,
} = {}) {
  const safeCount =
    classificationCounts[
      NFL_HISTORICAL_SPORTRADAR_TEMPORAL_CLASSIFICATIONS.SAFE_PRIOR_CALENDAR_DATE
    ] ?? 0;
  const statusDateCoverage = totalRecords ? recordsWithStatusDate / totalRecords : 0;
  const kickoffResolvedRate = totalRecords ? kickoffResolvedRecords / totalRecords : 0;
  const pregameSafeRate = totalRecords ? safeCount / totalRecords : 0;
  const qualified =
    totalRecords > 0 &&
    statusDateCoverage >= thresholds.minimumStatusDateCoverage &&
    kickoffResolvedRate >= thresholds.minimumKickoffResolvedRate &&
    pregameSafeRate >= thresholds.minimumPregameSafeRate;
  const partiallyQualified =
    !qualified &&
    totalRecords > 0 &&
    statusDateCoverage >= thresholds.minimumStatusDateCoverage &&
    kickoffResolvedRate >= thresholds.minimumKickoffResolvedRate;

  return Object.freeze({
    totalRecords,
    recordsWithStatusDate,
    kickoffResolvedRecords,
    safeCount,
    statusDateCoverage,
    kickoffResolvedRate,
    pregameSafeRate,
    thresholds,
    qualified,
    partiallyQualified,
  });
}
