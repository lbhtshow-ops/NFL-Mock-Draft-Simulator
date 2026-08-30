import fs from "node:fs";
import path from "node:path";
import { createNFLTeamIntelligenceResult } from "../src/engines/teamIntelligence/NFLTeamIntelligenceResultContract.js";
import {
  createMDSFIEConsumerEnvelope,
  MDS_FIE_CONSUMER_OWNERSHIP,
} from "../src/data/sportsIntelligence/adapters/MDSFIEConsumerAdapterContract.js";
import { createMDSIntelligenceApplicationContext } from "../src/data/sportsIntelligence/contracts/MDSIntelligenceApplicationContract.js";
import {
  createMDSFIEIntelligenceApplicationServiceResult,
  isMDSFIEIntelligenceApplicationServiceResult,
  MDS_FIE_APPLICATION_SERVICE_BOUNDARY,
} from "../src/data/sportsIntelligence/services/MDSFIEIntelligenceApplicationService.js";
import { resolveDraftWireItems } from "../src/data/sportsIntelligence/draft/DraftWireEngine.js";

let passed = 0;
let failed = 0;
function check(name, condition) {
  if (condition) { passed++; console.log(`PASS ${name}`); }
  else { failed++; console.error(`FAIL ${name}`); }
}

const team = createNFLTeamIntelligenceResult({
  teamAbbreviation: "BAL",
  state: "AVAILABLE",
  overallStrength: 84,
  components: { offense: 81, defense: 88, quarterback: 85, availability: 76 },
  confidence: 0.91,
  confidenceKnown: true,
  evidenceCompleteness: 0.87,
  summary: "Sprint 6 canonical team intelligence",
  explanation: { limitingFactors: ["Diagnostic fixture"] },
  sources: [{ provider: "LBHT_DIAGNOSTIC" }],
});

const envelope = createMDSFIEConsumerEnvelope({ teamIntelligence: team });
const app = createMDSIntelligenceApplicationContext({
  fie: envelope,
  draftContext: { draftId: "sprint-6", draftYear: 2027, pickNumber: 17, round: 1, selectingTeam: "BAL" },
});
const service = createMDSFIEIntelligenceApplicationServiceResult({
  teamIntelligence: team,
  draftContext: app.draftContext,
});

check("canonical team contract valid", team.contract === "NFLTeamIntelligenceResult");
check("adapter producer is canonical FIE", envelope.producer === "CANONICAL_FIE");
check("adapter consumer is MDS", envelope.consumer === "LBHT_MOCK_DRAFT_SIMULATOR");
check("adapter preserves team strength", envelope.teamIntelligence?.overallStrength === 84);
check("adapter preserves availability", envelope.teamIntelligence?.components?.availability === 76);
check("adapter preserves confidence", envelope.teamIntelligence?.confidence === 0.91);
check("adapter preserves evidence completeness", envelope.teamIntelligence?.evidenceCompleteness === 0.87);
check("application preserves FIE envelope", app.fie === envelope);
check("application preserves draft context", app.draftContext?.pickNumber === 17);
check("application service validates", isMDSFIEIntelligenceApplicationServiceResult(service));
check("service preserves team strength", service.application?.fie?.teamIntelligence?.overallStrength === 84);
check("service preserves availability", service.application?.fie?.teamIntelligence?.components?.availability === 76);
check("service preserves summary", service.application?.fie?.teamIntelligence?.summary === team.summary);
check("service does not invent matchup", service.application?.fie?.matchupIntelligence === null);

check("adapter football reasoning owner remains FIE", MDS_FIE_CONSUMER_OWNERSHIP.footballReasoningOwner === "CANONICAL_FIE");
check("adapter draft simulation owner remains MDS", MDS_FIE_CONSUMER_OWNERSHIP.draftSimulationOwner === "LBHT_MOCK_DRAFT_SIMULATOR");
check("adapter cannot recompute team strength", MDS_FIE_CONSUMER_OWNERSHIP.adapterMayRecomputeTeamStrength === false);
check("adapter cannot recompute availability", MDS_FIE_CONSUMER_OWNERSHIP.adapterMayRecomputeAvailability === false);
check("adapter cannot recompute matchup direction", MDS_FIE_CONSUMER_OWNERSHIP.adapterMayRecomputeMatchupDirection === false);
check("adapter cannot mutate probability", MDS_FIE_CONSUMER_OWNERSHIP.adapterMayMutateDecisionProbability === false);
check("adapter cannot select prospect", MDS_FIE_CONSUMER_OWNERSHIP.adapterMaySelectDraftProspect === false);
check("service football reasoning owner remains FIE", MDS_FIE_APPLICATION_SERVICE_BOUNDARY.footballReasoningOwner === "CANONICAL_FIE");
check("service draft simulation owner remains MDS", MDS_FIE_APPLICATION_SERVICE_BOUNDARY.draftSimulationOwner === "LBHT_MOCK_DRAFT_SIMULATOR");
check("service cannot select prospect", MDS_FIE_APPLICATION_SERVICE_BOUNDARY.maySelectDraftProspect === false);
check("service cannot mutate draft runtime", MDS_FIE_APPLICATION_SERVICE_BOUNDARY.mayMutateDraftRuntime === false);

