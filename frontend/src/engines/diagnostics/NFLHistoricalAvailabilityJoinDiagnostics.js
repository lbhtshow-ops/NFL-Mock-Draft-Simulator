import assert from "node:assert/strict";
import {getNFLHistoricalAvailabilityJoinGovernance,selectLatestSafeHistoricalAvailability,summarizeHistoricalAvailability} from "../teamIntelligence/strength/calibration/index.js";
const tests=[];const t=(n,f)=>{try{f();tests.push([n,true])}catch(e){tests.push([n,false,e.message])}};
const g=getNFLHistoricalAvailabilityJoinGovernance();
t("contract",()=>assert.equal(g.contractVersion,"FIE-NFL-HISTORICAL-AVAILABILITY-JOIN-GOVERNANCE-1.0.0"));
t("2022_qualified",()=>assert.ok(g.currentlyQualifiedSeasons.includes(2022)));
t("2023_qualified",()=>assert.ok(g.currentlyQualifiedSeasons.includes(2023)));
t("2024_qualified",()=>assert.ok(g.currentlyQualifiedSeasons.includes(2024)));
t("2025_unqualified",()=>assert.ok(g.currentlyUnqualifiedSeasons.includes(2025)));
t("latest_safe_required",()=>assert.equal(g.selectionPolicy.latestTemporallySafeRecordBeforeKickoff,true));
t("postkickoff_blocked",()=>assert.equal(g.selectionPolicy.postKickoffRecordAllowed,false));
t("missing_null",()=>assert.equal(g.selectionPolicy.missingAvailabilityRemainsNull,true));
t("roster_not_proxy",()=>assert.equal(g.selectionPolicy.rosterStatusMaySubstituteForInjuryEvidence,false));
t("no_in_place_mutation",()=>assert.equal(g.outputPolicy.mutatesSourceDatasetInPlace,false));
t("new_dataset",()=>assert.equal(g.outputPolicy.writesNewEnrichedDataset,true));
t("same_count",()=>assert.equal(g.outputPolicy.preservesOriginalObservationCount,true));
t("weights_blocked",()=>assert.equal(g.outputPolicy.learnedWeightsAuthorized,false));
const records=[
 {playerId:"P1",name:"A",position:"QB",reportStatus:"QUESTIONABLE",practiceStatus:"LIMITED",dateModified:"2024-09-01T09:00:00Z"},
 {playerId:"P1",name:"A",position:"QB",reportStatus:"OUT",practiceStatus:"DNP",dateModified:"2024-09-01T11:00:00Z"},
 {playerId:"P1",name:"A",position:"QB",reportStatus:"FULL",practiceStatus:"FULL",dateModified:"2024-09-01T14:00:00Z"},
 {playerId:"P2",name:"B",position:"WR",reportStatus:"DOUBTFUL",practiceStatus:"LIMITED",dateModified:"2024-09-01T10:00:00Z"},
];
const selected=selectLatestSafeHistoricalAvailability(records,"2024-09-01T13:00:00Z");
t("one_row_per_player",()=>assert.equal(selected.length,2));
t("latest_safe_selected",()=>assert.equal(selected.find(x=>x.playerId==="P1").reportStatus,"OUT"));
t("late_record_excluded",()=>assert.notEqual(selected.find(x=>x.playerId==="P1").practiceStatus,"FULL"));
t("second_player_preserved",()=>assert.equal(selected.find(x=>x.playerId==="P2").reportStatus,"DOUBTFUL"));
const summary=summarizeHistoricalAvailability(selected);
t("summary_available",()=>assert.equal(summary.status,"AVAILABLE"));
t("summary_count",()=>assert.equal(summary.playerCount,2));
t("out_count",()=>assert.equal(summary.outCount,1));
t("doubtful_count",()=>assert.equal(summary.doubtfulCount,1));
t("questionable_count",()=>assert.equal(summary.questionableCount,0));
const empty=summarizeHistoricalAvailability([]);
t("empty_no_report",()=>assert.equal(empty.status,"NO_REPORT_EVIDENCE"));
t("empty_count_zero",()=>assert.equal(empty.playerCount,0));
const questionable=summarizeHistoricalAvailability([{playerId:"P3",reportStatus:"QUESTIONABLE"}]);
t("questionable_not_out",()=>assert.equal(questionable.outCount,0));
t("questionable_preserved",()=>assert.equal(questionable.questionableCount,1));
const bad=tests.filter(x=>!x[1]);
console.log(JSON.stringify({suite:"NFL Qualified Historical Availability Join",contractVersion:"FIE-NFL-TEAM-STRENGTH-CALIBRATION-9D1B2-1.0.0",status:bad.length?"FAIL":"PASS",passed:tests.length-bad.length,failed:bad.length,checks:Object.fromEntries(tests.map(x=>[x[0],x[1]])),failures:bad.map(x=>x[0]+": "+x[2])},null,2));
if(bad.length)process.exitCode=1;
