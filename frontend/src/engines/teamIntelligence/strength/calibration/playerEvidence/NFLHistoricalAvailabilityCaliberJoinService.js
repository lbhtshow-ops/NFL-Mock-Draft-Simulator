import { validateNFLHistoricalPlayerCaliberSnapshot } from "./NFLHistoricalPlayerCaliberSnapshotContract.js";
import { validateNFLHistoricalReplacementMapping } from "./NFLHistoricalReplacementMappingContract.js";

export function enrichHistoricalAvailabilityPlayer({
  availabilityPlayer,
  caliberSnapshots = [],
  replacementMappings = [],
  replacementCaliberSnapshots = [],
} = {}) {
  const playerId = availabilityPlayer?.playerId ?? null;
  if (!playerId) return Object.freeze({...availabilityPlayer, playerCaliber:null, replacement:null});

  const caliber = caliberSnapshots.find((x) => x.playerId === playerId);
  const caliberValid = caliber ? validateNFLHistoricalPlayerCaliberSnapshot(caliber).valid : false;

  const mapping = replacementMappings.find((x) => x.unavailablePlayerId === playerId);
  const mappingValid = mapping ? validateNFLHistoricalReplacementMapping(mapping).valid : false;

  let replacement = null;
  if (mappingValid) {
    const replacementCaliber = replacementCaliberSnapshots.find((x) => x.playerId === mapping.replacementPlayerId);
    const replacementCaliberValid = replacementCaliber
      ? validateNFLHistoricalPlayerCaliberSnapshot(replacementCaliber).valid
      : false;

    replacement = Object.freeze({
      playerId: mapping.replacementPlayerId,
      evidenceType: mapping.evidenceType,
      mappingConfidence: mapping.confidence,
      caliber: replacementCaliberValid && replacementCaliber.status === "AVAILABLE"
        ? replacementCaliber.caliber : null,
      caliberConfidence: replacementCaliberValid && replacementCaliber.status === "AVAILABLE"
        ? replacementCaliber.confidence : null,
      caliberDelta:
        caliberValid && caliber.status === "AVAILABLE" &&
        replacementCaliberValid && replacementCaliber.status === "AVAILABLE"
          ? caliber.caliber - replacementCaliber.caliber
          : null,
    });
  }

  return Object.freeze({
    ...availabilityPlayer,
    playerCaliber: caliberValid && caliber.status === "AVAILABLE"
      ? caliber.caliber : null,
    playerCaliberConfidence: caliberValid && caliber.status === "AVAILABLE"
      ? caliber.confidence : null,
    playerCaliberModelVersion: caliberValid ? caliber.modelVersion : null,
    replacement,
  });
}

export function enrichHistoricalAvailabilityObservation({
  availabilityImpact,
  caliberSnapshots = [],
  replacementMappings = [],
} = {}) {
  if (!availabilityImpact || !Array.isArray(availabilityImpact.players)) return null;

  const players = availabilityImpact.players.map((player) => enrichHistoricalAvailabilityPlayer({
    availabilityPlayer: player,
    caliberSnapshots,
    replacementMappings,
    replacementCaliberSnapshots: caliberSnapshots,
  }));

  const withPlayerCaliber = players.filter((x) => Number.isFinite(x.playerCaliber)).length;
  const withReplacement = players.filter((x) => x.replacement?.playerId).length;
  const withReplacementCaliber = players.filter((x) => Number.isFinite(x.replacement?.caliber)).length;
  const withDelta = players.filter((x) => Number.isFinite(x.replacement?.caliberDelta)).length;

  return Object.freeze({
    ...availabilityImpact,
    players: Object.freeze(players),
    caliberCoverage: Object.freeze({
      reportedPlayers: players.length,
      playerCaliberCount: withPlayerCaliber,
      replacementMappedCount: withReplacement,
      replacementCaliberCount: withReplacementCaliber,
      caliberDeltaCount: withDelta,
    }),
  });
}
