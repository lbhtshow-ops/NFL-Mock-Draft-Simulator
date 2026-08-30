# Source-Controlled Canonical Record Ownership Policy

## Definition and ownership

A source-controlled canonical record is a contract-valid, verified, lifecycle-eligible, immutable production instance owned by one FID domain. FootballEntity owns canonical entity identities; DraftSelection owns completed selection events. This policy validates ownership but is not a universal record contract or registry.

Records live at `fid/records/<domain>/<record-slug>/revision-NNNN.js`. They never live in fixtures, diagnostics, examples, Research Source Packages, simulator or UI data, runtime caches, generated output, or persistence directories.

## Revision policy

Revision numbering begins at 1. Corrections append revision N+1 as a new immutable module; earlier revision files are never overwritten. Each domain record retains its own canonical ID and revision fields. Later revisions use the owning contract's predecessor, replacement, supersession, or merger fields. Source-controlled records do not invent persistence IDs.

## Eligibility

Canonical records must satisfy their production contract and canonical identifier policy, be verified, have an active or historical lifecycle allowed by their domain, retain evidence or creation provenance, have no blockers, and be frozen by the record module. Evidence-backed records reference approved Research Repository sources, artifacts, and reviews without copying evidence content.

## Export policy

Each domain has a record-only barrel. Approved revisions are exported explicitly—never by wildcard—from that barrel. Contract barrels and `fid/index.js` do not export production instances. Applications that intentionally need source-controlled records import the domain record path directly. No import implies runtime registration, persistence, FIIS, Population, simulator, or UI exposure.

## Persistence boundary

Source control owns the domain record ID and payload, domain revision, evidence and provenance references, verification, lifecycle, limitations, and contract-owned metadata. Persistence separately owns persistence IDs, database row identity, materialization and acceptance metadata, database request/operation/batch metadata, database predecessor IDs, and durable content hashes. A source-controlled revision may later be materialized without changing its domain facts, but this policy performs no materialization.

Sprint 48B establishes only this ownership boundary. It creates no FootballEntity, DraftCycle, DraftSelection, profile, relationship, Population, evidence, persistence, runtime, simulator, or UI instance.
