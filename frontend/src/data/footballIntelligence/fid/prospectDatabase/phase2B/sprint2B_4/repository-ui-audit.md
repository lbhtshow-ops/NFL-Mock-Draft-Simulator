# Repository and UI audit

## Repository truth

| Item | Result |
| --- | --- |
| Repository | `C:/Users/zeyga/NFL-Mock-Draft-Simulator-main/NFL-Mock-Draft-Simulator-main` |
| Working directory | `frontend` |
| Branch | `main` |
| HEAD | `f9f8272e8ea868534c9fbc36cf174769367fc6a1` |
| Upstream | `origin/fid-persistence-v1.0.1` |
| Origin | `https://github.com/lbhtshow-ops/NFL-Mock-Draft-Simulator.git` |
| Worktree | Materially dirty before Sprint 2B.4; inherited changes preserved. Sprint 2B.4 adds only this directory. |

Git required a per-command `safe.directory` override because the sandbox account differs from the owner. No global Git configuration was changed.

## Relevant artifact matrix

| Exact path | Role / UX responsibility | Visual responsibility | Reuse / modification recommendation | Risk | Priority |
| --- | --- | --- | --- | --- | --- |
| `frontend/src/App.jsx` | Owns guarded, lazy `/__dev/draft-room-preview` integration | Suspense status only | Reuse unchanged; retain `DEV || VITE_ENABLE_FID_DRAFT_ROOM_PREVIEW` and production-route isolation | App preload still performs unrelated API calls when preview loads; route is present only under guard | P0 preserve |
| `frontend/src/pages/DraftRoomPreview.jsx` | Owns header, team/trade rail, controls, cards, sheet, selection, tabs, history/class | Owns semantic structure and state classes | Split presentation owners in implementation sprint; retain native controls and fixture terminology | Monolith; focus containment/announcement gaps; universal warnings duplicated | P1 |
| `frontend/src/styles/draft-room-preview.css` | No data responsibility | Scoped Draft Operations palette, grids, sheet, breakpoints, focus and reduced motion | Retain `.fid-preview` scope; align values through shared tokens without global replacement | One tablet collapse and one mobile breakpoint; tiny text; unverified contrast/touch | P1 |
| `frontend/src/data/footballIntelligence/fid/prospectDatabase/phase2B/sprint2B_3/audit.md` | 2B.3 ownership and UI rationale | Records intended desktop/mobile presentation | Reuse as predecessor evidence, not visual proof | Assertions predate this review | P0 preserve |
| `frontend/src/data/footballIntelligence/fid/prospectDatabase/phase2B/sprint2B_3/authorization.md` | Consumed, non-reusable 2B.3 authorization | None | Preserve unchanged; does not authorize 2B.4 implementation | Reuse would violate lifecycle | P0 preserve |
| `frontend/src/data/footballIntelligence/fid/prospectDatabase/phase2B/sprint2B_2/contracts.js` | Card/detail, warnings, readiness, filters, history/class views | Declares compact/expanded semantic fields | Reuse semantic data; presentation may differ per viewport | Warning model mixes cohort-wide and candidate-specific limitations | P1 |
| `frontend/src/data/footballIntelligence/fid/prospectDatabase/phase2B/sprint2B_2/fixture.js` | 16-prospect session, synthetic team, pick, trade boundary | Supplies all labels shown by UI | Preserve as fixture; visually demote synthetic needs and unavailable trade | Synthetic priorities can look authoritative | P1 |
| `frontend/src/data/footballIntelligence/fid/prospectDatabase/phase2B/sprint2B_2/transitions.js` | Immutable search/watch/open/select/advance/history/class state | Drives selected/drafted feedback | Reuse unchanged unless a later authorized contract sprint changes behavior | After first pick `onTheClock=false`; no completion/handoff state | P3 dependency |
| `frontend/src/data/footballIntelligence/fid/prospectDatabase/phase2B/sprint2B_2/constants.js` | Filter, warning, readiness, selection and sort vocabulary | Labels are mapped in preview | Reuse; keep non-ranking sort declarations explicit | Hidden contract filters are not all exposed in UI | P2 |
| `frontend/src/styles/design-tokens.css` | Shared token boundary | LBHT colors/radii/shadows | Blend via scoped aliases in future; no global mutation | Current preview duplicates similar values | P2 |
| `frontend/src/App.css` | Legacy global simulator language and modal/button patterns | Broad global typography, draft colors, many breakpoints | Visual reference only; do not import legacy layout assumptions | Global scope and legacy inconsistency | P0 preserve |
| `frontend/src/styles/draft-room-v3.css` | Transitional simulator Draft Room | Navy/gold board and War Room patterns | Reference tone and density, not state/components | Legacy coupling; several breakpoint regimes | P2 |
| `frontend/src/styles/draft-room.css` | Existing Draft Operations styling | Dense operational panels and controls | Reference visual language only | Large legacy stylesheet | P2 |
| `frontend/src/components/footballIntelligenceOperations/football-intelligence-operations.css` | Internal FID operations surface | Closest navy/gold token and focus language | Align scoped tokens and labels | Internal-tool density can become admin-panel-like | P2 |
| `frontend/src/pages/Draft.jsx`, `DraftV3.jsx`, `Results.jsx` | Production/transitional simulator and results owners | Existing draft/result patterns | Do not import or modify; use only as conceptual reference | State/API/ranking/trade coupling | P0 preserve |
| `frontend/src/hooks/draft/useDraftEngine.js`, `frontend/src/components/draftV3/Tracker/DraftTracker.jsx` | Mutable simulator/session owners | Tracker interaction | Do not reuse in fixture preview | Duplicate state ownership | P0 preserve |
| `frontend/src/components/draftV3/WarRoom/WarRoomData.js`, `frontend/src/engines/TeamNeeds.js`, `TeamProfiles.js` | Legacy team/intelligence data | Team-needs presentation inputs | Do not import; future governed contracts required | Misleading authority and legacy coupling | P3 |

