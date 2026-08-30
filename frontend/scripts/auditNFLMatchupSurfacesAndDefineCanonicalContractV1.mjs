#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SPRINT = "2.19-RC2";

const SURFACES = Object.freeze({
  opponentAdjustment: [
    "src/data/footballIntelligence/nfl/performance/NFLOpponentAdjustmentEngine.js"
  ],
  historicalReplay: [
    "src/engines/gameDecisionSupport/NFLHistoricalReplayTeamStrength.js"
  ],
  performance: [
    "src/data/footballIntelligence/nfl/performance/NFLTeamPerformanceEvidenceRegistry.js",
    "src/data/footballIntelligence/nfl/performance/NFLTeamPerformanceEvidenceContract.js"
  ],
  teamStrength: [
    "src/engines/teamIntelligence/strength/integration/NFLPlayerImpactTeamStrengthShadowIntegration.js",
    "src/engines/teamIntelligence/NFLTeamPriorAndStrengthEngine.js"
  ],
  dependency: [
    "src/engines/teamIntelligence/dependency/NFLPlayerTeamDependencyIntelligence.js",
    "src/engines/teamIntelligence/dependency/NFLTeamDependencyEvidenceContract.js"
  ],
  availability: [
    "src/engines/playerAvailability/contracts/CanonicalPlayerAvailabilityImpactContract.js",
    "src/engines/playerAvailability/contracts/PlayerAvailabilityImpactContextContract.js",
    "src/engines/playerAvailability/CanonicalPlayerAvailabilityImpactService.js"
  ]
});

const TOKENS = Object.freeze({
  opponentAdjustment: ["opponentAdjusted","opponent","adjust"],
  performance: ["epa","successRate","performanceEvidence"],
  offenseDefense: ["offense","offensive","defense","defensive"],
  teamStrength: ["teamStrength","strength"],
  dependency: ["dependency","quarterback","starter"],
  availability: ["availability","playerImpact","injury"],
  provenance: ["provenance","provider","source"],
  confidence: ["confidence"]
});

function normalize(rel) {
  return rel.replaceAll("/", path.sep);
}
function exists(rel) {
  return fs.existsSync(path.join(ROOT, normalize(rel)));
}
function read(rel) {
  try { return fs.readFileSync(path.join(ROOT, normalize(rel)), "utf8"); }
  catch { return ""; }
}
function imports(text) {
  const result = new Set();
  for (const re of [
    /from\s+["']([^"']+)["']/g,
    /import\s*\(\s*["']([^"']+)["']\s*\)/g,
    /require\(\s*["']([^"']+)["']\s*\)/g
  ]) {
    let m;
    while ((m = re.exec(text))) result.add(m[1]);
  }
  return [...result];
}
function exports(text) {
  const names = new Set();
  for (const re of [
    /export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g,
    /export\s+(?:const|let|var|class)\s+([A-Za-z_$][\w$]*)/g,
    /export\s*\{([^}]+)\}/g
  ]) {
    let m;
    while ((m = re.exec(text))) {
      if (m[1]?.includes(",")) {
        for (const x of m[1].split(",")) names.add(x.trim().split(/\s+as\s+/)[1] || x.trim().split(/\s+as\s+/)[0]);
      } else if (m[1]) names.add(m[1].trim());
    }
  }
  return [...names].filter(Boolean);
}
function tokenHits(text) {
  const low = text.toLowerCase();
  return Object.fromEntries(Object.entries(TOKENS).map(([k,v]) => [
    k, v.filter(t => low.includes(t.toLowerCase()))
  ]));
}

const inspected = [];
for (const [role, files] of Object.entries(SURFACES)) {
  for (const file of files) {
    const present = exists(file);
    const text = present ? read(file) : "";
    inspected.push({
      role, file, present,
      imports: present ? imports(text) : [],
      exports: present ? exports(text) : [],
      tokens: present ? tokenHits(text) : {}
    });
  }
}

const present = inspected.filter(x => x.present);
const allText = present.map(x => read(x.file)).join("\n");

const capability = {};
for (const [name, tokens] of Object.entries(TOKENS)) {
  capability[name] = tokens.some(t => allText.toLowerCase().includes(t.toLowerCase()));
}

const reusable = {
  opponentAdjustmentEnginePresent:
    inspected.some(x => x.role === "opponentAdjustment" && x.present),
  historicalReplayConsumerPresent:
    inspected.some(x => x.role === "historicalReplay" && x.present),
  performanceEvidenceSurfacePresent:
    inspected.some(x => x.role === "performance" && x.present),
  teamStrengthSurfacePresent:
    inspected.some(x => x.role === "teamStrength" && x.present),
  dependencySurfacePresent:
    inspected.some(x => x.role === "dependency" && x.present),
  availabilitySurfacePresent:
    inspected.some(x => x.role === "availability" && x.present)
};

