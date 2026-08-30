# Runtime Evidence Framework Authorization Model

## 1. Authorization rule

Authorization is an explicit decision by a competent authority permitting a precisely bounded governed operation. It is neither access nor execution evidence. Every record distinguishes the operation, artifact where applicable, target, environment, executor, mechanism, time, attempts, executions, mutations, transaction semantics, observations, preservation, review, and exclusions.

## 2. Scope dimensions and assessment

The canonical dimensions are operation identity; artifact identity; artifact version; intended bytes or other immutable representation; target; environment; branch or deployment context; operator or executor; allowed execution mechanism; allowed time window; maximum attempts; maximum executions; allowed operation range; required transaction boundary; required observation plan; required evidence capture; permitted mutations; prohibited mutations; required stop conditions; required review; and successor-action restrictions.

Assessment outcomes are exact, bounded, ambiguous, incomplete, overbroad, contradictory, invalid, expired, revoked, and consumed. Exactness means each required dimension identifies one supported interpretation. Bounded authority may allow a declared finite set or range. Ambiguous, incomplete, overbroad, contradictory, invalid, expired, revoked, and consumed authority cannot authorize a new execution.

## 3. Exclusion governance

Each relevant action is classified as excluded, not addressed, conditionally permitted, or separately authorized. High-risk silence is treated as not addressed and therefore not permitted. The record expressly addresses retry, reuse, editing, partial or selected-statement execution, alternate target or environment, role or privilege changes, cleanup, repair, migration, RPC or application operation, remediation, reconciliation, post-verification, successor operation, automatic client retry, and Dashboard Retry.

The explicit exclusion vocabulary is: no retry; no reuse; no editing; no partial execution; no selected-statement execution; no alternate target; no alternate environment; no role change; no additional privilege change; no cleanup; no repair; no post-verification; no migration; no RPC; no application operation; no successor operation; no automatic client retry; and no Dashboard Retry.

Conditional permission states the condition and proof required. Separately authorized means a new decision and record are required; it never enlarges the current authorization.

## 4. Lifecycle, activation, and consumption

Authority reserved means issued but not yet available because conditions or a time window remain unsatisfied. Authority activated means valid and available. Authority consumed means the governed consumption event occurred. Operation executed means runtime evidence supports some or all execution. Outcome established means evidence supports an outcome. These five facts are independent.

The authorization selects a consumption rule according to mutation risk, replay safety, idempotence, observability, ability to prove non-receipt, external side effects, and cost of duplicate execution. Candidate boundaries include operator initiation, client submission, platform or server receipt, execution acknowledgement, first governed statement, or first mutation.

For safety-sensitive one-execution operations, consumption occurs no later than execution beginning under every outcome because submission, disconnect, timeout, partial execution, or missing acknowledgment may leave effects unknowable. Conservative consumption prevents duplicate effects. This is not a universal rule: a local validation failure before submission or a proven precondition failure before execution may remain unconsumed only when the authorization expressly chooses that boundary and evidence proves it was not crossed. Timeout before proven server receipt, partial submission, disconnect after submission, client uncertainty, and platform uncertainty are assessed against the selected rule; uncertainty never restores authority. First mutation is too late where earlier statements or external effects matter. Acknowledgment is too late where execution can precede it.

## 5. Attempts and counts

Maximum attempts bounds initiation efforts; maximum executions bounds runtime entries. An attempt can exist without execution. A single-use authorization is not reusable after consumption even when execution fails. Multiple attempts or retries require explicit limits, conditions, identity separation, and evidence capable of distinguishing them.

## 6. Preconditions

Required checks cover repository, artifact, integrity, target, environment, operator, permission context, runtime/database state, migration, dependency, observation, custody, authorization validity and history, and prohibited concurrency. Each check identifies its verification class, owner, time of validity, result, and evidence. A required failure or unresolved result blocks execution; no cross-domain attestation is silently promoted.

## 7. Mutation and transaction authority

Every authorization classifies the operation as read-only, transaction-local mutation, persistent mutation, rollback-required, commit-authorized, unknown persistence, or externally controlled persistence. It states exactly what mutation is permitted, whether commit is permitted, whether rollback is required, and whether transaction control belongs to the operator, artifact, runtime, or platform.

Rollback is an authorized requirement, not proof that each intended statement ran. Commit authority does not prove a commit or artifact identity. An error does not prove no persistent effect, and platform-controlled persistence requires platform-appropriate evidence. Persistent-state claims require observation of the relevant authoritative state with sufficient correlation and custody.

## 8. Retry and successor authorization

Retry is a governed decision, never a user-interface action. A same-authorization retry is allowed only when expressly scoped with remaining attempts/executions and when the prior event did not consume single-use authority. A newly authorized retry references the prior attempt and its uncertainties. Diagnostic, remediation, reconciliation, repair, cleanup, and post-verification successors each require purpose-specific scope and cannot inherit mutation authority by implication. An unrelated new operation remains separately governed.

A successor references and preserves the predecessor proposal, authorization, artifact, target, attempts, outcome, evidence, uncertainties, decisions, conclusions, and unanswered questions. It cannot rewrite history. Reconciliation may establish state without authorizing remediation; remediation may change state without authorizing cleanup; post-verification observes only what its separate authority permits.

## 9. Responsibility and boundary

The authorizing authority establishes permission; the operator or executor complies; clients and platforms report only their layers; runtime and database attest their own events; observers capture within authority; reviewers assess; decision authorities determine next steps. Independence is declared and supported, not presumed.

This model creates no executable permission, authorization token, constants, schema, or enforcement mechanism.
