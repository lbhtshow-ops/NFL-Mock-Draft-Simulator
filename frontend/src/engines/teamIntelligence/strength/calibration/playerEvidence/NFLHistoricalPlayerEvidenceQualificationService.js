import { validateNFLHistoricalPlayerCaliberSnapshot } from "./NFLHistoricalPlayerCaliberSnapshotContract.js";
import { validateNFLHistoricalReplacementMapping } from "./NFLHistoricalReplacementMappingContract.js";

export function qualifyHistoricalPlayerCaliberSnapshot(snapshot = {}) {
  const validation = validateNFLHistoricalPlayerCaliberSnapshot(snapshot);
  const provenancePresent = Boolean(snapshot?.provenance);
  const modelVersionPresent = Boolean(snapshot?.modelVersion);
  const confidencePresent = snapshot?.status !== "AVAILABLE" || Number.isFinite(snapshot?.confidence);

  const errors = [...validation.errors];
  if (!provenancePresent) errors.push("PROVENANCE_REQUIRED");
  if (!modelVersionPresent) errors.push("MODEL_VERSION_REQUIRED");
  if (!confidencePresent) errors.push("CONFIDENCE_REQUIRED");

  return Object.freeze({
    qualified: errors.length === 0,
    errors: Object.freeze(errors),
    playerId: snapshot?.playerId ?? null,
    gameId: snapshot?.gameId ?? null,
  });
}

export function qualifyHistoricalReplacementMapping(mapping = {}) {
  const validation = validateNFLHistoricalReplacementMapping(mapping);
  const provenancePresent = Boolean(mapping?.provenance);
  const asOfPresent = Boolean(mapping?.asOf);
  const confidencePresent = Number.isFinite(mapping?.confidence);

  const errors = [...validation.errors];
  if (!provenancePresent) errors.push("PROVENANCE_REQUIRED");
  if (!asOfPresent) errors.push("AS_OF_REQUIRED");
  if (!confidencePresent) errors.push("CONFIDENCE_REQUIRED");

  return Object.freeze({
    qualified: errors.length === 0,
    errors: Object.freeze(errors),
    unavailablePlayerId: mapping?.unavailablePlayerId ?? null,
    gameId: mapping?.gameId ?? null,
  });
}

export function summarizeHistoricalPlayerEvidenceQualification({
  caliberSnapshots = [],
  replacementMappings = [],
} = {}) {
  const caliber = caliberSnapshots.map(qualifyHistoricalPlayerCaliberSnapshot);
  const replacements = replacementMappings.map(qualifyHistoricalReplacementMapping);
  return Object.freeze({
    contractVersion: "FIE-NFL-HISTORICAL-PLAYER-EVIDENCE-QUALIFICATION-REPORT-1.0.0",
    caliber: Object.freeze({
      total: caliber.length,
      qualified: caliber.filter(x => x.qualified).length,
      rejected: caliber.filter(x => !x.qualified).length,
    }),
    replacements: Object.freeze({
      total: replacements.length,
      qualified: replacements.filter(x => x.qualified).length,
      rejected: replacements.filter(x => !x.qualified).length,
    }),
  });
}
