# Canonical Prospect Identity Issuance Authorization

The active CANONICAL_PROSPECT_IDENTITY_ISSUANCE_AUTHORIZATION_POLICY version 1.0.0 governs immutable, non-executable authorization decisions. Authorization is neither identifier generation nor issuance, reservation, record creation, persistence, promotion, or simulator registration.

Only a request bound to REQUEST_READY_FOR_AUTHORIZATION may be approved. Scope is exact by entity layer and independently records identity, profile, and draft-cycle actions. Scope expansion, duplicate issuance, unauthorized actors, and production authorization are denied; unresolved prerequisites, ownership, evidence, versions, lifecycle, or idempotency block. Conditional or independent review needs remain AUTHORIZATION_REVIEW_REQUIRED.

Requesting actor, reviewer, and authorizing authority are independent for approval. Domain ownership, data stewardship, future issuing authority, and persistence authority remain distinct capabilities. An authorizer never becomes the issuer or executor.

Policy, convention, issuance-request, and assessment versions are bound exactly. TEST, DEDICATED_NON_PRODUCTION_TEST, and STAGING may be governance-eligible; no environment enables execution. Expiration uses only caller-declared references and no clock is invoked.

Lifecycle is declarative: DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, DENIED, BLOCKED, SUPERSEDED, REVOKED, EXPIRED, or CANCELLED. Supersession preserves the original decision and expanded scope requires review. Revocation requires separate authority and reason, preserves audit history, and disables future issuer eligibility. No lifecycle mutation or deletion occurs.

Every permission remains false, including mayInvokeIssuer. AUTHORIZATION_APPROVED means only eligible for a future Canonical Prospect Identifier Issuer Architecture planning stage.
