import pg from "pg";
const { Pool } = pg;
const databaseUrl = process.env.RESEARCH_REPOSITORY_DATABASE_URL;
if (!databaseUrl) throw new Error("RESEARCH_REPOSITORY_DATABASE_URL is required for read-only inspection.");
const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false }, application_name: "lbht-fie-identity-isolation-inspection" });
try {
  const legacyEvidenceId = "evidence:nfl-multisignal-availability:2026:1:bal";
  const legacySessionId = "research-session:nfl-multisignal-availability:2026:1";
  const artifact = await pool.query("select evidence_id, created_at, updated_at, payload from public.evidence_artifacts where evidence_id=$1", [legacyEvidenceId]);
  const session = await pool.query("select session_id, created_at, updated_at, payload from public.research_sessions where session_id=$1", [legacySessionId]);
  console.log(JSON.stringify({
    inspection: "LEGACY_MULTI_SIGNAL_IDENTITY_COLLISION_READ_ONLY",
    mutated: false,
    legacyArtifact: artifact.rowCount ? { evidenceId: artifact.rows[0].evidence_id, createdAt: artifact.rows[0].created_at, updatedAt: artifact.rows[0].updated_at, recordedObservationRefCount: Array.isArray(artifact.rows[0]?.payload?.recordedObservationRefs) ? artifact.rows[0].payload.recordedObservationRefs.length : null } : null,
    legacySession: session.rowCount ? { sessionId: session.rows[0].session_id, createdAt: session.rows[0].created_at, updatedAt: session.rows[0].updated_at, evidenceArtifactRefs: session.rows[0]?.payload?.artifactRefs?.evidenceArtifactRefs ?? null, recordedObservationRefCount: Array.isArray(session.rows[0]?.payload?.artifactRefs?.recordedObservationRefs) ? session.rows[0].payload.artifactRefs.recordedObservationRefs.length : null } : null,
    correctedExpected: {
      evidenceId: "evidence:nfl-multisignal-availability:2026:pre:1:bal",
      sessionId: "research-session:nfl-multisignal-availability:2026:pre:1"
    }
  }, null, 2));
} finally { await pool.end(); }
