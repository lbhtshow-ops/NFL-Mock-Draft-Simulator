import crypto from "crypto";

function stableStringify(value) {
  if (
    value === null ||
    typeof value !== "object"
  ) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value
      .map(stableStringify)
      .join(",")}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map(
      (key) =>
        `${JSON.stringify(key)}:${stableStringify(
          value[key]
        )}`
    )
    .join(",")}}`;
}

export function sha256Json(value) {
  return crypto
    .createHash("sha256")
    .update(stableStringify(value))
    .digest("hex");
}

export function createNFLHistoricalReplayManifest({
  startSeason,
  endSeason,
  games = [],
  snapshots = [],
  exclusions = [],
  generatedAt = null,
} = {}) {
  return {
    contract:
      "NFLHistoricalReplayManifest",
    version:
      "NFL-HISTORICAL-REPLAY-MANIFEST-1.0.0",

    range: {
      startSeason,
      endSeason,
    },

    counts: {
      games:
        games.length,
      snapshots:
        snapshots.length,
      exclusions:
        exclusions.length,
    },

    hashes: {
      games:
        sha256Json(games),
      snapshots:
        sha256Json(snapshots),
      exclusions:
        sha256Json(exclusions),
    },

    generatedAt,
  };
}

export default {
  sha256Json,
  createNFLHistoricalReplayManifest,
};
