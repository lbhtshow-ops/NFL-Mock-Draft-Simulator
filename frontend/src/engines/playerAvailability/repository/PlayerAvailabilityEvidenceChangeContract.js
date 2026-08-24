export const PLAYER_AVAILABILITY_EVIDENCE_CHANGE_CONTRACT_VERSION =
  "FIE-PLAYER-AVAILABILITY-EVIDENCE-CHANGE-1.0.0";

export const PLAYER_AVAILABILITY_EVIDENCE_CHANGE_TYPES = Object.freeze({
  ADDED: "ADDED",
  CHANGED: "CHANGED",
  REMOVED: "REMOVED",
  UNCHANGED: "UNCHANGED",
  UNKNOWN: "UNKNOWN",
});

const normalizeString = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export function createPlayerAvailabilityEvidenceChange({
  playerId = null,
  changeType = PLAYER_AVAILABILITY_EVIDENCE_CHANGE_TYPES.UNKNOWN,
  previousSnapshotId = null,
  currentSnapshotId = null,
  detectedAt = null,
  changedFields = [],
  provenance = {},
} = {}) {
  return Object.freeze({
    contract: "PlayerAvailabilityEvidenceChange",
    contractVersion: PLAYER_AVAILABILITY_EVIDENCE_CHANGE_CONTRACT_VERSION,
    playerId: normalizeString(playerId),
    changeType: Object.values(PLAYER_AVAILABILITY_EVIDENCE_CHANGE_TYPES).includes(
      changeType,
    )
      ? changeType
      : PLAYER_AVAILABILITY_EVIDENCE_CHANGE_TYPES.UNKNOWN,
    previousSnapshotId: normalizeString(previousSnapshotId),
    currentSnapshotId: normalizeString(currentSnapshotId),
    detectedAt: normalizeString(detectedAt),
    changedFields: Array.isArray(changedFields) ? [...new Set(changedFields)] : [],
    provenance: Object.freeze({
      adapter: normalizeString(provenance?.adapter),
      repositoryVersion: normalizeString(provenance?.repositoryVersion),
    }),
  });
}

export default { createPlayerAvailabilityEvidenceChange };
