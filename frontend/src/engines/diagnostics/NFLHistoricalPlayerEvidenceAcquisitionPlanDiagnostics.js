import assert from "node:assert/strict";
import { HISTORICAL_PLAYER_EVIDENCE_SOURCE_CLASS as C, qualifyHistoricalPlayerEvidenceSource as q } from "../teamIntelligence/strength/calibration/index.js";
const tests=[]; const t=(n,f)=>{try{f();tests.push([n,true])}catch(e){tests.push([n,false,e.message])}};
const base={provider:"nflverse",sourceRef:"artifact",playerIdentityKey:"gsis_id",seasonWeekTeamJoin:true};
const snap=q({...base,sourceClass:C.SNAP_PARTICIPATION,asOfTimestamp:false,pregameSafe:false});
t("contract",()=>assert.equal(snap.contractVersion,"FIE-NFL-HISTORICAL-PLAYER-EVIDENCE-ACQUISITION-1.0.0"));
t("snap_participation_qualified",()=>assert.equal(snap.postgameParticipationQualified,true));
t("snap_not_pregame_replacement",()=>assert.equal(snap.replacementPregameQualified,false));
t("snap_never_determines_pregame_replacement",()=>assert.equal(snap.snapCountsMayDeterminePregameReplacement,false));
const depth=q({...base,sourceClass:C.DEPTH_CHART,asOfTimestamp:true,pregameSafe:true});
t("depth_pregame_qualified",()=>assert.equal(depth.replacementPregameQualified,true));
const lateDepth=q({...base,sourceClass:C.DEPTH_CHART,asOfTimestamp:true,pregameSafe:false});
t("late_depth_rejected",()=>assert.equal(lateDepth.replacementPregameQualified,false));
const cal=q({...base,sourceClass:C.CANONICAL_EVALUATION_INPUT,asOfTimestamp:true,pregameSafe:true});
t("canonical_input_qualified",()=>assert.equal(cal.caliberQualified,true));
const badCal=q({...base,sourceClass:C.CANONICAL_EVALUATION_INPUT,asOfTimestamp:false,pregameSafe:true});
t("caliber_requires_asof",()=>assert.equal(badCal.caliberQualified,false));
for (const x of [snap,depth,lateDepth,cal,badCal]) {
 t("no_current_backfill_"+tests.length,()=>assert.equal(x.currentRatingBackfillAllowed,false));
 t("no_roster_guess_"+tests.length,()=>assert.equal(x.rosterOrderGuessAllowed,false));
 t("no_name_guess_"+tests.length,()=>assert.equal(x.nameGuessAllowed,false));
}
const bad=tests.filter(x=>!x[1]);
console.log(JSON.stringify({suite:"NFL Historical Player Evidence Acquisition Plan",contractVersion:"FIE-NFL-TEAM-STRENGTH-CALIBRATION-9D1C2B-1.0.0",status:bad.length?"FAIL":"PASS",passed:tests.length-bad.length,failed:bad.length,checks:Object.fromEntries(tests.map(x=>[x[0],x[1]])),failures:bad.map(x=>x[0]+": "+x[2])},null,2));
if(bad.length)process.exitCode=1;
