import fs from "node:fs";
import path from "node:path";

import {
  resolveNFLPlayerTeamDependencyEvidence,
} from "../src/engines/teamIntelligence/dependency/NFLPlayerTeamDependencyIntelligence.js";

import {
  assessNFLTeamDependencyCalibrationReadiness,
} from "../src/engines/teamIntelligence/dependency/NFLTeamDependencyCalibrationReadiness.js";

const dependency = resolveNFLPlayerTeamDependencyEvidence({
  targetSeason: 2026,
  week: 1,
  team: "BAL",
  playerId: "00-0034796",
  playerName: "Lamar Jackson",
  position: "QB",
  usageEvidence: {
    season: 2025,
    gamesTracked: 13,
    usage: {
      offenseSnapPct: 0.9223076923076925,
      defenseSnapPct: 0,
      specialTeamsSnapPct: 0,
    },
    provenance: {
      source: "generatedNFLVerseSnapCountsSource",
    },
  },
});

const reportPath = path.resolve(
  process.cwd(),
  "data/calibration/historical/v1/expected-replacement-mapping-v1-report.json"
);

const report = fs.existsSync(reportPath)
  ? JSON.parse(fs.readFileSync(reportPath, "utf8"))
  : null;

const readiness = report
  ? assessNFLTeamDependencyCalibrationReadiness(report)
  : null;

const pass =
  dependency?.evidenceState?.teamPerformanceRecordAvailable === true &&
  dependency?.evidenceState?.teamPerformanceContractValid === true &&
  dependency?.sample?.teamPerformanceAvailable === true &&
  dependency?.components?.teamPerformanceUsedInDependencyScore === false &&
  dependency?.provenance?.evidenceRefs?.includes(
    "nfl-team-performance:2025:BAL"
  ) &&
  readiness?.productionPromotionAuthorized === false;

console.log(JSON.stringify({
  acceptance:
    "TEAM_DEPENDENCY_EVIDENCE_PROVENANCE_HARDENING",
  mode: "READ_ONLY",
  status: pass ? "PASS" : "FAIL",
  dependency,
  calibrationReadiness: readiness,
  interpretation: {
    semanticMismatchCorrected:
      dependency?.sample?.teamPerformanceAvailable === true,
    teamPerformanceContextAvailable:
      dependency?.evidenceState?.teamPerformanceContractValid === true,
    teamPerformanceUsedInDependencyScore:
      dependency?.components?.teamPerformanceUsedInDependencyScore,
    provisionalShadowUseAllowed:
      dependency?.dependency !== "UNKNOWN",
    productionCalibrationAuthorized:
      readiness?.productionPromotionAuthorized ?? false,
  },
  safeguards: {
    databaseMutationMethodsInvoked: false,
    calibrationExecutedByThisAcceptance: false,
    learnedWeightsCreated: false,
    historicalReplacementMappingMutated: false,
    rosterOrderHeuristicIntroduced: false,
    predictionScoringInvoked: false,
    pickemDecisionModelMutated: false,
  },
}, null, 2));

if (!pass) process.exitCode = 1;
