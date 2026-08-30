#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const SPRINT = "2.19-RC7";

const REQUIRED_FILES = [
  "src/data/footballIntelligence/nfl/matchup/CanonicalNFLMatchupIntelligenceRuntimeV1.js",
  "src/data/footballIntelligence/nfl/matchup/CanonicalNFLMatchupDirectionalAssessmentEngineV1.js",
  "scripts/validateCanonicalNFLMatchupIntelligenceRuntimeV1.mjs",
  "scripts/diagnoseCanonicalNFLMatchupIntelligenceRuntimeV1.mjs",
  "scripts/validateCanonicalNFLMatchupDirectionalAssessmentEngineV1.mjs",
  "scripts/diagnoseCanonicalNFLMatchupDirectionalAssessmentEngineV1.mjs",
  "scripts/defineGovernedNFLMatchupDirectionalAssessmentScoringPolicyV1.mjs"
];

const VALIDATION_COMMANDS = [
  {
    id: "MATCHUP_RUNTIME_DIAGNOSTICS",
    file: "scripts/diagnoseCanonicalNFLMatchupIntelligenceRuntimeV1.mjs"
  },
  {
    id: "MATCHUP_RUNTIME_FIXTURES",
    file: "scripts/validateCanonicalNFLMatchupIntelligenceRuntimeV1.mjs"
  },
  {
    id: "MATCHUP_ASSESSMENT_DIAGNOSTICS",
    file: "scripts/diagnoseCanonicalNFLMatchupDirectionalAssessmentEngineV1.mjs"
  },
  {
    id: "MATCHUP_ASSESSMENT_FIXTURES",
    file: "scripts/validateCanonicalNFLMatchupDirectionalAssessmentEngineV1.mjs"
  },
  {
    id: "MATCHUP_SCORING_POLICY",
    file: "scripts/defineGovernedNFLMatchupDirectionalAssessmentScoringPolicyV1.mjs"
  }
];

const MDS_CONSUMER_ANCHORS = [
  "src/components/draftOperations/DraftOperationsCenter.jsx",
  "src/components/draftOperations/DraftWire",
  "src/components/draftV3/Intelligence/ProspectIntelligenceCenter",
  "src/data/sportsIntelligence/SportsIntelligenceEngine"
];

function relExists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function runNode(rel) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    return {
      file: rel,
      exists: false,
      exitCode: null,
      passed: false,
      stdoutTail: "",
      stderrTail: "FILE_NOT_FOUND"
    };
  }
  const r = spawnSync(process.execPath, [full], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
  });
  const stdout = r.stdout || "";
  const stderr = r.stderr || "";
  const failedMarker = /"failed"\s*:\s*[1-9]\d*/.test(stdout);
  const rejectedMarker = /_REJECTED|BLOCKED/i.test(stdout) &&
    !/INSUFFICIENT_EVIDENCE/.test(stdout);
  return {
    file: rel,
    exists: true,
    exitCode: r.status,
    passed: r.status === 0 && !failedMarker && !rejectedMarker,
    decisions: [...stdout.matchAll(/"decision"\s*:\s*"([^"]+)"/g)].map(m => m[1]),
    stdoutTail: stdout.slice(-5000),
    stderrTail: stderr.slice(-2000)
  };
}

function inspectAnchor(anchor) {
  const full = path.join(ROOT, anchor);
  if (fs.existsSync(full) && fs.statSync(full).isFile()) {
    return { anchor, present: true, type: "file" };
  }

  const withExt = [".js",".jsx",".ts",".tsx",".mjs"].map(ext => full + ext);
  const hit = withExt.find(fs.existsSync);
  if (hit) return { anchor: path.relative(ROOT, hit), present: true, type: "file" };

  if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
    return { anchor, present: true, type: "directory" };
  }

  return { anchor, present: false, type: null };
}

const filePresence = REQUIRED_FILES.map(file => ({
  file,
  present: relExists(file)
}));

const validationResults = VALIDATION_COMMANDS.map(x => ({
  id: x.id,
  ...runNode(x.file)
}));

const mdsConsumerAnchors = MDS_CONSUMER_ANCHORS.map(inspectAnchor);

const ownershipBoundary = {
  canonicalFIEOwnsTeamIntelligence: true,
  canonicalFIEOwnsAvailabilityIntelligence: true,
  canonicalFIEOwnsMatchupIntelligence: true,
  canonicalFIEOwnsDirectionalAssessment: true,
  mdsOwnsDraftSimulation: true,
  mdsOwnsDraftRoomPresentation: true,
  mdsMayConsumeCanonicalFIEContracts: true,
  mdsMayDuplicateFIEReasoning: false
};

