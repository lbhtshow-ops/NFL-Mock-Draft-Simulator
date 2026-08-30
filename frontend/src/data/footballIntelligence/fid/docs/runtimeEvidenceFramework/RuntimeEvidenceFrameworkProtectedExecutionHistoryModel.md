# Runtime Evidence Framework Protected Execution History Model

## 1. Purpose

Protected execution history preserves the governed record needed to distinguish authority, attempts, execution, outcomes, evidence, decisions, and successors over time. Preservation follows REF-3 authenticity, integrity, provenance, custody, continuity, supersession, and retirement governance.

## 2. Protected record classes

History preserves proposals and scopes; plans and artifact identities; targets and environments; authorization authority, scope, constraints, exclusions, validity, revocation, expiration, and consumed status; attempts; executor and session claims; precondition results and their verification classes; execution identities, boundaries, stages, and events; runtime observations; raw and layer-visible results; errors and warnings; interruption and termination; outcome and uncertainty declarations; custody events; evidence reviews; decisions and conclusions; and successor authorizations.

Each record states provenance, applicable trust domain, time semantics, relationship to predecessors, and whether it is original, derivative, corrected, superseding, or retired. Protection does not elevate an unauthenticated record; it prevents later loss or misrepresentation of what was recorded.

## 3. Immutability and correction

An execution attempt is never overwritten by a later attempt. A failed execution is never replaced by a later success. Consumption cannot be cleared, and an artifact or target declaration cannot be silently edited. Corrections are additive and link to the erroneous record while preserving it. A later interpretation may supersede an earlier conclusion only by retaining both conclusions, their evidence, reasoning, authority, and effective order.

Retirement limits future use of a record without erasure. Supersession changes interpretive authority, not historical occurrence. Missing, contradictory, partial, or uncertain evidence remains visible after closure.

## 4. Successor lineage

Every successor authorization links to the exact predecessor authorization and attempts, historical artifact and target declarations, outcome, evidence assessment, unresolved questions, review, decision, and conclusion. The successor states why it is diagnostic, reconciliation, remediation, repair, cleanup, post-verification, retry, or unrelated. It creates a new authority lifecycle and never reopens its predecessor.

## 5. Review and access governance

Review verifies completeness, linkage, custody continuity, authenticity and integrity support, boundary gaps, and protection against overwrite. Access follows least disclosure and preserves evidence necessary for accountability. Reviewer and decision-authority identities, competence, and independence claims are recorded. Export, transformation, or redaction creates a derivative with lineage.

## 6. Sprint 17C applicability

Sprint 17C.57 authorized exactly one corrected remediation execution after platform recovery. Beginning that attempt consumed its authority even though the runtime error did not establish successful remediation; authorization status and outcome therefore remain separate. Dashboard Retry was explicitly prohibited and, in any event, a client control could not create authority.

Sprint 17C.58 was a distinct read-only reconciliation successor that preserved the failed predecessor and assessed current state without reopening remediation authority. Sprint 17C.60 was a distinct rollback-only diagnostic: commit and persistent mutation were prohibited, and its authorization was consumed when execution began under every outcome. Its returned evidence remained insufficiently correlated at the external runtime boundary because the repository could not prove exact submitted bytes or selection, exact target/session, server completion of both utility statements, or binding of the row to that transaction.

Sprint 17C.61 corrected the permissible interpretation to repository evidence insufficiency, and 17C.62 documented the boundary. Neither created successor authority. The protected conclusion remains that root cause was not established.

A future runtime-evidence operation would require its own proposal, scope, plan, immutable artifact identity, exact target/environment and authority, explicit consumption rule, execution identity, cross-layer correlation of submission through server/database session and transaction, stage-completion observations, result attribution, custody, uncertainty handling, review, and conclusion. This statement models requirements only; it neither designs nor authorizes such an operation.

## 7. Boundary

This model defines preservation semantics only. It creates no repository service, database, schema, storage, retention automation, authorization, or runtime mechanism.
