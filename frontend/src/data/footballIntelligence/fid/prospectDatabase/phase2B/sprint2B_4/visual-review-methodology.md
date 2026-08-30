# Visual-review methodology and viewport record

## Method attempted

1. Started the repository-supported Vite command without installing packages.
2. Verified `http://127.0.0.1:4174/__dev/draft-room-preview` returned HTTP 200 from the host.
3. Connected the Codex in-app browser and attempted the exact guarded route.
4. The browser returned `ERR_CONNECTION_REFUSED` because its isolated browser environment cannot reach the host loopback listener.
5. A request to bind Vite to `0.0.0.0` was rejected because it would expose repository-derived content to the local network. No workaround or unsafe exposure was attempted.

The preview was therefore **run on the host but not successfully rendered or inspected in a browser**. Visual capture was unavailable. No screenshot inventory exists and no screenshot dimensions are claimed.

## Required viewport matrix

| Viewport | Runtime inspected | Source breakpoint inference only | Evidence limit |
| --- | --- | --- | --- |
| 1440 × 900 | No | Three-column grid is specified up to 1500px | No pixel/layout/scroll proof |
| 1280 × 800 | No | Three-column grid remains until 1180px | No density proof |
| 1024 × 768 | No | Two-column layout under 1180px | No landscape interaction proof |
| 768 × 1024 | No | Still two-column because mobile begins at 760px | High cramping risk; not visually proven |
| 430 × 932 | No | Single-view mobile tabs and full-screen sheet | No touch/scroll proof |
| 390 × 844 | No | Same mobile regime | No focus/keyboard proof |
| 360 × 800 | No | Same mobile regime, two-column controls | High density risk; not visually proven |

## State capture matrix

Initial room, filtered list, open detail, warning detail, confirmation, post-selection history, post-selection class, no results, program contradiction, and all mobile states: **not captured**. Static source confirms code paths exist but cannot establish their visual quality.

## Static responsive observations requiring follow-up

- 768px portrait receives the 240px rail plus a central workspace, not the mobile/tab layout; the usable workspace is approximately 512px before gaps/padding.
- 1024px landscape uses the same two-column regime and moves both summaries under the rail.
- At 760px the team context disappears completely; users lose team-on-clock identity because the header shows only Overall and Selections.
- Mobile controls remain a two-column grid with four selects/search/check/reset; they are not drawer-based or summarized.
- Mobile cards hide measurements, readiness, strength and concern but retain multiple universal warnings, reversing decision priority.
- The sheet footer is sticky inside a full-height flex sheet; nested body scrolling is likely, but not runtime verified.

## Required next evidence pass

The next sprint must begin with a browser-accessible localhost transport and capture all seven exact viewports plus the 13 required states. It must measure horizontal overflow, visible prospect count, nested scrolling, sticky overlap, keyboard focus order/trap/return, 200% zoom, contrast, reduced motion and minimum touch targets. Until then the maximum defensible outcome is `OUTCOME_E_VISUAL_REVIEW_COULD_NOT_BE_COMPLETED`.

