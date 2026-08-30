#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SPRINT = "MDS-FIE-INTEGRATION-1-RC1";

const ANCHORS = [
  "src/components/draftOperations/DraftOperationsCenter.jsx",
  "src/components/draftOperations/DraftWire.jsx",
  "src/components/draftV3/Intelligence/ProspectIntelligenceCenter.jsx",
  "src/data/sportsIntelligence/SportsIntelligenceEngine.js"
];

const SEARCH_ROOTS = [
  "src/components",
  "src/data",
  "src/engines",
  "src/services",
  "src/hooks",
  "src/utils"
];

const TOKENS = {
  fieCanonical: [
    "CanonicalNFLMatchupIntelligenceRuntimeV1",
    "CanonicalNFLMatchupDirectionalAssessmentEngineV1",
    "CANONICAL_FIE_MATCHUP_INTELLIGENCE_OUTPUT"
  ],
  sportsIntelligence: [
    "SportsIntelligenceEngine",
    "footballIntelligence",
    "intelligence"
  ],
  draftOperations: [
    "DraftOperationsCenter",
    "DraftWire",
    "draft operations",
    "draftOperations"
  ],
  cpuDrafting: [
    "cpu pick",
    "cpuPick",
    "cpu draft",
    "cpuDraft",
    "auto pick",
    "autopick",
    "recommendation",
    "selectBest"
  ],
  teamNeeds: [
    "team needs",
    "teamNeeds",
    "needs",
    "scheme fit",
    "schemeFit"
  ],
  prospectIntelligence: [
    "ProspectIntelligenceCenter",
    "prospect intelligence",
    "prospectIntelligence"
  ],
  decisionSupport: [
    "decision support",
    "decisionSupport",
    "recommendation",
    "confidence",
    "fit score",
    "fitScore"
  ],
  potentialDuplicateReasoning: [
    "teamStrength",
    "availabilityImpact",
    "matchupScore",
    "winProbability",
    "opponentAdjusted",
    "injuryImpact"
  ]
};

const EXT = /\.(js|jsx|mjs|cjs|ts|tsx)$/i;
const EXCLUDE = new Set(["node_modules",".git","dist","build","coverage"]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    if (EXCLUDE.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXT.test(entry.name)) out.push(full);
  }
  return out;
}

function read(file) {
  try { return fs.readFileSync(file, "utf8"); }
  catch { return ""; }
}

function extractImports(text) {
  const out = new Set();
  for (const re of [
    /from\s+["']([^"']+)["']/g,
    /import\s*\(\s*["']([^"']+)["']\s*\)/g,
    /require\(\s*["']([^"']+)["']\s*\)/g
  ]) {
    let m;
    while ((m = re.exec(text))) out.add(m[1]);
  }
  return [...out];
}

