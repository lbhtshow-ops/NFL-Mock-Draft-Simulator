# Canonical Prospect Identifier Convention

CANONICAL_PROSPECT_IDENTIFIER_CONVENTION version 1.0.0 governs prospect-identity identifier semantics. It is an active governance contract, not an issuer, generator, reservation service, persistence adapter, migration, or simulator integration.

## Decision

The repository supports a hybrid convention. Canonical football entity references retain the approved namespaced form `<namespace>:<immutable-assigned-segment>`. The segment is assigned only by a future authorized issuer; this sprint defines no generator and does not make names, slugs, hashes, UUIDs, draft cycles, or storage keys issuance inputs. Human-readable UI slugs and opaque revision-aware persistence identifiers remain separate.

Opaque-only IDs reduce semantic leakage and tolerate corrections but weaken source readability. Deterministic name-based IDs are reproducible but unsafe under aliases, corrections, collisions, and merges. Hash IDs have similar correction and provenance problems and obscure review. The hybrid choice follows FootballEntityReferencePolicy while preserving separate external slugs and persistence identity.

## Identity layers and boundaries

| Layer | Meaning | Scope and stability | Owner / issuer |
|---|---|---|---|
| Person | Stable human identity | Immutable; never cycle, school, team, position, ranking, or declaration scoped | FID Person domain / separately authorized issuer |
| Player | A person's football-participation role | Survives school, season, position, and transfer changes | FID Player domain / separately authorized issuer |
| Prospect | Stable draft-prospect domain role | Survives draft-cycle reclassification | FID Prospect domain / separately authorized issuer |
| Prospect Profile | Factual and analytical profile chain | May be draft-cycle and revision scoped; never replaces Person | FID Prospect Profile domain |
| Canonical record | Version-independent source-controlled record chain | Path-owned chain with immutable revisions | FID record owner |
| Persistence ID | Storage-row/revision identity | Storage and revision aware; not public football identity | Persistence adapter or authorized caller |
| Record revision | Immutable revision number/path | May receive a new persistence ID while canonical identity survives | FID record owner |
| Source, research artifact, evidence, relationship | Owning record identity | Governed by each existing domain contract | Owning domain |
| Request, operation, batch, decision, promotion | Workflow/audit identity | Operational only; cannot substitute for entity identity | Owning operation contract/caller |
| Simulator, UI slug, legacy fixture | Application or legacy identity | Never establishes canonical FID identity | Simulator/application/legacy system |

One Person can participate through a Player role; the contracts do not authorize school- or season-specific Player replacement. A Player may enter the Prospect domain without making mutable eligibility facts part of Player identity. A Prospect can have multiple profile revisions or cycle-scoped profiles. Transfers, position, school, eligibility, and declaration changes are facts or classifications, not stable-identity replacement events.

## Namespaces, validation, and issuance

Canonical type and namespace must agree. Whitespace, mutable classifications, storage keys, operation IDs, simulator IDs, UI slugs, and unsupported caller issuance are prohibited. Existing exact Person, Player, and Prospect identifiers and an authorized merge survivor must be reused. Supplying a canonical-looking value never establishes issuance authority.

An ISSUE_NEW_IDENTITY authority decision means only that a separate future issuance request may be considered. Eligibility additionally requires CONVENTION_SATISFIED. Generation, issuance, reservation, identity creation, persistence, merge, deprecation, cycle reclassification, and simulator registration remain false.

## Draft cycle

Draft cycle is prohibited from Person, Player, and Prospect identity. It may appear in Prospect Profile, relationship, lifecycle, or classification metadata. The Peter Woods 2026/2027 conflict preserves the existing stable canonical reference while remaining blocked for separate cycle review. This convention neither resolves nor authorizes reclassification.

## Persistence and revision

Canonical entity identity, canonical record-chain identity, persistence row identity, and record revision are distinct. Database primary keys and Supabase IDs are not externally meaningful football identity by default. A revision may have a new persistence ID and predecessor persistence reference while retaining the canonical record chain and domain entity reference. Existing persistence contracts remain authoritative.

## Reuse, collisions, merge, and deprecation

Name, normalized name, alias, school, position, draft cycle, and simulator matches are insufficient for reuse. Exact collisions resolve only through governed reuse or blocking. Namespace, persistence, and cross-request collisions block; semantic and legacy collisions require review. Input order never selects a winner.

Future merge requires explicit authority, a survivor, non-destructive deprecated alias mapping, predecessor/successor references, relationship preservation, an audit trail, and a new persistence revision where applicable. Deprecation never deletes identity history. This sprint grants neither permission.

## Legacy, simulator, review, and lifecycle

Legacy runtime IDs, development fixture IDs, UI slugs, canonical candidates, prohibited-as-canonical values, and unresolved values remain classified. Operational use does not confer authority. No migration occurs. Simulator registration can later reference canonical identity, but cannot establish or override it.

Review is required for semantic or legacy collisions, unresolved legacy classification, merge/deprecation state, namespace uncertainty, draft-cycle conflict, and attempted layer conflation. Canonical/persistence substitution, operation/entity substitution, prohibited simulator or UI identity, namespace collision, and cross-request collision block.

The next boundary is a Controlled Canonical Prospect Identity Issuance Request Contract. It must consume a valid authority decision and convention assessment, remain non-executing, and remain separate from future issuer architecture.
