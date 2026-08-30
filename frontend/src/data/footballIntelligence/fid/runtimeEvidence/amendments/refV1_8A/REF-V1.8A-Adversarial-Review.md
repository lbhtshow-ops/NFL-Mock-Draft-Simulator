# REF-V1.8A Adversarial Review

The original diagnostic and count were not changed or relabeled. The manifest is explicit and non-recursive; additions are reported but never auto-enrolled. Every predecessor remains path-and-hash bound, so same-hash substitution at another path, rename, deletion, modification, duplicate path, case/path-separator ambiguity, and manifest aggregate corruption fail. Paths are repository-relative forward-slash identifiers with a restricted alphabet; absolute and traversal paths fail.

Tracked status is recorded as an amendment-time declaration and was independently checked with Git; no historical tracking is inferred. Symlink substitution remains a residual platform concern because the successor currently verifies resolved file bytes but does not persist filesystem-object identity. The manifest has no self-reference. Future sprints may not rewrite it.

Protected barrels and predecessors remain unchanged. Blocked writer/composition experiments were removed only after exact origin and untracked status were established. No writer implementation, package, execution authority, or Sprint 17C successor survives. Remaining risks are filesystem case behavior, symlink metadata, and future status drift; each requires explicit reporting rather than silent acceptance.

Review result: `REF_V1_8A_ADVERSARIAL_REVIEW_ACCEPTED_WITH_DOCUMENTED_FILESYSTEM_LIMITATIONS`.