const cpuFixture = {
  available: true,
  recommendation: { playerId: 101, name: "Prospect Alpha", position: "EDGE", confidence: 82 },
};
const wire = resolveDraftWireItems({
  draft: { id: "sprint-6", year: 2027 },
  currentTeam: { id: 1, name: "Baltimore Ravens" },
  currentPick: { id: 17, draft_pick: { pick_number: 17, round: 1 } },
  cpuDecision: cpuFixture,
  fieApplicationContext: service,
  queueCount: 2,
  includeLbhtPromos: false,
});
const fieItem = wire.items.find((item) => item.label === "Canonical FIE");

check("Draft Wire available", wire.available === true);
check("Draft Wire receives FIE context", wire.policy?.canonicalFIEContextPassedThrough === true);
check("Draft Wire does not recompute FIE", wire.policy?.canonicalFIEReasoningRecomputedHere === false);
check("Draft Wire publishes FIE item", Boolean(fieItem));
check("Draft Wire preserves state", fieItem?.headline?.includes("AVAILABLE"));
check("Draft Wire preserves strength", fieItem?.detail?.includes("84"));
check("Draft Wire preserves evidence completeness", fieItem?.detail?.includes("87%"));
check("Draft Wire preserves summary", fieItem?.detail?.includes(team.summary));
check("Draft Wire retains CPU recommendation", wire.items.some((item) => item.headline?.includes("Prospect Alpha")));
check("Draft Wire retains queue context", wire.items.some((item) => item.headline?.includes("2 prospects")));

const src = {
  sports: fs.readFileSync(path.resolve("src/data/sportsIntelligence/SportsIntelligenceEngine.js"), "utf8"),
  decision: fs.readFileSync(path.resolve("src/data/sportsIntelligence/draft/SportsDraftDecisionEngine.js"), "utf8"),
  wire: fs.readFileSync(path.resolve("src/data/sportsIntelligence/draft/DraftWireEngine.js"), "utf8"),
  ops: fs.readFileSync(path.resolve("src/components/draftOperations/DraftOperationsCenter.jsx"), "utf8"),
  draft: fs.readFileSync(path.resolve("src/pages/Draft.jsx"), "utf8"),
};

check("SportsIntelligenceEngine retains canonical resolver", src.sports.includes("resolveSportsCanonicalNFLTeamIntelligence"));
check("SportsIntelligenceEngine retains application resolver", src.sports.includes("resolveSportsFIEApplicationContext"));
check("SportsIntelligenceEngine builds FIE CPU context", src.sports.includes("const canonicalTeamIntelligence = resolveSportsCanonicalNFLTeamIntelligence(team)"));
check("SportsIntelligenceEngine passes FIE context to CPU", src.sports.includes("fieApplicationContext,"));
check("CPU accepts FIE context", src.decision.includes("fieApplicationContext = null"));
check("CPU exposes canonical FIE context", src.decision.includes("canonicalFIE:"));
check("CPU marks FIE context-only", src.decision.includes("CONTEXT_ONLY_NO_PROSPECT_SELECTION"));
check("CPU declares FIE not used for ranking", src.decision.includes("canonicalFIEUsedForProspectRanking: false"));
check("CPU preserves FIE football ownership", src.decision.includes('canonicalFIEFootballReasoningOwner: "CANONICAL_FIE"'));
check("CPU preserves MDS selection ownership", src.decision.includes('mdsDraftSelectionOwner: "LBHT_MOCK_DRAFT_SIMULATOR"'));
check("CPU still uses MDS DraftBoardEngine", src.decision.includes("buildTeamDraftBoard"));
check("CPU selected prospect still comes from MDS board", src.decision.includes("const selected = board[0] || null"));
check("Draft page still consumes MDS recommendation", src.draft.includes("draftDecision?.recommendation?.player || null"));
check("Draft Operations retains FIE assessment", src.ops.includes("selectedDraftDecision?.canonicalFIE?.state") && src.ops.includes("canonicalTeamIntelligence"));
check("Draft Operations passes FIE context to Draft Wire", src.ops.includes("fieApplicationContext,"));
check("Draft Wire consumes FIE application context", src.wire.includes("fieApplicationContext"));
check("Draft Wire does not directly import canonical engine", !src.wire.includes("CanonicalNFLTeamIntelligenceEngine"));
check("CPU does not directly import canonical engine", !src.decision.includes("CanonicalNFLTeamIntelligenceEngine"));
check("Draft Wire has no Pick'em dependency", !src.wire.toLowerCase().includes("pickem"));
check("CPU has no Pick'em dependency", !src.decision.toLowerCase().includes("pickem"));
check("Draft Operations has no Pick'em dependency", !src.ops.toLowerCase().includes("pickem"));
check("CPU does not invent calibrated probability", !src.decision.includes("calibratedWinProbability"));
check("CPU does not invent predicted winner", !src.decision.includes("predictedWinner"));
check("Draft Wire does not invent predicted winner", !src.wire.includes("predictedWinner"));

console.log(`\nMDS/FIE End-to-End Integration Gate diagnostics: ${passed}/${passed + failed} passed; ${failed} failed.`);
if (failed) process.exit(1);
console.log("MDS_FIE_INITIAL_INTEGRATION_END_TO_END_GATE_READY");
