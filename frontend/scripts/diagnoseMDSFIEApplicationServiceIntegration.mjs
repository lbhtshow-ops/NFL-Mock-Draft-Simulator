import fs from "node:fs";
import path from "node:path";
import {
  createNFLTeamIntelligenceResult,
} from "../src/engines/teamIntelligence/NFLTeamIntelligenceResultContract.js";
import {
  createNFLMatchupIntelligenceResult,
} from "../src/engines/matchupIntelligence/NFLMatchupIntelligenceResultContract.js";
import {
  MDS_FIE_APPLICATION_SERVICE_BOUNDARY,
  createMDSFIEIntelligenceApplicationServiceResult,
  isMDSFIEIntelligenceApplicationServiceResult,
} from "../src/data/sportsIntelligence/services/MDSFIEIntelligenceApplicationService.js";

let passed = 0;
let failed = 0;

function check(name, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}`);
  }
}

const team = createNFLTeamIntelligenceResult({
  teamAbbreviation: "BAL",
  state: "AVAILABLE",
  overallStrength: 84,
  components: {
    offense: 81,
    defense: 88,
    quarterback: 85,
    availability: 76,
  },
  confidence: 0.91,
  confidenceKnown: true,
  evidenceCompleteness: 0.87,
  summary: "Canonical team test result",
});

const matchup = createNFLMatchupIntelligenceResult({
  gameId: "mds-app-service-contract-test",
  season: 2026,
  week: 1,
  awayTeam: "BAL",
  homeTeam: "CLE",
  state: "AVAILABLE",
  matchupEdge: -18,
  dimensions: {
    overallStrength: -14,
    quarterback: -9,
    availability: 4,
  },
  evidenceQuality: 0.83,
  evidenceQualityKnown: true,
  keyAdvantages: ["BAL_OVERALL_STRENGTH"],
});

const draftContext = {
  draftId: "diagnostic",
  pickNumber: 17,
  round: 1,
  selectingTeam: "BAL",
};

const result = createMDSFIEIntelligenceApplicationServiceResult({
  teamIntelligence: team,
  matchupIntelligence: matchup,
  draftContext,
});

check("application service result contract valid", isMDSFIEIntelligenceApplicationServiceResult(result));
check("canonical FIE remains producer", result.producer === "CANONICAL_FIE");
check("MDS remains consumer", result.consumer === "LBHT_MOCK_DRAFT_SIMULATOR");
check("team strength passed through unchanged", result.application?.fie?.teamIntelligence?.overallStrength === 84);
check("team availability passed through unchanged", result.application?.fie?.teamIntelligence?.components?.availability === 76);
check("team confidence passed through unchanged", result.application?.fie?.teamIntelligence?.confidence === 0.91);
check("matchup direction passed through unchanged", result.application?.fie?.matchupIntelligence?.matchupEdge === -18);
check("matchup availability dimension passed through unchanged", result.application?.fie?.matchupIntelligence?.dimensions?.availability === 4);
check("evidence quality passed through unchanged", result.application?.fie?.matchupIntelligence?.evidenceQuality === 0.83);
check("draft context preserved", result.application?.draftContext?.pickNumber === 17);
check("no calibrated win probability invented", result.application?.fie?.matchupIntelligence?.calibratedWinProbability === false);
check("no expected point margin invented", result.application?.fie?.matchupIntelligence?.expectedPointMargin === null);

check("FIE owns football reasoning", MDS_FIE_APPLICATION_SERVICE_BOUNDARY.footballReasoningOwner === "CANONICAL_FIE");
check("MDS owns draft simulation", MDS_FIE_APPLICATION_SERVICE_BOUNDARY.draftSimulationOwner === "LBHT_MOCK_DRAFT_SIMULATOR");
check("service cannot recompute team strength", MDS_FIE_APPLICATION_SERVICE_BOUNDARY.mayRecomputeTeamStrength === false);
check("service cannot recompute availability", MDS_FIE_APPLICATION_SERVICE_BOUNDARY.mayRecomputeAvailability === false);
check("service cannot recompute matchup direction", MDS_FIE_APPLICATION_SERVICE_BOUNDARY.mayRecomputeMatchupDirection === false);
check("service cannot mutate probability", MDS_FIE_APPLICATION_SERVICE_BOUNDARY.mayMutateDecisionProbability === false);
check("service cannot select draft prospect", MDS_FIE_APPLICATION_SERVICE_BOUNDARY.maySelectDraftProspect === false);
check("service cannot mutate draft runtime", MDS_FIE_APPLICATION_SERVICE_BOUNDARY.mayMutateDraftRuntime === false);

const sportsSource = fs.readFileSync(
  path.resolve("src/data/sportsIntelligence/SportsIntelligenceEngine.js"),
  "utf8"
);
const draftOpsSource = fs.readFileSync(
  path.resolve("src/components/draftOperations/DraftOperationsCenter.jsx"),
  "utf8"
);
const draftWireSource = fs.readFileSync(
  path.resolve("src/components/draftOperations/DraftWire.jsx"),
  "utf8"
);
const draftDecisionSource = fs.readFileSync(
  path.resolve("src/data/sportsIntelligence/draft/SportsDraftDecisionEngine.js"),
  "utf8"
);

check("SportsIntelligenceEngine imports application service", sportsSource.includes("MDSFIEIntelligenceApplicationService"));
check("SportsIntelligenceEngine exports FIE application resolver", sportsSource.includes("export function resolveSportsFIEApplicationContext"));
check("default SportsIntelligenceEngine API exposes FIE resolver", sportsSource.includes("resolveSportsFIEApplicationContext,"));
check("existing prospect resolver retained", sportsSource.includes("export function resolveSportsProspectIntelligence"));
check("existing team resolver retained", sportsSource.includes("export function resolveSportsTeamIntelligence"));
check("existing draft decision resolver retained", sportsSource.includes("export function resolveSportsDraftDecision"));
check("existing Draft Wire resolver retained", sportsSource.includes("export function resolveSportsDraftWire"));

check("DraftOperationsCenter not wired in Sprint 3", !draftOpsSource.includes("resolveSportsFIEApplicationContext"));
check("DraftWire component not wired in Sprint 3", !draftWireSource.includes("resolveSportsFIEApplicationContext"));
check("CPU decision engine not wired in Sprint 3", !draftDecisionSource.includes("resolveSportsFIEApplicationContext"));

console.log(`\nMDS/FIE Application Service Integration diagnostics: ${passed}/${passed + failed} passed; ${failed} failed.`);
if (failed) process.exit(1);
console.log("MDS_FIE_APPLICATION_SERVICE_INTEGRATED_SPORTS_INTELLIGENCE_BOUNDARY_READY");
