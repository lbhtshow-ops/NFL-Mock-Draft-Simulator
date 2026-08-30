import assert from "node:assert/strict";
import {getNFLHistoricalCanonicalCaliberSnapshotGenerationGovernance as get} from "../teamIntelligence/strength/calibration/index.js";
import {buildHistoricalRosterEvaluationEnvelope} from "../playerEvaluation/nfl/HistoricalCanonicalPlayerCaliberSnapshotService.js";

const g=get();
const env=buildHistoricalRosterEvaluationEnvelope({
 rawPositionEvaluation:{
  playerQuality:81,rosterValue:81,positionModel:"QuarterbackEvaluationModel",
  notes:["fixture"]
 },
 completedHistoricalInput:{
  usageProfile:{available:true,gamesTracked:8,totalSnaps:500,matchedBy:"HISTORICAL"},
  performanceProfile:{available:true,gamesTracked:6,matchedBy:"HISTORICAL"},
  recognitionSummary:null,
 },
 completedCanonicalInput:{
  scores:{statusScore:72,experienceScore:70,usageScore:80,productionScore:77,recognitionScore:null},
 }
});
const checks={
 contract:g.contractVersion==="FIE-NFL-HISTORICAL-CANONICAL-CALIBER-SNAPSHOT-GENERATION-GOVERNANCE-1.0.0",
 minimum:g.minimumReadyCanonicalScoreInputs===3,
 position:g.resolvedCanonicalPositionRequired===true,
 temporal:g.asOfRequired===true && g.kickoffRequired===true && g.asOfMustPrecedeKickoff===true,
 canonicalModel:g.canonicalPositionModelExecutionRequired===true,
 hardening:g.canonicalNFLHardeningRequired===true,
 canonicalCaliber:g.canonicalPlayerCaliberProjectionRequired===true,
 qualitySource:g.playerQualityIsCanonicalCaliberSource===true,
 noRosterProxy:g.rosterValueMayNotSubstituteForCaliber===true,
 deterministic:g.deterministicRepeatRequired===true,
 confidence:g.finiteConfidenceRequired===true,
 model:g.modelVersionRequired===true,
 provenance:g.provenanceRequired===true,
 partial:g.partialReadinessMayProduceSnapshot===true,
 noCurrent:g.currentIndexLookupAllowed===false && g.currentRosterLookupAllowed===false && g.currentRecognitionLookupAllowed===false,
 noCarryover:g.prospectCarryoverAllowed===false,
 noFuture:g.targetWeekEvidenceAllowed===false && g.futureEvidenceAllowed===false,
 noForce606:g.all606ForcedScoringAllowed===false,
 envelopeQuality:env.playerQuality===81,
 envelopeUsage:env.usage.available===true && env.usage.usageScore===80,
 envelopeProduction:env.production.available===true && env.production.productionScore===77,
 envelopeRecognition:env.recognition.available===false,
 envelopeNoCarryover:env.positionEvaluation.prospectCarryover===null,
 noCalibration:g.calibrationAuthorized===false,
 noWeights:g.learnedWeightsAuthorized===false,
 noMutation:g.datasetMutationAuthorized===false,
};
const bad=Object.entries(checks).filter(([,v])=>!v);
console.log(JSON.stringify({
 suite:"NFL Historical Canonical Caliber Snapshot Generation",
 contractVersion:g.contractVersion,status:bad.length?"FAIL":"PASS",
 passed:Object.keys(checks).length-bad.length,failed:bad.length,checks
},null,2));
assert.equal(bad.length,0);
