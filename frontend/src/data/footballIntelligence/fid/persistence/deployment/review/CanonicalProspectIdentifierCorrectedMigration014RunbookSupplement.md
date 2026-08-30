# Corrected Migration 014 Runbook Supplement

This supplement is mandatory for the existing controlled-deployment runbook.

Before Stage 0 can pass, calculate the repository file SHA-256 and require exactly `18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD`. Stop on any other value. The historical hash `3B271BC994D82C8109CDE4E62E6A1F85A67E49F86C5D98FBD0EBA46D6D214F13` is explicitly prohibited from execution.

Record the expected Sprint 17C historical diagnostic divergence: its original-hash and original-unvalidated-payload assertions must fail after the authorized correction. All other historical assertions must pass.

After structural acceptance, run the supplement’s read-only Block A. Safe replay tests remain rollback-contained. Privileged integrity injection is not ordinary acceptance: it requires separate authorization, a disposable or proven rollback-contained session, synthetic state only, and no disabled constraints or RLS. If those safeguards cannot be proven, do not run it; retain static model evidence.

Stop deployment if the corrected recovery marker is absent, unrestricted payload return is present, any replay creates a row or reference, recovery exposes stored data, linked-row access fails under forced RLS, or reconciliation finds unexpected state.
