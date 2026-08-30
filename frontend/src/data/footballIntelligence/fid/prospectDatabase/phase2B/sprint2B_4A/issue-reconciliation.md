# Issue reconciliation and new register

## Sprint 2B.4 P0/P1 reconciliation

| ID | Decision | Evidence / viewport | Final severity and recommendation |
| --- | --- | --- | --- |
| DR-01 | CONFIRMED_BY_VISUAL_EVIDENCE, then resolved for capture | 32 accepted screenshots across all required viewports | Process blocker removed, subject to native-zoom limitation |
| Route/boundary preservation | CONFIRMED_BY_VISUAL_EVIDENCE | loopback route, source guard, separate production chunk | P0 preserve unchanged |
| DR-02 | PARTIALLY_CONFIRMED | dialog semantics plus inconclusive Tab loop; 1440 and 430 | High: implement tested trap/inert/scroll lock/restoration |
| DR-03 | CONFIRMED_BY_VISUAL_EVIDENCE | post-confirm DOM/history/class, 1440 and 430 | High: visible and polite success status |
| DR-04 | CONFIRMED_BY_VISUAL_EVIDENCE | 768×1024 | High: deliberate tablet workspace/tabs |
| DR-05 | CONFIRMED_BY_VISUAL_EVIDENCE | 430/390/360 | High: persistent team + R/P/# context |
| DR-06 | CONFIRMED_BY_VISUAL_EVIDENCE | typical/provisional/contradictory captures | High: layered warnings and compact cards |
| DR-07 | CONFIRMED_BY_VISUAL_EVIDENCE | desktop left rail | High: label synthetic once; suppress implied priority |
| DR-08 | CONFIRMED_BY_VISUAL_EVIDENCE | desktop header/rail | Medium: one owner for pick/team and one global notice |
| DR-09 | CONFIRMED_BY_VISUAL_EVIDENCE | post-selection desktop/mobile | Medium: differentiate chronology from team summary |
| DR-10 | CONFIRMED_BY_VISUAL_EVIDENCE | cards | High after new rendering defect: format measurements and restore production cue |
| DR-11 | CONFIRMED_BY_VISUAL_EVIDENCE | desktop rail | Medium: demote Trade Center |
| DR-12 | CONFIRMED_BY_VISUAL_EVIDENCE | all detail captures | High: football first, grouped limitations later, safe internal scroll |
| DR-13 | PARTIALLY_CONFIRMED | watch toggle works/pressed state exposed | Medium: persistent marker and polite status |
| DR-14 | CONFIRMED_BY_VISUAL_EVIDENCE | 430/390/360 | Medium: mobile filter sheet and active chips |
| DR-17 | CONFIRMED_BY_VISUAL_EVIDENCE | all initial captures | Medium: one calm fixture notice |

## New issues

| ID | Category | Severity | Component / evidence | Impact | Recommendation / complexity / sprint |
| --- | --- | --- | --- | --- | --- |
| 2B4A-01 | UX_BLOCKER | High | cards + detail; all viewports | `[object Object]` replaces both measurements and destroys trust | Presentation adapter/formatter, S, 2B.4B correction |
| 2B4A-02 | RESPONSIVE_BLOCKER | High | detail, 1440×900 and 430×932 | dialog exceeds viewport and selection controls can be unreachable | constrain backdrop/sheet and make body scroll, M, 2B.4B correction |
| 2B4A-03 | FOCUS_MANAGEMENT_PROBLEM | High | dialog keyboard review | containment/order/restoration cannot be proven; background is not inert | focus trap + inert + tests, M, 2B.4B correction |
| 2B4A-04 | MISSING_FEEDBACK | High | selection completion | no live success announcement | visible `role=status`/polite message with pick and next state, S, 2B.4B correction |
| 2B4A-05 | TOUCH_TARGET_PROBLEM | Medium | mobile controls | 42px search/select and 20px checkbox fall below 44px target | 44px controls/enlarged label target, S, 2B.4B correction |
| 2B4A-06 | INFORMATION_HIERARCHY_PROBLEM | High | mobile header | team and round/pick context disappear | compact persistent team/pick header, S, 2B.4B correction |
| 2B4A-07 | POLISH_OPPORTUNITY | Low | screenshot capture | native zoom commands unsupported in evidence browser | repeat zoom in a supporting browser before authorization, S, 2B.4A correction |

No new data-contract, resolver, simulator or persistence correction is required; 2B4A-01 is a presentation formatting defect over governed measurement objects.
