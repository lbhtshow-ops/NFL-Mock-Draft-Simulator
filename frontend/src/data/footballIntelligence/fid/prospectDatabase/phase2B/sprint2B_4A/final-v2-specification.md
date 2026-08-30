# Final V2 specification and bounded scope

## Reconciled specification

| Area | Decision | Final requirement |
| --- | --- | --- |
| Page hierarchy / global notice | APPROVED_WITH_REVISION | Sticky operational header; one calm fixture/not-saved notice; football board immediately follows |
| Wide desktop | APPROVED | Three columns only when board retains at least 620px; 1440 works |
| Standard laptop | APPROVED_WITH_REVISION | Collapse/demote right rail before board compression |
| Tablet landscape/portrait | APPROVED_WITH_REVISION | single workspace with context/history/class tabs; 768 must not use pseudo-desktop |
| Large/compact mobile | APPROVED_WITH_REVISION | sticky team + R/P/# header, bottom views, compact cards, detail replaces list |
| Team context | APPROVED_WITH_REVISION | label synthetic once; no priority-strength claim |
| Prospect list/cards | APPROVED_WITH_REVISION | correct measurement formatter; desktop football summary; mobile concise identity/production/exception |
| Detail | APPROVED_WITH_REVISION | internally scrollable continuous report, football first, limitations last, persistent action footer |
| Warnings | APPROVED | global cohort notice + candidate exceptions + grouped detail limits + material acknowledgement |
| Search/filters | APPROVED_WITH_REVISION | search visible; desktop inline; active chips; mobile/tablet filter sheet; no-results Clear |
| Watchlist | APPROVED_WITH_REVISION | secondary pressed control, persistent marker, polite feedback |
| Selection/success | APPROVED_WITH_REVISION | acknowledge → propose → cancel/confirm; visible/polite success; deterministic focus target |
| History | APPROVED | chronological complete fixture session record |
| Your Class | APPROVED_WITH_REVISION | user-team summary, distribution, pick refs, warning/completeness summary; no duplicated history |
| Trade note | APPROVED | demote to muted unavailable capability note |
| Keyboard/dialog | APPROVED_WITH_REVISION | initial close/heading focus, Tab/Shift+Tab trap, inert background, Escape, restoration, scroll lock |
| Contrast/touch | APPROVED_WITH_REVISION | retain verified palette; raise tiny text; 44px target or equivalent enlarged hit area |
| Future intelligence | REQUIRES_FUTURE_CAPABILITY | reserved semantic insertion slots only; no values/placeholders |
| Draft Results handoff | DEFERRED | immutable completion event and explicit unsaved handoff require a later contract |

## Exact proposed Sprint 2B.4B correction scope

This scope is a proposal only; no authorization record exists.

Allowed existing files:

- `src/pages/DraftRoomPreview.jsx`
- `src/styles/draft-room-preview.css`

Allowed new files (maximum four):

- up to two narrowly scoped preview presentation/accessibility helpers under `src/pages/draftRoomPreview/`
- one scoped diagnostic/test file
- one Sprint 2B.4B documentation package/index

Protected and prohibited: `src/App.jsx`; all Phase 2A, Sprint 2B.1–2B.4 predecessor artifacts; routes; resolver/contracts/transitions/fixtures; simulator; production pages; packages/lockfile; persistence, canonical mapping, SQL/database/migrations; REF/Sprint 17C. Maximum six source/test/style files touched, one existing scoped stylesheet, no global stylesheet, no package or data-model changes. Route guard and lazy import remain unchanged.

## Readiness gates

Gates for repository, preview, required viewports/screenshots, inventory, primary journey, overflow, contrast sampling, targets, warning/product/card/detail/filter/selection/history reviews, issue reconciliation, scope, route isolation, data boundary and no package installation pass. Gates for complete keyboard proof, dialog focus proof, native 200%/400% zoom, final accessibility acceptance and bounded blocker acceptance do not pass. Therefore `FID_DRAFT_ROOM_V2_PRESENTATION_REFINEMENT_ONE_EXECUTION_2B4B_V1` was not created.
