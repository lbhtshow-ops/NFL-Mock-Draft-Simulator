import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.RESEARCH_REPOSITORY_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const source = await pool.query(`
    select
      source_id,
      contract_name,
      contract_version,
      payload
    from public.research_sources
    order by created_at
  `);

  const session = await pool.query(`
    select
      session_id,
      contract_name,
      contract_version,
      payload
    from public.research_sessions
    order by created_at
  `);

  const observations = await pool.query(`
    select
      observation_id,
      contract_name,
      contract_version,
      payload
    from public.recorded_observations
    order by observation_id
  `);

  const artifact = await pool.query(`
    select
      evidence_id,
      contract_name,
      contract_version,
      payload
    from public.evidence_artifacts
    order by created_at
  `);

  const summary = {
    sourceIds: source.rows.map(r => r.source_id),
    sessionIds: session.rows.map(r => r.session_id),
    observationCount: observations.rowCount,
    observationIds: observations.rows.map(r => r.observation_id),
    evidenceIds: artifact.rows.map(r => r.evidence_id),
    sessionPayload: session.rows[0]?.payload ?? null,
    evidencePayload: artifact.rows[0]?.payload ?? null,
  };

  console.log(JSON.stringify(summary, null, 2));
} finally {
  await pool.end();
}
