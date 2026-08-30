import {
  createPlayerAvailabilityEvidenceChange,
  PLAYER_AVAILABILITY_EVIDENCE_CHANGE_TYPES,
} from "./PlayerAvailabilityEvidenceChangeContract.js";

export const NFL_PLAYER_AVAILABILITY_EVIDENCE_DIFF_CONTRACT =
  "NFLPlayerAvailabilityEvidenceDiffResult";
export const NFL_PLAYER_AVAILABILITY_EVIDENCE_DIFF_VERSION = "1.0.0";

const clean = value => {
  const text = String(value ?? "").trim();
  return text || null;
};

const booleanOrNull = value =>
  value === true ? true : value === false ? false : null;

const numberOrNull = value => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

function normalizePlayer(record = {}) {
  const playerId = clean(record.playerId ?? record.player?.playerId);
  if (!playerId) return null;

  return Object.freeze({
    playerId,
    playerName: clean(record.playerName ?? record.player?.playerName),
    position: clean(record.position)?.toUpperCase() ?? null,
    reportStatus: clean(
      record.reportStatus ?? record.status?.report ?? record.availability?.reportStatus,
    )?.toUpperCase() ?? null,
    practiceStatus: clean(
      record.practiceStatus ??
        record.status?.practice ??
        record.availability?.practiceStatus,
    )?.toUpperCase() ?? null,
    rosterStatus: clean(
      record.rosterStatus ?? record.availability?.rosterStatus,
    )?.toUpperCase() ?? null,
    depthPosition: clean(record.depthPosition ?? record.role?.depthPosition)?.toUpperCase() ?? null,
    depthRank: numberOrNull(record.depthRank ?? record.role?.depthRank),
    starter: booleanOrNull(record.starter ?? record.role?.starter),
    availabilityStatus: clean(
      record.availabilityStatus ??
        record.canonicalAvailabilityStatus ??
        record.availability?.canonicalStatus,
    )?.toUpperCase() ?? null,
    snapshotId: clean(
      record.snapshotId ??
        record.evidenceSnapshotId ??
        record.observationId ??
        record.recordId,
    ),
    effectiveAt: clean(
      record.evidenceEffectiveAt ?? record.effectiveAt ?? record.observedAt,
    ),
  });
}

const FIELDS = Object.freeze([
  "playerName",
  "position",
  "reportStatus",
  "practiceStatus",
  "rosterStatus",
  "depthPosition",
  "depthRank",
  "starter",
  "availabilityStatus",
]);

function fieldChanges(previous, current) {
  return FIELDS.filter(field => previous?.[field] !== current?.[field]);
}

function indexPlayers(records = []) {
  const index = new Map();
  const invalid = [];

  for (const raw of Array.isArray(records) ? records : []) {
    const normalized = normalizePlayer(raw);
    if (!normalized) {
      invalid.push(raw);
      continue;
    }
    index.set(normalized.playerId, normalized);
  }

  return { index, invalid };
}

function makeChange({
  playerId,
  changeType,
  previous,
  current,
  detectedAt,
  changedFields,
  provenance,
}) {
  return Object.freeze({
    change: createPlayerAvailabilityEvidenceChange({
      playerId,
      changeType,
      previousSnapshotId: previous?.snapshotId ?? null,
      currentSnapshotId: current?.snapshotId ?? null,
      detectedAt,
      changedFields,
      provenance,
    }),
    previous: previous ?? null,
    current: current ?? null,
    context: Object.freeze({
      playerId,
      playerName: current?.playerName ?? previous?.playerName ?? null,
      position: current?.position ?? previous?.position ?? null,
      starter: current?.starter ?? previous?.starter ?? false,
      depthRank: current?.depthRank ?? previous?.depthRank ?? null,
      previousStatus:
        previous?.availabilityStatus ??
        previous?.reportStatus ??
        previous?.rosterStatus ??
        previous?.practiceStatus ??
        null,
      currentStatus:
        current?.availabilityStatus ??
        current?.reportStatus ??
        current?.rosterStatus ??
        current?.practiceStatus ??
        null,
      evidenceEffectiveAt:
        current?.effectiveAt ?? previous?.effectiveAt ?? detectedAt ?? null,
    }),
  });
}

export function diffNFLPlayerAvailabilityEvidence({
  previousPlayers = [],
  currentPlayers = [],
  detectedAt = null,
  provenance = {},
  includeUnchanged = false,
} = {}) {
  const previous = indexPlayers(previousPlayers);
  const current = indexPlayers(currentPlayers);
  const playerIds = [...new Set([...previous.index.keys(), ...current.index.keys()])].sort();
  const changes = [];

  for (const playerId of playerIds) {
    const before = previous.index.get(playerId) ?? null;
    const after = current.index.get(playerId) ?? null;

    if (!before && after) {
      changes.push(
        makeChange({
          playerId,
          changeType: PLAYER_AVAILABILITY_EVIDENCE_CHANGE_TYPES.ADDED,
          previous: null,
          current: after,
          detectedAt,
          changedFields: FIELDS.filter(field => after[field] !== null),
          provenance,
        }),
      );
      continue;
    }

    if (before && !after) {
      changes.push(
        makeChange({
          playerId,
          changeType: PLAYER_AVAILABILITY_EVIDENCE_CHANGE_TYPES.REMOVED,
          previous: before,
          current: null,
          detectedAt,
          changedFields: FIELDS.filter(field => before[field] !== null),
          provenance,
        }),
      );
      continue;
    }

    const changedFields = fieldChanges(before, after);
    if (changedFields.length > 0) {
      changes.push(
        makeChange({
          playerId,
          changeType: PLAYER_AVAILABILITY_EVIDENCE_CHANGE_TYPES.CHANGED,
          previous: before,
          current: after,
          detectedAt,
          changedFields,
          provenance,
        }),
      );
    } else if (includeUnchanged) {
      changes.push(
        makeChange({
          playerId,
          changeType: PLAYER_AVAILABILITY_EVIDENCE_CHANGE_TYPES.UNCHANGED,
          previous: before,
          current: after,
          detectedAt,
          changedFields: [],
          provenance,
        }),
      );
    }
  }

  return Object.freeze({
    contract: NFL_PLAYER_AVAILABILITY_EVIDENCE_DIFF_CONTRACT,
    version: NFL_PLAYER_AVAILABILITY_EVIDENCE_DIFF_VERSION,
    changes: Object.freeze(changes),
    summary: Object.freeze({
      previousPlayers: previous.index.size,
      currentPlayers: current.index.size,
      emittedChanges: changes.length,
      added: changes.filter(entry => entry.change.changeType === "ADDED").length,
      changed: changes.filter(entry => entry.change.changeType === "CHANGED").length,
      removed: changes.filter(entry => entry.change.changeType === "REMOVED").length,
      unchanged: changes.filter(entry => entry.change.changeType === "UNCHANGED").length,
      invalidPreviousRecords: previous.invalid.length,
      invalidCurrentRecords: current.invalid.length,
    }),
    governance: Object.freeze({
      evidenceDiffOnly: true,
      persistenceMutationAuthorized: false,
      modelMutationAuthorized: false,
      probabilityMutationAuthorized: false,
      pickemReasoningAuthorized: false,
    }),
  });
}

export default {
  NFL_PLAYER_AVAILABILITY_EVIDENCE_DIFF_CONTRACT,
  NFL_PLAYER_AVAILABILITY_EVIDENCE_DIFF_VERSION,
  diffNFLPlayerAvailabilityEvidence,
};
