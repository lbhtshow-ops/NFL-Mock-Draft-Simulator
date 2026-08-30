import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,"..");
const read=(p)=>fs.readFileSync(path.join(root,p),"utf8");
const exists=(p)=>fs.existsSync(path.join(root,p));
const files={
 sie:read("src/data/sportsIntelligence/SportsIntelligenceEngine.js"),
 ops:read("src/components/draftOperations/DraftOperationsCenter.jsx"),
 pic:read("src/components/draftV3/Intelligence/ProspectIntelligenceCenter.jsx"),
 decision:read("src/data/sportsIntelligence/draft/SportsDraftDecisionEngine.js"),
 wire:read("src/data/sportsIntelligence/draft/DraftWireEngine.js"),
 draft:read("src/pages/Draft.jsx"),
 adapter:read("src/data/sportsIntelligence/adapters/MDSFIEConsumerAdapterContract.js"),
 service:read("src/data/sportsIntelligence/services/MDSFIEIntelligenceApplicationService.js"),
};
let passed=0, failed=0;
function check(name, ok){ if(ok){console.log(`PASS ${name}`);passed++;}else{console.log(`FAIL ${name}`);failed++;} }
const contains=(s,...xs)=>xs.every(x=>s.includes(x));

check("consumer adapter contract remains present", exists("src/data/sportsIntelligence/adapters/MDSFIEConsumerAdapterContract.js"));
check("application service remains present", exists("src/data/sportsIntelligence/services/MDSFIEIntelligenceApplicationService.js"));
check("Sports Intelligence remains MDS orchestration boundary", contains(files.sie,"resolveSportsProspectIntelligence","resolveSportsTeamIntelligence","resolveSportsDraftDecision","resolveSportsDraftWire"));
check("canonical team resolver remains exposed", files.sie.includes("resolveSportsCanonicalNFLTeamIntelligence"));
check("FIE application resolver remains exposed", files.sie.includes("resolveSportsFIEApplicationContext"));
check("Draft Operations remains primary intelligence consumer", contains(files.ops,"ProspectIntelligenceCenter","resolveSportsTeamIntelligence","resolveSportsDraftWire"));
check("Prospect Intelligence Center consumes Sports Intelligence", files.pic.includes("resolveSportsProspectIntelligence"));
check("Draft Wire presentation boundary remains present", files.wire.includes("resolveDraftWireItems"));
check("CPU draft decision boundary remains present", files.decision.includes("resolveSportsDraftDecision"));
check("Draft page consumes MDS decision support", files.draft.includes("resolveSportsDraftDecision"));

check("prospect resolver exposes canonical runtime", files.sie.includes("canonicalProspectRuntime"));
check("prospect resolver exposes canonical model result", files.sie.includes("canonicalProspectModelResult"));
check("unavailable model remains explicit", files.sie.includes("CANONICAL_FIE_PROSPECT_MODEL_UNAVAILABLE"));
check("unavailable model reason remains visible", files.pic.includes("canonicalProspectError") && files.pic.includes("model unavailable"));
check("Big Board display preserves unavailable grade", files.ops.includes("raw === null || raw === undefined || raw === \"\""));
check("governed IntelligenceResult value envelope supported", contains(files.sie,"value?.data?.evaluation"));
check("Prospect Intelligence Center supports governed value envelope", files.pic.includes("evaluationSummary?.value?.data"));
check("null Intel Grade coercion guard remains present", files.ops.includes("Number.isFinite(Number(grade))")===false || files.ops.includes("grade !== null"));

check("team intelligence resolver remains wired", files.sie.includes("resolveSportsTeamIntelligence"));
check("War Room coverage contract returned", files.sie.includes("WAR_ROOM_INTELLIGENCE_COVERAGE_V1"));

check("CPU decision resolver remains wired", files.sie.includes("resolveSportsDraftDecisionCore"));
check("Draft Wire resolver remains wired", files.sie.includes("resolveDraftWireItems"));
check("CPU decision retains MDS DraftBoardEngine ownership", files.decision.includes("buildTeamDraftBoard"));
check("CPU decision accepts canonical FIE context", files.decision.includes("fieApplicationContext"));
check("CPU decision exposes canonical FIE context", files.decision.includes("canonicalFIE:"));
check("CPU decision does not rank prospects with FIE team strength", files.decision.includes("canonicalFIEUsedForProspectRanking: false"));
check("Draft Wire remains presentation-only", files.wire.includes("footballEvaluationCalculatedHere: false"));
check("Draft Wire accepts FIE application context", files.wire.includes("fieApplicationContext"));
check("Draft Wire does not directly import canonical FIE", !/from\s+[\"'][^\"']*footballIntelligence[^\"']*[\"']/.test(files.wire));

for (const [name,src] of Object.entries({SportsIntelligenceEngine:files.sie,DraftOperationsCenter:files.ops,ProspectIntelligenceCenter:files.pic,CPUDecision:files.decision,DraftWire:files.wire})) {
 check(`${name} has no Pick'em dependency`, !/pick.?em/i.test(src));
}
check("MDS does not mutate calibrated win probability", !/calibratedWinProbability\s*=/.test(files.decision+files.ops+files.wire));
check("MDS does not add predicted winner logic", !/predictedWinner\s*=/.test(files.decision+files.ops+files.wire));
check("consumer adapter prohibits team-strength recomputation", files.adapter.includes("adapterMayRecomputeTeamStrength: false"));
check("consumer adapter prohibits availability recomputation", files.adapter.includes("adapterMayRecomputeAvailability: false"));
check("consumer adapter prohibits matchup-direction recomputation", files.adapter.includes("adapterMayRecomputeMatchupDirection: false"));
check("consumer adapter prohibits prospect selection", files.adapter.includes("adapterMaySelectDraftProspect: false"));

for(const tab of ["overview","needs","roster","drafted","intel","identity","frontOffice","capital","queue"]) check(`War Room tab ${tab} retained`, files.ops.toLowerCase().includes((tab==="frontOffice"?"front-office":tab).toLowerCase()));
check("coverage legend remains rendered", /coverage legend|coverage-legend/i.test(files.ops+read("src/styles/draft-operations-next.css")));
check("Front Office provenance remains rendered", /front.?office/i.test(files.ops)&&/coverage/i.test(files.ops));
check("Identity provenance remains rendered", /identity/i.test(files.ops)&&/coverage/i.test(files.ops));

check("database files not imported by gate consumers", !/supabase|postgres|database\.js/i.test(files.ops+files.pic+files.decision+files.wire));
check("REF Sprint 17C not imported by gate consumers", !/Sprint 17C|REF-17C/i.test(files.ops+files.pic+files.decision+files.wire));

console.log(`\nMDS/FIE Draft Room End-to-End Release Gate diagnostics: ${passed}/${passed+failed} passed; ${failed} failed.`);
if(failed===0){console.log("MDS_FIE_DRAFT_ROOM_END_TO_END_RELEASE_GATE_READY");process.exit(0);}else{console.log("MDS_FIE_DRAFT_ROOM_END_TO_END_RELEASE_GATE_BLOCKED");process.exit(1);}
