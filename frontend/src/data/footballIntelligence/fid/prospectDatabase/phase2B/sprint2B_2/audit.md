# Repository and contract audit

| Artifact | Owner / responsibility | Authority and lifecycle | Decision / duplication risk / import |
| --- | --- | --- | --- |
| `phase2B/sprint2B_1/ProspectResolver.js` | FID 2B.1 resolution | Authoritative active application resolver | Reuse through boundary; direct import prohibited |
| `ProspectResolverContract.js` | FID 2B.1 outcomes | Active application-safe contract | Reuse semantics; no duplicate resolver |
| `NormalizedProspectView.js` | FID 2B.1 application projection | Active immutable V1 | Consume returned values; sufficient without amendment |
| `FixtureResolver.js` | FID 2B.1 cohort adapter | Active fixture infrastructure; internally reads 2A | References reused only by fixture assembler; no raw records imported by 2B.2 |
| `ApplicationResolverBoundary.js` | FID 2B.1 public boundary | Authoritative active application boundary | Required import; low duplication risk |
| `hooks/draft/useDraftEngine.js` | Legacy React simulator session, pick, board, CPU, history | Active application runtime; mutable/transitional | Do not import or extend; incompatible production concern |
| `hooks/draft/useCpuDraft.js` | Legacy timer/CPU transition | Active simulator runtime | Prohibited |
| `pages/Draft.jsx`, `Draft_OLD.jsx`, `DraftV3.jsx` | Legacy page-owned session, search, filters, selection, trades and saved state | Active/legacy UI runtime | Audit only; no import or mutation |
| `components/draftV3/Tracker/DraftTracker.jsx` | Pick/history presentation | Active UI | Audit only; no data authority |
| `components/draftV3/WarRoom/*` and `WarRoomData.js` | War Room UI/team compatibility map/queue | Active UI compatibility fixture | Do not reuse: includes mutable UI state and potentially time-sensitive claims |
| `engines/TeamNeeds.js`, `DerivedTeamNeedsEngine.js`, `TeamProfiles.js` | Simulator need/AI heuristics | Active legacy engine compatibility | Do not import; no governed 2027 truth |
| `data/footballIntelligence/teamContext/*` and roster/depth data | Team intelligence inputs | Active but outside prospect application boundary | Placeholder only; future governed integration |
| `data/draft/prospects*` | Legacy prospect registry/arrays | Active simulator compatibility | Explicitly prohibited; no import |
| Results pages/components | Final results presentation | Active UI, separate future contract | Audit only; Draft Room history is not durable Results |

Identifiers in legacy state are heterogeneous (`id`, team abbreviations, numeric pick/rank, canonical compatibility IDs). Sprint 2B.2 uses namespaced fixture references and does not claim canonical or production identity. Existing immutable FID conventions (`Object.freeze`, deep-freeze builders, pure diagnostics) are reused. Existing React setters/reducers and browser-facing barrels are not changed.

Security review found no need to expose URLs, evidence references, blocker identifiers, HTML, or repository internals. Application architecture review accepts synthetic team context and future-intelligence gaps as non-blocking. The adversarial review confirms no ranking claim, real team-need claim, canonical/readiness inflation, simulator/trade mutation, durable-history claim, grades, duplicated mobile records, or populated fake score placeholders.

## Additive inventory

`constants.js`, `contracts.js`, `transitions.js`, `fixture.js`, `governance.js`, `diagnostics.js`, `runDiagnostics.mjs`, `audit.md`, `README.md`, and `index.js`. Aggregate: 10 additive files; 0 existing files modified.
