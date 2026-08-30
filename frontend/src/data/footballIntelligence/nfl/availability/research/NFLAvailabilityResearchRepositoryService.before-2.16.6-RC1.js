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
  return artifact?.metadata?.externalRefs?.find((value) =>
    value.startsWith("content-hash:")
  ) || null;
}

function success(result) {
  return result?.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS;
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function teamFromArtifact(artifact = {}) {
  const tag = artifact?.classification?.tags?.find((value) =>
    String(value).startsWith("team:")
  );
  return tag ? String(tag).slice("team:".length).toUpperCase() : null;
}

function mergeSession(existing, incoming, {
  successfulObservationRefs = [],
  successfulEvidenceRefs = [],
} = {}) {
  const previous = existing || {};
  const previousArtifacts = previous?.artifactRefs || {};
  const incomingArtifacts = incoming?.artifactRefs || {};

  return {
    ...previous,
    ...incoming,
    sourceRefs: unique([
      ...(previous?.sourceRefs || []),
      ...(incoming?.sourceRefs || []),
    ]),
    artifactRefs: {
      ...previousArtifacts,
      ...incomingArtifacts,
      recordedObservationRefs: unique([
        ...(previousArtifacts?.recordedObservationRefs || []),
        ...successfulObservationRefs,
      ]),
      analyticalObservationRefs: unique([
        ...(previousArtifacts?.analyticalObservationRefs || []),
        ...(incomingArtifacts?.analyticalObservationRefs || []),
      ]),
      evidenceArtifactRefs: unique([
        ...(previousArtifacts?.evidenceArtifactRefs || []),
        ...successfulEvidenceRefs,
      ]),
      otherArtifactRefs: unique([
        ...(previousArtifacts?.otherArtifactRefs || []),
        ...(incomingArtifacts?.otherArtifactRefs || []),
      ]),
    },
    provenance: {
      ...(previous?.provenance || {}),
      ...(incoming?.provenance || {}),
      createdAt:
        previous?.provenance?.createdAt ||
        incoming?.provenance?.createdAt ||
        null,
      createdBy:
        previous?.provenance?.createdBy ||
        incoming?.provenance?.createdBy ||
        null,
    },
  };
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
    const teamResults = [];
    let observationWrites = 0;
    let artifactWrites = 0;
    let unchangedArtifacts = 0;
    let sessionWrites = 0;

    const sourceResult = await adapter.upsert(
      upsertRequest(
        researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE,
        bundle.source,
        "nfl-availability-upsert-source"
      )
    );

    if (!success(sourceResult)) {
      failures.push({ type: "RESEARCH_SOURCE", result: sourceResult });
      return {
        status: "SOURCE_FAILURE",
        failures,
        sourceWritten: false,
        observationWrites,
        artifactWrites,
        unchangedArtifacts,
        sessionWrites,
        teamResults,
      };
    }

    const observationsById = new Map(
      bundle.observations.map((record) => [record.observationId, record])
    );
    const successfulObservationRefs = new Set();
    const successfulEvidenceRefs = new Set();

    for (const artifact of bundle.artifacts) {
      const team = teamFromArtifact(artifact);
      const teamResult = {
        team,
        evidenceId: artifact.evidenceId,
        status: "PENDING",
        observationWrites: 0,
        artifactWrites: 0,
        unchanged: false,
        failureCount: 0,
      };

      const existing = await read(
        researchRepository.PERSISTENCE_RECORD_TYPES.EVIDENCE_ARTIFACT,
        artifact.evidenceId,
        `nfl-availability-read-artifact:${artifact.evidenceId}`
      );

      if (
        success(existing) &&
        contentHash(existing.record) === contentHash(artifact)
      ) {
        unchangedArtifacts += 1;
        teamResult.status = "UNCHANGED";
        teamResult.unchanged = true;
        successfulEvidenceRefs.add(artifact.evidenceId);

        for (const observationRef of (
          existing.record?.recordedObservationRefs ||
          artifact.recordedObservationRefs ||
          []
        )) {
          successfulObservationRefs.add(observationRef);
        }

        teamResults.push(teamResult);
        continue;
      }

      const artifactObservationFailures = [];

      for (const observationRef of artifact.recordedObservationRefs) {
        const observation = observationsById.get(observationRef);

        if (!observation) {
          artifactObservationFailures.push({
            type: "RECORDED_OBSERVATION",
            recordId: observationRef,
            result: null,
            failure: "OBSERVATION_NOT_IN_BUNDLE",
          });
          continue;
        }

        const result = await adapter.upsert(
          upsertRequest(
            researchRepository.PERSISTENCE_RECORD_TYPES.RECORDED_OBSERVATION,
            observation,
            `nfl-availability-upsert-observation:${observationRef}`
          )
        );

        if (success(result)) {
          observationWrites += 1;
          teamResult.observationWrites += 1;
          successfulObservationRefs.add(observationRef);
        } else {
          artifactObservationFailures.push({
            type: "RECORDED_OBSERVATION",
            recordId: observationRef,
            result,
          });
        }
      }

      if (artifactObservationFailures.length) {
        teamResult.status = "OBSERVATION_FAILURE";
        teamResult.failureCount = artifactObservationFailures.length;
        failures.push(
          ...artifactObservationFailures.map((failure) => ({
            ...failure,
            team,
            evidenceId: artifact.evidenceId,
          }))
        );
        teamResults.push(teamResult);
        continue;
      }

      const artifactResult = await adapter.upsert(
        upsertRequest(
          researchRepository.PERSISTENCE_RECORD_TYPES.EVIDENCE_ARTIFACT,
          artifact,
          `nfl-availability-upsert-artifact:${artifact.evidenceId}`
        )
      );

      if (success(artifactResult)) {
        artifactWrites += 1;
        teamResult.artifactWrites = 1;
        teamResult.status = "SUCCESS";
        successfulEvidenceRefs.add(artifact.evidenceId);
      } else {
        teamResult.status = "ARTIFACT_FAILURE";
        teamResult.failureCount = 1;
        failures.push({
          type: "EVIDENCE_ARTIFACT",
          team,
          recordId: artifact.evidenceId,
          result: artifactResult,
        });
      }

      teamResults.push(teamResult);
    }

    for (const session of bundle.sessions) {
      const currentSession = await read(
        researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SESSION,
        session.sessionId,
        `nfl-availability-read-session:${session.sessionId}`
      );

      const relevantSuccessfulArtifacts =
        session?.artifactRefs?.evidenceArtifactRefs?.filter((ref) =>
          successfulEvidenceRefs.has(ref)
        ) || [];

      const relevantSuccessfulObservations =
        session?.artifactRefs?.recordedObservationRefs?.filter((ref) =>
          successfulObservationRefs.has(ref)
        ) || [];

      const mergedSession = mergeSession(
        success(currentSession) ? currentSession.record : null,
        session,
        {
          successfulObservationRefs: relevantSuccessfulObservations,
          successfulEvidenceRefs: relevantSuccessfulArtifacts,
        }
      );

      const result = await adapter.upsert(
        upsertRequest(
          researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SESSION,
          mergedSession,
          `nfl-availability-upsert-session:${session.sessionId}`
        )
      );

      if (success(result)) sessionWrites += 1;
      else failures.push({
        type: "RESEARCH_SESSION",
        recordId: session.sessionId,
        result,
      });
    }

    return {
      status: failures.length ? "PARTIAL_FAILURE" : "SUCCESS",
      failures,
      sourceWritten: true,
      observationWrites,
      artifactWrites,
      unchangedArtifacts,
      sessionWrites,
      teamResults,
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
      if (success(observationResult) && observationResult.record) {
        observations.push(observationResult.record);
      }
    }

    return {
      status: "SUCCESS",
      artifact: artifactResult.record,
      source: success(sourceResult) ? sourceResult.record : null,
      observations,
    };
  }

  return { persistBundle, readTeamWeek };
}

export default {
  createNFLAvailabilityResearchRepositoryService,
};
