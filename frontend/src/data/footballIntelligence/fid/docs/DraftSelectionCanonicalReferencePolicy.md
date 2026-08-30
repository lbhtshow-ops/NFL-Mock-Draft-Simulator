# DraftSelection canonical reference policy

DraftSelection owns `selectionRef`. Its stable identity is one overall-pick slot within one canonical draft cycle:

`draft-selection:<draft-cycle-segment>:overall-<positive-integer>`

Examples are `draft-selection:2026:overall-29` and `draft-selection:2027:overall-1`. A helper accepts a canonical `DRAFT_CYCLE` FootballEntity reference and an integer overall pick; it does not accept a bare year or legacy cycle identifier. Outer whitespace and letter case can be normalized for validation, but issued values use lowercase canonical form. Overall pick has no repository-authorized maximum; zero, negative, decimal, numeric-string, signed, whitespace-bearing, and leading-zero forms are rejected.

## Identity semantics

The uniqueness key is `draftCycleRef` plus `overallPick`. Prospect, selecting organization, round, selection date, verification, lifecycle, evidence, and revision metadata are selection facts rather than identity. Correcting those facts retains the same canonical reference. Prospect and organization names or references, team codes such as `KC`, round, and revision never enter the identifier.

All revisions of one selection preserve `selectionRef`, `draftCycleRef`, and `overallPick`. Revision numbers and predecessor metadata do not alter identity. A genuinely misidentified draft slot requires the owning lifecycle/supersession process rather than silently changing the ID.

Within an explicitly supplied governed inventory, competing records may not share a canonical reference or a normalized draft-cycle/overall-pick pair. Multiple revisions are permitted only for the same reference and slot with distinct revision numbers. This assessment requires no registry, resolver, filesystem scan, or database query.

## Compatibility

`draft-selection:synthetic:2027:1` remains a synthetic diagnostic identifier and is not eligible for production issuance. `selection:revision:1` and `selection:current` are synthetic compatibility values. Other historical noncanonical values may remain contract-valid because DraftSelectionContract retains backward compatibility, but they cannot qualify for source-controlled production ownership.

Invalid new issuance examples include:

- `draft-selection:2026:29`
- `draft-selection:2026:overall-029`
- `draft-selection:2026:overall-0`
- `draft-selection:peter-woods:2026:29`
- `draft-selection:2026:29:peter-woods`
- `draft-selection:kc:2026:29`
- `selection:current`
- `selection:revision:1`

## Ownership boundaries

Sprint 48B continues to govern record verification, lifecycle, immutability, evidence, storage, and exports, while this policy governs canonical `selectionRef` issuance and its consistency with `draftCycleRef` and `overallPick`. DraftSelectionContract and its serialized schema remain unchanged.

Persistence separately owns `persistenceId`, database row identity, materialization timestamps, `requestId`, `operationId`, `batchId`, content hashes, database predecessor IDs, and acceptance metadata. Canonical issuance performs no persistence, runtime registration, FIIS, simulator, or UI behavior.
