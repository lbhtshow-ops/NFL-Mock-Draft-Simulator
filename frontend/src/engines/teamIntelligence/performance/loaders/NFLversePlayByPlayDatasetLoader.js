import { createNFLTeamPerformanceDatasetLoader } from "./NFLTeamPerformanceDatasetLoader.js";

export const NFLVERSE_PBP_RELEASE_TAG = "pbp";
export const NFLVERSE_PBP_ASSET_KIND = "PLAY_BY_PLAY_CSV_GZIP";

export function buildNFLversePlayByPlayCsvGzipUrl(season) {
  if (!Number.isInteger(season) || season < 1999) return null;
  return `https://github.com/nflverse/nflverse-data/releases/download/${NFLVERSE_PBP_RELEASE_TAG}/play_by_play_${season}.csv.gz`;
}

export function createNFLversePlayByPlayDatasetLoader({
  loadRows,
  now = () => new Date().toISOString(),
} = {}) {
  if (typeof loadRows !== "function") {
    throw new Error("NFLverse loader requires injected loadRows implementation");
  }

  return createNFLTeamPerformanceDatasetLoader({
    provider: "NFLVERSE",
    dataset: "NFLVERSE_PLAY_BY_PLAY",
    metadata: {
      releaseTag: NFLVERSE_PBP_RELEASE_TAG,
      assetKind: NFLVERSE_PBP_ASSET_KIND,
      sourceRepository: "nflverse/nflverse-data",
    },
    async load({ season } = {}) {
      const sourceUrl = buildNFLversePlayByPlayCsvGzipUrl(season);
      if (!sourceUrl) {
        return { status: "INVALID_REQUEST", rows: [], sourceUrl: null };
      }
      try {
        const result = await loadRows({ season, sourceUrl });
        if (!result || !Array.isArray(result.rows)) {
          return { status: "MALFORMED_PROVIDER_RESPONSE", rows: [], sourceUrl };
        }
        return {
          status: "OK",
          rows: result.rows,
          sourceUrl,
          retrievedAt: result.retrievedAt || now(),
          providerUpdatedAt: result.providerUpdatedAt || null,
          datasetVersion: result.datasetVersion || null,
          sourceRefs: Array.isArray(result.sourceRefs) && result.sourceRefs.length
            ? result.sourceRefs
            : [sourceUrl],
        };
      } catch (error) {
        return {
          status: "PROVIDER_UNAVAILABLE",
          rows: [],
          sourceUrl,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });
}

export default {
  NFLVERSE_PBP_RELEASE_TAG,
  NFLVERSE_PBP_ASSET_KIND,
  buildNFLversePlayByPlayCsvGzipUrl,
  createNFLversePlayByPlayDatasetLoader,
};
