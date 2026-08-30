# Sprint 2B.3 repository and UI audit

## Decision

Option B was selected: an additive Draft Operations Center preview route guarded by development mode or `VITE_ENABLE_FID_DRAFT_ROOM_PREVIEW=true`. It is lazy-loaded and has no dependency on the production simulator, its API, reducer, prospect array, CPU drafting, trades, or persistence.

## Application inventory

| Artifact | Owner/status | Purpose and decision | Risk/accessibility |
| --- | --- | --- | --- |
| `src/main.jsx`, `src/App.jsx` | application / production | Browser root and single React Router. Extend the existing router with one guarded lazy route; never replace production routes. | Lazy route limits normal bundle entry; native loading status. |
| `src/pages/Draft.jsx`, `/draft/:draftId` | simulator / production | Active simulator, API and mutable draft ownership. Preserve; do not import or modify. | Coupled legacy state and modals prohibit reuse. |
| `src/pages/DraftV3.jsx`, `src/components/draftV3/**` | simulator / transitional | Board, available list, War Room, tracker, filters, tabs, UI primitives. Visual reference only because data/state depend on legacy prospects and intelligence engines. | Some clickable/card and modal patterns are not sufficient for the preview's dialog requirements. |
| `src/pages/Results.jsx` | simulator / production | Durable simulator results presentation. Preserve; fixture history must not claim this contract. | No reuse. |
| `src/components/ui/LBHTButton.jsx`, `LBHTCard.jsx`, `ui.css` | shared / active | Existing buttons/cards and typography direction. Visual compatibility retained; preview uses native semantic controls to avoid coupled props/clickable divs. | Existing button is keyboard-safe; card can be non-semantic when clickable. |
| `src/styles/design-tokens.css`, `draft-room*.css` | design system / active and transitional | Navy/gold palette, spacing, panels, breakpoints around 760/900/1100/1200. Preview creates scoped CSS and no global overrides. | Add explicit focus-visible and reduced-motion behavior. |
| Sprint 2B.1 package | FID data / fixture | Resolver boundary, normalized view, unknown/blocked handling. Verified unchanged by diagnostics; UI does not import it directly. | Application boundary remains intact. |
| Sprint 2B.2 package | FID application / fixture | Sole UI data/business-state boundary: package, card/detail views, selectors, immutable reducer, warnings/readiness. Reuse directly. | Safe text only; no raw source/evidence/canonical internals exposed. |
| Football Intelligence Operations Center | internal / development | Existing guarded lazy route proves repository-approved internal preview pattern. | Follow the same gating and Suspense pattern. |

The active simulator owns teams, players, picks, CPU speed, trades, API calls, and results. The preview owns only a 2B.2 immutable fixture session plus tab, detail, and confirmation presentation state. No duplicate production state ownership is created.

## Product and interaction specification

- Desktop: pick header, team/limitation rail, governed prospect workspace, detail drawer, and session summaries.
- Mobile: sticky pick context and three exclusive tabs (Prospects, History, Your Class); detail uses a full-screen dialog sheet.
- Cards: identity, position/role, program, measurements, bounded production/strength/concern, warning/readiness text, and watch state; fixture order is labeled non-ranking.
- Detail: normalized identity, measurements, production, testing, scouting statements, warnings, limitations, and future-intelligence unavailable state.
- Selection: open, acknowledge eligibility uncertainty, propose, confirm, immutable 2B.2 selection, history/class update, deterministic pick advancement.
- Trade boundary: informational unavailable panel with no active control.
- Empty/error states: fixture failure, no governed prospects, no filter results, no history/class, missing detail, and unavailable team/future intelligence.

## Reviews

- Security: `FID_DRAFT_ROOM_UI_SECURITY_PASSED_WITH_NON_BLOCKING_LIMITATIONS` (fixture/synthetic limitations remain intentionally visible).
- Architecture: `FID_DRAFT_ROOM_UI_ARCHITECTURE_PASSED_WITH_FUTURE_TEAM_AND_INTELLIGENCE_GAPS`.