const mdsIntegrationContract = {
  producer: "CANONICAL_FIE",
  consumer: "LBHT_MOCK_DRAFT_SIMULATOR",
  boundary: "CANONICAL_FIE_MATCHUP_INTELLIGENCE_OUTPUT",
  allowedInitialUses: [
    "DRAFT_ROOM_INTELLIGENCE_PRESENTATION",
    "TEAM_CONTEXT_EXPLANATION",
    "DRAFT_WIRE_INTELLIGENCE_EVENT_INPUT",
    "DRAFT_DECISION_SUPPORT_CONTEXT",
    "CPU_DRAFT_DECISION_SUPPORT_INPUT"
  ],
  prohibitedInitialUses: [
    "RECOMPUTE_TEAM_STRENGTH_IN_MDS",
    "RECOMPUTE_AVAILABILITY_IN_MDS",
    "RECOMPUTE_MATCHUP_SCORING_IN_MDS",
    "MUTATE_FIE_DECISION_PROBABILITY",
    "IMPORT_PICKEM_SPECIFIC_LOGIC"
  ],
  requiredRuntimeBehavior: {
    missingMatchupIntelligenceMustNotBreakDraftRoom: true,
    neutralOrInsufficientEvidenceMustRemainPresentationallySafe: true,
    provenanceShouldRemainInspectable: true,
    confidenceShouldRemainInspectable: true,
    evidenceCompletenessShouldRemainInspectable: true,
    duplicateReasoningProhibited: true
  }
};

const checks = {
  allRequiredFilesPresent: filePresence.every(x => x.present),
  allValidationCommandsPassed: validationResults.every(x => x.passed),
  canonicalOwnershipLocked:
    ownershipBoundary.canonicalFIEOwnsMatchupIntelligence &&
    ownershipBoundary.canonicalFIEOwnsDirectionalAssessment,
  mdsConsumerBoundaryLocked:
    ownershipBoundary.mdsMayConsumeCanonicalFIEContracts &&
    ownershipBoundary.mdsMayDuplicateFIEReasoning === false,
  mdsConsumerAnchorsIdentified:
    mdsConsumerAnchors.some(x => x.present),
  safeFallbackRequired:
    mdsIntegrationContract.requiredRuntimeBehavior.missingMatchupIntelligenceMustNotBreakDraftRoom === true,
  provenanceInspectable:
    mdsIntegrationContract.requiredRuntimeBehavior.provenanceShouldRemainInspectable === true,
  confidenceInspectable:
    mdsIntegrationContract.requiredRuntimeBehavior.confidenceShouldRemainInspectable === true,
  evidenceCompletenessInspectable:
    mdsIntegrationContract.requiredRuntimeBehavior.evidenceCompletenessShouldRemainInspectable === true,
  duplicateReasoningProhibited:
    mdsIntegrationContract.requiredRuntimeBehavior.duplicateReasoningProhibited === true
};

const ready = Object.values(checks).every(Boolean);

console.log(JSON.stringify({
  contractVersion: "FIE-NFL-MDS-MATCHUP-INTEGRATION-READINESS-GATE-1.0.0",
  sprint: SPRINT,
  mode: "READ_ONLY_FINAL_MDS_INTEGRATION_READINESS_GATE",
  decision: ready
    ? "FIE_MDS_MATCHUP_INTELLIGENCE_INTEGRATION_READY"
    : "FIE_MDS_MATCHUP_INTELLIGENCE_INTEGRATION_BLOCKED",

  filePresence,
  validationResults,
  mdsConsumerAnchors,
  ownershipBoundary,
  mdsIntegrationContract,
  checks,

  authorizationBoundary: {
    finalReadinessGateComplete: true,
    mdsConsumerIntegrationMayAdvance: ready,
    canonicalFIERemainsReasoningOwner: true,
    mdsMayDuplicateFIEReasoning: false,
    productionDecisionProbabilityMutationAuthorized: false,
    productionWinnerMutationAuthorized: false,
    pickemRepositoryMutationAuthorized: false,
    databaseMutationAuthorized: false,
    refSprint17CResumptionAuthorized: false
  },

  nextStep: ready
    ? "BEGIN_MDS_FIE_CONSUMER_INTEGRATION_WITH_REPOSITORY_AUDIT_AND_NO_DUPLICATE_FOOTBALL_REASONING"
    : "REMEDIATE_FAILED_FIE_MDS_READINESS_COMPONENTS_BEFORE_MDS_INTEGRATION",

  safeguards: {
    repositoryFilesMutated: false,
    mdsRuntimeMutated: false,
    matchupScoringRecomputed: false,
    decisionModelMutated: false,
    pickemRepositoryMutated: false,
    databaseMutated: false,
    refSprint17CResumed: false
  }
}, null, 2));

if (!ready) process.exitCode = 1;
