import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.RESEARCH_REPOSITORY_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const tables = [
    "research_sources",
    "research_sessions",
    "recorded_observations",
    "analytical_observations",
    "evidence_artifacts",
  ];

  const results = {};

  for (const table of tables) {
    const result = await pool.query(
      `select count(*)::int as count from public.${table}`
    );
    results[table] = result.rows[0].count;
  }

  console.log(
    JSON.stringify(
      {
        verification: "RESEARCH_REPOSITORY_POST_WRITE_COUNTS",
        database: "postgres",
        results,
      },
      null,
      2
    )
  );
} finally {
  await pool.end();
}
