# FootballEntity Canonical Reference Policy

FootballEntity remains FID's sole canonical identity owner. No separate canonical-identity contract or registry is introduced.

## Issuance

`entityId` is the canonical reference when it passes the canonical-reference policy. The format is `<namespace>:<identity-segment>`. Both parts use lowercase letters, numbers, and single hyphens. References are trimmed and lowercased deterministically, but internal whitespace, alternate separators, empty segments, unknown namespaces, and more than one colon are invalid. An issued reference is immutable; identity changes use existing supersession or merger metadata.

Legacy non-empty, unnamespaced `entityId` values remain valid under FootballEntity 1.0.0. They are legacy-compatible identifiers, not newly issued canonical references. This preserves existing fixtures and records without automatic migration.

## Identity boundaries

Aliases remain alternate names. Abbreviations such as `KC`, historical names, and alternate spellings never become canonical automatically. A canonical reference cannot also appear as an alias. Provider identifiers remain in `externalIdentifiers`; simulator and UI codes remain outside FID canonical identity.

Namespaces are compatible with FootballEntity kinds. Organization and Team remain distinct: Organization represents the stable institution or franchise, while Team represents a competitive football representation and may reference an Organization. A future Kansas City identity can therefore be issued as an `ORGANIZATION` with an `organization:*` reference without using application code as identity.

## Draft identities

`DRAFT_CLASS` represents a prospect cohort. `DRAFT_CYCLE` represents only the stable identity of a draft cycle. Adding `DRAFT_CYCLE` does not create a DraftCycle profile and does not own dates, rules, rounds, teams, or selection facts. DraftSelection continues to own completed selection events. A future `draft-cycle:2026` FootballEntity can be issued without hardcoded year rules.

## Operation metadata

`requestId`, `operationId`, and `batchId` remain persistence-operation metadata. They are not FootballEntity identity or version fields. Persistence specifications and runtime behavior are unchanged.

The policy performs validation and normalization only. It provides no resolver, fuzzy matching, merge execution, synchronization, persistence, runtime registry, simulator mapping, or UI behavior.
