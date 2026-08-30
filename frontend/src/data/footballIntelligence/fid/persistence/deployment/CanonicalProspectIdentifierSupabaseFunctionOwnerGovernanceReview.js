import paths from "./CanonicalProspectIdentifierSupabaseFunctionOwnerGovernancePathComparison.js";

export const CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_FUNCTION_OWNER_GOVERNANCE_REVIEW = Object.freeze({
  reviewId: "CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_FUNCTION_OWNER_GOVERNANCE_REVIEW",
  reviewVersion: "1.0.0",
  status: "READY_FOR_SUPABASE_OWNERSHIP_CAPABILITY_READ_ONLY_PREFLIGHT_REVIEW",
  accessDate: "2026-07-25",
  exactTarget: Object.freeze({ projectId: "ahmorpzcaapvoymiqlkv", postgresVersion: "17.6", governedEnvironment: "DEDICATED_NON_PRODUCTION_TEST" }),
  authoritativeState: Object.freeze({ migration014State: "MIGRATION_014_FULLY_ROLLED_BACK", migration014Applied: false, migration015Absent: true }),
  protectedHashes: Object.freeze({
    migration014: "18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD",
    reconciliation017c5: "EF3F45440082D9558A6CCF60F9F91F1017D0EC8E3EC0338C37FCEB6DC4742AA7",
    prohibitedOriginalMigration014: "3B271BC994D82C8109CDE4E62E6A1F85A67E49F86C5D98FBD0EBA46D6D214F13",
  }),
  officialSources: Object.freeze([
    Object.freeze({ authority: "SUPABASE", url: "https://supabase.com/docs/guides/database/postgres/roles" }),
    Object.freeze({ authority: "SUPABASE", url: "https://supabase.com/docs/guides/database/postgres/roles-superuser" }),
    Object.freeze({ authority: "SUPABASE", url: "https://supabase.com/docs/guides/deployment/database-migrations" }),
    Object.freeze({ authority: "SUPABASE", url: "https://supabase.com/docs/reference/cli/supabase-projects-create#supabase-db-push" }),
    Object.freeze({ authority: "SUPABASE", url: "https://supabase.com/docs/guides/database/postgres/row-level-security" }),
    Object.freeze({ authority: "POSTGRESQL_17", url: "https://www.postgresql.org/docs/17/role-membership.html" }),
    Object.freeze({ authority: "POSTGRESQL_17", url: "https://www.postgresql.org/docs/17/functions-info.html" }),
    Object.freeze({ authority: "POSTGRESQL_17", url: "https://www.postgresql.org/docs/17/sql-grant.html" }),
    Object.freeze({ authority: "POSTGRESQL_17", url: "https://www.postgresql.org/docs/17/sql-alterfunction.html" }),
    Object.freeze({ authority: "POSTGRESQL_17", url: "https://www.postgresql.org/docs/17/sql-alterrole.html" }),
  ]),
  findings: Object.freeze({
    clientChangesAuthority: false,
    clientAuthorityReason: "DATABASE_AUTHORITY_FOLLOWS_AUTHENTICATED_DATABASE_IDENTITY_AND_MEMBERSHIP_NOT_CLIENT_INTERFACE",
    supabasePostgresIsTrueSuperuser: false,
    supabaseCustomRolesSupported: true,
    supabaseCliMigrationsSupported: true,
    repositoryAlternateDeploymentIdentityAuthorized: false,
    repositoryMembershipAmendmentAuthorized: false,
    currentSetCapabilityConfirmed: false,
    currentAdminCapabilityKnown: false,
    additionalReadOnlyPreflightRequired: true,
    supportRequiredNow: false,
  }),
  paths,
  preflight: Object.freeze({
    path: "src/data/footballIntelligence/fid/persistence/deployment/review/017c6_supabase_function_owner_deployment_capability_read_only_preflight.sql",
    sha256: "3D42FF4F38C7A3C3D7275F461E24BB55AB6B41DA8B6977537E67B3ADF695786B",
    executionAuthorized: false,
    reviewRequired: true,
    readOnly: true,
  }),
  permissions: Object.freeze({ migration014Modification: false, migration014Execution: false, sqlExecution: false, roleChange: false, grant: false, supabaseConnection: false, supportContact: false, rpcInvocation: false }),
});

export default CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_FUNCTION_OWNER_GOVERNANCE_REVIEW;
