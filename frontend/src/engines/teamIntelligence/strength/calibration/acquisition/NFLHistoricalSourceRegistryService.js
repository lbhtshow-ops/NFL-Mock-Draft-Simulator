import {getNFLHistoricalCalibrationSourceRegistry} from "./NFLHistoricalCalibrationSourceRegistry.js";

export function inspectNFLHistoricalSourceRegistry() {
  const sources = getNFLHistoricalCalibrationSourceRegistry();
  const providers = [...new Set(sources.map((x)=>x.provider))];
  const domains = [...new Set(sources.map((x)=>x.domain))];
  return Object.freeze({
    serviceVersion: "FIE-NFL-HISTORICAL-SOURCE-REGISTRY-SERVICE-1.0.0",
    status: "REGISTRY_READY_ACQUISITION_NOT_EXECUTED",
    sourceCount: sources.length,
    providers: Object.freeze(providers),
    domains: Object.freeze(domains),
    sources,
    networkFetchExecuted: false,
    persistenceExecuted: false,
    databaseMutationExecuted: false,
  });
}
