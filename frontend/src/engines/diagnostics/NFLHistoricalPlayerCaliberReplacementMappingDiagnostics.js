import assert from "node:assert/strict";
import {
 createNFLHistoricalPlayerCaliberSnapshot,validateNFLHistoricalPlayerCaliberSnapshot,
 NFL_REPLACEMENT_EVIDENCE_TYPES,createNFLHistoricalReplacementMapping,
 validateNFLHistoricalReplacementMapping,enrichHistoricalAvailabilityObservation
} from "../teamIntelligence/strength/calibration/index.js";
const tests=[];const t=(n,f)=>{try{f();tests.push([n,true])}catch(e){tests.push([n,false,e.message])}};
const cal=createNFLHistoricalPlayerCaliberSnapshot({playerId:"P1",team:"BAL",position:"QB",season:2024,week:5,gameId:"g",asOf:"2024-10-01T12:00:00Z",kickoffAt:"2024-10-01T20:00:00Z",status:"AVAILABLE",caliber:92,confidence:.8,modelVersion:"NFL-PLAYER-EVAL-1"});
t("cal_contract",()=>assert.equal(cal.contractVersion,"FIE-NFL-HISTORICAL-PLAYER-CALIBER-SNAPSHOT-1.0.0"));
t("cal_safe",()=>assert.equal(cal.temporallySafe,true));
t("cal_grade",()=>assert.equal(cal.caliber,92));
t("cal_conf",()=>assert.equal(cal.confidence,.8));
t("cal_valid",()=>assert.equal(validateNFLHistoricalPlayerCaliberSnapshot(cal).valid,true));
const late=createNFLHistoricalPlayerCaliberSnapshot({playerId:"P1",team:"BAL",position:"QB",season:2024,week:5,gameId:"g",asOf:"2024-10-02T12:00:00Z",kickoffAt:"2024-10-01T20:00:00Z",status:"AVAILABLE",caliber:92});
t("late_not_safe",()=>assert.equal(late.temporallySafe,false));
t("late_rejected",()=>assert.ok(validateNFLHistoricalPlayerCaliberSnapshot(late).errors.includes("HISTORICAL_CALIBER_FUTURE_LEAKAGE")));
const unavailable=createNFLHistoricalPlayerCaliberSnapshot({playerId:"P9",team:"BAL",position:"QB",season:2024,week:5,gameId:"g",asOf:"2024-10-01T12:00:00Z",kickoffAt:"2024-10-01T20:00:00Z",status:"UNAVAILABLE",caliber:99});
t("unavailable_grade_null",()=>assert.equal(unavailable.caliber,null));
const map=createNFLHistoricalReplacementMapping({unavailablePlayerId:"P1",replacementPlayerId:"P2",team:"BAL",position:"QB",season:2024,week:5,gameId:"g",asOf:"2024-10-01T12:00:00Z",evidenceType:NFL_REPLACEMENT_EVIDENCE_TYPES.EXPLICIT_DEPTH_CHART,confidence:.9});
t("map_contract",()=>assert.equal(map.contractVersion,"FIE-NFL-HISTORICAL-REPLACEMENT-MAPPING-1.0.0"));
t("map_evidence",()=>assert.equal(map.evidenceType,"EXPLICIT_DEPTH_CHART"));
t("map_not_roster_order",()=>assert.equal(map.inferredFromRosterOrder,false));
t("map_valid",()=>assert.equal(validateNFLHistoricalReplacementMapping(map).valid,true));
const noEvidence=createNFLHistoricalReplacementMapping({unavailablePlayerId:"P1",replacementPlayerId:"P2",team:"BAL",position:"QB"});
t("map_no_evidence_invalid",()=>assert.equal(validateNFLHistoricalReplacementMapping(noEvidence).valid,false));
const same=createNFLHistoricalReplacementMapping({unavailablePlayerId:"P1",replacementPlayerId:"P1",team:"BAL",position:"QB",evidenceType:NFL_REPLACEMENT_EVIDENCE_TYPES.PRIOR_USAGE});
t("same_invalid",()=>assert.ok(validateNFLHistoricalReplacementMapping(same).errors.includes("REPLACEMENT_MUST_DIFFER")));
const rep=createNFLHistoricalPlayerCaliberSnapshot({playerId:"P2",team:"BAL",position:"QB",season:2024,week:5,gameId:"g",asOf:"2024-10-01T12:00:00Z",kickoffAt:"2024-10-01T20:00:00Z",status:"AVAILABLE",caliber:65,confidence:.7});
const enriched=enrichHistoricalAvailabilityObservation({availabilityImpact:{status:"AVAILABLE",playerCount:1,players:[{playerId:"P1",position:"QB",reportStatus:"OUT"}]},caliberSnapshots:[cal,rep],replacementMappings:[map]});
t("enriched_not_null",()=>assert.ok(enriched));
t("player_caliber_joined",()=>assert.equal(enriched.players[0].playerCaliber,92));
t("replacement_id_joined",()=>assert.equal(enriched.players[0].replacement.playerId,"P2"));
t("replacement_caliber_joined",()=>assert.equal(enriched.players[0].replacement.caliber,65));
t("delta_joined",()=>assert.equal(enriched.players[0].replacement.caliberDelta,27));
t("coverage_player",()=>assert.equal(enriched.caliberCoverage.playerCaliberCount,1));
t("coverage_replacement",()=>assert.equal(enriched.caliberCoverage.replacementMappedCount,1));
t("coverage_delta",()=>assert.equal(enriched.caliberCoverage.caliberDeltaCount,1));
const noMap=enrichHistoricalAvailabilityObservation({availabilityImpact:{status:"AVAILABLE",players:[{playerId:"P1",position:"QB",reportStatus:"OUT"}]},caliberSnapshots:[cal],replacementMappings:[]});
t("no_map_null_replacement",()=>assert.equal(noMap.players[0].replacement,null));
const noCal=enrichHistoricalAvailabilityObservation({availabilityImpact:{status:"AVAILABLE",players:[{playerId:"P9",position:"WR",reportStatus:"OUT"}]},caliberSnapshots:[],replacementMappings:[]});
t("no_caliber_null",()=>assert.equal(noCal.players[0].playerCaliber,null));
t("no_caliber_coverage_zero",()=>assert.equal(noCal.caliberCoverage.playerCaliberCount,0));
t("null_availability_returns_null",()=>assert.equal(enrichHistoricalAvailabilityObservation({availabilityImpact:null}),null));
const bad=tests.filter(x=>!x[1]);
console.log(JSON.stringify({suite:"NFL Historical Player Caliber & Replacement Mapping",contractVersion:"FIE-NFL-TEAM-STRENGTH-CALIBRATION-9D1C-1.0.0",status:bad.length?"FAIL":"PASS",passed:tests.length-bad.length,failed:bad.length,checks:Object.fromEntries(tests.map(x=>[x[0],x[1]])),failures:bad.map(x=>x[0]+": "+x[2])},null,2));
if(bad.length)process.exitCode=1;
