import assert from "node:assert/strict";
import {
 getNFLHistoricalPlayerCaliberGenerationGovernance,
 getNFLHistoricalReplacementEvidenceGovernance,
 createNFLHistoricalPlayerCaliberSnapshot,
 createNFLHistoricalReplacementMapping,
 NFL_REPLACEMENT_EVIDENCE_TYPES,
 qualifyHistoricalPlayerCaliberSnapshot,
 qualifyHistoricalReplacementMapping,
 summarizeHistoricalPlayerEvidenceQualification,
} from "../teamIntelligence/strength/calibration/index.js";

const tests=[];const t=(n,f)=>{try{f();tests.push([n,true])}catch(e){tests.push([n,false,e.message])}};
const cg=getNFLHistoricalPlayerCaliberGenerationGovernance();
const rg=getNFLHistoricalReplacementEvidenceGovernance();

t("cal_governance_version",()=>assert.equal(cg.contractVersion,"FIE-NFL-HISTORICAL-PLAYER-CALIBER-GENERATION-GOVERNANCE-1.0.0"));
t("canonical_eval_required",()=>assert.equal(cg.canonicalEvaluationRequired,true));
t("historical_asof_required",()=>assert.equal(cg.historicalAsOfBoundaryRequired,true));
t("current_rating_backfill_forbidden",()=>assert.equal(cg.currentRatingBackfillAllowed,false));
t("future_evidence_forbidden",()=>assert.equal(cg.futureEvidenceAllowed,false));
t("rank_proxy_forbidden",()=>assert.equal(cg.rankProxyAllowed,false));
t("roster_value_proxy_forbidden",()=>assert.equal(cg.rosterValueProxyAllowed,false));
t("missing_remains_null",()=>assert.equal(cg.missingEvaluationRemainsNull,true));
t("provenance_required",()=>assert.equal(cg.provenanceRequired,true));

t("replacement_governance_version",()=>assert.equal(rg.contractVersion,"FIE-NFL-HISTORICAL-REPLACEMENT-EVIDENCE-GOVERNANCE-1.0.0"));
t("replacement_roster_guess_forbidden",()=>assert.equal(rg.samePositionRosterOrderInferenceAllowed,false));
t("replacement_name_guess_forbidden",()=>assert.equal(rg.replacementByNameGuessAllowed,false));
t("ambiguous_replacement_null",()=>assert.equal(rg.ambiguousReplacementRemainsNull,true));
t("postgame_not_pregame",()=>assert.equal(rg.postgameOutcomeAsPregameEvidenceAllowed,false));
t("weights_blocked",()=>assert.equal(rg.learnedWeightsAuthorized,false));

const goodCal=createNFLHistoricalPlayerCaliberSnapshot({
 playerId:"P1",team:"BAL",position:"QB",season:2024,week:5,gameId:"g",
 asOf:"2024-10-01T12:00:00Z",kickoffAt:"2024-10-01T20:00:00Z",
 status:"AVAILABLE",caliber:92,confidence:.8,modelVersion:"NFL-EVAL-1",
 provenance:{source:"canonical-player-evaluation",evidenceAsOf:"2024-10-01T12:00:00Z"}
});
const qCal=qualifyHistoricalPlayerCaliberSnapshot(goodCal);
t("good_caliber_qualified",()=>assert.equal(qCal.qualified,true));

const noProv={...goodCal,provenance:null};
t("caliber_without_provenance_rejected",()=>assert.ok(qualifyHistoricalPlayerCaliberSnapshot(noProv).errors.includes("PROVENANCE_REQUIRED")));
const noModel={...goodCal,modelVersion:null};
t("caliber_without_model_rejected",()=>assert.ok(qualifyHistoricalPlayerCaliberSnapshot(noModel).errors.includes("MODEL_VERSION_REQUIRED")));
const noConf={...goodCal,confidence:null};
t("caliber_without_confidence_rejected",()=>assert.ok(qualifyHistoricalPlayerCaliberSnapshot(noConf).errors.includes("CONFIDENCE_REQUIRED")));
const late=createNFLHistoricalPlayerCaliberSnapshot({...goodCal,asOf:"2024-10-02T12:00:00Z"});
t("future_caliber_rejected",()=>assert.equal(qualifyHistoricalPlayerCaliberSnapshot(late).qualified,false));

const goodMap=createNFLHistoricalReplacementMapping({
 unavailablePlayerId:"P1",replacementPlayerId:"P2",team:"BAL",position:"QB",
 season:2024,week:5,gameId:"g",asOf:"2024-10-01T12:00:00Z",
 evidenceType:NFL_REPLACEMENT_EVIDENCE_TYPES.EXPLICIT_DEPTH_CHART,
 confidence:.9,provenance:{source:"historical-depth-chart"}
});
t("good_replacement_qualified",()=>assert.equal(qualifyHistoricalReplacementMapping(goodMap).qualified,true));
t("replacement_no_provenance_rejected",()=>assert.ok(qualifyHistoricalReplacementMapping({...goodMap,provenance:null}).errors.includes("PROVENANCE_REQUIRED")));
t("replacement_no_asof_rejected",()=>assert.ok(qualifyHistoricalReplacementMapping({...goodMap,asOf:null}).errors.includes("AS_OF_REQUIRED")));
t("replacement_no_confidence_rejected",()=>assert.ok(qualifyHistoricalReplacementMapping({...goodMap,confidence:null}).errors.includes("CONFIDENCE_REQUIRED")));
const badEvidence=createNFLHistoricalReplacementMapping({...goodMap,evidenceType:"ROSTER_ORDER"});
t("replacement_bad_evidence_rejected",()=>assert.equal(qualifyHistoricalReplacementMapping(badEvidence).qualified,false));

const report=summarizeHistoricalPlayerEvidenceQualification({
 caliberSnapshots:[goodCal,noProv],
 replacementMappings:[goodMap,{...goodMap,provenance:null}]
});
t("report_version",()=>assert.equal(report.contractVersion,"FIE-NFL-HISTORICAL-PLAYER-EVIDENCE-QUALIFICATION-REPORT-1.0.0"));
t("report_cal_total",()=>assert.equal(report.caliber.total,2));
t("report_cal_qualified",()=>assert.equal(report.caliber.qualified,1));
t("report_replacement_total",()=>assert.equal(report.replacements.total,2));
t("report_replacement_qualified",()=>assert.equal(report.replacements.qualified,1));

const bad=tests.filter(x=>!x[1]);
console.log(JSON.stringify({
 suite:"NFL Historical Player Evidence Acquisition & Qualification",
 contractVersion:"FIE-NFL-TEAM-STRENGTH-CALIBRATION-9D1C2-1.0.0",
 status:bad.length?"FAIL":"PASS",
 passed:tests.length-bad.length,failed:bad.length,
 checks:Object.fromEntries(tests.map(x=>[x[0],x[1]])),
 failures:bad.map(x=>x[0]+": "+x[2])
},null,2));
if(bad.length)process.exitCode=1;
