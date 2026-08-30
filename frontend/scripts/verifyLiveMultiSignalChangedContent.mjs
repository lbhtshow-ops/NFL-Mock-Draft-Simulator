import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.RESEARCH_REPOSITORY_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const evidenceId =
    "evidence:nfl-multisignal-availability:2026:pre:1:bal";

  const artifact = await pool.query(`
    select
      evidence_id,
      record_version,
      is_deleted,
      created_at,
      updated_at,
      payload
    from public.evidence_artifacts
    where evidence_id = $1
  `, [evidenceId]);

  const payload = artifact.rows[0]?.payload ?? null;

  const refs =
    Array.isArray(payload?.recordedObservationRefs)
      ? payload.recordedObservationRefs
      : [];

  const observations = refs.length
    ? await pool.query(`
        select
          observation_id,
          record_version,
          is_deleted,
          created_at,
          updated_at,
          payload
        from public.recorded_observations
        where observation_id = any($1::text[])
      `, [refs])
    : { rows: [] };

  const classOf = row => {
    const tags = Array.isArray(row?.payload?.metadata?.tags)
      ? row.payload.metadata.tags
      : [];

    const tag = tags.find(value =>
      typeof value === "string" &&
      value.startsWith("signal-class:")
    );

    if (tag) {
      return tag.replace("signal-class:", "");
    }

    return (
      row?.payload?.observation?.signalClass ??
      row?.payload?.signalClass ??
      "UNKNOWN"
    );
  };

  const classCounts = {};

  for (const row of observations.rows) {
    const signalClass = classOf(row);

    classCounts[signalClass] =
      (classCounts[signalClass] ?? 0) + 1;
  }

  const newest = [...observations.rows]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )
    .slice(0, 10)
    .map(row => ({
      observationId: row.observation_id,
      signalClass: classOf(row),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      recordVersion: row.record_version,
      playerRef:
        row?.payload?.subject?.subjectRef ??
        row?.payload?.subjectRef ??
        row?.payload?.targetRef ??
        null,
      summary:
        row?.payload?.observation?.summary ??
        row?.payload?.summary ??
        null,
    }));

  console.log(JSON.stringify({
    verification:
      "LIVE_MULTI_SIGNAL_CHANGED_CONTENT_VERIFICATION",

    artifact: {
      found: artifact.rowCount === 1,
      evidenceId:
        artifact.rows[0]?.evidence_id ?? null,
      recordVersion:
        artifact.rows[0]?.record_version ?? null,
      isDeleted:
        artifact.rows[0]?.is_deleted ?? null,
      updatedAt:
        artifact.rows[0]?.updated_at ?? null,
      observationRefCount: refs.length,
    },

    currentSnapshot: {
      resolvedObservationCount:
        observations.rows.length,
      classCounts,
    },

    newestObservations: newest,
  }, null, 2));

} finally {
  await pool.end();
}
