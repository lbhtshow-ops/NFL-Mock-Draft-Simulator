export const NFL_TEAM_PERFORMANCE_DATASET_LOADER_CONTRACT = "NFLTeamPerformanceDatasetLoader";
export const NFL_TEAM_PERFORMANCE_DATASET_LOADER_VERSION = "NFL-TEAM-PERFORMANCE-DATASET-LOADER-1.0.0";

export function createNFLTeamPerformanceDatasetLoader({ provider, dataset, load, metadata = {} } = {}) {
  if (typeof provider !== "string" || !provider.trim()) throw new Error("provider required");
  if (typeof dataset !== "string" || !dataset.trim()) throw new Error("dataset required");
  if (typeof load !== "function") throw new Error("load function required");
  return Object.freeze({
    contract: NFL_TEAM_PERFORMANCE_DATASET_LOADER_CONTRACT,
    version: NFL_TEAM_PERFORMANCE_DATASET_LOADER_VERSION,
    provider: provider.trim().toUpperCase(),
    dataset: dataset.trim().toUpperCase(),
    metadata: Object.freeze({ ...metadata }),
    load,
  });
}

export default {
  NFL_TEAM_PERFORMANCE_DATASET_LOADER_CONTRACT,
  NFL_TEAM_PERFORMANCE_DATASET_LOADER_VERSION,
  createNFLTeamPerformanceDatasetLoader,
};
