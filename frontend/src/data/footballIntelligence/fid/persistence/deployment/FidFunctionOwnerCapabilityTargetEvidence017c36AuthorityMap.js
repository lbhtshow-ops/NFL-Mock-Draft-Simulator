const field = (property, classification, owner, source, postgresObservable, stableDocumented, spoofability, sqlUse, prerequisite) => Object.freeze({
  property, classification, authoritativeOwner: owner, exactSource: source, postgresObservableWithoutCallerInput: postgresObservable,
  stableAndDocumented: stableDocumented, spoofability, safelyIncludedInSqlClassification: sqlUse,
  stage1OrAuthorizationPrerequisite: prerequisite,
});

export const TARGET_EVIDENCE_AUTHORITY_MAP_017C36 = Object.freeze([
  field("organization", "SUPABASE_PLATFORM_OBSERVABLE", "Supabase Platform", "Dashboard organization selector", false, true, "Not supplied by PostgreSQL; operator observation required", false, true),
  field("project_name", "SUPABASE_PLATFORM_OBSERVABLE", "Supabase Platform", "Dashboard project selector", false, true, "Not supplied by PostgreSQL; operator observation required", false, true),
  field("project_id", "SUPABASE_PLATFORM_OBSERVABLE", "Supabase Platform", "Dashboard project reference", false, true, "Not supplied by PostgreSQL; caller strings are not evidence", false, true),
  field("region", "SUPABASE_PLATFORM_OBSERVABLE", "Supabase Platform", "Dashboard project region", false, true, "Not supplied by PostgreSQL; caller strings are not evidence", false, true),
  field("branch", "SUPABASE_PLATFORM_OBSERVABLE", "Supabase Platform", "Dashboard branch selector/top bar", false, true, "Not supplied by PostgreSQL; PRODUCTION label alone is insufficient", false, true),
  field("database_source", "SUPABASE_PLATFORM_OBSERVABLE", "Supabase Dashboard", "SQL Editor database-source selector", false, true, "Database name does not prove Dashboard source selection", false, true),
  field("sql_role", "DATABASE_SESSION_OBSERVABLE", "PostgreSQL session", "CURRENT_USER and SESSION_USER", true, true, "CURRENT_USER changes under SET ROLE; SESSION_USER can be changed by privileged SET SESSION AUTHORIZATION", true, false),
  field("governed_environment", "GOVERNED_EXTERNAL_ATTESTATION", "LBHT deployment governance", "Exact-target authorization and Stage 1 operator confirmation", false, true, "Caller strings and Dashboard PRODUCTION label are not governance evidence", false, true),
]);

export const SESSION_EVIDENCE_AUTHORITY_MAP_017C36 = Object.freeze([
  field("CURRENT_USER", "DATABASE_SESSION_OBSERVABLE", "PostgreSQL", "CURRENT_USER", true, true, "Mutable through SET ROLE or SECURITY DEFINER context", true, false),
  field("SESSION_USER", "DATABASE_SESSION_OBSERVABLE", "PostgreSQL", "SESSION_USER", true, true, "Privileged sessions can use SET SESSION AUTHORIZATION", true, false),
  field("current_database()", "DATABASE_SESSION_OBSERVABLE", "PostgreSQL", "current_database()", true, true, "Query author cannot change the connected database within the statement", true, false),
]);

export default TARGET_EVIDENCE_AUTHORITY_MAP_017C36;