## Current information and action hierarchy

The source places branding and pick numbers first, then a left team rail, central prospect list, and right session summaries. Within cards it shows identity, measurements, readiness, two scouting summaries, up to two warnings, and watch. This is too much Tier 3/governance content for the comparison surface and too little production information despite the contract declaring production as compact data.

Recommended rank:

1. Team on clock, round/pick/overall, prospect identity, position, primary Select action.
2. Program, measurements, projected role, compact production, one strength/concern phrase, exception indicator.
3. Full production/testing/scouting/evidence/eligibility/declaration/limitations in detail.
4. Future team fit, scheme fit, Draft Intelligence, confidence, positional value and explainability only after governed inputs exist.

Overemphasized: four header counters, repeated fixture language, universal warnings, unavailable Trade Center, synthetic need priority. Underemphasized: team-on-clock in the header, production on cards, selection availability, post-selection feedback. Duplicated: pick in header/team rail; fixture caveats in badge/subtitle/team limitation/detail/footer/empty states; Your Class reuses Draft History rows.

## Static accessibility findings

Strengths: one `main`, native buttons/inputs/selects, explicit labels, dialog name, Escape close, focus return, `aria-pressed`, `aria-current`, visible `:focus-visible`, and reduced-motion override.

Unresolved/high-risk findings:

- The modal moves focus to Close but has no focus trap or background inertness. Tab can escape the modal (`HIGH`).
- Escape closes but there is no verified focus restoration after confirmation because the opener may be removed from the list (`MEDIUM`).
- Selection confirmation and pick advancement lack an `aria-live` success announcement (`HIGH`).
- Warnings use list text and hidden severity prefixes, but repeated updates/acknowledgement are not announced (`MEDIUM`).
- Mobile tabs use `aria-current` navigation semantics, not a documented tabs pattern; headings remain in hidden sections (`LOW/MEDIUM`).
- Several labels are `.67rem`–`.76rem`; readability, 200% zoom, contrast, and 44px touch targets require runtime measurement (`UNVERIFIED`).
- Disabled state is opacity-dependent and may need adjacent explanation (`MEDIUM`).
- Color is generally paired with text, but selected/drafted card states are absent because drafted players disappear (`MEDIUM`).

No conformance claim is made.

## Boundaries

Bundle isolation is confirmed by a separate `DraftRoomPreview` JS/CSS chunk in the successful production build. Production routes remain `/`, `/draft/:draftId`, and `/results/:draftId`; the preview remains guarded and lazy. CSS is scoped under `.fid-preview` except `.sr-only`, which is generic and therefore the only scope leak. Component ownership is local to `DraftRoomPreview.jsx`; data/business state remains owned by 2B.2. REF/Sprint 17C and all persistence/canonical/database paths were inspected only through repository status/search context and were not continued.

