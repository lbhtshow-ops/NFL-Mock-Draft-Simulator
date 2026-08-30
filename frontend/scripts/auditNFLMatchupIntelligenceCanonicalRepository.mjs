#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SPRINT = "2.19-RC1";
const EXCLUDED_DIRS = new Set(["node_modules",".git","dist","build","coverage"]);
const EXT = /\.(js|mjs|cjs|ts|tsx|jsx|json|jsonl|md)$/i;

const CAPABILITY_GROUPS = Object.freeze({
  teamIntelligence: [
    "team intelligence","teamIntelligence","team-strength","teamStrength",
    "team context","teamContext"
  ],
  matchup: [
    "matchup intelligence","matchupIntelligence","matchup",
    "opponent-adjusted","opponent adjusted","opponentAdjusted"
  ],
  performance: [
    "performance evidence","performanceEvidence","epa","success rate",
    "successRate","play-by-play","play by play","recent performance"
  ],
  offenseDefense: [
    "offense","offensive","defense","defensive"
  ],
  qbDependency: [
    "quarterback","qb state","qbState","dependency","starter","depth chart"
  ],
  availability: [
    "availability","injury","injuries","player impact","playerImpact",
    "resolveBoundedAvailabilityImpact"
  ],
  decisionSupport: [
    "decision model","decisionModel","decision api","Decision API",
    "NFL-GAME-DECISION-MODEL-V1.0.0","prediction","win probability"
  ],
  provenanceConfidence: [
    "provenance","confidence","evidence completeness","evidenceCompleteness",
    "sourceClassification","provider"
  ]
});

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (EXT.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function safeRead(file) {
  try {
    const stat = fs.statSync(file);
    if (stat.size > 80 * 1024 * 1024) return "";
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
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

function hitTokens(text, tokens) {
  const low = text.toLowerCase();
  return tokens.filter(t => low.includes(t.toLowerCase()));
}

function scoreFile(rel, text) {
  const groups = {};
  let score = 0;

  for (const [group, tokens] of Object.entries(CAPABILITY_GROUPS)) {
    const hits = hitTokens(text, tokens);
    groups[group] = hits;
    if (hits.length) score += hits.length;
  }

  if (/footballIntelligence|football-intelligence|FIE/i.test(rel)) score += 3;
  if (/service|engine|contract|model|decision|matchup|team|availability|impact/i.test(rel)) score += 2;

  return { score, groups };
}

const roots = [
  path.join(ROOT, "src"),
  path.join(ROOT, "scripts"),
  path.join(ROOT, "data")
].filter(fs.existsSync);

const files = [...new Set(roots.flatMap(r => walk(r)))];
const candidates = [];

for (const file of files) {
  const text = safeRead(file);
  if (!text) continue;

  const rel = path.relative(ROOT, file);
  const { score, groups } = scoreFile(rel, text);

  const activeGroups = Object.entries(groups).filter(([, hits]) => hits.length);
  if (activeGroups.length < 2) continue;

  candidates.push({
    file: rel,
    score,
    groups,
    imports: extractImports(text).slice(0, 60),
    likelyContract: /contract|interface|type|schema/i.test(rel + "\n" + text),
    likelyRuntimeSurface: /service|engine|resolver|runtime|api|decision/i.test(rel + "\n" + text),
    likelyGeneratedData: /generated|source\.json|source\.js|jsonl/i.test(rel)
  });
}

candidates.sort((a,b) => b.score - a.score || a.file.localeCompare(b.file));

const groupCoverage = {};
for (const group of Object.keys(CAPABILITY_GROUPS)) {
  const matches = candidates.filter(c => c.groups[group].length > 0);
  groupCoverage[group] = {
    candidateCount: matches.length,
    topFiles: matches.slice(0, 12).map(x => x.file)
  };
}

const explicitMatchupCandidates = candidates.filter(c => c.groups.matchup.length > 0);
const likelyContracts = candidates.filter(c => c.likelyContract);
const likelyRuntimeSurfaces = candidates.filter(c => c.likelyRuntimeSurface);

const checks = {
  repositoryScanComplete: true,
  teamIntelligenceCoverageFound: groupCoverage.teamIntelligence.candidateCount > 0,
  performanceEvidenceCoverageFound: groupCoverage.performance.candidateCount > 0,
  offenseDefenseCoverageFound: groupCoverage.offenseDefense.candidateCount > 0,
  qbDependencyCoverageFound: groupCoverage.qbDependency.candidateCount > 0,
  availabilityCoverageFound: groupCoverage.availability.candidateCount > 0,
  decisionSupportCoverageFound: groupCoverage.decisionSupport.candidateCount > 0,
  provenanceConfidenceCoverageFound: groupCoverage.provenanceConfidence.candidateCount > 0,
  matchupCandidateFilesFound: explicitMatchupCandidates.length > 0,
  contractCandidatesFound: likelyContracts.length > 0,
  runtimeCandidatesFound: likelyRuntimeSurfaces.length > 0
};

const foundationalCoverageComplete =
  checks.teamIntelligenceCoverageFound &&
  checks.performanceEvidenceCoverageFound &&
  checks.offenseDefenseCoverageFound &&
  checks.qbDependencyCoverageFound &&
  checks.availabilityCoverageFound &&
  checks.decisionSupportCoverageFound &&
  checks.provenanceConfidenceCoverageFound;

let decision;
if (foundationalCoverageComplete && checks.matchupCandidateFilesFound) {
  decision = "MATCHUP_INTELLIGENCE_EXISTING_SURFACES_IDENTIFIED_FOR_CANONICAL_CONTRACT_AUDIT";
} else if (foundationalCoverageComplete) {
  decision = "MATCHUP_INTELLIGENCE_FOUNDATION_PRESENT_BUT_EXPLICIT_MATCHUP_SURFACE_MISSING";
} else {
  decision = "MATCHUP_INTELLIGENCE_FOUNDATION_INCOMPLETE_REQUIRES_RECONCILIATION";
}

console.log(JSON.stringify({
  contractVersion: "FIE-NFL-MATCHUP-INTELLIGENCE-CANONICAL-REPOSITORY-AUDIT-1.0.0",
  sprint: SPRINT,
  mode: "READ_ONLY_CANONICAL_REPOSITORY_AUDIT",
  decision,

  scan: {
    roots: roots.map(r => path.relative(ROOT, r)),
    filesInspected: files.length,
    candidateCount: candidates.length,
    explicitMatchupCandidateCount: explicitMatchupCandidates.length,
    contractCandidateCount: likelyContracts.length,
    runtimeCandidateCount: likelyRuntimeSurfaces.length
  },

  capabilityCoverage: groupCoverage,

  explicitMatchupCandidates: explicitMatchupCandidates.slice(0, 50),
  likelyContractCandidates: likelyContracts.slice(0, 50),
  likelyRuntimeCandidates: likelyRuntimeSurfaces.slice(0, 50),
  topCrossCapabilityCandidates: candidates.slice(0, 80),

  checks,

  architectureBoundary: {
    canonicalFIEOwnsMatchupReasoning: true,
    mdsConsumesMatchupAndDraftDecisionSupport: true,
    pickemConsumesDecisionOutputOnly: true,
    duplicateMatchupEngineInApplicationsProhibited: true,
    teamIntelligenceMustRemainReusableFoundation: true,
    playerAvailabilityMustRemainReusableFoundation: true,
    provenanceAndConfidenceMustRemainFirstClass: true
  },

  authorizationBoundary: {
    canonicalRepositoryAuditComplete: true,
    matchupContractAuditMayAdvance:
      decision === "MATCHUP_INTELLIGENCE_EXISTING_SURFACES_IDENTIFIED_FOR_CANONICAL_CONTRACT_AUDIT",
    matchupContractDesignMayAdvance:
      decision !== "MATCHUP_INTELLIGENCE_FOUNDATION_INCOMPLETE_REQUIRES_RECONCILIATION",
    matchupScoringImplementationAuthorized: false,
    productionDecisionModelMutationAuthorized: false,
    pickemRepositoryMutationAuthorized: false,
    databaseMutationAuthorized: false,
    refSprint17CResumptionAuthorized: false
  },

  nextStep:
    decision === "MATCHUP_INTELLIGENCE_EXISTING_SURFACES_IDENTIFIED_FOR_CANONICAL_CONTRACT_AUDIT"
      ? "AUDIT_EXISTING_MATCHUP_SURFACES_AND_DEFINE_CANONICAL_MATCHUP_INTELLIGENCE_V1_CONTRACT"
      : decision === "MATCHUP_INTELLIGENCE_FOUNDATION_PRESENT_BUT_EXPLICIT_MATCHUP_SURFACE_MISSING"
        ? "DEFINE_CANONICAL_MATCHUP_INTELLIGENCE_V1_CONTRACT_FROM_EXISTING_FOUNDATIONS_WITHOUT_DUPLICATING_TEAM_INTELLIGENCE"
        : "RECONCILE_MISSING_MATCHUP_FOUNDATION_CAPABILITIES_BEFORE_CONTRACT_DESIGN",

  safeguards: {
    repositoryFilesMutated: false,
    matchupScoringExecuted: false,
    decisionModelMutated: false,
    pickemRepositoryMutated: false,
    databaseMutated: false,
    refSprint17CResumed: false
  }
}, null, 2));
