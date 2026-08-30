# Consolidated Sprint 2B.4 review

## Decision

Final status: `FOOTBALL_INTELLIGENCE_DRAFT_ROOM_UX_REVIEW_CORRECTION_REQUIRED`

Selected outcome: `OUTCOME_E_VISUAL_REVIEW_COULD_NOT_BE_COMPLETED`

This outcome is procedural, not a rejection of the design direction. Source evidence supports a professional operations-center direction with priority refinements, but the required actual-page evidence could not be obtained and therefore approval is not defensible.

## Predecessor verification

- Phase 2A: versioned preparation/research/cohort records exist through Sprint 2A.3C and remain preparation-only/non-canonical. No Phase 2A files were modified.
- Sprint 2B.1: diagnostics passed; 16 resolved/unique prospects, immutable, deterministic, unknown and blocked states handled, no direct preparation/canonical dependencies.
- Sprint 2B.2: 112 checks passed; 16 prospects, all ready with limitations; immutable open/close/watch/search/filter/sort/select/advance transitions; no React/simulator/persistence/database boundary mutation.
- Sprint 2B.3: guarded lazy route, isolated preview source/styles, consumed authorization, security/architecture status, and fixture limitations verified from source and records. Production build passed and emitted separate DraftRoomPreview JS/CSS chunks.
- REF/Sprint 17C: paused. No continuation, SQL, database or canonical work occurred.

## Product identity

The title, dark navy/gold palette, pick counters, team rail and governed language aim clearly at a Draft Operations Center rather than a fantasy dashboard. The current density and repeated governance copy risk making it feel like an internal compliance tool. V2 should preserve the serious operational shell while moving football comparison ahead of limitations and avoiding decorative theatrics.

## Primary journey assessment

| Step | Static assessment | Main refinement |
| --- | --- | --- |
| Enter / orient | Product title and fixture badge are clear; team is separated from header | Put team on clock in persistent header |
| See available prospects | Count and non-ranking order are clear | Reduce card warnings; surface compact production |
| Narrow list | Native controls and reset exist | Active chips; mobile filter sheet; result announcements |
| Open/review | Whole card opens detail; continuous report is understandable | Add focus trap; reorder football before full limitations |
| Watch | One action, `aria-pressed` | Stronger persistent watched marker/status |
| Acknowledge/select | Acknowledge → propose → confirm is safe | Rename primary action, inline confirmation, explain disabled state |
| Receive feedback | History/class update in state | Visible/live confirmation and logical focus restoration |
| Understand unsaved state | Repeatedly stated | Consolidate into one persistent notice |

Highest friction: warning fatigue; team identity disappearing on mobile; 768px portrait pseudo-desktop; modal focus escape; duplicate propose/confirm language; post-selection feedback; always-expanded mobile controls.

## Functional-area conclusions

- Information hierarchy: direction valid, but governance currently competes with prospect comparison. Use Tier 1–4 order defined in the V2 spec.
- Header: strong identity but oversized/duplicated. Always retain team, round/pick/overall and fixture status; selection count may collapse.
- Team context: useful future anchor, currently too authoritative. Keep one neutral synthetic summary and collapse unavailable modules.
- Prospect list/cards: medium rows are correct on desktop, compact cards on mobile. Current desktop content is dense and current mobile hides football fields while keeping warnings.
- Detail: continuous sheet is preferable to tabs. Keep decision summary/strengths/concerns visible, collapse evidence/full limitations, retain sticky selection action.
- Warnings: all 16 share eligibility, declaration, production and data limitations; repeating them creates fatigue. Separate global cohort limits from the one program contradiction and other future candidate exceptions.
- Search/filter/sort: wording correctly avoids ranking. Add active-filter visibility and mobile drawer; keep search visible.
- Selection: required acknowledgement plus two deliberate activations is acceptable. Improve labels, focus containment, disabled explanation and success feedback.
- History: keep active-draft chronology only—pick, team, player, position/program, latest marker.
- Your Draft Class: valuable but must become a team-only distribution/selection summary rather than copied history.
- Trade boundary: minimize to a quiet unavailable note until a trade engine exists.
- Desktop: three columns are plausible at wide widths; narrow laptops should collapse the right rail before squeezing the board.
- Tablet: material redesign needed; landscape uses tabs/context strip, portrait uses replacement detail and one column.
- Mobile: three-view navigation is appropriate. Header must retain team/pick, filters move to a sheet, cards prioritize identity/football, detail replaces list with focus/scroll restoration.
- Accessibility: good semantic foundation, but focus trap, inert background, announcements, zoom/contrast/touch/readability require correction and runtime verification. No conformance claim.
- Visual system: blend current simulator/FID language through scoped aliases. Preserve navy/gold, panels and focus rings; rationalize spacing/type/borders without broad global CSS changes.
- Future intelligence: reserve one detail decision-support region and expanded team context; no placeholder scores.
- Results transition: needs an explicit completion event and immutable snapshot carrying history, class and limitation references. Do not turn active summaries into Results.

## What remains unchanged

Guarded preview route; lazy bundle; production routes; 2B.1 resolver boundary; 2B.2 immutable contracts/transitions; non-ranking fixture order; explicit unsaved/synthetic/eligibility truth; native controls; Escape close and focus return intent; navy/gold operations identity; absence of fake countdown, ranking, grades, fit scores and trades.

## Exact next sprint

`Sprint 2B.4A — Draft Room Visual Evidence Completion and Implementation Authorization Decision`.

It must solve browser-safe localhost access, inspect/capture all required states at all seven exact viewports, perform keyboard/focus/zoom/contrast/touch checks, reconcile results with this static specification, and then select A–D or retain E. Only after user approval may a separate Sprint 2B.5 implementation authorization be created.

## Residual uncertainty

Actual visible density, clipping, scroll containment, card count above fold, contrast, sticky overlap, touch comfort, keyboard sequence, focus restoration, screen-reader behavior and emotional product quality remain unobserved. All responsive conclusions in this package are source-based risks/specifications, not visual findings.

