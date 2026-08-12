export const NFL_TEAM_PERFORMANCE_SOURCE_ADAPTER_CONTRACT =
  "NFLTeamPerformanceSourceAdapter";
export const NFL_TEAM_PERFORMANCE_SOURCE_ADAPTER_VERSION =
  "NFL-TEAM-PERFORMANCE-SOURCE-ADAPTER-1.0.0";

export function validateNFLTeamPerformanceSourceAdapter(adapter) {
  const errors = [];
  if (!adapter || typeof adapter !== "object") {
    return { valid: false, errors: ["ADAPTER_REQUIRED"] };
  }
  if (adapter.contract !== NFL_TEAM_PERFORMANCE_SOURCE_ADAPTER_CONTRACT) {
    errors.push("INVALID_ADAPTER_CONTRACT");
  }
  if (typeof adapter.aggregate !== "function") {
    errors.push("AGGREGATE_FUNCTION_REQUIRED");
  }
  if (!adapter.provider || typeof adapter.provider !== "string") {
    errors.push("PROVIDER_REQUIRED");
  }
  return { valid: errors.length === 0, errors };
}

export function createNFLTeamPerformanceSourceAdapter({
  provider,
  dataset,
  aggregate,
  methodology,
  metadata = {},
} = {}) {
  const adapter = Object.freeze({
    contract: NFL_TEAM_PERFORMANCE_SOURCE_ADAPTER_CONTRACT,
    version: NFL_TEAM_PERFORMANCE_SOURCE_ADAPTER_VERSION,
    provider: typeof provider === "string" ? provider : null,
    dataset: typeof dataset === "string" ? dataset : null,
    methodology: methodology || null,
    metadata: Object.freeze({ ...metadata }),
    aggregate,
  });

  const validation = validateNFLTeamPerformanceSourceAdapter(adapter);
  if (!validation.valid) {
    throw new Error(`Invalid NFL team performance source adapter: ${validation.errors.join(", ")}`);
  }
  return adapter;
}

export default {
  NFL_TEAM_PERFORMANCE_SOURCE_ADAPTER_CONTRACT,
  NFL_TEAM_PERFORMANCE_SOURCE_ADAPTER_VERSION,
  validateNFLTeamPerformanceSourceAdapter,
  createNFLTeamPerformanceSourceAdapter,
};
