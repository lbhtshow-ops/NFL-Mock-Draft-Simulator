# Sprint 17C.61 ACL observation-semantics audit

Status: `FID_ATOMIC_FUNCTION_ACL_TRANSACTION_LOCAL_OBSERVATION_ROOT_CAUSE_CORRECTION_REQUIRED`

Root-cause classification: `OUTCOME_I_REPOSITORY_EVIDENCE_INSUFFICIENT`.

The protected 17C.60 SQL resolves one function OID by schema, name, and exact identity arguments, resolves each governed role once, captures before-state ACL and effective privileges in dedicated `before_*` variables, gates the exact schema-qualified `REVOKE` and `GRANT`, and then assigns the ACL counts to separate `direct_*` variables from a new `pg_proc`/`aclexplode` query. It next calls `has_function_privilege` into separate `effective_*` variables, recomputes membership paths, constructs predicates from those post-state variables, stores a new JSONB value in a transaction-local custom setting, emits that setting once, and explicitly rolls back.

No before-state record or JSON is reused. No post-state variable is assigned before the mutations. No variable shadowing, field collision, duplicate result key, stale prebuilt JSON, wrong `current_setting` key, pre-mutation emission, dynamic ACL statement, exception suppression, or result-field substitution exists in the repository artifact. The only dynamic SQL is the guarded read of the optional Migration 014 metadata relation and it does not participate in ACL observation.

PostgreSQL 17 semantics do not make the reported unchanged row an expected result: `GRANT` and `REVOKE` are transactional utility statements; subsequent commands in the same transaction normally observe their catalog changes; PL/pgSQL plan caching caches plans, not result rows; `aclexplode` expands the ACL value supplied by the new catalog query; and ACL catalog/cache invalidation is expected after privilege changes. `has_function_privilege` includes ownership, PUBLIC, and inherited membership paths, while direct ACL counts do not. A null `proacl` expands to the default function ACL, including PUBLIC EXECUTE, which the artifact handles with `acldefault`.

The runtime capture nevertheless reports that the intended statements executed and that every direct/effective observation remained at the pre-state. Repository text alone cannot establish whether the external client executed exactly the represented bytes, whether the server ran the represented utility commands, or whether an external runtime anomaly occurred. It therefore cannot prove statement non-execution, wrong targeting, stale observation, partial Dashboard execution, or another implementation defect.

No new read-only proof SQL was created: reading the current committed ACL through the same independent mechanisms would repeat 17C.58 and cannot prove same-transaction mutation visibility. No successor rollback diagnostic was created because no concrete 017c60a defect is proven. No execution, remediation, post-verification, Migration 014, or capability authorization was created.
