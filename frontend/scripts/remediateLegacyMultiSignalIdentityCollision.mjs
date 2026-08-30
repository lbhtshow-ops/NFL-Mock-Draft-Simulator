import pg from "pg";
import researchRepository from "../src/data/researchRepository/index.js";
import { createPostgresResearchRepositoryAdapter } from "../src/data/researchRepository/persistence/postgres/createPostgresResearchRepositoryAdapter.js";

const { Pool } = pg;
const LEGACY_EVIDENCE_ID = "evidence:nfl-multisignal-availability:2026:1:bal";
const LEGACY_SESSION_ID = "research-session:nfl-multisignal-availability:2026:1";
const CORRECTED_EVIDENCE_ID = "evidence:nfl-multisignal-availability:2026:pre:1:bal";
const CORRECTED_SESSION_ID = "research-session:nfl-multisignal-availability:2026:pre:1";
const EXPECTED_OBSERVATIONS = 187;
const execute = process.argv.includes("--execute-soft-delete");
const databaseUrl = process.env.RESEARCH_REPOSITORY_DATABASE_URL;
if (!databaseUrl) throw new Error("RESEARCH_REPOSITORY_DATABASE_URL is required.");

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  application_name: "lbht-fie-legacy-multisignal-identity-remediation",
});
const adapter = createPostgresResearchRepositoryAdapter({ pool, options: { allowSoftDelete: true, allowHardDelete: false } });

function softDeleteRequest(recordType, recordId) {
  return {
    requestId: `legacy-multisignal-soft-delete:${recordId}`,
    operation: researchRepository.PERSISTENCE_OPERATION_TYPES.DELETE,
    recordType,
    recordId,
    lifecycle: {
      action: researchRepository.PERSISTENCE_LIFECYCLE_ACTIONS.DELETE,
      deleteMode: researchRepository.PERSISTENCE_DELETE_MODES.SOFT_DELETE,
    },
    consistency: researchRepository.PERSISTENCE_CONSISTENCY_MODES.STANDARD,
    actor: { actorRef: "lbht-sports-intelligence-remediation", role: "CONTROLLED_REMEDIATION" },
    context: { source: "LEGACY_MULTI_SIGNAL_IDENTITY_COLLISION_REMEDIATION" },
  };
}

const payloadRefs = (row, path) => path.reduce((value, key) => value?.[key], row?.payload) ?? [];
const active = (row) => row && row.is_deleted === false;

