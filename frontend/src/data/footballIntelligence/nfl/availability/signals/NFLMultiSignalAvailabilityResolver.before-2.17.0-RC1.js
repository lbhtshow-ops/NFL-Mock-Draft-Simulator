import { NFL_AVAILABILITY_SIGNAL_CLASSES } from "./NFLAvailabilitySignalContract.js";

const millis = (value) => { const n = Date.parse(value || ""); return Number.isFinite(n) ? n : -1; };
const keyFor = (signal) => signal?.player?.playerId || signal?.player?.providerPlayerId || `${signal?.team || "UNKNOWN"}:${signal?.player?.playerName || "UNKNOWN"}`;

export function compareNFLAvailabilitySignals(a, b) {
  if ((a?.authority || 0) !== (b?.authority || 0)) return (b?.authority || 0) - (a?.authority || 0);
  return millis(b?.timing?.observedAt) - millis(a?.timing?.observedAt);
}

export function resolveNFLMultiSignalAvailability(signals = []) {
  const groups = new Map();
  for (const signal of signals.filter(Boolean)) {
    const key = keyFor(signal);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(signal);
  }
  const players = [];
  for (const [playerKey, playerSignals] of groups) {
    const ordered = [...playerSignals].sort(compareNFLAvailabilitySignals);
    const official = ordered.find((x) => x.signalClass === NFL_AVAILABILITY_SIGNAL_CLASSES.OFFICIAL_INJURY_REPORT) || null;
    const roster = ordered.find((x) => x.signalClass === NFL_AVAILABILITY_SIGNAL_CLASSES.ROSTER_STATUS) || null;
    const transaction = ordered.find((x) => x.signalClass === NFL_AVAILABILITY_SIGNAL_CLASSES.TRANSACTION) || null;
    const depth = ordered.find((x) => x.signalClass === NFL_AVAILABILITY_SIGNAL_CLASSES.DEPTH_CHART) || null;
    const gameday = ordered.find((x) => x.signalClass === NFL_AVAILABILITY_SIGNAL_CLASSES.GAMEDAY_INACTIVE) || null;

    players.push({
      playerKey,
      team: ordered[0]?.team || null,
      player: ordered[0]?.player || null,
      officialDesignation: official?.availability?.status || null,
      practiceStatus: official?.availability?.practiceStatus || null,
      injury: official?.availability?.injury || null,
      rosterStatus: roster?.availability?.rosterStatus || transaction?.transaction?.statusAfter || null,
      gamedayInactive: gameday ? gameday.availability?.status === "INACTIVE" || gameday.availability?.status === "OUT" : null,
      role: depth?.role || null,
      evidence: { selected: ordered[0] || null, official, roster, transaction, depth, gameday, all: ordered },
      officialReportAvailable: Boolean(official),
      inferredAvailabilityOnly: !official && Boolean(roster || transaction || gameday),
    });
  }
  return { contract: "NFLMultiSignalAvailabilityResolution", version: "1.0.0", players, signalCount: signals.length };
}
