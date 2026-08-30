import failureRecord from "./CanonicalProspectIdentifier017c7ExecutionFailureRecord.js";

export const CANONICAL_PROSPECT_IDENTIFIER_017C8_DISTINCT_ORDER_CORRECTION_REVIEW = Object.freeze({
  reviewId: "CANONICAL_PROSPECT_IDENTIFIER_017C8_DISTINCT_ORDER_CORRECTION_REVIEW",
  reviewVersion: "1.0.0",
  status: "READY_FOR_017C8_READ_ONLY_PREFLIGHT_STATIC_REVIEW",
  failureRecordReference: `${failureRecord.recordId}@${failureRecord.recordVersion}`,
  exactTarget: Object.freeze({ projectId: "ahmorpzcaapvoymiqlkv", database: "PRIMARY_DATABASE", sqlEditorRole: "postgres" }),
  protected: Object.freeze({
    preflight017c7Sha256: "BC96C898B17BB9C55B34991E6CB164C2AB038BD16B1DDC45BC4B2F12D939FD57",
    migration014Sha256: "18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD",
  }),
  successor: Object.freeze({
    path: "src/data/footballIntelligence/fid/persistence/deployment/review/017c8_supabase_function_owner_deployment_capability_read_only_preflight_distinct_order_correction.sql",
    sha256: "5131801D2DFDCDBE04504BD0414272B66329E620EBBCEB1557F6FE8336105495",
    correction: "DEDUPLICATE_ROLE_NAMES_IN_INNER_CTE_ORDER_COLLATE_IN_OUTER_NON_DISTINCT_SELECT",
    returnedColumnsChanged: false,
    executionAuthorized: false,
  }),
  fullFileAudit: Object.freeze({ selectDistinctCount: 1, distinctAggregateCount: 0, unionAllCount: 1, intersectCount: 0, exceptCount: 0, orderByCount: 2, collateCount: 2, equivalentDefectsRemaining: 0 }),
  permissions: Object.freeze({ preflightExecution: false, migration014Execution: false, migration014Modification: false, roleChange: false, grant: false, supabaseConnection: false }),
});

export default CANONICAL_PROSPECT_IDENTIFIER_017C8_DISTINCT_ORDER_CORRECTION_REVIEW;