const contract = {
  contractVersion: "FIE-NFL-MATCHUP-INTELLIGENCE-V1-CONTRACT-0.1.0",
  status: "DESIGN_BASELINE_NOT_RUNTIME_IMPLEMENTATION",
  owner: "CANONICAL_FIE",
  purpose: "Compose existing canonical team, performance, opponent, dependency, availability, provenance and confidence intelligence into a single matchup-level reasoning boundary.",
  identity: {
    required: ["season","week","gameId","homeTeam","awayTeam"],
    gameTypeOptional: true,
    kickoffTimeOptionalAtContractBaseline: true
  },
  inputs: {
    teamContext: {
      home: "CANONICAL_TEAM_INTELLIGENCE_OR_TEAM_STRENGTH_INPUT",
      away: "CANONICAL_TEAM_INTELLIGENCE_OR_TEAM_STRENGTH_INPUT"
    },
    performanceEvidence: {
      home: "CANONICAL_TEAM_PERFORMANCE_EVIDENCE",
      away: "CANONICAL_TEAM_PERFORMANCE_EVIDENCE",
      opponentAdjustment: "CANONICAL_NFL_OPPONENT_ADJUSTMENT"
    },
    dependencyState: {
      home: "CANONICAL_TEAM_DEPENDENCY_CONTEXT",
      away: "CANONICAL_TEAM_DEPENDENCY_CONTEXT"
    },
    availabilityImpact: {
      home: "CANONICAL_PLAYER_AVAILABILITY_IMPACT",
      away: "CANONICAL_PLAYER_AVAILABILITY_IMPACT"
    }
  },
  outputs: {
    matchupId: "STABLE_GAME_SCOPED_ID",
    homeTeam: "TEAM_CODE",
    awayTeam: "TEAM_CODE",
    dimensions: [
      "TEAM_STRENGTH_CONTEXT",
      "OFFENSE_VS_DEFENSE",
      "DEFENSE_VS_OFFENSE",
      "OPPONENT_ADJUSTED_PERFORMANCE",
      "QB_AND_DEPENDENCY_CONTEXT",
      "PLAYER_AVAILABILITY_IMPACT"
    ],
    directionalAssessment: "HOME_EDGE_AWAY_EDGE_NEUTRAL_OR_INSUFFICIENT_EVIDENCE",
    confidence: "FIRST_CLASS_OUTPUT",
    provenance: "FIRST_CLASS_OUTPUT",
    evidenceCompleteness: "FIRST_CLASS_OUTPUT",
    decisionSupportProjection: "ADDITIVE_HANDOFF_ONLY_NOT_A_SECOND_DECISION_MODEL"
  },
  rules: {
    noApplicationLevelMatchupReasoning: true,
    noDuplicateTeamStrengthEngine: true,
    noDuplicateOpponentAdjustmentEngine: true,
    noDuplicateAvailabilityResolver: true,
    noOutcomeLeakage: true,
    missingEvidenceMustFailNeutralOrDegradeConfidence: true,
    provenanceMustRemainInspectable: true,
    confidenceMustReflectEvidenceQuality: true,
    matchupOutputMustNotApplyDecisionProbabilityAdjustmentTwice: true
  }
};

const checks = {
  opponentAdjustmentReusable: reusable.opponentAdjustmentEnginePresent,
  performanceEvidenceReusable: reusable.performanceEvidenceSurfacePresent,
  teamStrengthReusable: reusable.teamStrengthSurfacePresent,
  dependencyReusable: reusable.dependencySurfacePresent,
  availabilityReusable: reusable.availabilitySurfacePresent,
  offenseDefenseSignalsObserved: capability.offenseDefense,
  provenanceSignalsObserved: capability.provenance,
  confidenceSignalsObserved: capability.confidence,
  canonicalContractBaselineDefined: true,
  duplicateReasoningProhibited: contract.rules.noApplicationLevelMatchupReasoning,
  doubleCountingProhibited: contract.rules.matchupOutputMustNotApplyDecisionProbabilityAdjustmentTwice
};

const coreReusable = [
  checks.opponentAdjustmentReusable,
  checks.performanceEvidenceReusable,
  checks.teamStrengthReusable,
  checks.dependencyReusable,
  checks.availabilityReusable
].every(Boolean);

const decision = coreReusable
  ? "CANONICAL_MATCHUP_INTELLIGENCE_V1_CONTRACT_BASELINE_DEFINED_FROM_EXISTING_FIE_SURFACES"
  : "MATCHUP_CONTRACT_BASELINE_BLOCKED_BY_MISSING_CANONICAL_SURFACES";

console.log(JSON.stringify({
  contractVersion: "FIE-NFL-MATCHUP-SURFACE-AUDIT-AND-CONTRACT-BASELINE-1.0.0",
  sprint: SPRINT,
  mode: "READ_ONLY_SURFACE_AUDIT_AND_CONTRACT_DESIGN",
  decision,
  inspectedSurfaces: inspected,
  reusable,
  observedCapabilitySignals: capability,
  canonicalMatchupIntelligenceContractV1: contract,
  checks,
  authorizationBoundary: {
    surfaceAuditComplete: true,
    canonicalMatchupContractBaselineDefined: coreReusable,
    runtimeCompositionDesignMayAdvance: coreReusable,
    runtimeImplementationAuthorized: false,
    matchupScoringAuthorized: false,
    productionDecisionModelMutationAuthorized: false,
    pickemRepositoryMutationAuthorized: false,
    databaseMutationAuthorized: false,
    refSprint17CResumptionAuthorized: false
  },
  nextStep: coreReusable
    ? "DEFINE_CANONICAL_MATCHUP_RUNTIME_COMPOSITION_AND_FIXTURE_GATES_WITHOUT_DUPLICATING_EXISTING_ENGINES"
    : "RECONCILE_MISSING_CANONICAL_MATCHUP_INPUT_SURFACES",
  safeguards: {
    repositoryFilesMutated: false,
    runtimeCompositionExecuted: false,
    matchupScoringExecuted: false,
    decisionModelMutated: false,
    pickemRepositoryMutated: false,
    databaseMutated: false
  }
}, null, 2));

if (!coreReusable) process.exitCode = 1;
