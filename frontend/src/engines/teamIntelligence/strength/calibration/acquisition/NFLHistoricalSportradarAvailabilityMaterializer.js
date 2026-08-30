import { adaptSportradarWeeklyInjuriesPayload } from "../../../../../data/footballIntelligence/nfl/availability/providers/sportradar/SportradarNFLAvailabilityProviderAdapter.js";
import {
  normalizeNFLHistoricalProviderTeamCode,
  resolveNFLHistoricalSportradarPlayerIdentity,
} from "../playerEvidence/NFLHistoricalSportradarIdentityCrosswalk.js";
import { qualifyNFLHistoricalAvailabilitySeason } from "./NFLHistoricalAvailabilityQualificationContract.js";
import {
  buildNFLHistoricalSportradarKickoffMap,
  classifyNFLHistoricalSportradarTemporalEvidence,
  NFL_HISTORICAL_SPORTRADAR_TEMPORAL_CLASSIFICATIONS,
} from "./NFLHistoricalSportradarTemporalQualification.js";

export const NFL_HISTORICAL_SPORTRADAR_CANONICAL_COLUMNS = Object.freeze([
  "season",
  "team",
  "week",
  "gsis_id",
  "position",
  "full_name",
  "report_primary_injury",
  "report_status",
  "practice_primary_injury",
  "practice_status",
  "date_modified",
]);

const clean = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const INJURY_STATUS_DATE_FIELDS = new Set([
  "injuries[].status_date",
  "injuries[].statusDate",
]);

function quarantine(reason, evidence, extras = {}) {
  return Object.freeze({
    reason,
    season: evidence?.season ?? null,
    week: evidence?.week ?? null,
    team: normalizeNFLHistoricalProviderTeamCode(evidence?.team),
    providerPlayerId: clean(evidence?.provenance?.providerPlayerId),
    playerName: clean(evidence?.player?.playerName),
    position: clean(evidence?.player?.position),
    sourceTemporalField: clean(evidence?.provenance?.sourceTemporalField),
    sourceModifiedAt: clean(evidence?.provenance?.modifiedAt),
    ...extras,
  });
}

export function materializeNFLHistoricalSportradarWeek({
  season,
  week,
  gameType = "REG",
  injuryPayload,
  schedulePayload,
  injuryUrl = null,
  crosswalk,
} = {}) {
  const { map: kickoffMap } = buildNFLHistoricalSportradarKickoffMap(schedulePayload);
  const evidenceRecords = adaptSportradarWeeklyInjuriesPayload(injuryPayload, {
    season: Number(season),
    week: Number(week),
    gameType,
    sourceUrl: injuryUrl,
  });

  const rows = [];
  const quarantined = [];
  const sourceMetrics = {
    sourceRecordCount: evidenceRecords.length,
    recordsWithInjuryStatusDate: 0,
    kickoffResolvedRecords: 0,
    exactIdentityResolvedRecords: 0,
    safePriorCalendarDateRecords: 0,
    classificationCounts: {},
  };

  for (const evidence of evidenceRecords) {
    const team = normalizeNFLHistoricalProviderTeamCode(evidence.team);
    const kickoff = team ? kickoffMap.get(team) ?? null : null;
    const modifiedAt = clean(evidence?.provenance?.modifiedAt);
    const sourceTemporalField = clean(evidence?.provenance?.sourceTemporalField);
    const providerPlayerId = clean(evidence?.provenance?.providerPlayerId);
    const identity = resolveNFLHistoricalSportradarPlayerIdentity(
      providerPlayerId,
      crosswalk
    );

    if (INJURY_STATUS_DATE_FIELDS.has(sourceTemporalField) && modifiedAt) {
      sourceMetrics.recordsWithInjuryStatusDate++;
    }
    if (kickoff) sourceMetrics.kickoffResolvedRecords++;
    if (identity.status === "RESOLVED") sourceMetrics.exactIdentityResolvedRecords++;

    if (!INJURY_STATUS_DATE_FIELDS.has(sourceTemporalField) || !modifiedAt) {
      quarantined.push(
        quarantine("SOURCE_INJURY_STATUS_DATE_REQUIRED", evidence, { kickoff })
      );
      continue;
    }

    const temporalClassification = classifyNFLHistoricalSportradarTemporalEvidence(
      modifiedAt,
      kickoff
    );
    sourceMetrics.classificationCounts[temporalClassification] =
      (sourceMetrics.classificationCounts[temporalClassification] ?? 0) + 1;

    if (
      temporalClassification !==
      NFL_HISTORICAL_SPORTRADAR_TEMPORAL_CLASSIFICATIONS.SAFE_PRIOR_CALENDAR_DATE
    ) {
      quarantined.push(
        quarantine(temporalClassification, evidence, { kickoff })
      );
      continue;
    }
    sourceMetrics.safePriorCalendarDateRecords++;

    if (identity.status !== "RESOLVED") {
      quarantined.push(
        quarantine(`IDENTITY_${identity.status}`, evidence, {
          kickoff,
          identityReason: identity.reason,
          identityCandidates: identity.candidates ?? [],
        })
      );
      continue;
    }

    rows.push(
      Object.freeze({
        season: Number(season),
        team,
        week: Number(week),
        gsis_id: identity.canonicalPlayerId,
        position: clean(evidence?.player?.position),
        full_name: clean(evidence?.player?.playerName),
        report_primary_injury: clean(evidence?.injury?.primary),
        report_status: clean(evidence?.status?.report),
        practice_primary_injury: clean(evidence?.injury?.primary),
        practice_status: clean(evidence?.status?.practice),
        date_modified: modifiedAt,
      })
    );
  }

  return Object.freeze({
    season: Number(season),
    week: Number(week),
    rows: Object.freeze(rows),
    quarantined: Object.freeze(quarantined),
    sourceMetrics: Object.freeze({
      ...sourceMetrics,
      classificationCounts: Object.freeze({ ...sourceMetrics.classificationCounts }),
    }),
  });
}

