# PostgreSQL feasibility review

One direct `pg.Client` can conceptually support one connection, one backend session, one explicit transaction, serial catalog/ACL stages, transaction-local visibility, and explicit rollback acknowledgement. Transaction-mode pooling cannot support the same session claim. Session pooling may, but requires affinity and hidden-replacement proof.

PostgreSQL does not make connection close proof of rollback acknowledgement, backend PID a stable identity, or a stable transaction identifier universally available for this purpose. Role membership, ownership-derived authority, PUBLIC privileges, grant options, RLS/BYPASSRLS, and catalog visibility require runtime proof. A low-privilege login cannot be assumed able to perform owner-preserving ACL administration.

Decision: `REF_V1_11_POSTGRESQL_FEASIBILITY_ACCEPTED_WITH_ROLE_AND_ENDPOINT_PROOF_REQUIRED`.
