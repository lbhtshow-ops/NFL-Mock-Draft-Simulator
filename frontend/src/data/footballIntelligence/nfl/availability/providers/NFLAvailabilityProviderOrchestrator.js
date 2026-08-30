import { classifyNFLAvailabilityProviderFreshness, selectNFLAvailabilityProvider } from "./NFLAvailabilityProviderRegistry.js";

export async function observeNFLAvailabilityProviders(registry, adapters = {}, request = {}) {
  const observations = [];
  for (const provider of registry?.providers || []) {
    const adapter = adapters[provider.id];
    if (!adapter?.acquire) { observations.push({ providerId: provider.id, state: "UNAVAILABLE", reason: "ADAPTER_NOT_CONFIGURED" }); continue; }
    try {
      const result = await adapter.acquire(request);
      if (!result?.available) { observations.push({ providerId: provider.id, state: "UNAVAILABLE", reason: result?.reason || "SOURCE_UNAVAILABLE" }); continue; }
      const freshness = classifyNFLAvailabilityProviderFreshness({ observedAt: result.observedAt, now: request.now, freshForMinutes: provider.freshForMinutes, staleAfterMinutes: provider.staleAfterMinutes });
      observations.push({ providerId: provider.id, ...freshness, observedAt: result.observedAt, sourceUrl: result.sourceUrl || null, records: result.records || [], provenance: result.provenance || {} });
    } catch (error) { observations.push({ providerId: provider.id, state: "FAILED", reason: error?.message || "PROVIDER_FAILURE" }); }
  }
  return observations;
}

export async function orchestrateNFLAvailabilityProviders({ registry, adapters, request = {}, allowAging = true } = {}) {
  const observations = await observeNFLAvailabilityProviders(registry, adapters, request);
  const selection = selectNFLAvailabilityProvider(registry, observations, { allowAging });
  return { contract: "NFLAvailabilityProviderOrchestrationResult", version: "1.0.0", request, observations, selection, selectedRecords: selection.observation?.records || [], persistenceAuthorized: false };
}