export function qualifyNFLHistoricalSportradarMaterialization({
  season,
  sourceRecordCount,
  canonicalRows,
  sourceRecordsWithInjuryStatusDate,
  kickoffResolvedRecords,
  safePriorCalendarDateRecords,
  duplicateRate = 0,
  sourceUrl = "sportradar-nfl-v7:weekly-injuries+weekly-schedule",
} = {}) {
  const n = Number(sourceRecordCount) || 0;
  const rowCount = n;
  return qualifyNFLHistoricalAvailabilitySeason({
    season: Number(season),
    sourceAvailable: n > 0,
    sourceFormat: "CANONICAL_CSV_FROM_SPORTRADAR",
    sourceUrl,
    rowCount,
    columns: [...NFL_HISTORICAL_SPORTRADAR_CANONICAL_COLUMNS],
    gsisCoverageRate: n ? canonicalRows.length / n : null,
    dateModifiedCoverageRate: n ? Number(sourceRecordsWithInjuryStatusDate) / n : null,
    pregameSafeRate: n ? Number(safePriorCalendarDateRecords) / n : null,
    duplicateRate,
  });
}

export function getNFLHistoricalSportradarMaterializationGovernance() {
  return Object.freeze({
    contractVersion: "FIE-NFL-HISTORICAL-SPORTRADAR-MATERIALIZATION-GOVERNANCE-2C3-1.0.0",
    provider: "sportradar-nfl-v7",
    canonicalIdentity: "gsis_id",
    exactIdentityRequired: true,
    injuryStatusDateRequired: true,
    sameDayEvidenceAccepted: false,
    acquisitionTimeAcceptedAsHistoricalEvidence: false,
    providerTeamAliasNormalizationAllowed: true,
    canonicalJacksonvilleTeamCode: "JAX",
    unresolvedRowsQuarantined: true,
    historicalArtifactWriteRequiresExplicitFlag: true,
    treatmentControlRebuildAuthorized: false,
    matchingAuthorized: false,
    attRecomputationAuthorized: false,
    uncertaintyRecomputationAuthorized: false,
    learnedWeightsAuthorized: false,
    calibrationAuthorized: false,
    teamStrengthMutationAuthorized: false,
    decisionModelMutationAuthorized: false,
    pickemMutationAuthorized: false,
    databaseMutationAuthorized: false,
  });
}
