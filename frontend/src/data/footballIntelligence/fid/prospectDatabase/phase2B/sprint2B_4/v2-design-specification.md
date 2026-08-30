# Proposed V2 Draft Room specification

This specification is implementation-ready but **not authorized for implementation**.

## 1. Page structure and persistent context

Order: skip link → compact fixture notice → sticky Draft header → primary workspace → contextual detail sheet → mobile view navigation. The fixture notice says: “Fixture preview — synthetic team context, eligibility unconfirmed, and selections are not saved.” It appears once persistently and links to complete limitations.

The header owns product name, team on clock, `Round 1 · Pick 1 · Overall 1`, and draft progress. Remove duplicated pick text from the team panel. Do not add a clock. Primary header line on mobile: `FTA on the clock · R1 P1 (#1)`; second line: `0 selections · Fixture preview`.

## 2. Responsive grids

- Wide desktop (≥1360): `240px minmax(560px, 1fr) 320px`, 16px gaps. Left context is sticky below header; center list owns page scrolling; right rail has two tabs, History and Your Class. Detail overlays as a 520–600px sheet.
- Standard/narrow laptop (1100–1359): `220px minmax(0,1fr) 280px`; card summaries reduce to one line each. At 1100, right rail becomes a drawer/tabs above the list, not a column.
- Tablet landscape (900–1099): single workspace with a compact context strip above; Prospects/History/Your Class tabs; detail overlays 60–70vw.
- Tablet portrait (761–899): one primary column; context collapsible below header; detail replaces the list with a Back action and preserved list scroll.
- Mobile (≤760): exclusive Prospects, History and Your Class views; full-screen detail replaces Prospects; fixed/sticky bottom navigation remains visible only outside detail.

Avoid independent nested scroll regions in the base page. Only the modal sheet body may scroll, with header and action bar fixed inside it.

## 3. Team context and trade boundary

Collapsed context summary: team label, “Synthetic fixture context,” needs as neutral `OT, CB` chips, and a `View context limitations` disclosure. Expanded future order: roster context → primary needs → scheme → organizational philosophy → draft capital → previous selections. Unavailable sections do not occupy cards; show one bounded “Not available in this fixture” explanation.

Remove the standalone Trade Center panel. Place “Trades unavailable in this fixture” in a quiet capability/limitations menu. No affordance may resemble an enabled trade control.

## 4. Prospect list and compact card

Use a medium selectable row on desktop/tablet and a compact two-zone card on mobile. The semantic model remains shared.

Exact desktop order:

1. position token;
2. name;
3. program · projected role;
4. height · weight;
5. one-line production summary/status;
6. primary strength phrase;
7. primary concern phrase;
8. candidate-specific exception badge, only when present;
9. Watch secondary action.

Mobile order: position + name; program/role; candidate exception badge; Watch. Measurements and production may appear as one compact metadata line when space permits. Strength, concern, testing, eligibility and declaration move to detail. Universal cohort warnings never repeat on cards. Readiness appears only when it discriminates between prospects; do not show “Ready with limitations” 16 times.

The entire identity/body opens detail; Watch is a separate 44px target. Watched state uses text, icon/shape and `aria-pressed`. Drafted prospects are removed from Available but remain findable through History/Class; after selection, announce that movement.

## 5. Search, filters and sort

Desktop: sticky control bar immediately above results. Search remains first. Position and Program are primary filters; Watched is a toggle; Sort is last. Show result count and active-filter chips beneath. Reset is labeled `Clear filters` and appears only when active.

Mobile: search stays visible. A `Filters (n)` button opens a modal sheet containing Position, Program, Watched and Sort; Apply and Clear are sticky. Preserve draft-order wording: `Fixture order (not a ranking)`. No sort may say best, rank, board, consensus or FID.

No-results state repeats active chips and provides a single `Clear filters` action. Result-count changes use a polite live region.

## 6. Prospect detail

One continuous report is preferred over tabs because the content is moderate and comparison context should remain predictable. Use collapsible disclosures only for full evidence/limitations; do not hide football evaluation.

Desktop/mobile section order:

1. sticky identity: name, position, program, role, watch;
2. decision snapshot: measurements, production, testing availability;
3. strengths;
4. concerns and versatility/role notes;
5. candidate-specific risk, if any;
6. future intelligence insertion region (absent until governed; never fake scores);
7. evidence summary;
8. complete eligibility, declaration, program, production, scouting and testing limitations;
9. sticky action area.

