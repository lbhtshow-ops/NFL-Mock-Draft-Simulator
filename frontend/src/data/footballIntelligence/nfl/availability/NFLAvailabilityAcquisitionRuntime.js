export const NFL_AVAILABILITY_ACQUISITION_MANIFEST_CONTRACT =
  "NFLAvailabilityAcquisitionManifest";

export const NFL_AVAILABILITY_ACQUISITION_MANIFEST_VERSION =
  "NFL-AVAILABILITY-ACQUISITION-MANIFEST-1.0.0";

export const NFL_AVAILABILITY_RUNTIME_VERSION =
  "NFL-AVAILABILITY-RUNTIME-1.0.0";

export const NFL_AVAILABILITY_FRESHNESS_POLICY =
  Object.freeze({
    freshHours: 36,
    agingHours: 72,
  });

function integerOrNull(value) {
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function isoOrNull(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString();
}

export function createNFLAvailabilityAcquisitionPlan(
  season
) {
  const normalizedSeason =
    integerOrNull(season);

  if (!normalizedSeason) {
    throw new Error(
      "NFL availability acquisition requires a valid season."
    );
  }

  return {
    provider: "nflverse",
    dataset: "injuries",
    season: normalizedSeason,
    candidates: [
      `https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_${normalizedSeason}.csv`,
      `https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_${normalizedSeason}.csv.gz`,
    ],
  };
}

export function createNFLAvailabilityAcquisitionManifest({
  season,
  status = "UNAVAILABLE",
  provider = "nflverse",
  sourceUrl = null,
  checkedAt = null,
  fetchedAt = null,
  recordCount = 0,
  latestWeek = null,
  latestModifiedAt = null,
  message = null,
} = {}) {
  const normalizedSeason =
    integerOrNull(season);

  if (!normalizedSeason) {
    throw new Error(
      "NFL availability acquisition manifest requires season."
    );
  }

  return {
    contract:
      NFL_AVAILABILITY_ACQUISITION_MANIFEST_CONTRACT,
    version:
      NFL_AVAILABILITY_ACQUISITION_MANIFEST_VERSION,

    season:
      normalizedSeason,

    provider:
      String(provider || "unknown"),

    status:
      String(status || "UNAVAILABLE")
        .trim()
        .toUpperCase(),

    sourceUrl:
      sourceUrl || null,

    checkedAt:
      isoOrNull(checkedAt),

    fetchedAt:
      isoOrNull(fetchedAt),

    recordCount:
      Math.max(
        0,
        Number(recordCount) || 0
      ),

    latestWeek:
      integerOrNull(latestWeek),

    latestModifiedAt:
      isoOrNull(latestModifiedAt),

    message:
      message || null,
  };
}

export function isNFLAvailabilityAcquisitionManifest(
  value
) {
  return Boolean(
    value &&
      value.contract ===
        NFL_AVAILABILITY_ACQUISITION_MANIFEST_CONTRACT &&
      value.version ===
        NFL_AVAILABILITY_ACQUISITION_MANIFEST_VERSION &&
      Number.isInteger(value.season) &&
      typeof value.status === "string"
  );
}

function latestModifiedAt(records = []) {
  let latest = null;

  for (const record of records) {
    const raw =
      record?.provenance?.modifiedAt;

    if (!raw) continue;

    const date =
      new Date(raw);

    if (
      Number.isNaN(date.getTime())
    ) {
      continue;
    }

    if (
      !latest ||
      date.getTime() >
        latest.getTime()
    ) {
      latest = date;
    }
  }

  return latest
    ? latest.toISOString()
    : null;
}

function latestWeek(records = []) {
  return records.reduce(
    (max, record) =>
      Math.max(
        max,
        Number(record?.week) || -1
      ),
    -1
  );
}

function hoursBetween(
  newer,
  older
) {
  const newerDate =
    new Date(newer);

  const olderDate =
    new Date(older);

  if (
    Number.isNaN(newerDate.getTime()) ||
    Number.isNaN(olderDate.getTime())
  ) {
    return null;
  }

  return Math.max(
    0,
    (
      newerDate.getTime() -
      olderDate.getTime()
    ) / 3_600_000
  );
}

export function assessNFLAvailabilityRuntime({
  records = [],
  manifest = null,
  season,
  week = null,
  now = new Date().toISOString(),
} = {}) {
  const targetSeason =
    integerOrNull(season);

  const targetWeek =
    week === null
      ? null
      : integerOrNull(week);

  const seasonRecords =
    (Array.isArray(records)
      ? records
      : []
    ).filter(
      (record) =>
        record?.season ===
        targetSeason
    );

  const exactWeekRecords =
    targetWeek === null
      ? seasonRecords
      : seasonRecords.filter(
          (record) =>
            record?.week ===
            targetWeek
        );

  const newestModified =
    latestModifiedAt(
      exactWeekRecords.length
        ? exactWeekRecords
        : seasonRecords
    );

  const freshnessAnchor =
    newestModified ||
    manifest?.fetchedAt ||
    null;

  const ageHours =
    freshnessAnchor
      ? hoursBetween(
          now,
          freshnessAnchor
        )
      : null;

  let freshness =
    "UNAVAILABLE";

  if (freshnessAnchor) {
    if (
      ageHours <=
      NFL_AVAILABILITY_FRESHNESS_POLICY.freshHours
    ) {
      freshness = "FRESH";
    } else if (
      ageHours <=
      NFL_AVAILABILITY_FRESHNESS_POLICY.agingHours
    ) {
      freshness = "AGING";
    } else {
      freshness = "STALE";
    }
  }

  let state =
    "UNAVAILABLE";

  if (
    targetWeek !== null &&
    exactWeekRecords.length === 0 &&
    seasonRecords.length > 0
  ) {
    state =
      "MISSING_REQUESTED_WEEK";
  } else if (
    exactWeekRecords.length > 0
  ) {
    state =
      freshness === "STALE"
        ? "STALE"
        : "READY";
  } else if (
    targetWeek === null &&
    seasonRecords.length > 0
  ) {
    state =
      freshness === "STALE"
        ? "STALE"
        : "READY";
  }

  return {
    version:
      NFL_AVAILABILITY_RUNTIME_VERSION,

    season:
      targetSeason,

    week:
      targetWeek,

    state,
    freshness,

    recordCount:
      exactWeekRecords.length,

    seasonRecordCount:
      seasonRecords.length,

    latestWeek:
      latestWeek(
        seasonRecords
      ),

    latestModifiedAt:
      newestModified,

    ageHours:
      ageHours === null
        ? null
        : Number(
            ageHours.toFixed(2)
          ),

    providerStatus:
      manifest?.status ||
      "UNKNOWN",

    sourceUrl:
      manifest?.sourceUrl ||
      null,

    checkedAt:
      manifest?.checkedAt ||
      null,

    message:
      state ===
      "UNAVAILABLE"
        ? "No canonical availability evidence is available."
        : state ===
          "MISSING_REQUESTED_WEEK"
          ? "Canonical availability evidence exists for the season but not the requested week."
          : freshness ===
            "STALE"
            ? "Canonical availability evidence exists but is stale."
            : null,
  };
}

export default {
  NFL_AVAILABILITY_ACQUISITION_MANIFEST_CONTRACT,
  NFL_AVAILABILITY_ACQUISITION_MANIFEST_VERSION,
  NFL_AVAILABILITY_RUNTIME_VERSION,
  NFL_AVAILABILITY_FRESHNESS_POLICY,
  createNFLAvailabilityAcquisitionPlan,
  createNFLAvailabilityAcquisitionManifest,
  isNFLAvailabilityAcquisitionManifest,
  assessNFLAvailabilityRuntime,
};
