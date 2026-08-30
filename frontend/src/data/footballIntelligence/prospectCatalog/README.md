# Application Prospect Catalog

MDS-5B.1 establishes the application prospect catalog without creating a competing FID prospect contract.

The catalog consumes the existing `ApplicationResolverBoundary` and `NormalizedProspectView` contracts. It adds only an application-safe, explicitly non-canonical reference (`app-prospect:<draftYear>:<slug>`) and an intelligence-coverage declaration used by simulator/application consumers.

## Identity boundary

- `applicationProspectRef` is an application reference only.
- `fidProspectRef` points to an existing FID application-resolver reference when enriched research exists.
- `canonicalIdentifier` remains `null` in this sprint.
- No canonical identifier issuance, persistence, SQL, REF, or Sprint 17C authority is implied.

## Coverage boundary

An application prospect can exist at either:

- `ENRICHED_RESEARCH`: resolved through the existing FID application boundary.
- `BASE_PROFILE`: draftable/runtime identity and base facts are available, but enriched Football Intelligence is not yet available.

This separation is the foundation for allowing a future full draftable inventory without fabricating intelligence for unresearched prospects.
