import { buildNFLTeamPerformanceSnapshotKey } from "./NFLTeamPerformanceSnapshotContract.js";

export const NFL_TEAM_PERFORMANCE_SNAPSHOT_CACHE_CONTRACT = "NFLTeamPerformanceSnapshotCache";
export const NFL_TEAM_PERFORMANCE_SNAPSHOT_CACHE_VERSION = "NFL-TEAM-PERFORMANCE-SNAPSHOT-CACHE-1.0.0";

export function createNFLTeamPerformanceSnapshotCache({
  maxAgeMs = 15 * 60 * 1000,
  now = () => Date.now(),
  store = new Map(),
} = {}) {
  const ttl = Number.isFinite(maxAgeMs) && maxAgeMs >= 0 ? maxAgeMs : 0;

  function get(keyParts = {}) {
    const key = buildNFLTeamPerformanceSnapshotKey(keyParts);
    if (!key) return { status: "INVALID_KEY", snapshot: null, key: null };
    const entry = store.get(key);
    if (!entry) return { status: "MISS", snapshot: null, key };
    const current = now();
    const ageMs = Math.max(0, current - entry.storedAtMs);
    const stale = ageMs > ttl;
    return {
      status: stale ? "STALE" : "HIT",
      snapshot: entry.snapshot,
      key,
      ageMs,
      storedAt: new Date(entry.storedAtMs).toISOString(),
      expiresAt: new Date(entry.storedAtMs + ttl).toISOString(),
      stale,
    };
  }

  function set(keyParts = {}, snapshot) {
    const key = buildNFLTeamPerformanceSnapshotKey(keyParts);
    if (!key || !snapshot) return { status: "INVALID", key: key || null };
    const storedAtMs = now();
    store.set(key, { snapshot, storedAtMs });
    return {
      status: "STORED",
      key,
      storedAt: new Date(storedAtMs).toISOString(),
      expiresAt: new Date(storedAtMs + ttl).toISOString(),
    };
  }

  function clear() {
    store.clear();
  }

  return Object.freeze({
    contract: NFL_TEAM_PERFORMANCE_SNAPSHOT_CACHE_CONTRACT,
    version: NFL_TEAM_PERFORMANCE_SNAPSHOT_CACHE_VERSION,
    maxAgeMs: ttl,
    get,
    set,
    clear,
    size: () => store.size,
  });
}

export default {
  NFL_TEAM_PERFORMANCE_SNAPSHOT_CACHE_CONTRACT,
  NFL_TEAM_PERFORMANCE_SNAPSHOT_CACHE_VERSION,
  createNFLTeamPerformanceSnapshotCache,
};
