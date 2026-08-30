import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.RESEARCH_REPOSITORY_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const result = await pool.query(`
    select
      current_database() as database_name,
      current_schema() as schema_name,
      to_regclass('public.research_sources') as research_sources,
      to_regclass('public.research_sessions') as research_sessions,
      to_regclass('public.recorded_observations') as recorded_observations,
      to_regclass('public.analytical_observations') as analytical_observations,
      to_regclass('public.evidence_artifacts') as evidence_artifacts
  `);

  console.log(JSON.stringify(result.rows[0], null, 2));
} finally {
  await pool.end();
}
