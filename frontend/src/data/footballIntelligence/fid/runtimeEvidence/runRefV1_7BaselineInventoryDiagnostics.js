import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import process from "node:process";
import { REF_V1_7_PREDECESSOR_BASELINE } from "./refV1_7BaselineInventory.js";

const runtimeDirectory = new URL("./", import.meta.url);
const docsDirectory = new URL("../docs/runtimeEvidenceFramework/", import.meta.url);
const excluded = new Set(["postgresAtomicOperationProfile.js", "deterministicFakePostgresDriver.js", "postgresTransactionWitnessAdapter.js", "runtimeEvidenceV1_7Fixtures.js", "runPostgresTransactionWitnessDiagnostics.js", "runRefV1_7BaselineInventoryDiagnostics.js", "refV1_7BaselineInventory.js"]);
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();
async function run() {
  const runtimeNames = (await readdir(runtimeDirectory)).filter((name) => name.endsWith(".js") && !excluded.has(name));
  const docNames = (await readdir(docsDirectory)).filter((name) => name.endsWith(".md") && name !== "RuntimeEvidenceFrameworkV1_7PostgresTransactionWitnessAdapter.md");
  const entries = [];
  for (const name of runtimeNames) entries.push({ path: `src/data/footballIntelligence/fid/runtimeEvidence/${name}`, sha256: digest(await readFile(new URL(name, runtimeDirectory))), gitState: "UNTRACKED" });
  for (const name of docNames) entries.push({ path: `src/data/footballIntelligence/fid/docs/runtimeEvidenceFramework/${name}`, sha256: digest(await readFile(new URL(name, docsDirectory))), gitState: "UNTRACKED" });
  entries.sort((a, b) => a.path.localeCompare(b.path));
  const aggregate = digest(new TextEncoder().encode(entries.map((entry) => `${entry.path}=${entry.sha256}`).join("\n")));
  assert.equal(entries.length, REF_V1_7_PREDECESSOR_BASELINE.fileCount);
  assert.equal(aggregate, REF_V1_7_PREDECESSOR_BASELINE.inventoryAggregateSha256);
  assert.equal(REF_V1_7_PREDECESSOR_BASELINE.gitState.trackedCount, 0);
  assert(REF_V1_7_PREDECESSOR_BASELINE.disclaimers.includes("NO_RETROACTIVE_CUSTODY_CLAIM"));
  console.log(JSON.stringify({ status: "REF_V1_7_CURRENT_FILESYSTEM_BASELINE_VERIFIED", aggregateSha256: aggregate, entries, historicalGitTrackingEstablished: false, retroactiveCustodyClaim: false }));
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
