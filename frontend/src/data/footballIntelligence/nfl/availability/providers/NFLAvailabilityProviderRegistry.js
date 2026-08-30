export const NFL_AVAILABILITY_PROVIDER_STATES = Object.freeze({
  READY: "READY", AGING: "AGING", STALE: "STALE", UNAVAILABLE: "UNAVAILABLE", FAILED: "FAILED",
});

function isoMillis(value) {
  const n = Date.parse(value || "");
  return Number.isFinite(n) ? n : null;
}

export function classifyNFLAvailabilityProviderFreshness({ observedAt, now = new Date().toISOString(), freshForMinutes = 360, staleAfterMinutes = 1440 } = {}) {
  const observed = isoMillis(observedAt); const current = isoMillis(now);
  if (observed == null || current == null) return { state: NFL_AVAILABILITY_PROVIDER_STATES.UNAVAILABLE, ageMinutes: null };
  const ageMinutes = Math.max(0, (current - observed) / 60000);
  const state = ageMinutes <= freshForMinutes ? NFL_AVAILABILITY_PROVIDER_STATES.READY : ageMinutes <= staleAfterMinutes ? NFL_AVAILABILITY_PROVIDER_STATES.AGING : NFL_AVAILABILITY_PROVIDER_STATES.STALE;
  return { state, ageMinutes };
}

export function createNFLAvailabilityProviderDefinition({ id, priority, authority = "SUPPLEMENTAL", capabilities = ["AVAILABILITY"], freshForMinutes = 360, staleAfterMinutes = 1440 } = {}) {
  if (!id || !Number.isInteger(priority)) throw new Error("Provider id and integer priority are required.");
  return Object.freeze({ id, priority, authority, capabilities: [...capabilities], freshForMinutes, staleAfterMinutes });
}

export function createNFLAvailabilityProviderRegistry(definitions = []) {
  const providers = [...definitions];
  const ids = providers.map((p) => p.id);
  if (new Set(ids).size !== ids.length) throw new Error("Provider ids must be unique.");
  return Object.freeze({ providers: Object.freeze(providers.sort((a,b) => a.priority - b.priority || a.id.localeCompare(b.id))) });
}

export function selectNFLAvailabilityProvider(registry, observations = [], { allowAging = true } = {}) {
  const byId = new Map(observations.map((x) => [x.providerId, x]));
  const considered = [];
  for (const provider of registry?.providers || []) {
    const observation = byId.get(provider.id);
    const state = observation?.state || NFL_AVAILABILITY_PROVIDER_STATES.UNAVAILABLE;
    considered.push({ providerId: provider.id, priority: provider.priority, state });
    if (state === NFL_AVAILABILITY_PROVIDER_STATES.READY || (allowAging && state === NFL_AVAILABILITY_PROVIDER_STATES.AGING)) {
      return { status: "SELECTED", provider, observation, considered };
    }
  }
  return { status: "NO_ACCEPTABLE_PROVIDER", provider: null, observation: null, considered };
}

export const DEFAULT_NFL_AVAILABILITY_PROVIDER_REGISTRY = createNFLAvailabilityProviderRegistry([
  createNFLAvailabilityProviderDefinition({ id: "sportradar-nfl-v7", priority: 10, authority: "PRIMARY", capabilities: ["AVAILABILITY", "PRACTICE_PARTICIPATION", "ESTIMATED_RETURN_DATE"], freshForMinutes: 240, staleAfterMinutes: 720 }),
  createNFLAvailabilityProviderDefinition({ id: "official-current-availability", priority: 20, authority: "RESERVED_OFFICIAL", freshForMinutes: 180, staleAfterMinutes: 720 }),
  createNFLAvailabilityProviderDefinition({ id: "nflverse-injury-reports", priority: 100, authority: "HISTORICAL_BACKFILL", freshForMinutes: 1440, staleAfterMinutes: 10080 }),
]);
