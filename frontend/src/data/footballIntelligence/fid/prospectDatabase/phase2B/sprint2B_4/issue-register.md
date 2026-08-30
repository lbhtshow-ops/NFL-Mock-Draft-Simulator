# Issue register and priorities

Evidence marked **static** comes from implemented JSX/CSS/contracts. **Runtime-blocked** means the risk must be confirmed visually.

| ID | Class | Screen / component | Severity | User impact and evidence | Recommendation | Complexity | Sprint |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DR-01 | UX_BLOCKER | All viewports / review evidence | Critical process blocker | Required live page, viewport, screenshot, keyboard and contrast review could not be completed; browser isolation produced connection refusal | Establish browser-accessible localhost transport and repeat full evidence matrix before implementation authorization | S | 2B.4A |
| DR-02 | ACCESSIBILITY_BLOCKER | Detail sheet / dialog | High | Static: focus starts on Close and Escape works, but there is no focus trap or inert background | Trap focus, prevent background interaction, restore focus to surviving logical target, test screen reader announcements | M | 2B.5 |
| DR-03 | MISSING_FEEDBACK | Selection confirmation / header/history | High | Static: state changes and sheet closes without live success announcement | Announce prospect, pick and next state in a polite status region; visibly persist confirmation | S | 2B.5 |
| DR-04 | RESPONSIVE_BLOCKER | 768px portrait / layout | High | Static: `max-width:760px` excludes 768; 240px rail plus workspace risks a cramped pseudo-desktop | Use deliberate tablet portrait replacement layout with collapsed context and workspace tabs | M | 2B.5 |
| DR-05 | INFORMATION_HIERARCHY_PROBLEM | Mobile header | High | Static: Round and Pick are hidden; team name is in a rail that is also hidden | Sticky compact header must show team abbreviation/name plus `R1 · P1 · #1`; selection count is secondary | S | 2B.5 |
| DR-06 | VISUAL_DENSITY_PROBLEM | Prospect cards | High | Static: every card renders two universal warnings plus “more”; strength and concern add two more rows | Remove cohort-wide warnings from cards; show only candidate exceptions; use medium desktop rows and compact mobile rows | M | 2B.5 |
| DR-07 | MISLEADING_AUTHORITY | Team needs | High | Synthetic OT/CB needs receive bold chip treatment and HIGH/MEDIUM exists in fixture data | Label entire context as synthetic once; suppress priority strength; do not imply real team intelligence | S | 2B.5 |
| DR-08 | DUPLICATED_INFORMATION | Header/team panel | Medium | Pick appears in both; preview/not-saved caveats repeat across surfaces | Header owns pick/team; one persistent fixture notice owns global limitations | S | 2B.5 |
| DR-09 | DUPLICATED_INFORMATION | Your Class | Medium | Static: Your Class delegates player rendering to DraftHistory and repeats each selection | Class shows only user picks with position distribution and exception count; history shows league/session chronology | M | 2B.5 |
| DR-10 | INFORMATION_HIERARCHY_PROBLEM | Cards | Medium | Production is declared compact by contract but omitted; multiple warnings appear instead | Compact one-line production availability/value after measurements; details retain full production | S | 2B.5 |
| DR-11 | POLISH_OPPORTUNITY | Trade boundary | Medium | A full rail panel gives unavailable functionality operational weight | Reduce to a muted capability note in overflow/help; no button or primary panel | S | 2B.5 |
| DR-12 | INFORMATION_HIERARCHY_PROBLEM | Detail | Medium | Continuous sheet is sensible but warnings/future absence occupy a full major section; evidence/versatility fields are absent | Order football evaluation first, candidate risk second, cohort limitations collapsed last; reserve intelligence slot without scores | M | 2B.5 |
| DR-13 | MISSING_FEEDBACK | Watchlist/card | Medium | `aria-pressed` is sound, but watched state depends on text/color and no list-level feedback exists | Add persistent watched marker and status announcement; keep action secondary | S | 2B.5 |
| DR-14 | POLISH_OPPORTUNITY | Search/filter mobile | Medium | Static: all controls always visible in two columns and active filters lack a summary | Search always visible; filters/sort in mobile sheet; show active chips and one Clear action | M | 2B.5 |
| DR-15 | NOT_CURRENTLY_BLOCKING | No-results state | Low | Recovery copy and Reset are separated; Reset remains in controls | Put `Clear filters` in the empty state and announce result count | S | 2B.5 |
| DR-16 | ACCESSIBILITY_BLOCKER | Text/touch/zoom | High, unverified | `.67rem` labels and 42px controls may fail readability/touch expectations; no runtime measurement | Minimum body/support text 12–14px, interactive target 44px, test 200%/400% zoom | S/M | 2B.4A then 2B.5 |
| DR-17 | FIXTURE_VERSUS_PRODUCTION_CONFUSION | Global shell | Medium | Strong “Draft Operations Center” identity competes with repeated fixture language; current team looks invented but operational | One persistent, non-alarm fixture banner; keep “nothing saved”; use “Synthetic team context” label | S | 2B.5 |
| DR-18 | FUTURE_INTELLIGENCE_DEPENDENCY | Detail/team/card | Dependency | Team fit, scheme fit, confidence, positional value and trade intelligence lack governed inputs | Reserve labeled structural slots only; no scores or empty decorative panels | L | future governed modules |
| DR-19 | MISSING_FEEDBACK | Draft completion/results handoff | Dependency | After one fixture selection, `onTheClock=false`; no completion state or Results transition contract | Define completion event, immutable snapshot and explicit unsaved handoff before Draft Results implementation | L | Draft Results foundation |
| DR-20 | POLISH_OPPORTUNITY | CSS scope | Low | `.sr-only` is the sole unscoped preview utility | Reuse an existing governed utility or scope it without broad global edits | S | 2B.5 |

## Priority summary

### P0 — before implementation authorization

- DR-01: complete actual visual/keyboard evidence at all required states and viewports.
- Preserve guarded route, lazy chunk, production-route isolation, immutable 2B.2 boundary and explicit fixture status.

### P1 — next Draft Room polish implementation

- DR-02 through DR-14 and DR-17: focus containment/feedback, tablet/mobile context, warning layering, card/detail hierarchy, synthetic authority, summary differentiation, trade demotion and mobile filters.

### P2 — before production integration

- DR-15, DR-16, DR-20: empty-state recovery, measured contrast/zoom/touch/readability, scoped token and utility cleanup, refined keyboard navigation and tablet polish.

### P3 — capability-dependent

- DR-18 and DR-19: governed team/scheme/Draft Intelligence/confidence/value/explainability/trade contracts and immutable Draft Results handoff.

