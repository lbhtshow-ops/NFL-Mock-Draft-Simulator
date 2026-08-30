# Runtime Evidence Framework Sprint 17C Target Use Case

## 1. Governed question

Can one governed runtime operation produce trustworthy evidence binding the exact protected artifact, target, execution context, completion of both intended ACL statements, immediate same-transaction catalog observation, returned row, and explicit rollback or transaction outcome?

This is a non-executable use-case definition. It creates no diagnostic, remediation, SQL, authorization, or claim that all runtime layers are observable. The ACL root cause remains unestablished.

## 2. Required claim map

| Required claim | Most likely REF observation layer | Evidence requirement | Likely residual gap |
| --- | --- | --- | --- |
| Artifact identity | Repository plus client/submission | Authenticate immutable protected identity and bind it to submission | Client selection or transformation may obscure exact bytes. |
| Target identity | Client/platform plus database | Correlate declared destination with server-side target evidence | Hosted platforms may mask routing. |
| Execution identity | Cross-layer correlation | One identity lineage across authorization, submission, session, transaction, result | No universal identifier may span every layer. |
| Client submission | Client/submission | Observe complete submitted operation and timing | Observation may be client-attested only. |
| Server receipt where observable | Platform/runtime | Observe acceptance of the complete submission | Platform may expose no trustworthy receipt event. |
| Database session identity | Database session | Bind execution events and observations to one session | Session identity may be hidden or transformed. |
| Transaction identity | Transaction | Establish same transaction for statements, observations, and rollback | Platform transaction abstraction may limit proof. |
| First ACL statement completion | Statement/runtime | Record completion or failure before progression | Receipt does not prove completion. |
| Second ACL statement completion | Statement/runtime | Record completion or failure and ordering after the first | Aggregate errors may not identify statement completion. |
| Immediate post-statement direct ACL observation | Catalog/state in the same transaction | Bind catalog observation after both statements | “Immediate” ordering and same-transaction correlation may remain partial. |
| Effective privilege observation | Database result/state | Bind privilege evaluation to the same session and transaction | Membership and ownership paths require careful interpretation. |
| Result attribution | Result plus cross-layer correlation | Bind raw returned row to the exact execution and transaction | Client transformation or truncation may intervene. |
| Rollback or commit outcome | Transaction/database | Observe explicit transaction termination and resulting state semantics | Client disconnect can leave termination uncertain. |
| Persistent-state conclusion | Authoritative database state plus review | Distinguish rollback-required non-persistence from unexpected effects | A rollback signal alone does not prove every intended statement ran. |
| Uncertainty and contradiction status | Evidence review | Preserve all gaps and compare layer claims | Some platform gaps may remain permanently unresolved. |

## 3. Sufficiency boundary

The evidence package is sufficient only if each claim needed for the investigation conclusion has adequate authenticity, integrity, provenance, custody, fidelity, completeness, ordering, non-interference, and correlation under REF-1 through REF-5. A gap in server receipt may be tolerable only if stronger downstream evidence independently establishes the required claim; it may not be silently assumed.

No single client response, returned row, transaction label, repository artifact, or operator attestation is sufficient for the complete question. Contradictions remain explicit and may require the conclusion “insufficient evidence.”

## 4. Protected-history relationship

Any future evidence record would reference—not modify—the 17C.57 authorization and failed result, 17C.58 reconciliation, 17C.60 rollback diagnostic record, and 17C.61–62 conclusions. It would require a new governed proposal and authorization. It cannot reopen consumed authority or rewrite the existing unresolved conclusion.
