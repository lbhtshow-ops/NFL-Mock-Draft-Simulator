# Sprint 2A.3A preparation-boundary review

## Decisions

- Final status: `FOOTBALL_INTELLIGENCE_PROSPECT_PREPARATION_BOUNDARY_ESTABLISHED`.
- Outcome: `OUTCOME_A_SEPARATE_PROSPECT_PREPARATION_CONTRACT_ESTABLISHED`.
- Profile authority: `PROSPECT_PROFILE_REMAINS_CANONICAL_ONLY`.
- Security: `FID_PROSPECT_PREPARATION_BOUNDARY_SECURITY_PASSED_WITH_NON_BLOCKING_LIMITATIONS`.
- Architecture: `FID_PROSPECT_PREPARATION_BOUNDARY_ARCHITECTURE_PASSED_WITH_FUTURE_MAPPING_REQUIRED`.

## Audit and duplicate search

`ProspectProfileContract` (FID contracts owner, active canonical declaration) requires `profileId`, `entityRef`, and `playerProfileRef`; its validators, getters, diagnostics, persistence mapper, promotion declarations, and application-adjacent consumers treat those as resolved canonical references. Optionalizing them or adding a preparation mode would introduce invalid downstream states. `PlayerProfileContract` has the same canonical profile pattern.

`ProspectIntakeCandidateContract` (Prospect Intake owner, active intake declaration) truthfully owns `intakeId`/`candidateRef`, discovery, identity review, research planning, evidence sufficiency, reviews, blockers, readiness declarations, and promotion plans. FIIS request/validation/authorization records govern intake claims and authorization, but do not assemble a profile-shaped football record. Promotion decision/workflow/execution contracts consume approved canonical record operations; persistence envelopes/revisions stage canonical writes. Canonical identity candidate/issuance declarations govern future identifier issuance. Research source/session/observation/evidence records own evidence and provenance. Existing bio/player, measurement/athletic, position, production/statistics, scouting/trait, scheme/role, review, blocker, fixture, cohort, modeled-output, resolver, simulator, and application records either remain canonical/application-specific, supporting records, transitional outputs, or fixtures. Execution “staging” is atomic persistence staging, not profile preparation. No semantic equivalent preparation aggregate exists.

Artifact ownership/version/purpose/identity/lifecycle/authority/inputs/outputs/consumers were taken from each declaration and adjacent constants/index/diagnostics. The reusable overlap is by reference only: intake is the predecessor; research/evidence/supporting/review/blocker records remain their own authorities. None can be extended into this aggregate without mixing lifecycle authority. The new record is declaration-only and isolated from shared exports.

## Options A–F

| Option | Assessment |
| --- | --- |
| A separate record | Selected. Truthful preparation identity, clear lifecycle and mapping, no canonical consumer exposure; modest maintenance cost. |
| B profile mode | Rejected. Weakens mandatory canonical identity and risks persistence/resolver ambiguity. |
| C reuse existing | Rejected after duplicate search; intake and persistence staging are not semantic equivalents. |
| D supporting records only | Rejected because reviews need one governed assembly reference and completeness declaration. |
| E extend intake | Rejected because it merges discovery/intake lifecycle with assembled-profile lifecycle. |
| F other | No repository-supported alternative was superior. |

## Boundary and lifecycle

`preparationRecordRef` identifies only immutable record content in the `preparation:` namespace; it is not person, entity, player, simulator, or canonical prospect identity. `intakeCandidateRef` preserves predecessor authority. Detailed bio, measurements, positions/roles, production, testing, scouting/traits, strengths/concerns/notes, scheme declarations, reviews, blockers, evidence, and provenance remain governed referenced records; no such cohort records are created here. Program identity is explicitly provisional and a canonical-program-resolution blocker remains supported.

Lifecycle is distinct: `DECLARED`, assembly states, validation states, review/blocking states, readiness/deferred/identifier/persistence states, then `SUPERSEDED`/`RETIRED`. Assembly is not promotion; validation is not identity; readiness is not authorization; fixture visibility is not live availability. Resolver, simulator, Big Board, live Draft Room/Results, and persistence availability must remain false.

A future separately authorized mapping creates a new `ProspectProfileContract`; it never mutates this record. It requires validated preparation, all three canonical identities, resolved supporting/program references, approved promotion decision and authorization, provenance/predecessor linkage, transformations/omissions, and no promotion-blocking blocker. Promotion and persistence remain deferred.

## Security and residual limitations

Validation rejects current canonical identity fields, spoofed identities, duplicate/bounded references, invalid lifecycle, promotion/persistence/live-availability overclaims, sensitive or executable fields, circular objects, and governed-field extension overrides; output is deeply frozen. Extensions are JSON-like and size/key bounded. Non-blocking limitations: references are structurally rather than resolver-validated; preparation IDs are namespace-validated rather than registry-issued; supporting contracts and future mapping behavior remain future work.

No Sprint 2A.2 candidate, canonical profile, canonical identifier, promotion, persistence, resolver, simulator, application, SQL, database, Supabase, migration, package, REF, or Sprint 17C artifact is created or changed.
