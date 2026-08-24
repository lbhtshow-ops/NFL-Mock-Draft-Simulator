import {
  AVAILABILITY_FRESHNESS_STATES,
  createPlayerAvailabilityEvidence,
  validatePlayerAvailabilityEvidence,
} from "../contracts/PlayerAvailabilityEvidenceContract.js";

export const PLAYER_AVAILABILITY_REPOSITORY_SNAPSHOT_CONTRACT_VERSION =
  "FIE-PLAYER-AVAILABILITY-REPOSITORY-SNAPSHOT-1.0.0";

export const PLAYER_AVAILABILITY_REPOSITORY_SNAPSHOT_STATES = Object.freeze({
  AVAILABLE: "AVAILABLE",
  NOT_FOUND: "NOT_FOUND",
  UNAVAILABLE: "UNAVAILABLE",
});

const normalizeString = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;
const normalizeArray = (value) => (Array.isArray(value) ? [...value] : []);

export function createPlayerAvailabilityRepositorySnapshot({
  snapshotId = null,
  playerId = null,
  asOf = null,
  repositoryVersion = null,
  revision = null,
  state = PLAYER_AVAILABILITY_REPOSITORY_SNAPSHOT_STATES.UNAVAILABLE,
  evidence = null,
  historyRefs = [],
  retrievedAt = null,
  repositoryFreshness = AVAILABILITY_FRESHNESS_STATES.UNKNOWN,
  acquisitionFreshness = AVAILABILITY_FRESHNESS_STATES.UNKNOWN,
  metadata = {},
} = {}) {
  const normalizedState = Object.values(
    PLAYER_AVAILABILITY_REPOSITORY_SNAPSHOT_STATES,
  ).includes(state)
    ? state
    : PLAYER_AVAILABILITY_REPOSITORY_SNAPSHOT_STATES.UNAVAILABLE;

  const canonicalEvidence = evidence
    ? createPlayerAvailabilityEvidence({
        ...evidence,
        playerId: evidence?.playerId || playerId,
        repository: {
          ...(evidence?.repository || {}),
          snapshotId: evidence?.repository?.snapshotId || snapshotId,
          retrievedAt: evidence?.repository?.retrievedAt || retrievedAt,
        },
      })
    : null;

  return Object.freeze({
    contract: "PlayerAvailabilityRepositorySnapshot",
    contractVersion: PLAYER_AVAILABILITY_REPOSITORY_SNAPSHOT_CONTRACT_VERSION,
    snapshotId: normalizeString(snapshotId),
    playerId: normalizeString(playerId),
    asOf: normalizeString(asOf),
    repositoryVersion: normalizeString(repositoryVersion),
    revision:
      typeof revision === "number" && Number.isFinite(revision) && revision >= 0
        ? revision
        : null,
    state: normalizedState,
    evidence: canonicalEvidence,
    historyRefs: normalizeArray(historyRefs),
    retrievedAt: normalizeString(retrievedAt),
    freshness: Object.freeze({
      repository: Object.values(AVAILABILITY_FRESHNESS_STATES).includes(
        repositoryFreshness,
      )
        ? repositoryFreshness
        : AVAILABILITY_FRESHNESS_STATES.UNKNOWN,
      evidence: canonicalEvidence?.freshness || AVAILABILITY_FRESHNESS_STATES.UNKNOWN,
      acquisition: Object.values(AVAILABILITY_FRESHNESS_STATES).includes(
        acquisitionFreshness,
      )
        ? acquisitionFreshness
        : AVAILABILITY_FRESHNESS_STATES.UNKNOWN,
    }),
    metadata: Object.freeze({
      persistenceContract: normalizeString(metadata?.persistenceContract),
      persistenceSchemaVersion: normalizeString(metadata?.persistenceSchemaVersion),
      adapter: normalizeString(metadata?.adapter),
      sourceRecordType: normalizeString(metadata?.sourceRecordType),
    }),
  });
}

export function validatePlayerAvailabilityRepositorySnapshot(value) {
  const errors = [];
  if (!value || typeof value !== "object") {
    return { valid: false, errors: ["SNAPSHOT_REQUIRED"] };
  }
  if (value.contract !== "PlayerAvailabilityRepositorySnapshot") {
    errors.push("INVALID_CONTRACT");
  }
  if (
    value.contractVersion !==
    PLAYER_AVAILABILITY_REPOSITORY_SNAPSHOT_CONTRACT_VERSION
  ) {
    errors.push("INVALID_CONTRACT_VERSION");
  }
  if (
    !Object.values(PLAYER_AVAILABILITY_REPOSITORY_SNAPSHOT_STATES).includes(
      value.state,
    )
  ) {
    errors.push("INVALID_STATE");
  }
  if (
    value.state === PLAYER_AVAILABILITY_REPOSITORY_SNAPSHOT_STATES.AVAILABLE
  ) {
    if (!value.snapshotId) errors.push("SNAPSHOT_ID_REQUIRED");
    if (!value.playerId) errors.push("PLAYER_ID_REQUIRED");
    if (!value.asOf) errors.push("AS_OF_REQUIRED");
    const evidenceValidation = validatePlayerAvailabilityEvidence(value.evidence);
    if (!evidenceValidation.valid) {
      errors.push(...evidenceValidation.errors.map((code) => `EVIDENCE_${code}`));
    }
  }
  return { valid: errors.length === 0, errors };
}

export default {
  createPlayerAvailabilityRepositorySnapshot,
  validatePlayerAvailabilityRepositorySnapshot,
};
