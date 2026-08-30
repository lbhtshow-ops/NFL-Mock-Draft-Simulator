import assert from "node:assert/strict";
import {getNFLHistoricalPlayerEvaluatorReadinessGovernance as get} from "../teamIntelligence/strength/calibration/index.js";
const g=get(),checks={
 contract:g.contractVersion==="FIE-NFL-HISTORICAL-PLAYER-EVALUATOR-READINESS-GOVERNANCE-1.0.0",
 classify:g.residualTargetsMustBeClassified===true,mapPos:g.replacementMappingPositionMayResolveRole===true,
 depthPos:g.exactDepthChartPositionMayResolveRole===true,snapPos:g.canonicalSnapPositionMayResolveRole===true,
 noName:g.nameGuessAllowed===false,noCurrentRoster:g.currentRosterLookupAllowed===false,noCurrentRating:g.currentPlayerRatingAllowed===false,
 ungraded:g.residualWithoutHistoricalEvidenceRemainsUngraded===true,audit:g.canonicalEvaluatorRepositoryAuditRequired===true,
 noCompeting:g.competingEvaluatorImplementationAllowed===false,wrapper:g.historicalAdapterMayWrapCanonicalEvaluator===true,
 asOf:g.asOfSupportMustBeExplicit===true,noFallback:g.currentStateFallbackAllowed===false,
 noCalibration:g.calibrationAuthorized===false,noWeights:g.learnedWeightsAuthorized===false,noMutation:g.datasetMutationAuthorized===false
};
const bad=Object.entries(checks).filter(([,v])=>!v);
console.log(JSON.stringify({suite:"NFL Historical Player Evaluator Readiness Governance",contractVersion:g.contractVersion,status:bad.length?"FAIL":"PASS",passed:Object.keys(checks).length-bad.length,failed:bad.length,checks},null,2));
assert.equal(bad.length,0);
