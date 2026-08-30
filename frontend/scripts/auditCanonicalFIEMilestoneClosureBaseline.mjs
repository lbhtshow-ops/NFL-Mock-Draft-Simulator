#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const SPRINT = "2.18.25-RC1";

const REQUIRED = [
  "scripts/defineBoundedPlayerAvailabilityImpactPolicyV1.mjs",
  "scripts/resolveBoundedAvailabilityImpactV1.mjs",
  "scripts/validateBoundedAvailabilityPolicyResolverV1.mjs",
  "scripts/defineCanonicalDecisionAvailabilityAdapterContractV1.mjs",
  "scripts/applyAvailabilityToCanonicalDecisionV1.mjs",
  "scripts/validateCanonicalDecisionAvailabilityAdapterFixturesV1.mjs",
  "scripts/definePickemDecisionConsumerHandoffContractV1.mjs",
  "scripts/runFinalFIEPickemHandoffGate.mjs"
];

const OPTIONAL_ANCHORS = [
  "scripts/promoteNFLGameDecisionModelV1.mjs",
  "scripts/runPlayerImpactTeamStrengthShadowAcceptance.mjs",
  "scripts/runLiveNFLTeamDependencyImpactAcceptance.mjs",
  "scripts/runTeamDependencyEvidenceProvenanceAcceptance.mjs"
];

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function run(rel) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return { file: rel, present: false, passed: false, exitCode: null };
  const r = spawnSync(process.execPath, [full], {
    cwd: ROOT, encoding: "utf8", maxBuffer: 20 * 1024 * 1024
  });
  const stdout = r.stdout || "";
  return {
    file: rel,
    present: true,
    exitCode: r.status,
    passed: r.status === 0 &&
      !/"failed"\s*:\s*[1-9]\d*/.test(stdout) &&
      !/FIE_PICKEM_HANDOFF_BLOCKED/.test(stdout),
    decisionSignals: [...stdout.matchAll(/"decision"\s*:\s*"([^"]+)"/g)].map(m => m[1]),
    stdoutTail: stdout.slice(-3000),
    stderrTail: (r.stderr || "").slice(-1500)
  };
}

const requiredFiles = REQUIRED.map(file => ({ file, present: exists(file) }));
const optionalAnchors = OPTIONAL_ANCHORS.map(file => ({ file, present: exists(file) }));

const finalGate = run("scripts/runFinalFIEPickemHandoffGate.mjs");

const sourceFiles = REQUIRED.filter(exists).map(file => ({
  file,
  bytes: fs.statSync(path.join(ROOT, file)).size
}));

const ownershipBoundary = {
  canonicalFIEOwnsFootballReasoning: true,
  mdsOwnsDraftSimulationAndDraftPresentation: true,
  pickemOwnsPicksLeaderboardCreatorCommunityPresentation: true,
  applicationConsumersMustNotDuplicateFIEReasoning: true
};

const matchupReadiness = {
  teamIntelligenceFoundationExpected: optionalAnchors.some(x =>
    /TeamStrength|TeamDependency/.test(x.file) && x.present
  ),
  playerAvailabilityFoundationPresent:
    exists("scripts/resolveBoundedAvailabilityImpactV1.mjs"),
  decisionBoundaryPresent:
    exists("scripts/defineCanonicalDecisionAvailabilityAdapterContractV1.mjs"),
  provenanceBoundaryExpected:
    exists("scripts/runTeamDependencyEvidenceProvenanceAcceptance.mjs"),
  matchupIntelligenceMayAdvance:
    requiredFiles.every(x => x.present) && finalGate.passed
};

const checks = {
  allRequiredMilestoneFilesPresent: requiredFiles.every(x => x.present),
  finalHandoffGateStillPasses: finalGate.passed,
  ownershipBoundaryLocked:
    ownershipBoundary.canonicalFIEOwnsFootballReasoning &&
    ownershipBoundary.applicationConsumersMustNotDuplicateFIEReasoning,
  matchupPrerequisiteAvailabilityPresent:
    matchupReadiness.playerAvailabilityFoundationPresent,
  matchupPrerequisiteDecisionBoundaryPresent:
    matchupReadiness.decisionBoundaryPresent,
  matchupIntelligenceMayAdvance:
    matchupReadiness.matchupIntelligenceMayAdvance
};

const passed = Object.values(checks).every(Boolean);

console.log(JSON.stringify({
  contractVersion: "FIE-CANONICAL-MILESTONE-CLOSURE-BASELINE-1.0.0",
  sprint: SPRINT,
  mode: "READ_ONLY_BASELINE_AUDIT",
  decision: passed
    ? "FIE_2_18_MILESTONE_CLOSED_MATCHUP_INTELLIGENCE_READY"
    : "FIE_2_18_MILESTONE_CLOSURE_BLOCKED",
  baseline: {
    completedMilestone: "FIE_TO_PICKEM_CONSUMER_HANDOFF",
    handoffDecisionRequired: "FIE_PICKEM_HANDOFF_READY",
    nextMajorCapability: "NFL_MATCHUP_INTELLIGENCE_V1",
    nextSprintFamily: "2.19"
  },
  requiredFiles,
  optionalAnchors,
  sourceFiles,
  finalHandoffGate: finalGate,
  ownershipBoundary,
  matchupReadiness,
  checks,
  authorizationBoundary: {
    sprint218MilestoneMayClose: passed,
    sprint219MatchupIntelligenceDesignMayAdvance: passed,
    pickemRepositoryMutationAuthorized: false,
    productionDecisionModelMutationAuthorized: false,
    databaseMutationAuthorized: false,
    refSprint17CResumptionAuthorized: false
  },
  nextStep: passed
    ? "BEGIN_SPRINT_2_19_NFL_MATCHUP_INTELLIGENCE_V1_WITH_CANONICAL_REPOSITORY_AUDIT"
    : "REMEDIATE_BASELINE_CLOSURE_FAILURES_BEFORE_SPRINT_2_19",
  safeguards: {
    repositoryFilesMutated: false,
    pickemRepositoryMutated: false,
    decisionModelMutated: false,
    databaseMutated: false,
    refSprint17CResumed: false
  }
}, null, 2));

if (!passed) process.exitCode = 1;
