export function createNFLHistoricalAcquisitionRequest(input = {}) {
  return Object.freeze({
    contractVersion: "FIE-NFL-HISTORICAL-ACQUISITION-REQUEST-1.0.0",
    requestId: input.requestId ?? null,
    sourceId: input.sourceId ?? null,
    seasons: Object.freeze([...(input.seasons ?? [])].filter(Number.isInteger)),
    weeks: Object.freeze([...(input.weeks ?? [])].filter(Number.isInteger)),
    domains: Object.freeze([...(input.domains ?? [])]),
    requestedAt: input.requestedAt ?? null,
    mode: input.mode ?? "DISCOVERY_ONLY",
    persist: false,
    mutateDatabase: false,
    executeNetworkFetch: false,
  });
}
