import {
  createNFLProtectionPressureEvidence,
} from "./NFLProtectionPressureEvidenceContract.js";

function isObject(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function looksLikeProtectionPressureEvidence(value) {
  if (!isObject(value)) return false;

  const sample = value.sample;
  const offense = value.offense;
  const defense = value.defense;

  if (!isObject(sample) || !isObject(offense) || !isObject(defense)) {
    return false;
  }

  const hasDropbackSurface =
    Object.prototype.hasOwnProperty.call(
      sample,
      "offensiveDropbacks"
    ) ||
    Object.prototype.hasOwnProperty.call(
      sample,
      "defensiveDropbacks"
    );

  const hasPressureSurface =
    Object.prototype.hasOwnProperty.call(
      offense,
      "pressureAllowedRate"
    ) ||
    Object.prototype.hasOwnProperty.call(
      defense,
      "pressureGeneratedRate"
    );

  return hasDropbackSurface && hasPressureSurface;
}

function collectObjects(
  value,
  path = "snapshot",
  results = [],
  seen = new WeakSet()
) {
  if (!isObject(value) && !Array.isArray(value)) {
    return results;
  }

  if (typeof value === "object" && value !== null) {
    if (seen.has(value)) {
      return results;
    }
    seen.add(value);
  }

  if (isObject(value) && looksLikeProtectionPressureEvidence(value)) {
    results.push({
      path,
      value,
    });
  }

  if (Array.isArray(value)) {
    value.forEach((child, index) => {
      collectObjects(
        child,
        `${path}[${index}]`,
        results,
        seen
      );
    });
    return results;
  }

  for (const [key, child] of Object.entries(value)) {
    if (
      child &&
      typeof child === "object"
    ) {
      collectObjects(
        child,
        `${path}.${key}`,
        results,
        seen
      );
    }
  }

  return results;
}

function firstText(...values) {
  return values.find(
    value =>
      typeof value === "string" &&
      value.trim()
  )?.trim() || null;
}

function firstInteger(...values) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isInteger(n)) {
      return n;
    }
  }
  return null;
}

export function extractNFLProtectionPressureEvidenceFromHistoricalSnapshot(
  snapshot
) {
  const matches =
    collectObjects(snapshot);

  return matches.map(
    ({ path, value }) =>
      createNFLProtectionPressureEvidence({
        team:
          firstText(
            value.team,
            value.teamAbbreviation,
            value.abbreviation,
            value.code
          ),

        season:
          firstInteger(
            value.season,
            snapshot?.game?.season
          ),

        throughWeek:
          firstInteger(
            value.throughWeek,
            value.week,
            snapshot?.game?.week
          ),

        phaseScope:
          firstText(
            value.phaseScope,
            snapshot?.game?.gameType
          ),

        sample: {
          offensiveDropbacks:
            value.sample?.offensiveDropbacks,

          defensiveDropbacks:
            value.sample?.defensiveDropbacks,
        },

        offense: {
          pressureAllowedRate:
            value.offense?.pressureAllowedRate,

          sackAllowedRate:
            value.offense?.sackAllowedRate,
        },

        defense: {
          pressureGeneratedRate:
            value.defense?.pressureGeneratedRate,

          sackGeneratedRate:
            value.defense?.sackGeneratedRate,
        },

        provenance: {
          source:
            "GENERATED_NFL_HISTORICAL_PREGAME_SNAPSHOT",

          provider:
            firstText(
              value.provenance?.provider,
              snapshot?.provenance?.featureSource
            ),

          dataset:
            firstText(
              value.provenance?.dataset
            ),

          sourceVersion:
            firstText(
              value.provenance?.sourceVersion,
              snapshot?.pregame?.sourceVersion
            ),

          generatedAt:
            firstText(
              value.provenance?.generatedAt,
              snapshot?.provenance?.generatedAt
            ),

          path,
        },
      })
  );
}

export function buildNFLProtectionPressureHistoricalEvidenceIndex(
  snapshots = []
) {
  const records = [];

  for (const snapshot of Array.isArray(snapshots) ? snapshots : []) {
    records.push(
      ...extractNFLProtectionPressureEvidenceFromHistoricalSnapshot(
        snapshot
      )
    );
  }

  const unique = new Map();

  for (const record of records) {
    const key = [
      record.team,
      record.season,
      record.throughWeek,
      record.phaseScope,
      record.sample.offensiveDropbacks,
      record.sample.defensiveDropbacks,
      record.offense.pressureAllowedRate,
      record.defense.pressureGeneratedRate,
    ].join("|");

    if (!unique.has(key)) {
      unique.set(key, record);
    }
  }

  return [...unique.values()];
}

export default {
  extractNFLProtectionPressureEvidenceFromHistoricalSnapshot,
  buildNFLProtectionPressureHistoricalEvidenceIndex,
};
