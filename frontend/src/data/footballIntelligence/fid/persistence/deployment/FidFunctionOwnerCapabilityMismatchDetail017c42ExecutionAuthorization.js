import { AUTHORITATIVE_25_FIELD_ORDER_017C39 } from "./FidFunctionOwnerCapabilityMismatchDetail017c39OrderedFields.js";

export const FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_017C42_EXECUTION_AUTHORIZATION = Object.freeze({
  authorizationId: "SPLIT_AUTHORITY_MISMATCH_DETAIL_DIAGNOSTIC_ONE_EXECUTION_017C42_V1",
  version: "17C.42.1", status: "ACTIVE_UNCONSUMED", consumed: false, reusable: false,
  organization: "Lunch Break Hot Take", projectName: "LBHT FID Persistence Test", projectReference: "ahmorpzcaapvoymiqlkv",
  region: "us-east-1", branch: "main", platformBranchLabel: "PRODUCTION",
  platformLabelMeaning: "PRIMARY_BRANCH_TOPOLOGY_ONLY_FOR_THIS_EXACT_DEDICATED_NON_PRODUCTION_TEST_TARGET",
  dashboardDatabaseSource: "Primary Database", sqlEditorRole: "postgres", governedEnvironment: "DEDICATED_NON_PRODUCTION_TEST",
  operation: "READ_ONLY_SPLIT_AUTHORITY_MISMATCH_DETAIL_DIAGNOSTIC",
  sqlFilename: "017c40_fid_function_owner_capability_mismatch_detail_split_authority_25_field_successor.sql",
  sqlPath: "frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c40_fid_function_owner_capability_mismatch_detail_split_authority_25_field_successor.sql",
  sqlSha256: "8D56003C1835ED6889C947DA75B56C4D032736DD31532FCF428FD68FF421688E",
  executionMode: "MANUAL_SUPABASE_DASHBOARD_SQL_EDITOR", maximumAttempts: 1, maximumExecutions: 1,
  completeFileByteForByteRequired: true, edits: "PROHIBITED", partialSelection: "PROHIBITED", retry: "PROHIBITED",
  readOnlyDiagnosticOnly: true, completeSingleRowRequired: true, fullMismatchDetailsWithoutTruncationRequired: true,
  resultColumns: AUTHORITATIVE_25_FIELD_ORDER_017C39,
  exclusions: Object.freeze({ secondExecution: "PROHIBITED", reconciliation: "PROHIBITED", repairOrCleanup: "PROHIBITED",
    grantOrRevoke: "PROHIBITED", roleOrMembershipChange: "PROHIBITED", capabilityAmendment: "PROHIBITED",
    postAmendmentVerification: "PROHIBITED", migration014: "PROHIBITED", rpc: "PROHIBITED",
    uuidOrCandidateGeneration: "PROHIBITED", identifierIssuance: "PROHIBITED", prospectOrCohortOperation: "PROHIBITED",
    databaseMutation: "PROHIBITED" }),
  consumption: Object.freeze({ event: "THE_SINGLE_EXECUTION_ATTEMPT_BEGINS", outcomeIndependent: true,
    consumedOn: Object.freeze(["SUCCESSFUL_RESULT", "SQL_ERROR", "TIMEOUT", "INTERRUPTION", "BROWSER_OR_NETWORK_UNCERTAINTY",
      "ZERO_ROWS", "MULTIPLE_ROWS", "MALFORMED_OUTPUT", "INCOMPLETE_OUTPUT", "UNKNOWN_COMPLETION"]),
    retryAuthorized: false, reusable: false }),
});

export default FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_017C42_EXECUTION_AUTHORIZATION;
