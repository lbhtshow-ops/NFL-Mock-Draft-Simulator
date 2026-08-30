import fs from "node:fs";
import path from "node:path";
import {
  createNFLTeamIntelligenceResult,
} from "../src/engines/teamIntelligence/NFLTeamIntelligenceResultContract.js";
import {
  createMDSFIEIntelligenceApplicationServiceResult,
} from "../src/data/sportsIntelligence/services/MDSFIEIntelligenceApplicationService.js";
import {
  resolveDraftWireItems,
} from "../src/data/sportsIntelligence/draft/DraftWireEngine.js";

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

const canonical = createNFLTeamIntelligenceResult({
  teamAbbreviation: "BAL",
  state: "AVAILABLE",
  overallStrength: 84,
  confidence: 0.91,
  confidenceKnown: true,
  evidenceCompleteness: 0.87,
  summary: "Canonical Ravens team context",
  explanation: { limitingFactors: ["Diagnostic limitation"] },
});

const fieApplicationContext = createMDSFIEIntelligenceApplicationServiceResult({
  teamIntelligence: canonical,
  draftContext: {
    pickNumber: 17,
    round: 1,
    selectingTeam: "BAL",
  },
});

const wire = resolveDraftWireItems({
  draft: { year: 2027 },
  currentTeam: { id: 1, name: "Baltimore Ravens" },
  currentPick: { id: 17, draft_pick: { pick_number: 17, round: 1 } },
  cpuDecision: {
    available: true,
    recommendation: {
      playerId: 100,
      name: "Diagnostic Prospect",
      position: "EDGE",
      confidence: 82,
    },
  },
  fieApplicationContext,
  queueCount: 2,
  includeLbhtPromos: false,
});

const canonicalWireItem = wire.items.find((item) => item.label === "Canonical FIE");

check("Draft Wire remains available", wire.available === true);
check("Draft Wire receives canonical FIE context", wire.policy?.canonicalFIEContextPassedThrough === true);
check("Draft Wire does not recompute canonical reasoning", wire.policy?.canonicalFIEReasoningRecomputedHere === false);
check("Draft Wire emits canonical FIE item", Boolean(canonicalWireItem));
check("canonical Draft Wire item preserves team abbreviation", canonicalWireItem?.headline?.includes("BAL"));
check("canonical Draft Wire item preserves canonical state", canonicalWireItem?.headline?.includes("AVAILABLE"));
check("canonical Draft Wire item passes through team strength", canonicalWireItem?.detail?.includes("84"));
check("canonical Draft Wire item passes through evidence completeness", canonicalWireItem?.detail?.includes("87%"));
check("canonical Draft Wire item passes through canonical summary", canonicalWireItem?.detail?.includes("Canonical Ravens team context"));
check("canonical Draft Wire item attributes FIE", canonicalWireItem?.attribution === "LBHT Football Intelligence Engine");
check("existing CPU recommendation Draft Wire item retained", wire.items.some((item) => item.headline?.includes("Diagnostic Prospect")));
check("existing queue Draft Wire item retained", wire.items.some((item) => item.headline?.includes("2 prospects")));

const sportsSource = fs.readFileSync(
  path.resolve("src/data/sportsIntelligence/SportsIntelligenceEngine.js"),
  "utf8"
);
const decisionSource = fs.readFileSync(
  path.resolve("src/data/sportsIntelligence/draft/SportsDraftDecisionEngine.js"),
  "utf8"
);
const wireSource = fs.readFileSync(
  path.resolve("src/data/sportsIntelligence/draft/DraftWireEngine.js"),
  "utf8"
);
const opsSource = fs.readFileSync(
  path.resolve("src/components/draftOperations/DraftOperationsCenter.jsx"),
  "utf8"
);
const draftPageSource = fs.readFileSync(
  path.resolve("src/pages/Draft.jsx"),
  "utf8"
);

check("SportsIntelligenceEngine builds canonical FIE context for CPU support", sportsSource.includes("const canonicalTeamIntelligence = resolveSportsCanonicalNFLTeamIntelligence(team)"));
check("SportsIntelligenceEngine passes FIE context into decision engine", sportsSource.includes("fieApplicationContext,"));
check("CPU decision engine accepts FIE application context", decisionSource.includes("fieApplicationContext = null"));
check("CPU decision output exposes canonical FIE context", decisionSource.includes("canonicalFIE:"));
check("CPU decision declares FIE context-only influence", decisionSource.includes("CONTEXT_ONLY_NO_PROSPECT_SELECTION"));
check("CPU decision preserves canonical FIE ownership", decisionSource.includes('canonicalFIEFootballReasoningOwner: "CANONICAL_FIE"'));
check("CPU decision preserves MDS draft-selection ownership", decisionSource.includes('mdsDraftSelectionOwner: "LBHT_MOCK_DRAFT_SIMULATOR"'));
check("CPU decision explicitly says FIE not used for prospect ranking", decisionSource.includes("canonicalFIEUsedForProspectRanking: false"));
check("CPU decision still uses existing MDS DraftBoardEngine", decisionSource.includes("buildTeamDraftBoard"));
check("CPU decision selected prospect still comes from MDS board", decisionSource.includes("const selected = board[0] || null"));
check("Draft.jsx still selects recommendation returned by MDS decision support", draftPageSource.includes("draftDecision?.recommendation?.player || null"));
check("DraftOperationsCenter passes FIE context to Draft Wire", opsSource.includes("fieApplicationContext,"));
check("Draft Wire engine consumes FIE application context", wireSource.includes("fieApplicationContext"));
check("Draft Wire does not import canonical FIE engine directly", !wireSource.includes("CanonicalNFLTeamIntelligenceEngine"));
check("Draft Wire does not import Pick'em logic", !wireSource.toLowerCase().includes("pickem"));
check("CPU decision engine does not import canonical FIE engine directly", !decisionSource.includes("CanonicalNFLTeamIntelligenceEngine"));
check("CPU decision engine does not import Pick'em logic", !decisionSource.toLowerCase().includes("pickem"));
check("CPU decision engine does not mutate calibrated win probability", !decisionSource.includes("calibratedWinProbability"));
check("CPU decision engine does not add predicted winner logic", !decisionSource.includes("predictedWinner"));
check("Draft Wire does not add predicted winner logic", !wireSource.includes("predictedWinner"));

console.log(`\nMDS/FIE Draft Wire + CPU Decision Support Integration diagnostics: ${passed}/${passed + failed} passed; ${failed} failed.`);
if (failed) process.exit(1);
console.log("MDS_FIE_DRAFT_WIRE_CPU_DECISION_SUPPORT_INTEGRATED_READY");
