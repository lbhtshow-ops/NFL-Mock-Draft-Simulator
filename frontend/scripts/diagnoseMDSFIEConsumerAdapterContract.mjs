import fs from "node:fs";
import path from "node:path";
import {
  createMDSFIEConsumerEnvelope,
  MDS_FIE_CONSUMER_OWNERSHIP,
} from "../src/data/sportsIntelligence/adapters/MDSFIEConsumerAdapterContract.js";
import {
  MDS_INTELLIGENCE_APPLICATION_BOUNDARY,
  MDS_INTELLIGENCE_CONSUMERS,
} from "../src/data/sportsIntelligence/contracts/MDSIntelligenceApplicationContract.js";
import { createNFLTeamIntelligenceResult } from "../src/engines/teamIntelligence/NFLTeamIntelligenceResultContract.js";
import { createNFLMatchupIntelligenceResult } from "../src/engines/matchupIntelligence/NFLMatchupIntelligenceResultContract.js";

let passed=0, failed=0;
function check(name, condition){ if(condition){passed++; console.log(`PASS ${name}`);} else {failed++; console.error(`FAIL ${name}`);} }

const team=createNFLTeamIntelligenceResult({teamAbbreviation:"BAL",state:"AVAILABLE",overallStrength:81,components:{availability:73},confidence:.82,confidenceKnown:true,summary:"Canonical team result"});
const matchup=createNFLMatchupIntelligenceResult({gameId:"contract-test",season:2026,week:1,awayTeam:"BAL",homeTeam:"CLE",state:"AVAILABLE",matchupEdge:-12,evidenceQuality:.8,evidenceQualityKnown:true,keyAdvantages:["TEST"]});
const envelope=createMDSFIEConsumerEnvelope({teamIntelligence:team,matchupIntelligence:matchup});

check("adapter identifies canonical producer", envelope.producer === "CANONICAL_FIE");
check("adapter identifies MDS consumer", envelope.consumer === "LBHT_MOCK_DRAFT_SIMULATOR");
check("team source contract preserved", envelope.teamIntelligence?.sourceContract === "NFLTeamIntelligenceResult");
check("team strength passed through unchanged", envelope.teamIntelligence?.overallStrength === 81);
check("availability component passed through unchanged", envelope.teamIntelligence?.components?.availability === 73);
check("team confidence provenance preserved", envelope.teamIntelligence?.confidenceKnown === true);
check("matchup source contract preserved", envelope.matchupIntelligence?.sourceContract === "NFLMatchupIntelligenceResult");
check("matchup direction passed through unchanged", envelope.matchupIntelligence?.matchupEdge === -12);
check("matchup evidence quality preserved", envelope.matchupIntelligence?.evidenceQuality === .8);
check("no calibrated win probability invented", envelope.matchupIntelligence?.calibratedWinProbability === false);
check("no expected margin invented", envelope.matchupIntelligence?.expectedPointMargin === null);
check("FIE owns football reasoning", MDS_FIE_CONSUMER_OWNERSHIP.footballReasoningOwner === "CANONICAL_FIE");
check("MDS owns draft simulation", MDS_FIE_CONSUMER_OWNERSHIP.draftSimulationOwner === "LBHT_MOCK_DRAFT_SIMULATOR");
check("adapter cannot recompute team strength", MDS_FIE_CONSUMER_OWNERSHIP.adapterMayRecomputeTeamStrength === false);
check("adapter cannot recompute availability", MDS_FIE_CONSUMER_OWNERSHIP.adapterMayRecomputeAvailability === false);
check("adapter cannot recompute matchup direction", MDS_FIE_CONSUMER_OWNERSHIP.adapterMayRecomputeMatchupDirection === false);
check("adapter cannot mutate decision probability", MDS_FIE_CONSUMER_OWNERSHIP.adapterMayMutateDecisionProbability === false);
check("adapter cannot select draft prospect", MDS_FIE_CONSUMER_OWNERSHIP.adapterMaySelectDraftProspect === false);
check("application may combine FIE with draft context", MDS_INTELLIGENCE_APPLICATION_BOUNDARY.mayCombineWithMDSDraftContext === true);
check("application cannot recompute team strength", MDS_INTELLIGENCE_APPLICATION_BOUNDARY.mayRecomputeTeamStrength === false);
check("application cannot recompute availability", MDS_INTELLIGENCE_APPLICATION_BOUNDARY.mayRecomputeAvailability === false);
check("application cannot recompute matchup direction", MDS_INTELLIGENCE_APPLICATION_BOUNDARY.mayRecomputeMatchupDirection === false);
check("application cannot import Pick'em logic", MDS_INTELLIGENCE_APPLICATION_BOUNDARY.mayImportPickemSpecificLogic === false);
for(const consumer of ["SPORTS_INTELLIGENCE_ENGINE","DRAFT_OPERATIONS_CENTER","PROSPECT_INTELLIGENCE_CENTER","DRAFT_WIRE","CPU_DRAFT_DECISION_SUPPORT"]){check(`consumer declared: ${consumer}`, MDS_INTELLIGENCE_CONSUMERS.includes(consumer));}

const sports=fs.readFileSync(path.resolve("src/data/sportsIntelligence/SportsIntelligenceEngine.js"),"utf8");
check("existing SportsIntelligenceEngine remains present", sports.includes("resolveSportsTeamIntelligence"));
check("existing draft decision boundary remains present", sports.includes("resolveSportsDraftDecision"));
check("existing Draft Wire boundary remains present", sports.includes("resolveSportsDraftWire"));
check("contract sprint does not wire adapter into runtime", !sports.includes("MDSFIEConsumerAdapterContract"));

console.log(`\nMDS/FIE Consumer Adapter Contract diagnostics: ${passed}/${passed+failed} passed; ${failed} failed.`);
if(failed) process.exit(1);
console.log("MDS_FIE_CONSUMER_ADAPTER_CONTRACT_DEFINED_APPLICATION_BOUNDARY_READY");
