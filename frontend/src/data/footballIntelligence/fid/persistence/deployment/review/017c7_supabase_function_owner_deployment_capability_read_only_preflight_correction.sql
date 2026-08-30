-- SPRINT 17C.8 SUPABASE FUNCTION-OWNER DEPLOYMENT CAPABILITY PREFLIGHT CORRECTION. READ-ONLY.
-- Exact target: project ahmorpzcaapvoymiqlkv. Inspect role governance only and stop.

-- BLOCK A: session identity and PostgreSQL version.
SELECT pg_catalog.current_setting('server_version') AS server_version,
       CURRENT_USER AS current_role,
       SESSION_USER AS session_role,
       pg_catalog.current_database() AS current_database,
       'ROLE_CAPABILITY_IDENTITY_RECORDED'::text AS sanitized_classification;

-- BLOCK B: security-relevant attributes of the session, current, and target-owner roles.
WITH relevant_roles(role_name) AS (
  VALUES (CURRENT_USER::text),(SESSION_USER::text),('postgres'),('fid_function_owner')
)
SELECT DISTINCT expected.role_name,
       role_record.rolcanlogin,
       role_record.rolsuper,
       role_record.rolinherit,
       role_record.rolcreaterole,
       role_record.rolcreatedb,
       role_record.rolreplication,
       role_record.rolbypassrls,
       CASE WHEN role_record.oid IS NULL THEN 'ROLE_ABSENT'
            WHEN expected.role_name='fid_function_owner'
             AND NOT role_record.rolcanlogin AND NOT role_record.rolsuper
             AND NOT role_record.rolinherit AND NOT role_record.rolcreaterole
             AND NOT role_record.rolcreatedb AND NOT role_record.rolreplication
             AND NOT role_record.rolbypassrls
              THEN 'RESTRICTED_FUNCTION_OWNER_ATTRIBUTES_CONFIRMED'
            ELSE 'ROLE_ATTRIBUTES_RECORDED'
       END AS sanitized_classification
FROM relevant_roles AS expected
LEFT JOIN pg_catalog.pg_roles AS role_record ON role_record.rolname=expected.role_name
ORDER BY expected.role_name COLLATE "C";

-- BLOCK C: exact direct membership record and PostgreSQL 17 membership options.
SELECT member_role.rolname AS member_role,
       target_role.rolname AS target_role,
       grantor_role.rolname AS grantor_role,
       membership.admin_option,
       membership.inherit_option,
       membership.set_option,
       CASE WHEN membership.roleid IS NULL THEN 'DIRECT_MEMBERSHIP_ABSENT'
            WHEN membership.set_option THEN 'DIRECT_MEMBERSHIP_SET_CAPABLE'
            ELSE 'DIRECT_MEMBERSHIP_WITHOUT_SET_CAPABILITY'
       END AS sanitized_classification
FROM (SELECT 1) AS seed
LEFT JOIN pg_catalog.pg_roles AS member_role ON member_role.rolname='postgres'
LEFT JOIN pg_catalog.pg_roles AS target_role ON target_role.rolname='fid_function_owner'
LEFT JOIN pg_catalog.pg_auth_members AS membership
  ON membership.member=member_role.oid AND membership.roleid=target_role.oid
LEFT JOIN pg_catalog.pg_roles AS grantor_role ON grantor_role.oid=membership.grantor;

-- BLOCK D: complete direct or indirect membership paths and their effective options.
WITH RECURSIVE membership_path AS (
  SELECT membership.member AS source_member_oid,
         membership.roleid AS reached_role_oid,
         membership.grantor AS grantor_oid,
         1 AS path_depth,
         membership.admin_option,
         membership.inherit_option,
         membership.set_option,
         membership.inherit_option AS path_inherit_option,
         membership.set_option AS path_set_option,
         ARRAY[membership.member,membership.roleid]::oid[] AS visited_roles
  FROM pg_catalog.pg_auth_members AS membership
  JOIN pg_catalog.pg_roles AS member_role ON member_role.oid=membership.member
  WHERE member_role.rolname='postgres'
  UNION ALL
  SELECT path.source_member_oid,
         membership.roleid,
         membership.grantor,
         path.path_depth+1,
         membership.admin_option,
         membership.inherit_option,
         membership.set_option,
         path.path_inherit_option AND membership.inherit_option,
         path.path_set_option AND membership.set_option,
         path.visited_roles||membership.roleid
  FROM membership_path AS path
  JOIN pg_catalog.pg_auth_members AS membership ON membership.member=path.reached_role_oid
  WHERE NOT membership.roleid=ANY(path.visited_roles)
)
SELECT source_role.rolname AS source_member,
       reached_role.rolname AS reached_role,
       grantor_role.rolname AS grantor_role,
       path.path_depth,
       path.admin_option,
       path.inherit_option,
       path.set_option,
       path.path_inherit_option,
       path.path_set_option,
       CASE WHEN reached_role.rolname='fid_function_owner' AND path.path_set_option
              THEN 'EFFECTIVE_SET_PATH_PRESENT'
            WHEN reached_role.rolname='fid_function_owner'
              THEN 'MEMBERSHIP_PATH_WITHOUT_EFFECTIVE_SET'
            ELSE 'INTERMEDIATE_MEMBERSHIP_PATH'
       END AS sanitized_classification
FROM membership_path AS path
JOIN pg_catalog.pg_roles AS source_role ON source_role.oid=path.source_member_oid
JOIN pg_catalog.pg_roles AS reached_role ON reached_role.oid=path.reached_role_oid
LEFT JOIN pg_catalog.pg_roles AS grantor_role ON grantor_role.oid=path.grantor_oid
ORDER BY path.path_depth, reached_role.rolname COLLATE "C";

