# Sprint 17C.38 split-authority visible-result contract correction

Status: `SPLIT_AUTHORITY_FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_DIAGNOSTIC_ADDITIONAL_CORRECTION_REQUIRED`

No corrected SQL successor was created because the authoritative output requirements are internally inconsistent and the sprint prohibits inventing another order. Sprint 17C.36, Sprint 17C.37, and every historical or protected artifact remain unchanged.

## Blocking contract contradiction

Sprint 17C.38 designates the exact 21-field order documented in the Sprint 17C.37 report as authoritative and requires the successor to return exactly those 21 fields in exactly that order. That order is:

`result_identity`, `result_version`, `classification`, `mismatch_count`, `mismatch_details`, `detail_count`, `count_reconciled`, `captured_preflight_mismatch_count`, `captured_count_reconciled`, `unresolved_details`, `state_conflicts`, `expected_before_set_state`, `expected_before_create_state`, `membership_evidence`, `database_observed_target_evidence`, `externally_authorized_target_binding`, `database_evidence_complete`, `external_target_attestation_required`, `overall_target_verified`, `read_only`, `mutation_count`.

The same request mandates adding four top-level fields absent from that order: `mode`, `metadata_storage_present`, `migration_014_metadata_count`, and `evidence_complete`. Adding them without removal yields 25 fields. Returning exactly 21 therefore requires removing or replacing four authoritative fields, but no removal or replacement mapping is supplied. Choosing four would invent a different order and could silently discard required mismatch, unresolved, state, reconciliation, authority, or safety evidence.

The two nested external-key renames are unambiguous, but implementing them alone would leave four reviewed defects unresolved. Creating a partial successor would violate the stop conditions. A corrected SQL successor requires an amended authoritative 21-field order or an explicit four-field replacement mapping.

## Preservation and repository record

Repository root is `C:\Users\zeyga\NFL-Mock-Draft-Simulator-main\NFL-Mock-Draft-Simulator-main`; working directory is `frontend`; branch is `main`; origin is `https://github.com/lbhtshow-ops/NFL-Mock-Draft-Simulator.git`; upstream is `origin/fid-persistence-v1.0.1`. The inherited dirty worktree was preserved without clean, reset, stash, overwrite, or unrelated repair. Migrations remain exactly 001–014, migration 015 is absent, migration 014 remains unapplied, and authoritative state remains `MIGRATION_014_FULLY_ROLLED_BACK`. Sprint 17C.23, 17C.26, and 17C.29 authorizations remain consumed.

Protected Sprint 17C.36 remains SHA-256 `ECB92D08C6712B81CEE71C59FD8DFD9CBCE4FA7B441EE0E6199ED912A28F894C`; Sprint 17C.34 remains `E4709DA5768F6D8099B1160DB845A9F744228C964AFE2CACBBE3A98520F96548`; Sprint 17C.32 remains `9A3A4E4583721182F3DE3A68B5DB29BECD6A120310CBE4C700850CC202D9A10D`; Sprint 17C.30 remains `A9882BBA3AD98B4EC608FB741672ABCFCAFB1F99CC863DEE83F39C8F35061468`.

This repository-only correction review executed no SQL, contacted no database or Supabase service, created no authorization, and performed no mutation, migration, amendment, RPC, UUID, candidate, or operational action. Parser reproduction is not applicable because no corrected SQL successor exists.
