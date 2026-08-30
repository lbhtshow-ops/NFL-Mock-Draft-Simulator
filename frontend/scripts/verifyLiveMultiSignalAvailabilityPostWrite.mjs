import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.RESEARCH_REPOSITORY_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const sourceId =
    "research-source:sportradar-nfl-availability-multisignal";

  const evidenceId =
    "evidence:nfl-availability-multisignal:2026:PRE:1:bal";

  const source = await pool.query(`
    select
      source_id,
      contract_name,
      contract_version,
      payload
    from public.research_sources
    where source_id = $1
  `, [sourceId]);

  const artifact = await pool.query(`
    select
      evidence_id,
      contract_name,
      contract_version,
      payload
    from public.evidence_artifacts
    where evidence_id = $1
  `, [evidenceId]);

  const artifactPayload = artifact.rows[0]?.payload ?? null;

  const observationRefs =
    Array.isArray(artifactPayload?.recordedObservationRefs)
      ? artifactPayload.recordedObservationRefs
      : [];

  let observations = [];

  if (observationRefs.length > 0) {
    const result = await pool.query(`
      select
        observation_id,
        payload
      from public.recorded_observations
      where observation_id = any($1::text[])
      order by observation_id
    `, [observationRefs]);

    observations = result.rows;
  }

  const classCounts = {};

  for (const row of observations) {
    const signalClass =
      row?.payload?.metadata?.tags?.find?.(
        tag => typeof tag === "string" && tag.startsWith("signal-class:")
      )?.replace("signal-class:", "")
      ??
      row?.payload?.observation?.signalClass
      ??
      row?.payload?.signalClass
      ??
      "UNKNOWN";

    classCounts[signalClass] =
      (classCounts[signalClass] ?? 0) + 1;
  }

  console.log(JSON.stringify({
    verification:
      "LIVE_MULTI_SIGNAL_AVAILABILITY_POST_WRITE",

    source: {
      found: source.rowCount === 1,
      sourceId:
        source.rows[0]?.source_id ?? null,
      accessType:
        source.rows[0]?.payload?.access?.type ?? null,
      status:
        source.rows[0]?.payload?.status ?? null,
    },

    artifact: {
      found: artifact.rowCount === 1,
      evidenceId:
        artifact.rows[0]?.evidence_id ?? null,
      recordedObservationRefs:
        observationRefs.length,
    },

    observations: {
      resolvedCount: observations.length,
      classCounts,
    },

    safetyChecks: {
      officialInjuryReports:
        classCounts.OFFICIAL_INJURY_REPORT ?? 0,
      expectedTotal: 187,
      totalMatches:
        observations.length === 187,
    },
  }, null, 2));

} finally {
  await pool.end();
}