-- BLOCK E: effective MEMBER, USAGE, SET, ADMIN, schema, and ownership-transfer capabilities.
WITH roles AS (
  SELECT pg_catalog.to_regrole('postgres') AS deployment_role_oid,
         pg_catalog.to_regrole('fid_function_owner') AS owner_role_oid,
         pg_catalog.to_regnamespace('fid') AS fid_schema_oid
), capability AS (
  SELECT deployment_role_oid,
         owner_role_oid,
         fid_schema_oid,
         CURRENT_USER='postgres' AS current_role_exact,
         SESSION_USER='postgres' AS session_role_exact,
         CASE WHEN deployment_role_oid IS NULL OR owner_role_oid IS NULL THEN false
              ELSE pg_catalog.pg_has_role(deployment_role_oid,owner_role_oid,'MEMBER') END AS member_capability,
         CASE WHEN deployment_role_oid IS NULL OR owner_role_oid IS NULL THEN false
              ELSE pg_catalog.pg_has_role(deployment_role_oid,owner_role_oid,'USAGE') END AS inherited_usage_capability,
         CASE WHEN deployment_role_oid IS NULL OR owner_role_oid IS NULL THEN false
              ELSE pg_catalog.pg_has_role(deployment_role_oid,owner_role_oid,'SET') END AS set_capability,
         CASE WHEN deployment_role_oid IS NULL OR owner_role_oid IS NULL THEN false
              ELSE pg_catalog.pg_has_role(deployment_role_oid,owner_role_oid,'MEMBER WITH ADMIN OPTION') END AS admin_capability,
         CASE WHEN deployment_role_oid IS NULL THEN false
              ELSE (SELECT role_record.rolsuper FROM pg_catalog.pg_roles AS role_record WHERE role_record.oid=deployment_role_oid) END AS deployment_role_superuser,
         CASE WHEN deployment_role_oid IS NULL THEN false
              ELSE (SELECT role_record.rolcreaterole FROM pg_catalog.pg_roles AS role_record WHERE role_record.oid=deployment_role_oid) END AS deployment_role_createrole,
         CASE WHEN deployment_role_oid IS NULL OR fid_schema_oid IS NULL THEN false
              ELSE pg_catalog.has_schema_privilege(deployment_role_oid,fid_schema_oid,'USAGE') END AS deployment_schema_usage,
         CASE WHEN deployment_role_oid IS NULL OR fid_schema_oid IS NULL THEN false
              ELSE pg_catalog.has_schema_privilege(deployment_role_oid,fid_schema_oid,'CREATE') END AS deployment_schema_create,
         CASE WHEN owner_role_oid IS NULL OR fid_schema_oid IS NULL THEN false
              ELSE pg_catalog.has_schema_privilege(owner_role_oid,fid_schema_oid,'USAGE') END AS owner_schema_usage,
         CASE WHEN owner_role_oid IS NULL OR fid_schema_oid IS NULL THEN false
              ELSE pg_catalog.has_schema_privilege(owner_role_oid,fid_schema_oid,'CREATE') END AS owner_schema_create
  FROM roles
)
SELECT deployment_role_oid::pg_catalog.regrole AS deployment_role,
       owner_role_oid::pg_catalog.regrole AS target_owner_role,
       CASE WHEN fid_schema_oid IS NULL THEN NULL::text ELSE 'fid'::text END AS schema_name,
       current_role_exact,
       session_role_exact,
       member_capability,
       inherited_usage_capability,
       set_capability,
       admin_capability,
       deployment_role_superuser,
       deployment_role_createrole,
       deployment_schema_usage,
       deployment_schema_create,
       owner_schema_usage,
       owner_schema_create,
       (current_role_exact AND session_role_exact AND set_capability
        AND deployment_schema_usage AND deployment_schema_create
        AND owner_schema_usage AND owner_schema_create) AS ownership_transfer_capability,
       (deployment_role_superuser OR admin_capability) AS membership_governance_capability,
       CASE
         WHEN owner_role_oid IS NULL THEN 'TARGET_OWNER_ROLE_MISSING'
         WHEN deployment_role_oid IS NULL THEN 'DEPLOYMENT_ROLE_MISSING'
         WHEN fid_schema_oid IS NULL THEN 'FID_SCHEMA_MISSING'
         WHEN NOT current_role_exact OR NOT session_role_exact THEN 'EXECUTION_IDENTITY_MISMATCH'
         WHEN set_capability AND deployment_schema_usage AND deployment_schema_create
          AND owner_schema_usage AND owner_schema_create
           THEN 'FUNCTION_OWNER_TRANSFER_CAPABILITY_CONFIRMED'
         WHEN NOT deployment_schema_usage OR NOT deployment_schema_create
           THEN 'DEPLOYMENT_ROLE_SCHEMA_CAPABILITY_MISSING'
         WHEN NOT owner_schema_usage OR NOT owner_schema_create
           THEN 'TARGET_OWNER_SCHEMA_CAPABILITY_MISSING'
         WHEN (deployment_role_superuser OR admin_capability) AND NOT set_capability THEN 'MEMBERSHIP_AMENDMENT_AUTHORITY_PRESENT_REVIEW_REQUIRED'
         WHEN member_capability AND NOT set_capability THEN 'MEMBER_WITHOUT_SET_OR_ADMIN_CAPABILITY'
         WHEN NOT member_capability THEN 'MEMBERSHIP_RELATIONSHIP_MISSING'
         ELSE 'OWNERSHIP_CAPABILITY_UNRESOLVED'
       END AS sanitized_classification
FROM capability;