try {
  const [artifactQ, sessionQ, correctedArtifactQ, correctedSessionQ] = await Promise.all([
    pool.query("select evidence_id,payload,is_deleted from public.evidence_artifacts where evidence_id=$1", [LEGACY_EVIDENCE_ID]),
    pool.query("select session_id,payload,is_deleted from public.research_sessions where session_id=$1", [LEGACY_SESSION_ID]),
    pool.query("select evidence_id,is_deleted from public.evidence_artifacts where evidence_id=$1", [CORRECTED_EVIDENCE_ID]),
    pool.query("select session_id,is_deleted from public.research_sessions where session_id=$1", [CORRECTED_SESSION_ID]),
  ]);
  const artifact = artifactQ.rows[0] ?? null;
  const session = sessionQ.rows[0] ?? null;
  const observationRefs = Array.isArray(artifact?.payload?.recordedObservationRefs) ? artifact.payload.recordedObservationRefs : [];
  const sessionObservationRefs = payloadRefs(session, ["artifactRefs", "recordedObservationRefs"]);
  const sessionEvidenceRefs = payloadRefs(session, ["artifactRefs", "evidenceArtifactRefs"]);

  const observationsQ = observationRefs.length
    ? await pool.query("select observation_id,payload,is_deleted from public.recorded_observations where observation_id = any($1::text[])", [observationRefs])
    : { rows: [] };
  const activeArtifactsQ = await pool.query("select evidence_id,payload from public.evidence_artifacts where is_deleted=false");
  const activeSessionsQ = await pool.query("select session_id,payload from public.research_sessions where is_deleted=false");

  const otherArtifactRefs = [];
  for (const row of activeArtifactsQ.rows) {
    if (row.evidence_id === LEGACY_EVIDENCE_ID) continue;
    const refs = Array.isArray(row?.payload?.recordedObservationRefs) ? row.payload.recordedObservationRefs : [];
    const overlap = refs.filter((ref) => observationRefs.includes(ref));
    if (overlap.length) otherArtifactRefs.push({ evidenceId: row.evidence_id, overlapCount: overlap.length });
  }
  const otherSessionRefs = [];
  for (const row of activeSessionsQ.rows) {
    if (row.session_id === LEGACY_SESSION_ID) continue;
    const refs = payloadRefs(row, ["artifactRefs", "recordedObservationRefs"]);
    const overlap = Array.isArray(refs) ? refs.filter((ref) => observationRefs.includes(ref)) : [];
    if (overlap.length) otherSessionRefs.push({ sessionId: row.session_id, overlapCount: overlap.length });
  }

  const checks = {
    legacyArtifactActive: active(artifact),
    legacySessionActive: active(session),
    artifactObservationRefCount: observationRefs.length === EXPECTED_OBSERVATIONS,
    sessionObservationRefCount: Array.isArray(sessionObservationRefs) && sessionObservationRefs.length === EXPECTED_OBSERVATIONS,
    sessionReferencesOnlyLegacyArtifact: Array.isArray(sessionEvidenceRefs) && sessionEvidenceRefs.length === 1 && sessionEvidenceRefs[0] === LEGACY_EVIDENCE_ID,
    observationRowsPresent: observationsQ.rows.length === EXPECTED_OBSERVATIONS,
    observationRowsActive: observationsQ.rows.every((row) => row.is_deleted === false),
    artifactSessionObservationRefsMatch: new Set(observationRefs).size === EXPECTED_OBSERVATIONS && new Set(sessionObservationRefs).size === EXPECTED_OBSERVATIONS && observationRefs.every((ref) => sessionObservationRefs.includes(ref)),
    noOtherArtifactReferences: otherArtifactRefs.length === 0,
    noOtherSessionReferences: otherSessionRefs.length === 0,
    correctedArtifactAbsent: correctedArtifactQ.rows.every((row) => row.is_deleted === true),
    correctedSessionAbsent: correctedSessionQ.rows.every((row) => row.is_deleted === true),
  };
  const ready = Object.values(checks).every(Boolean);

  if (!execute) {
    console.log(JSON.stringify({
      remediation: "LEGACY_MULTI_SIGNAL_IDENTITY_COLLISION",
      mode: "READ_ONLY_PREFLIGHT",
      mutated: false,
      readyForSoftDelete: ready,
      legacyEvidenceId: LEGACY_EVIDENCE_ID,
      legacySessionId: LEGACY_SESSION_ID,
      correctedEvidenceId: CORRECTED_EVIDENCE_ID,
      correctedSessionId: CORRECTED_SESSION_ID,
      expectedObservationCount: EXPECTED_OBSERVATIONS,
      checks,
      otherArtifactRefs,
      otherSessionRefs,
    }, null, 2));
    process.exit(ready ? 0 : 2);
  }

  if (!ready) throw new Error("REMEDIATION_PREFLIGHT_FAILED — repository state differs from the reviewed legacy validation bundle.");

  const results = { observations: [], artifact: null, session: null };
  for (const observationId of observationRefs) {
    const result = await adapter.delete(softDeleteRequest(researchRepository.PERSISTENCE_RECORD_TYPES.RECORDED_OBSERVATION, observationId));
    if (result?.status !== researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS) {
      throw new Error(`OBSERVATION_SOFT_DELETE_FAILED:${observationId}:${result?.status ?? "UNKNOWN"}`);
    }
    results.observations.push(observationId);
  }
  results.artifact = await adapter.delete(softDeleteRequest(researchRepository.PERSISTENCE_RECORD_TYPES.EVIDENCE_ARTIFACT, LEGACY_EVIDENCE_ID));
  if (results.artifact?.status !== researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS) throw new Error(`ARTIFACT_SOFT_DELETE_FAILED:${results.artifact?.status ?? "UNKNOWN"}`);
  results.session = await adapter.delete(softDeleteRequest(researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SESSION, LEGACY_SESSION_ID));
  if (results.session?.status !== researchRepository.PERSISTENCE_OPERATION_STATUSES.SUCCESS) throw new Error(`SESSION_SOFT_DELETE_FAILED:${results.session?.status ?? "UNKNOWN"}`);

  console.log(JSON.stringify({
    remediation: "LEGACY_MULTI_SIGNAL_IDENTITY_COLLISION",
    mode: "EXECUTE_SOFT_DELETE",
    mutated: true,
    status: "SUCCESS",
    softDeletedObservationCount: results.observations.length,
    softDeletedArtifact: LEGACY_EVIDENCE_ID,
    softDeletedSession: LEGACY_SESSION_ID,
    hardDeleteUsed: false,
    researchSourceTouched: false,
    correctedIdentityTouched: false,
  }, null, 2));
} finally {
  await pool.end();
}
