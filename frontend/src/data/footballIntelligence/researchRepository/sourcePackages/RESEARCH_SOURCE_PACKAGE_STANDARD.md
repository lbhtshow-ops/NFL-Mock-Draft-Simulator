# Research Source Package Standard v1.0

## Artifact scope

One Research Source Package represents one specifically identifiable primary source artifact concerning one package subject. A subject may have many packages. Each package can produce multiple sessions, recorded observations, supported analyses, evidence artifacts, review decisions, content locators, and Population links. Population aggregates authorized evidence across packages; the package does not aggregate every source about a subject.

The manifest's singular `researchSourceRef` identifies the primary governed `ResearchSource`. Its `access.location` identifies the source artifact: a specific stable page, release, report, episode, video, file, interview, dataset version, or retained repository artifact. A publisher, analyst, website, channel, database, or other generic label is not an artifact identity. Multiple page sections, seasons, tables, rows, timestamps, or short excerpts from one stable artifact remain content locators within one package.

The following identities are distinct:

- `subjectRef`: the person or other research subject.
- `researchSourceRef`: the governed primary source declaration.
- `ResearchSource.access.location`: the primary source artifact identity.
- `packageId`: the versioned package lineage.
- `evidenceId`: an `EvidenceArtifact` created from research activity.

All included records must resolve from caller-supplied context and remain attributable to the same `researchSourceRef`. Review artifact locators must not conflict with the primary source artifact identity, and Population links may reference only evidence included in the package. Contract validity never implies source, package, evidence, or Population-use approval.

## Revisions

A correction or expansion concerning the same primary artifact normally increments `packageRevision` and preserves the package ID, primary source reference, stable artifact identity, and `previousPackageRevisionRef` lineage. A materially different artifact normally receives a new package ID and source declaration.

This is a clarification of Standard v1.0. The original contract already used one singular primary source reference; no contract or schema version changes are required.
