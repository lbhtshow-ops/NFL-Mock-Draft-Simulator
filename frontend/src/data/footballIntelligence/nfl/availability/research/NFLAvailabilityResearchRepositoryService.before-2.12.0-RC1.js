import researchRepository from "../../../../researchRepository/index.js";

import {
  getNFLAvailabilityResearchEvidenceId,
  NFL_AVAILABILITY_RESEARCH_SOURCE_ID,
} from "./NFLAvailabilityResearchContracts.js";

function upsertRequest(recordType, record, requestId) {
  return {
    requestId,
    operation: researchRepository.PERSISTENCE_OPERATION_TYPES.UPSERT,
    recordType,
    record,
    write: {
      mode: researchRepository.PERSISTENCE_WRITE_MODES.UPSERT,
      validateBeforeWrite: true,
    },
    consistency: researchRepository.PERSISTENCE_CONSISTENCY_MODES.STANDARD,
    actor: {
      actorRef: "lbht-sports-intelligence-acquisition",
      role: "AUTOMATED_ACQUISITION",
    },
    context: {
      source: "NFL_AVAILABILITY_RESEARCH_REPOSITORY_SERVICE",
    },
  };
}

function readRequest(recordType, recordId, requestId) {
  return {
    requestId,
    operation: researchRepository.PERSISTENCE_OPERATION_TYPES.READ,
    recordType,
    recordId,
    query: {
      includeArchived: false,
      includeDeleted: false,
    },
    consistency: researchRepository.PERSISTENCE_CONSISTENCY_MODES.STANDARD,
    context: {
      source: "NFL_AVAILABILITY_RESEARCH_REPOSITORY_SERVICE",
    },
  };
}

function contentHash(artifact) {
  return artifact?.metadata?.externalRefs?.find((value) => value.startsWith("content-hash:")) || null;
}

function success(result) {
  return result?.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS;
}

export function createNFLAvailabilityResearchRepositoryService({ adapter } = {}) {
  if (!researchRepository.isPersistenceAdapter(adapter)) {
    throw new Error("A valid Research Repository persistence adapter is required.");
  }

  async function read(recordType, recordId, requestId) {
    return await adapter.read(readRequest(recordType, recordId, requestId));
  }

  async function persistBundle(bundle) {
    const failures = [];
    let observationWrites = 0;
    let artifactWrites = 0;
    let unchangedArtifacts = 0;

    const sourceResult = await adapter.upsert(
      upsertRequest(
        researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE,
        bundle.source,
        "nfl-availability-upsert-source"
      )
    );
    if (!success(sourceResult)) failures.push({ type: "RESEARCH_SOURCE", result: sourceResult });

    const observationsById = new Map(bundle.observations.map((record) => [record.observationId, record]));

    for (const artifact of bundle.artifacts) {
      const existing = await read(
        researchRepository.PERSISTENCE_RECORD_TYPES.EVIDENCE_ARTIFACT,
        artifact.evidenceId,
        `nfl-availability-read-artifact:${artifact.evidenceId}`
      );

      if (success(existing) && contentHash(existing.record) === contentHash(artifact)) {
        unchangedArtifacts += 1;
        continue;
      }

      for (const observationRef of artifact.recordedObservationRefs) {
        const observation = observationsById.get(observationRef);
        if (!observation) continue;
        const result = await adapter.upsert(
          upsertRequest(
            researchRepository.PERSISTENCE_RECORD_TYPES.RECORDED_OBSERVATION,
            observation,
            `nfl-availability-upsert-observation:${observationRef}`
          )
        );
        if (success(result)) observationWrites += 1;
        else failures.push({ type: "RECORDED_OBSERVATION", recordId: observationRef, result });
      }

      const artifactResult = await adapter.upsert(
        upsertRequest(
          researchRepository.PERSISTENCE_RECORD_TYPES.EVIDENCE_ARTIFACT,
          artifact,
          `nfl-availability-upsert-artifact:${artifact.evidenceId}`
        )
      );
      if (success(artifactResult)) artifactWrites += 1;
      else failures.push({ type: "EVIDENCE_ARTIFACT", recordId: artifact.evidenceId, result: artifactResult });
    }

    for (const session of bundle.sessions) {
      const result = await adapter.upsert(
        upsertRequest(
          researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SESSION,
          session,
          `nfl-availability-upsert-session:${session.sessionId}`
        )
      );
      if (!success(result)) failures.push({ type: "RESEARCH_SESSION", recordId: session.sessionId, result });
    }

    return {
      status: failures.length ? "PARTIAL_FAILURE" : "SUCCESS",
      failures,
      sourceWritten: success(sourceResult),
      observationWrites,
      artifactWrites,
      unchangedArtifacts,
    };
  }

  async function readTeamWeek({ season, week, team }) {
    const evidenceId = getNFLAvailabilityResearchEvidenceId(season, week, team);
    const artifactResult = await read(
      researchRepository.PERSISTENCE_RECORD_TYPES.EVIDENCE_ARTIFACT,
      evidenceId,
      `nfl-availability-read-team-artifact:${evidenceId}`
    );

    if (!success(artifactResult)) {
      return {
        status:
          artifactResult?.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.NOT_FOUND
            ? "NOT_FOUND"
            : "REPOSITORY_ERROR",
        artifact: null,
        source: null,
        observations: [],
        result: artifactResult,
      };
    }

    const sourceResult = await read(
      researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE,
      artifactResult.record?.sourceRefs?.[0] || NFL_AVAILABILITY_RESEARCH_SOURCE_ID,
      `nfl-availability-read-source:${season}:${week}:${team}`
    );

    const observations = [];
    for (const observationRef of artifactResult.record.recordedObservationRefs || []) {
      const observationResult = await read(
        researchRepository.PERSISTENCE_RECORD_TYPES.RECORDED_OBSERVATION,
        observationRef,
        `nfl-availability-read-observation:${observationRef}`
      );
      if (success(observationResult) && observationResult.record) observations.push(observationResult.record);
    }

    return {
      status: "SUCCESS",
      artifact: artifactResult.record,
      source: success(sourceResult) ? sourceResult.record : null,
      observations,
    };
  }

  return {
    persistBundle,
    readTeamWeek,
  };
}

export default {
  createNFLAvailabilityResearchRepositoryService,
};
