# Sprint 2B.2 — Draft Room application data layer

This repository-only package consumes prospect data exclusively through the Sprint 2B.1 `ApplicationResolverBoundary`. It supplies immutable fixture-safe session, pick, team-context, prospect card/detail, filter, warning, readiness, selection, history, user-class, trade-reference, and mobile presentation data. It does not register with the application or mutate React, the simulator, a database, or a protected barrel.

The pre-implementation audit found active draft state in `useDraftEngine.js`, pick/UI state in `DraftV3.jsx` and `DraftTracker.jsx`, and team compatibility data in `WarRoomData.js`, `TeamNeeds.js`, and `TeamProfiles.js`. Those artifacts are legacy application/simulator owners with ranking, CPU, React, or mutable runtime concerns. They remain unchanged and are not imported. Sprint 2B.2 therefore defines a distinct application-facing fixture view, not a replacement production session or team domain authority.

Fixture order is declared non-ranking. Team needs and draft order are synthetic. Readiness is presentation readiness only and does not imply canonical identity, eligibility confirmation, persistence, application registration, or intelligence completion.
