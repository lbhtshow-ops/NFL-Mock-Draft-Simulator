import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.RESEARCH_REPOSITORY_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const correctedEvidenceId =
    "evidence:nfl-multisignal-availability:2026:pre:1:bal";

  const correctedSessionId =
    "research-session:nfl-multisignal-availability:2026:pre:1";

  const legacyEvidenceId =
    "evidence:nfl-multisignal-availability:2026:1:bal";

  const legacySessionId =
    "research-session:nfl-multisignal-availability:2026:1";

  const correctedArtifact = await pool.query(`
    select
      evidence_id,
      deleted_at,
      payload
    from public.evidence_artifacts
    where evidence_id = $1
  `, [correctedEvidenceId]);

  const correctedSession = await pool.query(`
    select
      session_id,
      deleted_at,
      payload
    from public.research_sessions
    where session_id = $1
  `, [correctedSessionId]);

  const legacyArtifact = await pool.query(`
    select
      evidence_id,
      deleted_at
    from public.evidence_artifacts
    where evidence_id = $1
  `, [legacyEvidenceId]);

  const legacySession = await pool.query(`
    select
      session_id,
      deleted_at
    from public.research_sessions
    where session_id = $1
  `, [legacySessionId]);

  const artifactPayload =
    correctedArtifact.rows[0]?.payload ?? null;

  const observationRefs =
    Array.isArray(artifactPayload?.recordedObservationRefs)
      ? artifactPayload.recordedObservationRefs
      : [];

  let observations = [];

  if (observationRefs.length > 0) {
    const result = await pool.query(`
      select
        observation_id,
        deleted_at,
        payload
      from public.recorded_observations
      where observation_id = any($1::text[])
    `, [observationRefs]);

    observations = result.rows;
  }

  const activeObservations =
    observations.filter(row => row.deleted_at == null);

  const classCounts = {};

  for (const row of activeObservations) {
    const tags = Array.isArray(row?.payload?.metadata?.tags)
      ? row.payload.metadata.tags
      : [];

    const classTag = tags.find(tag =>
      typeof tag === "string" &&
      tag.startsWith("signal-class:")
    );

    const signalClass =
      classTag?.replace("signal-class:", "") ??
      row?.payload?.observation?.signalClass ??
      row?.payload?.signalClass ??
      "UNKNOWN";

    classCounts[signalClass] =
      (classCounts[signalClass] ?? 0) + 1;
  }

  console.log(JSON.stringify({
    verification:
      "CORRECTED_PRE_MULTI_SIGNAL_PERSISTENCE",

    corrected: {
      artifactFound:
        correctedArtifact.rowCount === 1,
      artifactActive:
        correctedArtifact.rows[0]?.deleted_at == null,

      sessionFound:
        correctedSession.rowCount === 1,
      sessionActive:
        correctedSession.rows[0]?.deleted_at == null,

      observationRefs:
        observationRefs.length,

      activeObservations:
        activeObservations.length,

      classCounts,
    },

    legacy: {
      artifactFound:
        legacyArtifact.rowCount === 1,
      artifactActive:
        legacyArtifact.rows[0]?.deleted_at == null,

      sessionFound:
        legacySession.rowCount === 1,
      sessionActive:
        legacySession.rows[0]?.deleted_at == null,
    },

    expected: {
      total: 187,
      depthChart: 95,
      rosterStatus: 92,
      officialInjuryReport: 0,
    },

    pass:
      correctedArtifact.rowCount === 1 &&
      correctedArtifact.rows[0]?.deleted_at == null &&
      correctedSession.rowCount === 1 &&
      correctedSession.rows[0]?.deleted_at == null &&
      activeObservations.length === 187 &&
      classCounts.DEPTH_CHART === 95 &&
      classCounts.ROSTER_STATUS === 92 &&
      (classCounts.OFFICIAL_INJURY_REPORT ?? 0) === 0 &&
      legacyArtifact.rows[0]?.deleted_at != null &&
      legacySession.rows[0]?.deleted_at != null,
  }, null, 2));

} finally {
  await pool.end();
}
