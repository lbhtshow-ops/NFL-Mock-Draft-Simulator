# Mandatory Capture and Post-Install Validation Plan

The executor must capture: command start; complete stdout/stderr; exit code; whether mutation began; both before/after hashes; exact `package.json` diff; bounded lockfile summary; installed `pg` version and direct declaration; complete dependency tree; optional-dependency result; lifecycle output; read-only audit output; unexpected-file inventory; post-command Git status; and mandatory-stop confirmation. Credentials and npm tokens must never be exposed.

Validation requires exact `"pg": "8.22.0"` (no caret, tilde, or `latest`); lockfile v3 with exact pg version, approved integrity where applicable, and official registry source; no unrelated dependency, script, engines, manifest, lockfile, source, migration, protected REF, or Sprint 17C change; `npm ls pg --depth=0` exact result; complete resolved tree; read-only `npm audit`; no audit fix; and stop before adapter work.

If any validation fails: do not retry, run another npm command, uninstall, edit manually, or roll back. Preserve evidence and stop for review.
