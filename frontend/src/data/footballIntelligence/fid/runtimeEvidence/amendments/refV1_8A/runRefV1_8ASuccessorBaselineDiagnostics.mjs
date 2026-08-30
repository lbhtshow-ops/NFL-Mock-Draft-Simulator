import assert from "node:assert/strict";
import process from "node:process";
import { loadExplicitPredecessorManifest, verifyExplicitPredecessorManifest } from "./verifyExplicitPredecessorManifest.mjs";

async function run() {
  let checks = 0; const check = (value, message) => { checks += 1; assert(value, message); };
  const manifest = await loadExplicitPredecessorManifest(); const result = await verifyExplicitPredecessorManifest(manifest);
  check(result.status === "REF_V1_8A_EXPLICIT_PREDECESSOR_MANIFEST_VERIFIED", "explicit predecessor verification failed");
  check(result.predecessorCount === 68 && new Set(manifest.entries.map((entry) => entry.relativePath)).size === 68, "exact unique count failed");
  check(result.calculatedAggregate === manifest.manifestAggregateSha256, "manifest aggregate failed");
  check(manifest.entries.every((entry) => entry.gitStateAtAmendment === "UNTRACKED" && !entry.historicalGitCustodyEstablished), "custody status overstated");
  check(result.additionalFiles.length > 0 && result.futureFilesImplicitlyAdded === false, "additive files not separated");
  const duplicate = structuredClone(manifest); duplicate.entries[1].relativePath = duplicate.entries[0].relativePath; check((await verifyExplicitPredecessorManifest(duplicate)).findings.some((item) => item.code === "DUPLICATE_PREDECESSOR_PATH"), "duplicate path accepted");
  const corrupted = structuredClone(manifest); corrupted.entries[0].sha256 = "0".repeat(64); check((await verifyExplicitPredecessorManifest(corrupted)).findings.some((item) => item.code === "PREDECESSOR_CONTENT_DRIFT"), "content drift accepted");
  const missing = structuredClone(manifest); missing.entries[0].relativePath = `${missing.entries[0].relativePath}.renamed`; check((await verifyExplicitPredecessorManifest(missing)).findings.some((item) => item.code === "PREDECESSOR_MISSING_OR_PATH_DRIFT"), "rename/missing accepted");
  const aggregate = structuredClone(manifest); aggregate.manifestAggregateSha256 = "F".repeat(64); check((await verifyExplicitPredecessorManifest(aggregate)).findings.some((item) => item.code === "MANIFEST_AGGREGATE_MISMATCH"), "manifest corruption accepted");
  check(manifest.nonRetroactiveDisclaimer.includes("NO_HISTORICAL_GIT_AUTHENTICATION") && result.originalMeasurementPreserved, "non-retroactive policy absent");
  check(manifest.extensibilityPolicy.includes("FUTURE_FILES") && manifest.verificationPolicy.includes("EXPLICIT"), "extensibility policy absent");
  console.log(JSON.stringify({ status: "RUNTIME_EVIDENCE_FRAMEWORK_V1_BASELINE_SCOPE_AMENDMENT_DIAGNOSTICS_PASSED", checks, predecessors: 68, manifestAggregateSha256: manifest.manifestAggregateSha256, additionalFiles: result.additionalFiles, originalV1_7AggregatePreserved: manifest.originalV1_7AggregateSha256, historicalGitCustodyEstablished: false, repositoryFilesMutatedByDiagnostic: false }));
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
