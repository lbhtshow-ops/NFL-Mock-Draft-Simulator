export const HISTORICAL_NFL_PLAYER_EVALUATION_PROVIDER_VERSION =
  "FIE-NFL-HISTORICAL-PLAYER-EVALUATION-PROVIDER-1.0.0";

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function sum(rows = [], key) {
  return rows.reduce((total, row) => {
    const value = row?.[key];
    return finite(value) ? total + value : total;
  }, 0);
}

function countFinite(rows = [], key) {
  return rows.reduce(
    (total, row) => total + (finite(row?.[key]) ? 1 : 0),
    0
  );
}

function buildUsageContext(evidenceBundle = {}) {
  const snapRows =
    evidenceBundle?.priorSnapEvidence ||
    evidenceBundle?.priorWeeklySnaps ||
    [];

  if (!Array.isArray(snapRows) || snapRows.length === 0) {
    return Object.freeze({
      available: false,
      gamesTracked: 0,
      offenseSnaps: 0,
      defenseSnaps: 0,
      specialTeamsSnaps: 0,
      totalSnaps: 0,
      maxWeeklySnapShare: 0,
      matchedBy: "HISTORICAL_EVIDENCE_BUNDLE",
    });
  }

  const offenseSnaps = sum(snapRows, "offenseSnaps");
  const defenseSnaps = sum(snapRows, "defenseSnaps");
  const specialTeamsSnaps = sum(snapRows, "specialTeamsSnaps");
  const totalSnaps =
    offenseSnaps + defenseSnaps + specialTeamsSnaps;

  const shares = snapRows
    .map((row) =>
      finite(row?.snapShare)
        ? row.snapShare
        : finite(row?.offenseSnapPct)
          ? row.offenseSnapPct
          : finite(row?.defenseSnapPct)
            ? row.defenseSnapPct
            : null
    )
    .filter(finite);

  return Object.freeze({
    available: true,
    gamesTracked: snapRows.length,
    offenseSnaps,
    defenseSnaps,
    specialTeamsSnaps,
    totalSnaps,
    maxWeeklySnapShare: shares.length ? Math.max(...shares) : 0,
    matchedBy: "HISTORICAL_EVIDENCE_BUNDLE",
  });
}

function buildPerformanceContext(evidenceBundle = {}) {
  const rows =
    evidenceBundle?.priorCurrentSeasonWeeklyStats ||
    evidenceBundle?.historicalWeeklyStats ||
    [];

  if (!Array.isArray(rows) || rows.length === 0) {
    return Object.freeze({
      available: false,
      gamesTracked: 0,
      matchedBy: "HISTORICAL_EVIDENCE_BUNDLE",
      totals: Object.freeze({}),
      valueCoverage: Object.freeze({}),
    });
  }

  const fields = [
    "passingAttempts","passingYards","passingTDs","interceptions",
    "carries","rushingYards","rushingTDs","targets","receptions",
    "receivingYards","receivingTDs","defensiveSnaps","tackles",
    "sacks","interceptionsDef"
  ];

  const totals = {};
  const valueCoverage = {};
  for (const field of fields) {
    totals[field] = sum(rows, field);
    valueCoverage[field] = countFinite(rows, field);
  }

  return Object.freeze({
    available: true,
    gamesTracked: rows.length,
    matchedBy: "HISTORICAL_EVIDENCE_BUNDLE",
    totals: Object.freeze(totals),
    valueCoverage: Object.freeze(valueCoverage),
  });
}

export function projectHistoricalNFLPlayerEvaluationContext({
  player = {},
  asOf = null,
  evidenceBundle = null,
} = {}) {
  if (!asOf) {
    return Object.freeze({
      status: "UNAVAILABLE",
      reason: "HISTORICAL_AS_OF_REQUIRED",
      asOf: null,
      player,
      context: null,
    });
  }

  if (!evidenceBundle) {
    return Object.freeze({
      status: "UNAVAILABLE",
      reason: "HISTORICAL_EVIDENCE_BUNDLE_REQUIRED",
      asOf,
      player,
      context: null,
    });
  }

  const temporallySafe =
    evidenceBundle?.targetWeekIncluded !== true &&
    evidenceBundle?.futureWeekIncluded !== true &&
    evidenceBundle?.futureSeasonIncluded !== true;

  if (!temporallySafe) {
    return Object.freeze({
      status: "UNAVAILABLE",
      reason: "HISTORICAL_EVIDENCE_NOT_TEMPORALLY_SAFE",
      asOf,
      player,
      context: null,
    });
  }

  const usageProfile = buildUsageContext(evidenceBundle);
  const performanceProfile = buildPerformanceContext(evidenceBundle);
  const recognitionSummary =
    evidenceBundle?.historicalRecognitionSummary ?? null;

  return Object.freeze({
    status: "READY_FOR_CANONICAL_POSITION_MODEL_ADAPTER",
    reason: null,
    asOf,
    player,
    context: Object.freeze({
      historical: true,
      asOf,
      usageProfile,
      performanceProfile,
      recognitionSummary,
      careerBaseline:
        evidenceBundle?.careerBaseline ??
        evidenceBundle?.historicalCareerBaseline ??
        null,
      evidenceBundle,
    }),
    providerVersion: HISTORICAL_NFL_PLAYER_EVALUATION_PROVIDER_VERSION,
  });
}

/**
 * Provider required by evaluateCanonicalHistoricalNFLPlayer().
 *
 * C7 intentionally does not call any position model yet. C8 will connect this
 * projected historical context to the canonical position-model dependency seam
 * after the model input audit is reviewed.
 */
export function historicalNFLPlayerEvaluationProvider({
  player = {},
  asOf = null,
  evidenceBundle = null,
} = {}) {
  const projected = projectHistoricalNFLPlayerEvaluationContext({
    player,
    asOf,
    evidenceBundle,
  });

  if (projected.status !== "READY_FOR_CANONICAL_POSITION_MODEL_ADAPTER") {
    return Object.freeze({
      status: "UNAVAILABLE",
      reason: projected.reason,
    });
  }

  return Object.freeze({
    status: "UNAVAILABLE",
    reason: "CANONICAL_POSITION_MODEL_HISTORICAL_ADAPTER_REQUIRED",
    historicalContext: projected.context,
    providerVersion: HISTORICAL_NFL_PLAYER_EVALUATION_PROVIDER_VERSION,
  });
}

historicalNFLPlayerEvaluationProvider.supportsHistoricalEvidence = true;

export default historicalNFLPlayerEvaluationProvider;
