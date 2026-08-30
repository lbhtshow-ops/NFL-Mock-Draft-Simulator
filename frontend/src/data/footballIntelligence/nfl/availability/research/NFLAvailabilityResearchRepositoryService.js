import researchRepository from "../../../../researchRepository/index.js";

import {
  getNFLAvailabilityResearchEvidenceId,
  NFL_AVAILABILITY_RESEARCH_SOURCE_ID,
} from "./NFLAvailabilityResearchContracts.js";

import {
  getNFLMultiSignalAvailabilityEvidenceId,
} from "./NFLMultiSignalAvailabilityResearchCapture.js";

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
    typeof value === "string" && value.startsWith("content-hash:")
  ) || null;
}

function sortedUnique(values = []) {
  return [...new Set(values.filter(Boolean))].sort();
}

function sameStringSet(left = [], right = []) {
  const a = sortedUnique(left);
  const b = sortedUnique(right);
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function containsAll(existing = [], required = []) {
  const available = new Set(existing.filter(Boolean));
  return required.filter(Boolean).every((value) => available.has(value));
}

function artifactScopeSignature(artifact = {}) {
  return JSON.stringify({
    evidenceId: artifact?.evidenceId || null,
    sessionRef: artifact?.sessionRef || null,
    sourceRefs: sortedUnique(artifact?.sourceRefs || []),
    targetRefs: sortedUnique((artifact?.targets || []).map((target) => target?.targetRef)),
    classificationTags: sortedUnique(artifact?.classification?.tags || []),
    recordedObservationRefs: sortedUnique(artifact?.recordedObservationRefs || []),
  });
}

function artifactsSemanticallyEquivalent(existing, incoming) {
  if (!existing || !incoming) return false;
  if (artifactScopeSignature(existing) !== artifactScopeSignature(incoming)) return false;

  // Observation IDs are content-addressed by the availability capture layer.
  // An identical scoped observation-ref set therefore represents identical
  // normalized evidence even when acquisition/review timestamps differ.
  return sameStringSet(
    existing?.recordedObservationRefs || [],
    incoming?.recordedObservationRefs || []
  );
}

function sourceSemanticSignature(source = {}) {
  return JSON.stringify({
    sourceId: source?.sourceId || null,
    name: source?.name || null,
    sourceClass: source?.sourceClass || null,
    status: source?.status || null,
    description: source?.description || null,
    domains: sortedUnique(source?.domains || []),
    permittedRoles: sortedUnique(source?.permittedRoles || []),
    prohibitedRoles: sortedUnique(source?.prohibitedRoles || []),
    independenceGroup: source?.independenceGroup || null,
    methodology: source?.methodology || null,
    access: source?.access || null,
    usageRestrictions: source?.usageRestrictions || null,
    verificationRequirements: sortedUnique(source?.verificationRequirements || []),
    metadataTags: sortedUnique(source?.metadata?.tags || []),
  });
}

function sourcesSemanticallyEquivalent(existing, incoming) {
  return Boolean(existing && incoming && sourceSemanticSignature(existing) === sourceSemanticSignature(incoming));
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
    let unchangedSessions = 0;

    let sourceWritten = false;
    let sourceUnchanged = false;
    const currentSource = await read(
      researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE,
      bundle.source.sourceId,
      "nfl-availability-read-source-before-upsert"
    );

    if (success(currentSource) && sourcesSemanticallyEquivalent(currentSource.record, bundle.source)) {
      sourceUnchanged = true;
    } else {
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
          sourceUnchanged,
          observationWrites,
          artifactWrites,
          unchangedArtifacts,
          sessionWrites,
          teamResults,
        };
      }
      sourceWritten = true;
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
        artifactsSemanticallyEquivalent(existing.record, artifact)
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
      const existingObservationRefs = new Set(
        success(existing) ? (existing.record?.recordedObservationRefs || []) : []
      );

      for (const observationRef of artifact.recordedObservationRefs) {
        if (existingObservationRefs.has(observationRef)) {
          successfulObservationRefs.add(observationRef);
          continue;
        }

        const existingObservation = await read(
          researchRepository.PERSISTENCE_RECORD_TYPES.RECORDED_OBSERVATION,
          observationRef,
          `nfl-availability-read-observation-before-upsert:${observationRef}`
        );
        if (success(existingObservation)) {
          successfulObservationRefs.add(observationRef);
          continue;
        }

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

      const sessionHasArtifactMutation = teamResults.some((teamResult) =>
        session?.artifactRefs?.evidenceArtifactRefs?.includes(teamResult.evidenceId) &&
        teamResult.status !== "UNCHANGED"
      );

      const currentArtifactRefs = currentSession.record?.artifactRefs || {};
      const sessionAlreadyContainsIncomingScope =
        success(currentSession) &&
        containsAll(currentArtifactRefs.evidenceArtifactRefs || [], relevantSuccessfulArtifacts) &&
        containsAll(currentArtifactRefs.recordedObservationRefs || [], relevantSuccessfulObservations);

      if (!sessionHasArtifactMutation && sessionAlreadyContainsIncomingScope) {
        unchangedSessions += 1;
        continue;
      }

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
      else {
        const sessionValidation =
          researchRepository.validateResearchSession(mergedSession);

        console.error(
          "NFL availability Research Session persistence validation failure:",
          JSON.stringify({
            sessionId: session.sessionId,
            status: mergedSession?.status ?? null,
            sessionType: mergedSession?.sessionType ?? null,
            validation: sessionValidation,
            execution: mergedSession?.execution ?? null,
            researchers: mergedSession?.researchers ?? null,
            subjects: mergedSession?.subjects ?? null,
            sourceRefs: mergedSession?.sourceRefs ?? null,
            artifactRefs: mergedSession?.artifactRefs ?? null,
            review: mergedSession?.review ?? null,
            provenance: mergedSession?.provenance ?? null,
            persistenceResult: result,
          }, null, 2)
        );

        failures.push({
          type: "RESEARCH_SESSION",
          recordId: session.sessionId,
          result,
        });
      }
    }

    return {
      status: failures.length ? "PARTIAL_FAILURE" : "SUCCESS",
      failures,
      sourceWritten,
      sourceUnchanged,
      observationWrites,
      artifactWrites,
      unchangedArtifacts,
      sessionWrites,
      unchangedSessions,
      teamResults,
    };
  }

  async function readTeamWeek({ season, week, gameType = "REG", team }) {
    const normalizedGameType = String(gameType || "REG").trim().toUpperCase();
    const canonicalEvidenceId = getNFLMultiSignalAvailabilityEvidenceId(
      season,
      normalizedGameType,
      week,
      team
    );
    const legacyEvidenceId = getNFLAvailabilityResearchEvidenceId(season, week, team);

    let artifactResult = await read(
      researchRepository.PERSISTENCE_RECORD_TYPES.EVIDENCE_ARTIFACT,
      canonicalEvidenceId,
      `nfl-multisignal-availability-read-team-artifact:${canonicalEvidenceId}`
    );
    let evidenceId = canonicalEvidenceId;
    let identityMode = "CANONICAL_MULTI_SIGNAL";

    if (
      !success(artifactResult) &&
      artifactResult?.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.NOT_FOUND
    ) {
      artifactResult = await read(
        researchRepository.PERSISTENCE_RECORD_TYPES.EVIDENCE_ARTIFACT,
        legacyEvidenceId,
        `nfl-availability-read-team-artifact:${legacyEvidenceId}`
      );
      evidenceId = legacyEvidenceId;
      identityMode = "LEGACY_FALLBACK";
    }

    if (!success(artifactResult)) {
      return {
        status:
          artifactResult?.status === researchRepository.PERSISTENCE_OPERATION_STATUSES.NOT_FOUND
            ? "NOT_FOUND"
            : "REPOSITORY_ERROR",
        artifact: null,
        source: null,
        observations: [],
        session: null,
        evidenceId,
        identityMode,
        result: artifactResult,
      };
    }

    const sourceResult = await read(
      researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE,
      artifactResult.record?.sourceRefs?.[0] || NFL_AVAILABILITY_RESEARCH_SOURCE_ID,
      `nfl-availability-read-source:${season}:${normalizedGameType}:${week}:${team}`
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

    const sessionRef = artifactResult.record?.sessionRef || null;
    const sessionResult = sessionRef
      ? await read(
          researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SESSION,
          sessionRef,
          `nfl-availability-read-session:${sessionRef}`
        )
      : null;

    return {
      status: "SUCCESS",
      artifact: artifactResult.record,
      source: success(sourceResult) ? sourceResult.record : null,
      observations,
      session: success(sessionResult) ? sessionResult.record : null,
      evidenceId,
      identityMode,
    };
  }

  return { persistBundle, readTeamWeek };
}

export default {
  createNFLAvailabilityResearchRepositoryService,
};
