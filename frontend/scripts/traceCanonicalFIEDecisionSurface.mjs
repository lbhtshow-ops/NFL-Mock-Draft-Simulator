#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SPRINT = "2.18.24-RC4.1";

const ANCHORS = [
  "scripts/diagnoseFieDecisionApiJsonImports.mjs",
  "scripts/diagnoseFieDecisionApiNodeEsmImports.mjs",
  "scripts/promoteNFLGameDecisionModelV1.mjs",
  "scripts/runPlayerImpactTeamStrengthShadowAcceptance.mjs",
  "scripts/runLiveNFLTeamDependencyImpactAcceptance.mjs",
  "scripts/runTeamDependencyEvidenceProvenanceAcceptance.mjs"
];

const KEY_TOKENS = [
  "NFL-GAME-DECISION-MODEL-V1.0.0",
  "Decision API",
  "decisionApi",
  "decisionModel",
  "teamStrength",
  "matchup",
  "playerImpact",
  "availability"
];

function read(rel) {
  const full = path.join(ROOT, rel);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "";
}

function extractImports(text) {
  const out = new Set();
  const patterns = [
    /from\s+["']([^"']+)["']/g,
    /import\s*\(\s*["']([^"']+)["']\s*\)/g,
    /require\(\s*["']([^"']+)["']\s*\)/g
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(text))) out.add(m[1]);
  }
  return [...out];
}

function resolveLocal(anchor, spec) {
  if (!spec.startsWith(".")) return null;
  const base = path.dirname(path.join(ROOT, anchor));
  const raw = path.resolve(base, spec);
  const tries = [
    raw, `${raw}.js`, `${raw}.mjs`, `${raw}.cjs`, `${raw}.ts`, `${raw}.tsx`,
    path.join(raw, "index.js"), path.join(raw, "index.mjs"), path.join(raw, "index.ts")
  ];
  const hit = tries.find(fs.existsSync);
  return hit ? path.relative(ROOT, hit) : path.relative(ROOT, raw);
}

const anchorReports = [];
const discoveredLocalFiles = new Set();

for (const anchor of ANCHORS) {
  const text = read(anchor);
  const imports = extractImports(text);
  const localImports = imports
    .map(spec => ({ spec, resolved: resolveLocal(anchor, spec) }))
    .filter(x => x.resolved);

  for (const x of localImports) discoveredLocalFiles.add(x.resolved);

  anchorReports.push({
    anchor,
    exists: Boolean(text),
    importCount: imports.length,
    imports,
    localImports,
    tokenHits: KEY_TOKENS.filter(t => text.toLowerCase().includes(t.toLowerCase()))
  });
}

const tracedFiles = [...discoveredLocalFiles].map(rel => {
  const text = read(rel);
  return {
    file: rel,
    exists: Boolean(text),
    importCount: text ? extractImports(text).length : 0,
    tokenHits: KEY_TOKENS.filter(t => text.toLowerCase().includes(t.toLowerCase())),
    likelyDecisionSurface:
      /decision|matchup|teamStrength|team-strength|gameDecision/i.test(rel + "\n" + text),
    likelyAvailabilitySurface:
      /availability|injur|playerImpact|player-impact/i.test(rel + "\n" + text)
  };
});

const decisionCandidates = tracedFiles.filter(x => x.exists && x.likelyDecisionSurface);
const availabilityAdjacentCandidates = tracedFiles.filter(x => x.exists && x.likelyAvailabilitySurface);

console.log(JSON.stringify({
  contractVersion: "FIE-NFL-CANONICAL-DECISION-SURFACE-TRACE-1.0.0",
  sprint: SPRINT,
  mode: "READ_ONLY_IMPORT_TRACE",
  anchors: anchorReports,
  tracedFiles,
  summary: {
    anchorCount: ANCHORS.length,
    anchorsPresent: anchorReports.filter(x => x.exists).length,
    localFilesDiscovered: tracedFiles.length,
    decisionCandidateCount: decisionCandidates.length,
    availabilityAdjacentCandidateCount: availabilityAdjacentCandidates.length
  },
  decisionCandidates,
  availabilityAdjacentCandidates,
  authorizationBoundary: {
    canonicalTraceComplete: true,
    adapterContractDefinitionMayAdvance:
      anchorReports.some(x => x.exists && x.tokenHits.length > 0),
    productionMutationAuthorized: false,
    decisionScoringMutationAuthorized: false,
    pickemMutationAuthorized: false,
    databaseMutationAuthorized: false
  },
  safeguards: {
    repositoryFilesMutated: false,
    productionScoringExecuted: false,
    pickemMutated: false,
    databaseMutated: false
  }
}, null, 2));
