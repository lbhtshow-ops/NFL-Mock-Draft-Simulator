# Controlled Canonical Prospect Identity Issuance Request

ProspectIdentityIssuanceRequest version 1.0.0 is an immutable proposal for a future authorization review. It is not an identifier, authorization, issuance command, record payload, persistence request, promotion, or simulator registration.

## Prerequisite chain

The request references—without copying—the governed dry-run plan, identity authority decision, and identifier convention assessment. Evaluation context declares whether those references align, the subject matches, versions remain current, and the prerequisite outcomes satisfy the requested action. No lookup occurs.

New identity requests require ISSUE_NEW_IDENTITY, CONVENTION_SATISFIED, explicit entity layers, committed ownership, sufficient evidence, no duplicate, a governed namespace, an identified future authority candidate, permitted purpose/environment, valid lifecycle, and caller-declared idempotency. A ready result means only eligible for a separate future authorization review.

Reuse requests require REUSE_EXISTING_IDENTITY and a governed existing canonical reference. They never request a replacement identifier. Person, Player, Prospect, and Prospect Profile intentions remain explicit: Player may reuse Person; Prospect may reuse Person and Player; Profile review never implies new stable identity.

## Draft cycle and profile actions

Identity action, profile action, and draft-cycle action are independent. Draft-cycle conflict produces review or blocking and cannot create a new Person, Player, or Prospect. Peter Woods retains the existing identity while the 2026/2027 classification conflict remains unresolved and reclassification remains unauthorized.

## Request identity and idempotency

Request ID, operation ID, optional batch/correlation ID, and caller-provided idempotency key reference are operational metadata, not canonical identity. Names and canonical entity references cannot be idempotency keys. No hashing or key generation is implemented. Batch evaluation detects duplicate request IDs and idempotency references without selecting a winner by input order.

## Lifecycle, supersession, and cancellation

Valid declarations are DRAFT, SUBMITTED, UNDER_REVIEW, BLOCKED, READY_FOR_AUTHORIZATION, SUPERSEDED, CANCELLED, EXPIRED, and REJECTED. Evaluation recommends but never mutates state. Supersession preserves predecessor references and history. Cancellation requires a declared authority in future workflow, never deletes a request, and performs no persistence. Expiration is never invented without a clock-owned external mechanism.

## Permissions and future boundaries

Generation, issuance, reservation, Person/Player/Prospect/Profile creation, canonical modification, merge, cycle reclassification, persistence, promotion, simulator registration, and request execution are always false.

The next boundary is Canonical Prospect Identity Issuance Authorization Contract. Only a valid REQUEST_READY_FOR_AUTHORIZATION assessment may enter it. The future identifier issuer remains a later, separate architecture and is not implemented here.
