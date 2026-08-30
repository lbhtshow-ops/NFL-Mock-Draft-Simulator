# Canonical Prospect Identity Authority Policy

| Attribute | Value |
| --- | --- |
| Policy | `CANONICAL_PROSPECT_IDENTITY_AUTHORITY_POLICY` |
| Version | `1.0.0` |
| Domain | `PROSPECT_IDENTITY` |
| Status | `ACTIVE` |

## Scope

This policy evaluates whether a valid Prospect Identity Dry-Run Plan is eligible for identity reuse review or a future issuance request. It defines authority only. It does not issue, reserve, generate, merge, create, update, persist, promote, or register anything.

## Identity and authority layers

FootballEntity owns canonical entity identity. Person, Player, Prospect, Prospect Profile, and draft-cycle classification are separate layers. Identity discovery does not authorize matching; matching does not authorize reuse; reuse does not authorize issuance; issuance does not authorize reservation; and identity authority does not authorize profile creation, cycle classification, persistence, promotion, execution, or simulator registration.

FIIS authority roles remain distinct: reviewer, approver, data steward, domain owner, source/external authority, persistence approver, and execution approver. Policy ownership or review never implies persistence or execution authority.

## Identifier policy

FootballEntity canonical references have a governed namespace syntax. The repository does not yet approve a final prospect issuer, issuance algorithm, deterministic/opaque choice, reservation mechanism, or profile-ID issuance convention. Person, Player, and Prospect Profile contracts require caller-supplied identifiers but do not grant callers issuance authority. Persistence IDs are stored-version identities and remain distinct from canonical record IDs. Draft cycle is not part of Person identity.

Therefore `CANONICAL_IDENTIFIER_CONVENTION_UNRESOLVED` blocks future issuance eligibility unless an explicit authority context declares that a separately approved convention is resolved. This policy never selects that convention.

## Evidence requirements

Required declarations are stable identity facts, verified name, source references, evidence references, a verification decision, and established entity type. Aliases, affiliation, position, roster evidence, and relationship evidence are optional and may support review. Date of birth is not required. The evaluator reports required, present, missing, and conflicting evidence without calculating confidence.

## Reuse, aliases, and duplicates

Exact reuse requires one governed canonical reference, committed ownership, eligible lifecycle, no unresolved duplicate, explicit reuse authority, and separate draft-cycle treatment. An existing Person or Player identity is reused rather than duplicated; missing downstream layers require their own future authority. Name-only and alias-only matches require review and never establish equivalence. Multiple canonical candidates and cross-request collisions prohibit separate issuance; input order never chooses a winner.

## Draft-cycle treatment

Identity remains stable independently of cycle classification. Allowed advisory actions are `NO_CYCLE_ACTION`, `REUSE_EXISTING_CYCLE_CLASSIFICATION`, `REQUEST_NEW_CYCLE_CLASSIFICATION`, `REQUEST_CYCLE_RECLASSIFICATION`, `REVIEW_CYCLE_CONFLICT`, and `BLOCK_CYCLE_CHANGE`. The evaluator never performs any action. Peter Woods' 2026/2027 conflict remains review-required and cannot authorize a duplicate identity or automatic reclassification.

## Ownership and permissions

Future issuance eligibility requires committed identity-record ownership. Authoring authority, contract owner, data steward, review authority, domain authority, source authority, persistence authority, and execution authority are reported independently. Uncommitted ownership never permits issuance eligibility.

Every decision fixes all execution permissions to false, including issuance, reservation, Person/Player/Prospect/Profile creation, cycle reclassification, persistence, promotion, simulator registration, merge, and canonical modification. `ISSUE_NEW_IDENTITY` means eligible for a separate future issuance request—not permission to issue.

## Lifecycle and review triggers

The policy must be reviewed when identifier conventions, authority roles, or evidence standards change. Name/alias-only matching, ownership ambiguity, duplicate risk, legacy conflict, draft-cycle conflict, and multiple canonical candidates always trigger review. Superseded, archived, or otherwise prohibited identity lifecycle states block reuse and issuance.

## Future boundary and unresolved questions

The next boundary may define the canonical prospect identifier convention and issuer. It must decide namespace ownership, deterministic versus opaque issuance, reservation semantics, entity/profile-specific rules, and collision handling without changing this policy's execution prohibition. A later issuance-request contract may consume an eligible decision, but neither this document nor the evaluator is an issuer.