Desktop may render snapshot and scouting in two columns; mobile is one column. Selection action remains visible. Warnings do not interrupt the first football sections unless blocking or candidate-specific and material.

## 7. Layered warning strategy

- Global fixture notice: preparation data, eligibility cohort not confirmed, synthetic context, no saved results.
- Card indicator: only candidate-specific exceptions, e.g. contradictory program; label and severity in text, not color alone.
- Detail risk summary: blocking/candidate-specific risks before action.
- Complete limitations disclosure: all eligibility, declaration, program, production, scouting and testing limitations grouped by category; common cohort limitations summarized once and linked.

Acknowledgement text is shown only when the selected prospect requires unresolved eligibility acknowledgement. Checking it changes selection readiness and is announced. Material uncertainty remains available in full.

## 8. Selection workflow

Primary: `Select [Name]` in sticky detail action bar. Secondary: `Watch` and `Close/Back`. First activation opens a compact confirmation region, not a second modal. If acknowledgement is required, it sits immediately before the primary action and confirmation stays disabled with a textual reason.

Confirmation hierarchy: `Confirm fixture pick` primary; `Back to report` secondary; `Cancel and close` tertiary only if needed. On confirmation: close detail, return focus to the next available prospect or Results summary if no prospects remain, preserve list position, announce `Selected [Name] at pick #[n].`, update header/history/class, and visually mark the latest history event. Two deliberate activations plus required acknowledgement are appropriate; do not add another confirmation.

## 9. Active-draft summaries

Draft History is chronological league/session context: overall pick, team abbreviation/name, prospect, position/program, and latest-pick marker. Empty state: “No selections yet.” Do not add grades or Results analytics.

Your Draft Class is user-team-only: selection count, compact position distribution, user selections with pick number/name/position, and one aggregate unresolved-exception count linking to details. It must not reuse full History rows. It is not a grade, recap or results surface.

## 10. Empty/error/loading states

- Route loading: concise `Loading Draft Room fixture…` status.
- Fixture unavailable: title, safe explanation, retry/reload only if supported, and fixture boundary.
- No prospects: distinguish fixture has none from filters hide all.
- Missing detail: close the sheet, announce unavailability, leave list operable.
- No history/class: concise active-session expectations and unsaved reminder.
- Completed fixture: freeze session snapshot and offer a defined Results handoff only when that contract exists.

## 11. Accessibility behavior

Use `header`, `nav`, `main`, named complementary regions and one page `h1`; panel titles are `h2`, report sections `h3`. Detail is a labeled modal dialog on desktop and a replacement view with Back on small screens. Modal behavior: focus first meaningful heading/action, trap Tab/Shift+Tab, make background inert, Escape closes, restore focus logically. All state changes use a polite status region; blocking errors use alert semantics sparingly. Targets are at least 44×44 CSS pixels; no essential text below 12px; support 200% and 400% zoom without two-dimensional scrolling. Preserve 3px focus rings and reduced motion. Verify contrast rather than assuming it.

## 12. Future intelligence insertion points

| Module | Compact representation | Expanded location | Prerequisites | Priority |
| --- | --- | --- | --- | --- |
| Draft Intelligence | One governed status/summary, only when available | Detail after scouting snapshot | governed model/output/version/explainability | P3 |
| Team fit | No card score initially | Detail intelligence region | real team context + fit contract | P3 |
| Scheme fit | Small labeled fit state only if validated | Detail plus expanded team context | scheme and player-role contracts | P3 |
| Positional value | No card ranking | Detail decision support | governed board/value methodology | P3 |
| Confidence | Accompanies a specific intelligence claim | Beside expanded claim | calibrated confidence contract | P3 |
| Explainability | `Why?` disclosure on supported claims | Evidence/explainability section | traceable evidence references | P3 |
| Board intelligence | Separate board workspace, not card decoration | Dedicated board view | governed ranking/board contract | P3 |
| Trade intelligence | Quiet availability status only | Separate Trade workspace | trade engine, ownership and value contracts | P3 |
| Team context | Team abbreviation/needs summary | Collapsible context region | roster, scheme, capital, prior-pick contracts | P3 |

## 13. Draft Results handoff

Trigger only when the governed session reports completion. Create an immutable session snapshot containing session/pick metadata, chronological history, user class, per-selection limitation references and fixture/persistence declaration. The active room shows `Review Draft Results` only after the Results contract accepts that snapshot. Route transition must be explicit; history/class state must not be recomputed from mutable live data. In the current fixture, clearly state that the snapshot is temporary and unsaved. No Results route or contract is implemented here.

