# Source-Controlled Canonical FID Records

This directory is the governed source-controlled ownership boundary for canonical FID production-record revisions. Records remain owned by their domain and are never fixtures, diagnostics, Research Source Packages, simulator data, runtime caches, or persistence rows.

Each record uses `records/<domain>/<record-slug>/revision-NNNN.js`. Revision 1 is original; corrections append the next immutable revision and preserve earlier modules. Domain record barrels explicitly export approved revisions. The root FID barrel exports ownership policy only and never record instances.

See `../docs/SourceControlledCanonicalRecordOwnershipPolicy.md`. No production records exist in this directory as of Sprint 48B.
