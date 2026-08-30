import {
  acquireNFLVerseCurrentRosterDepthSignals,
} from "../src/data/footballIntelligence/nfl/availability/providers/nflverse/NFLVerseCurrentAvailabilityAcquisition.js";

const args = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};

const season = Number(arg("season", "2026"));
const week = Number(arg("week", "1"));
const gameType = String(arg("game-type", "REG")).toUpperCase();
const team = String(arg("team", "BAL")).toUpperCase();

const result = await acquireNFLVerseCurrentRosterDepthSignals({
  season,
  week,
  gameType,
  team,
});

console.log(JSON.stringify({
  contract: result.contract,
  version: result.version,
  scope: result.scope,
  roster: {
    sourceUrl: result.roster.sourceUrl,
    rowCount: result.roster.rowCount,
    signalCount: result.roster.signalCount,
    statusDistribution: Object.fromEntries(
      [...new Set(result.roster.signals.map((s) => s.availability.rosterStatus))]
        .filter(Boolean)
        .sort()
        .map((status) => [
          status,
          result.roster.signals.filter((s) => s.availability.rosterStatus === status).length,
        ])
    ),
    sample: result.roster.signals.slice(0, 5).map((s) => ({
      player: s.player.playerName,
      playerId: s.player.playerId,
      rosterStatus: s.availability.rosterStatus,
      providerStatusDescriptionAbbr: s.metadata.providerStatusDescriptionAbbr,
      source: s.provenance.source,
    })),
  },
  depth: {
    sourceUrl: result.depth.sourceUrl,
    snapshotCount: result.depth.snapshotCount,
    latestTimestamp: result.depth.latestTimestamp,
    rowCount: result.depth.rowCount,
    signalCount: result.depth.signalCount,
    sample: result.depth.signals.slice(0, 10).map((s) => ({
      player: s.player.playerName,
      playerId: s.player.playerId,
      depthPosition: s.role.depthPosition,
      depthRank: s.role.depthRank,
      starter: s.role.starter,
      source: s.provenance.source,
    })),
  },
  safety: {
    rosterNFLVerseProvenance: result.roster.signals.every((s) => s.metadata.provider === "nflverse"),
    depthNFLVerseProvenance: result.depth.signals.every((s) => s.metadata.provider === "nflverse"),
    depthOfficialStatusesAbsent: result.depth.signals.every(
      (s) =>
        s.availability.status == null &&
        s.availability.practiceStatus == null &&
        s.availability.injury == null
    ),
    persistenceAuthorized: false,
    sportradarRequired: false,
  },
}, null, 2));
