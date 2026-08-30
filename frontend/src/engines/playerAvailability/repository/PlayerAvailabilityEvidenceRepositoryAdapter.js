import {
  createPlayerAvailabilityEvidence,
} from "../contracts/PlayerAvailabilityEvidenceContract.js";
import {
  createPlayerAvailabilityRepositorySnapshot,
  PLAYER_AVAILABILITY_REPOSITORY_SNAPSHOT_STATES,
  validatePlayerAvailabilityRepositorySnapshot,
} from "./PlayerAvailabilityRepositorySnapshotContract.js";
import {
  resolvePlayerAvailabilityFreshness,
} from "./PlayerAvailabilityFreshnessPolicy.js";

export const PLAYER_AVAILABILITY_REPOSITORY_ADAPTER_VERSION =
  "FIE-PLAYER-AVAILABILITY-REPOSITORY-ADAPTER-1.0.0";

/**
 * Converts a repository-owned snapshot representation into the canonical
 * PlayerAvailabilityEvidence contract. No database row shape is permitted
 * beyond this boundary.
 */
export function adaptPlayerAvailabilityRepositorySnapshot(input = {}) {
  const snapshot = input?.contract === "PlayerAvailabilityRepositorySnapshot"
    ? createPlayerAvailabilityRepositorySnapshot({
        snapshotId: input.snapshotId,
        playerId: input.playerId,
        asOf: input.asOf,
        repositoryVersion: input.repositoryVersion,
        revision: input.revision,
        state: input.state,
        evidence: input.evidence,
        historyRefs: input.historyRefs,
        retrievedAt: input.retrievedAt,
        repositoryFreshness: input.freshness?.repository,
        acquisitionFreshness: input.freshness?.acquisition,
        metadata: input.metadata,
      })
    : createPlayerAvailabilityRepositorySnapshot(input);
  const validation = validatePlayerAvailabilityRepositorySnapshot(snapshot);
  if (!validation.valid) {
    return Object.freeze({
      available: false,
      evidence: null,
      snapshot,
      errors: validation.errors,
      adapterVersion: PLAYER_AVAILABILITY_REPOSITORY_ADAPTER_VERSION,
    });
  }
  if (
    snapshot.state !== PLAYER_AVAILABILITY_REPOSITORY_SNAPSHOT_STATES.AVAILABLE ||
    !snapshot.evidence
  ) {
    return Object.freeze({
      available: false,
      evidence: null,
      snapshot,
      errors: ["SNAPSHOT_NOT_AVAILABLE"],
      adapterVersion: PLAYER_AVAILABILITY_REPOSITORY_ADAPTER_VERSION,
    });
  }

  const freshness = resolvePlayerAvailabilityFreshness({
    evidenceFreshness: snapshot.freshness.evidence,
    repositoryFreshness: snapshot.freshness.repository,
    acquisitionFreshness: snapshot.freshness.acquisition,
  });

  const evidence = createPlayerAvailabilityEvidence({
    ...snapshot.evidence,
    freshness,
    repository: {
      ...(snapshot.evidence.repository || {}),
      adapter:
        snapshot.evidence.repository?.adapter ||
        snapshot.metadata.adapter ||
        PLAYER_AVAILABILITY_REPOSITORY_ADAPTER_VERSION,
      snapshotId: snapshot.snapshotId,
      retrievedAt: snapshot.retrievedAt,
    },
    provenance: {
      ...(snapshot.evidence.provenance || {}),
      sourceArtifacts: [
        ...(snapshot.evidence.provenance?.sourceArtifacts || []),
        ...snapshot.historyRefs,
      ],
    },
  });

  return Object.freeze({
    available: true,
    evidence,
    snapshot,
    errors: [],
    adapterVersion: PLAYER_AVAILABILITY_REPOSITORY_ADAPTER_VERSION,
  });
}

export default { adaptPlayerAvailabilityRepositorySnapshot };