function extractExports(text) {
  const out = new Set();
  for (const re of [
    /export\s+(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g,
    /export\s+(?:default\s+)?(?:const|let|var|class)\s+([A-Za-z_$][\w$]*)/g
  ]) {
    let m;
    while ((m = re.exec(text))) out.add(m[1]);
  }
  return [...out];
}

function hitGroups(text) {
  const low = text.toLowerCase();
  return Object.fromEntries(Object.entries(TOKENS).map(([group,tokens]) => [
    group,
    tokens.filter(t => low.includes(t.toLowerCase()))
  ]));
}

function resolveAnchor(anchor) {
  const full = path.join(ROOT, anchor);
  if (fs.existsSync(full)) return full;
  const noExt = full.replace(/\.(jsx?|tsx?|mjs|cjs)$/i, "");
  for (const ext of [".js",".jsx",".ts",".tsx",".mjs",".cjs"]) {
    if (fs.existsSync(noExt + ext)) return noExt + ext;
  }
  return null;
}

const anchorReports = ANCHORS.map(anchor => {
  const resolved = resolveAnchor(anchor);
  const text = resolved ? read(resolved) : "";
  return {
    requestedAnchor: anchor,
    resolvedFile: resolved ? path.relative(ROOT, resolved) : null,
    present: Boolean(resolved),
    imports: text ? extractImports(text) : [],
    exports: text ? extractExports(text) : [],
    tokenHits: text ? hitGroups(text) : {}
  };
});

const files = [...new Set(
  SEARCH_ROOTS
    .map(r => path.join(ROOT,r))
    .filter(fs.existsSync)
    .flatMap(r => walk(r))
)];

const candidates = [];
for (const file of files) {
  const text = read(file);
  if (!text) continue;
  const groups = hitGroups(text);
  const active = Object.entries(groups).filter(([,hits]) => hits.length);
  if (!active.length) continue;

  const rel = path.relative(ROOT,file);
  const score =
    active.reduce((s,[,hits]) => s + hits.length, 0) +
    (/draft|intelligence|engine|service|decision|cpu|team/i.test(rel) ? 3 : 0);

  candidates.push({
    file: rel,
    score,
    groups,
    imports: extractImports(text).slice(0,50),
    exports: extractExports(text).slice(0,30),
    likelyUIConsumer: /components[\\/]/i.test(rel),
    likelyServiceOrEngine: /(engine|service|data[\\/]sportsIntelligence|data[\\/]footballIntelligence)/i.test(rel),
    potentialDuplicateReasoning:
      groups.potentialDuplicateReasoning.length > 0 &&
      !/footballIntelligence[\\/]|sportsIntelligence[\\/]/i.test(rel)
  });
}
candidates.sort((a,b) => b.score - a.score || a.file.localeCompare(b.file));

const duplicateCandidates = candidates.filter(x => x.potentialDuplicateReasoning);
const cpuCandidates = candidates.filter(x => x.groups.cpuDrafting.length);
const decisionSupportCandidates = candidates.filter(x => x.groups.decisionSupport.length);
const draftWireCandidates = candidates.filter(x => x.groups.draftOperations.includes("DraftWire") || /DraftWire/i.test(x.file));

const integrationMap = {
  producer: "CANONICAL_FIE",
  consumer: "LBHT_MOCK_DRAFT_SIMULATOR",
  boundary: "CANONICAL_FIE_MATCHUP_INTELLIGENCE_OUTPUT",
  recommendedLayers: [
    {
      order: 1,
      layer: "MDS_FIE_CONSUMER_ADAPTER",
      responsibility: "Translate canonical FIE output into MDS-safe view/application contracts without recomputing football reasoning."
    },
    {
      order: 2,
      layer: "MDS_INTELLIGENCE_APPLICATION_SERVICE",
      responsibility: "Expose stable draft-facing intelligence to Draft Room, Draft Operations, Draft Wire and CPU decision support."
    },
    {
      order: 3,
      layer: "MDS_PRESENTATION_AND_DRAFT_DECISION_CONSUMERS",
      responsibility: "Render or consume canonical intelligence while preserving MDS ownership of draft simulation behavior."
    }
  ],
  firstIntegrationTargets: [
    "SportsIntelligenceEngine / existing MDS intelligence boundary",
    "DraftOperationsCenter",
    "ProspectIntelligenceCenter",
    "DraftWire",
    "CPU draft decision support path"
  ],
  prohibitedPatterns: [
    "DIRECT_FIE_SCORING_LOGIC_IN_REACT_COMPONENTS",
    "MDS_RECOMPUTES_TEAM_STRENGTH",
    "MDS_RECOMPUTES_AVAILABILITY",
    "MDS_RECOMPUTES_MATCHUP_DIRECTION",
    "MDS_IMPORTS_PICKEM_SPECIFIC_LOGIC"
  ]
};

const checks = {
  allPrimaryAnchorsPresent: anchorReports.every(x => x.present),
  repositoryConsumerScanComplete: true,
  sportsIntelligenceCandidatesFound: candidates.some(x => x.groups.sportsIntelligence.length),
  draftOperationsCandidatesFound: candidates.some(x => x.groups.draftOperations.length),
  prospectIntelligenceCandidatesFound: candidates.some(x => x.groups.prospectIntelligence.length),
  cpuDraftingCandidatesFound: cpuCandidates.length > 0,
  decisionSupportCandidatesFound: decisionSupportCandidates.length > 0,
  draftWireCandidatesFound: draftWireCandidates.length > 0,
  canonicalConsumerBoundaryDefined: true,
  duplicateReasoningAuditComplete: true
};

const readyForDesign = Object.values(checks).every(Boolean);

console.log(JSON.stringify({
  contractVersion: "MDS-FIE-CONSUMER-REPOSITORY-AUDIT-INTEGRATION-MAP-1.0.0",
  sprint: SPRINT,
  mode: "READ_ONLY_MDS_CONSUMER_ARCHITECTURE_AUDIT",
  decision: readyForDesign
    ? "MDS_FIE_CONSUMER_ARCHITECTURE_AUDITED_INTEGRATION_MAP_READY"
    : "MDS_FIE_CONSUMER_ARCHITECTURE_AUDIT_BLOCKED",

  anchorReports,

  scan: {
    roots: SEARCH_ROOTS.filter(r => fs.existsSync(path.join(ROOT,r))),
    filesInspected: files.length,
    candidateCount: candidates.length,
    duplicateReasoningCandidateCount: duplicateCandidates.length,
    cpuDraftingCandidateCount: cpuCandidates.length,
    decisionSupportCandidateCount: decisionSupportCandidates.length,
    draftWireCandidateCount: draftWireCandidates.length
  },

  topCandidates: candidates.slice(0,100),
  duplicateReasoningCandidates: duplicateCandidates.slice(0,80),
  cpuDraftingCandidates: cpuCandidates.slice(0,60),
  decisionSupportCandidates: decisionSupportCandidates.slice(0,60),
  draftWireCandidates: draftWireCandidates.slice(0,40),

  integrationMap,
  checks,

  authorizationBoundary: {
    repositoryAuditComplete: true,
    integrationMapDesignMayAdvance: readyForDesign,
    consumerAdapterImplementationAuthorized: false,
    draftRoomMutationAuthorized: false,
    cpuDraftDecisionMutationAuthorized: false,
    draftWireRuntimeMutationAuthorized: false,
    productionDecisionProbabilityMutationAuthorized: false,
    pickemRepositoryMutationAuthorized: false,
    databaseMutationAuthorized: false
  },

  nextStep: readyForDesign
    ? "DEFINE_MDS_FIE_CONSUMER_ADAPTER_CONTRACT_AGAINST_IDENTIFIED_REPOSITORY_SURFACES"
    : "RECONCILE_MISSING_MDS_CONSUMER_SURFACES_BEFORE_INTEGRATION_DESIGN",

  safeguards: {
    repositoryFilesMutated: false,
    mdsRuntimeMutated: false,
    cpuDraftBehaviorMutated: false,
    draftWireMutated: false,
    pickemRepositoryMutated: false,
    databaseMutated: false
  }
}, null, 2));

if (!readyForDesign) process.exitCode = 1;
