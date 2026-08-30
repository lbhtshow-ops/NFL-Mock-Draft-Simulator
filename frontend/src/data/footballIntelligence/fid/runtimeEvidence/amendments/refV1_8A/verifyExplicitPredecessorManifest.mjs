import { createHash } from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const frontendRoot = path.resolve(here, "../../../../../../..");
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();
const stable = (value) => value == null || typeof value !== "object" ? value : Array.isArray(value) ? value.map(stable) : Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
const aggregate = (manifest) => digest(Buffer.from(JSON.stringify(stable({ manifestVersion: manifest.manifestVersion, schemaVersion: manifest.schemaVersion, entries: manifest.entries.map(({ relativePath, sha256, gitStateAtAmendment }) => ({ relativePath, sha256, gitStateAtAmendment })) })), "utf8"));

export async function verifyExplicitPredecessorManifest(manifest, { root = frontendRoot } = {}) {
  const findings = []; const paths = new Set();
  if (manifest?.manifestIdentity !== "REF_V1_8A_EXPLICIT_REF_V1_7_PREDECESSOR_MANIFEST" || manifest?.predecessorCount !== 68 || !Array.isArray(manifest?.entries) || manifest.entries.length !== 68) findings.push({ code: "MANIFEST_STRUCTURE_INVALID" });
  for (const entry of manifest?.entries ?? []) {
    if (paths.has(entry.relativePath)) findings.push({ code: "DUPLICATE_PREDECESSOR_PATH", path: entry.relativePath }); paths.add(entry.relativePath);
    if (!/^[A-Za-z0-9_./-]+$/.test(entry.relativePath) || entry.relativePath.includes("..") || path.isAbsolute(entry.relativePath)) { findings.push({ code: "PREDECESSOR_PATH_INVALID", path: entry.relativePath }); continue; }
    if (!/^[0-9A-F]{64}$/.test(entry.sha256) || entry.requiredPresence !== true || entry.renameProhibited !== true || entry.substitutionProhibited !== true || entry.contentModificationProhibited !== true || entry.historicalGitCustodyEstablished !== false) findings.push({ code: "PREDECESSOR_ENTRY_INVALID", path: entry.relativePath });
    const absolute = path.join(root, entry.relativePath);
    try { await access(absolute); const actual = digest(await readFile(absolute)); if (actual !== entry.sha256) findings.push({ code: "PREDECESSOR_CONTENT_DRIFT", path: entry.relativePath, expected: entry.sha256, actual }); }
    catch { findings.push({ code: "PREDECESSOR_MISSING_OR_PATH_DRIFT", path: entry.relativePath }); }
  }
  const calculatedAggregate = aggregate(manifest);
  if (calculatedAggregate !== manifest?.manifestAggregateSha256) findings.push({ code: "MANIFEST_AGGREGATE_MISMATCH", expected: manifest?.manifestAggregateSha256, actual: calculatedAggregate });
  if (!manifest?.nonRetroactiveDisclaimer?.includes("NO_HISTORICAL_GIT_AUTHENTICATION") || manifest?.originalV1_7AggregateSha256 !== "778B57736A3BD9ABF2964622E612185A1F45C4A19D2DC85A97150A27BB798A61") findings.push({ code: "GOVERNANCE_DISCLOSURE_INVALID" });
  const roots = ["src/data/footballIntelligence/fid/runtimeEvidence", "src/data/footballIntelligence/fid/docs/runtimeEvidenceFramework"];
  const additionalFiles = [];
  for (const relative of roots) for (const name of await readdir(path.join(root, relative), { withFileTypes: true })) { const candidate = `${relative}/${name.name}`; if (!paths.has(candidate)) additionalFiles.push({ path: candidate, classification: name.isDirectory() ? "ADDITIVE_VERSIONED_SUBDIRECTORY" : candidate.includes("V1_7") || candidate.includes("V1_6") ? "KNOWN_V1_ADDITIVE_FILE" : "UNKNOWN_OR_ADDITIVE_FILE" }); }
  return Object.freeze({ status: findings.length ? "REF_V1_8A_PREDECESSOR_VERIFICATION_FAILED" : "REF_V1_8A_EXPLICIT_PREDECESSOR_MANIFEST_VERIFIED", predecessorCount: paths.size, calculatedAggregate, findings: Object.freeze(findings), additionalFiles: Object.freeze(additionalFiles.sort((a, b) => a.path.localeCompare(b.path))), historicalGitCustodyEstablished: false, originalMeasurementPreserved: true, futureFilesImplicitlyAdded: false });
}

export async function loadExplicitPredecessorManifest() { return JSON.parse(await readFile(new URL("./refV1_7ExplicitPredecessorManifest.json", import.meta.url), "utf8")); }
