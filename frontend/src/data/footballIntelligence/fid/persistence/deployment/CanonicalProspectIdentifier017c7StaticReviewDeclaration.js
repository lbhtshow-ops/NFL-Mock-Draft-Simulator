export const CANONICAL_PROSPECT_IDENTIFIER_017C7_STATIC_REVIEW_DECLARATION = Object.freeze({
  declarationId: "CANONICAL_PROSPECT_IDENTIFIER_017C7_STATIC_REVIEW_DECLARATION",
  declarationVersion: "1.0.0",
  status: "READY_FOR_CONTROLLED_SUPABASE_OWNERSHIP_CAPABILITY_READ_ONLY_PREFLIGHT_EXECUTION",
  exactTarget: Object.freeze({ projectId: "ahmorpzcaapvoymiqlkv", database: "PRIMARY_DATABASE", sqlEditorRole: "postgres", currentUser: "postgres", sessionUser: "postgres", governedEnvironment: "DEDICATED_NON_PRODUCTION_TEST" }),
  authoritativeState: Object.freeze({ migration014State: "MIGRATION_014_FULLY_ROLLED_BACK", migration014Applied: false, stage1Valid: true, migration015Absent: true }),
  artifact: Object.freeze({
    path: "src/data/footballIntelligence/fid/persistence/deployment/review/017c7_supabase_function_owner_deployment_capability_read_only_preflight_correction.sql",
    sha256: "BC96C898B17BB9C55B34991E6CB164C2AB038BD16B1DDC45BC4B2F12D939FD57",
    readOnly: true,
    postgresqlVersion: "17.6",
    sanitized: true,
  }),
  protected: Object.freeze({
    preflight017c6Sha256: "3D42FF4F38C7A3C3D7275F461E24BB55AB6B41DA8B6977537E67B3ADF695786B",
    migration014Sha256: "18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD",
    reconciliation017c5Sha256: "EF3F45440082D9558A6CCF60F9F91F1017D0EC8E3EC0338C37FCEB6DC4742AA7",
  }),
  findings: Object.freeze({ intendedDeltaOnly: true, readOnlySafe: true, postgresql17Compatible: true, identitiesBound: true, coverageComplete: true, falsePositivePrevented: true, sanitizationPassed: true, remainingDefects: Object.freeze([]) }),
  effects: Object.freeze({ sqlExecutedDuringReview: false, supabaseConnections: 0, databaseOperations: 0, roleChanges: 0, rpcInvocations: 0 }),
});

export default CANONICAL_PROSPECT_IDENTIFIER_017C7_STATIC_REVIEW_DECLARATION;
