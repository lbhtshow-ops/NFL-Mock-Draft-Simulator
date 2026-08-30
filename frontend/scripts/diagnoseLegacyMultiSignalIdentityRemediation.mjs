import fs from "node:fs";
import assert from "node:assert/strict";
const path = new URL("./remediateLegacyMultiSignalIdentityCollision.mjs", import.meta.url);
const text = fs.readFileSync(path, "utf8");
const tests = [
  ["legacy-artifact-exactly-scoped", () => assert(text.includes('evidence:nfl-multisignal-availability:2026:1:bal'))],
  ["legacy-session-exactly-scoped", () => assert(text.includes('research-session:nfl-multisignal-availability:2026:1'))],
  ["corrected-pre-artifact-protected", () => assert(text.includes('evidence:nfl-multisignal-availability:2026:pre:1:bal'))],
  ["corrected-pre-session-protected", () => assert(text.includes('research-session:nfl-multisignal-availability:2026:pre:1'))],
  ["expected-187-observations", () => assert(/EXPECTED_OBSERVATIONS\s*=\s*187/.test(text))],
  ["default-mode-read-only", () => assert(text.includes('READ_ONLY_PREFLIGHT'))],
  ["explicit-execute-gate", () => assert(text.includes('--execute-soft-delete'))],
  ["canonical-postgres-adapter-reused", () => assert(text.includes('createPostgresResearchRepositoryAdapter'))],
  ["canonical-soft-delete-mode", () => assert(text.includes('PERSISTENCE_DELETE_MODES.SOFT_DELETE'))],
  ["hard-delete-disabled", () => assert(text.includes('allowHardDelete: false'))],
  ["other-artifact-reference-guard", () => assert(text.includes('noOtherArtifactReferences'))],
  ["other-session-reference-guard", () => assert(text.includes('noOtherSessionReferences'))],
  ["corrected-artifact-absence-guard", () => assert(text.includes('correctedArtifactAbsent'))],
  ["corrected-session-absence-guard", () => assert(text.includes('correctedSessionAbsent'))],
  ["research-source-not-deleted", () => assert(text.includes('researchSourceTouched: false'))],
  ["no-direct-delete-sql", () => assert(!/pool\.query\(\s*["'`]delete\s+/i.test(text))],
  ["no-direct-update-delete-flag-sql", () => assert(!/pool\.query\([\s\S]{0,100}is_deleted\s*=\s*true/i.test(text))],
];
let passed=0, failed=0; const results=[];
for (const [name,fn] of tests) { try { fn(); passed++; results.push({name,passed:true}); } catch (error) { failed++; results.push({name,passed:false,error:error.message}); } }
console.log(JSON.stringify({suite:"Legacy Multi-Signal Identity Remediation V1 Diagnostics",passed,failed,tests:results},null,2));
if (failed) process.exit(1);
