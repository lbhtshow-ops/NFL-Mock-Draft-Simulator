#!/usr/bin/env node
import {
  createNFLHistoricalSportradarAcquisitionClient,
} from "../src/engines/teamIntelligence/strength/calibration/acquisition/NFLHistoricalSportradarAcquisition.js";
import {
  buildNFLHistoricalSportradarKickoffMap,
  classifyNFLHistoricalSportradarTemporalEvidence,
  NFL_HISTORICAL_SPORTRADAR_TEMPORAL_CLASSIFICATIONS,
  NFL_HISTORICAL_SPORTRADAR_TEMPORAL_THRESHOLDS,
  summarizeNFLHistoricalSportradarTemporalQualification,
} from "../src/engines/teamIntelligence/strength/calibration/acquisition/NFLHistoricalSportradarTemporalQualification.js";
import { normalizeNFLHistoricalProviderTeamCode } from "../src/engines/teamIntelligence/strength/calibration/playerEvidence/NFLHistoricalSportradarIdentityCrosswalk.js";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] != null ? process.argv[i + 1] : fallback;
}

const season = Number(arg("--season", "2025"));
const startWeek = Number(arg("--start-week", "1"));
const endWeek = Number(arg("--end-week", "18"));
const gameType = String(arg("--game-type", "REG")).toUpperCase();
if (!Number.isInteger(season) || !Number.isInteger(startWeek) || !Number.isInteger(endWeek) || startWeek < 1 || endWeek < startWeek) {
  throw new Error("Invalid season/week arguments.");
}

const client = createNFLHistoricalSportradarAcquisitionClient();
const weeks = [];
const samples = [];
const aggregateCounts = {};
let totalRecords = 0;
let recordsWithStatusDate = 0;
let kickoffResolvedRecords = 0;
let gameCount = 0;

for (let week = startWeek; week <= endWeek; week++) {
  console.error(`[2025 temporal audit] week ${week}/${endWeek}`);
  const acquired = await client.acquireWeek({ season, week, gameType });
  const { games, map } = buildNFLHistoricalSportradarKickoffMap(acquired.schedulePayload);
  gameCount += games.length;
  const counts = {};
  let weekRecords = 0;

  for (const team of acquired.injuryPayload?.teams ?? []) {
    const teamCode = normalizeNFLHistoricalProviderTeamCode(
      team?.alias ?? team?.abbreviation ?? team?.abbr ?? null
    );
    const kickoff = teamCode ? map.get(teamCode) ?? null : null;
    for (const player of team?.players ?? []) {
      for (const injury of player?.injuries ?? []) {
        const statusDate = injury?.status_date ?? injury?.statusDate ?? null;
        const classification = classifyNFLHistoricalSportradarTemporalEvidence(
          statusDate,
          kickoff
        );
        weekRecords++;
        totalRecords++;
        if (statusDate) recordsWithStatusDate++;
        if (kickoff) kickoffResolvedRecords++;
        counts[classification] = (counts[classification] ?? 0) + 1;
        aggregateCounts[classification] =
          (aggregateCounts[classification] ?? 0) + 1;
        if (
          classification !==
            NFL_HISTORICAL_SPORTRADAR_TEMPORAL_CLASSIFICATIONS.SAFE_PRIOR_CALENDAR_DATE &&
          samples.length < 100
        ) {
          samples.push({
            week,
            team: teamCode,
            player: player?.name ?? null,
            status: injury?.status ?? null,
            statusDate,
            kickoff,
            classification,
          });
        }
      }
    }
  }
  weeks.push({
    week,
    gameCount: games.length,
    teamKickoffCount: map.size,
    injuryRecordCount: weekRecords,
    classificationCounts: counts,
  });
}

const summary = summarizeNFLHistoricalSportradarTemporalQualification({
  totalRecords,
  recordsWithStatusDate,
  kickoffResolvedRecords,
  classificationCounts: aggregateCounts,
  thresholds: NFL_HISTORICAL_SPORTRADAR_TEMPORAL_THRESHOLDS,
});
const decision = summary.qualified
  ? "2025_SPORTRADAR_TEMPORAL_SOURCE_QUALIFIED_FOR_HISTORICAL_NORMALIZATION_REVIEW"
  : summary.partiallyQualified
    ? "2025_SPORTRADAR_TEMPORAL_SOURCE_PARTIALLY_QUALIFIED_REQUIRES_REVIEW"
    : "2025_SPORTRADAR_TEMPORAL_SOURCE_NOT_QUALIFIED";

console.log(JSON.stringify({
  contractVersion: "FIE-NFL-2025-SPORTRADAR-HISTORICAL-TEMPORAL-QUALIFICATION-AUDIT-1.0.0",
  sprint: "2.25.0-RC1",
  mode: "READ_ONLY_FULL_SEASON_PROVIDER_TEMPORAL_QUALIFICATION_AUDIT",
  scope: { season, gameType, startWeek, endWeek },
  decision,
  source: {
    provider: "sportradar-nfl-v7",
    endpointClass: "weekly-injuries + weekly-schedule",
    externalNetworkInvoked: true,
    repositoryMutationPerformed: false,
    databaseMutationPerformed: false,
  },
  totals: {
    gameCount,
    injuryRecordCount: totalRecords,
    recordsWithStatusDate,
    statusDateCoverage: summary.statusDateCoverage,
    kickoffResolvedRecords,
    kickoffResolvedRate: summary.kickoffResolvedRate,
    safePriorCalendarDateCount: summary.safeCount,
    pregameSafeRate: summary.pregameSafeRate,
    classificationCounts: aggregateCounts,
  },
  thresholds: NFL_HISTORICAL_SPORTRADAR_TEMPORAL_THRESHOLDS,
  weeks,
  excludedOrAmbiguousSample: samples,
  interpretation: {
    statusDateSemantics: "Provider injury-level status_date is preserved as source temporal provenance.",
    conservativeQualificationRule: "Only status_date calendar dates strictly earlier than kickoff calendar date are counted pregame-safe; same-day records are excluded as ambiguous.",
    acquisitionTimeMayQualifyHistoricalEvidence: false,
    normalizationAuthorized: false,
    treatmentConstructionAuthorized: false,
    matchingAuthorized: false,
    attRecomputationAuthorized: false,
    calibrationAuthorized: false,
    teamStrengthMutationAuthorized: false,
    decisionModelMutationAuthorized: false,
    pickemMutationAuthorized: false,
  },
  authorizationBoundary: {
    historicalNormalizationReviewMayAdvance: summary.qualified,
    historicalNormalizationAuthorized: false,
    treatmentControlRebuildAuthorized: false,
    matchingRerunAuthorized: false,
    attRecomputationAuthorized: false,
    uncertaintyRecomputationAuthorized: false,
    productionCalibrationAuthorized: false,
    shadowTeamStrengthTransformationAuthorized: false,
  },
  safeguards: {
    sourceTimestampFabricated: false,
    acquisitionTimeSubstitutedForSourceTime: false,
    sameDayAssumedPregameSafe: false,
    sourceDataPersisted: false,
    databaseMutated: false,
    pickemScoringMutated: false,
  },
}, null, 2));
