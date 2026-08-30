import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.RESEARCH_REPOSITORY_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const artifacts = await pool.query(`
    select
      evidence_id,
      contract_name,
      contract_version,
      created_at,
      updated_at,
      payload
    from public.evidence_artifacts
    order by created_at desc
    limit 10
  `);

  const sessions = await pool.query(`
    select
      session_id,
      contract_name,
      contract_version,
      created_at,
      updated_at,
      payload
    from public.research_sessions
    order by created_at desc
    limit 10
  `);

  const observations = await pool.query(`
    select
      count(*)::int as total
    from public.recorded_observations
  `);

  console.log(JSON.stringify({
    verification: "DISCOVER_LIVE_MULTI_SIGNAL_IDENTITIES",

    recentArtifacts: artifacts.rows.map(row => ({
      evidenceId: row.evidence_id,
      contractName: row.contract_name,
      contractVersion: row.contract_version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      targetRefs: row.payload?.targetRefs ?? null,
      evidenceType: row.payload?.evidenceType ?? null,
      recordedObservationRefCount:
        Array.isArray(row.payload?.recordedObservationRefs)
          ? row.payload.recordedObservationRefs.length
          : null,
    })),

    recentSessions: sessions.rows.map(row => ({
      sessionId: row.session_id,
      contractName: row.contract_name,
      contractVersion: row.contract_version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      evidenceArtifactRefCount:
        Array.isArray(row.payload?.evidenceArtifactRefs)
          ? row.payload.evidenceArtifactRefs.length
          : null,
      recordedObservationRefCount:
        Array.isArray(row.payload?.recordedObservationRefs)
          ? row.payload.recordedObservationRefs.length
          : null,
    })),

    totalRecordedObservations:
      observations.rows[0]?.total ?? null,
  }, null, 2));

} finally {
  await pool.end();
}
