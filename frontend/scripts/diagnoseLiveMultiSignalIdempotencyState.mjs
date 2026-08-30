import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.RESEARCH_REPOSITORY_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const tables = [
    "evidence_artifacts",
    "research_sessions",
    "recorded_observations",
  ];

  const schema = {};

  for (const table of tables) {
    const result = await pool.query(`
      select
        column_name,
        data_type
      from information_schema.columns
      where table_schema = 'public'
        and table_name = $1
      order by ordinal_position
    `, [table]);

    schema[table] = result.rows;
  }

  const correctedArtifactId =
    "evidence:nfl-multisignal-availability:2026:pre:1:bal";

  const correctedSessionId =
    "research-session:nfl-multisignal-availability:2026:pre:1";

  const artifact = await pool.query(`
    select *
    from public.evidence_artifacts
    where evidence_id = $1
  `, [correctedArtifactId]);

  const session = await pool.query(`
    select *
    from public.research_sessions
    where session_id = $1
  `, [correctedSessionId]);

  const artifactPayload = artifact.rows[0]?.payload ?? null;

  const refs =
    Array.isArray(artifactPayload?.recordedObservationRefs)
      ? artifactPayload.recordedObservationRefs
      : [];

  let referencedRows = [];

  if (refs.length > 0) {
    const result = await pool.query(`
      select *
      from public.recorded_observations
      where observation_id = any($1::text[])
    `, [refs]);

    referencedRows = result.rows;
  }

  const liveMultisignalCount = await pool.query(`
    select count(*)::int as count
    from public.recorded_observations
    where observation_id like 'observation:nfl-multisignal-availability:2026:pre:1:bal:%'
  `);

  console.log(JSON.stringify({
    verification: "MULTISIGNAL_IDEMPOTENCY_DIAGNOSIS",

    schema,

    correctedArtifact: {
      rowCount: artifact.rowCount,
      row: artifact.rows[0] ?? null,
      observationRefCount: refs.length,
    },

    correctedSession: {
      rowCount: session.rowCount,
      row: session.rows[0] ?? null,
    },

    referencedObservations: {
      rowCount: referencedRows.length,
      uniqueObservationIds:
        new Set(referencedRows.map(row => row.observation_id)).size,
    },

    prefixObservationCount:
      liveMultisignalCount.rows[0]?.count ?? null,

  }, null, 2));

} finally {
  await pool.end();
}
