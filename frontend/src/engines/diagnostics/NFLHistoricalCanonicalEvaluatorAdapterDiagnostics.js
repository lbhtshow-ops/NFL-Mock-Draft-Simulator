import assert from "node:assert/strict";
import {evaluateCanonicalHistoricalNFLPlayer} from "../playerEvaluation/nfl/CanonicalNFLPlayerEvaluationService.js";
import {getNFLHistoricalCanonicalEvaluatorAdapterGovernance as get} from "../teamIntelligence/strength/calibration/index.js";
const g=get();
const noAsOf=evaluateCanonicalHistoricalNFLPlayer({evidenceBundle:{}});
const noBundle=evaluateCanonicalHistoricalNFLPlayer({asOf:"2024-09-01T12:00:00Z"});
const unsafeProvider=()=>({playerQuality:99});
const unsafe=evaluateCanonicalHistoricalNFLPlayer({asOf:"2024-09-01T12:00:00Z",evidenceBundle:{},historicalEvaluationProvider:unsafeProvider});
const unavailableProvider=()=>({status:"UNAVAILABLE",reason:"INSUFFICIENT_HISTORICAL_EVIDENCE"});
unavailableProvider.supportsHistoricalEvidence=true;
const unavailable=evaluateCanonicalHistoricalNFLPlayer({asOf:"2024-09-01T12:00:00Z",evidenceBundle:{},historicalEvaluationProvider:unavailableProvider});
const checks={
 contract:g.contractVersion==="FIE-NFL-HISTORICAL-CANONICAL-EVALUATOR-ADAPTER-GOVERNANCE-1.0.0",
 preserve:g.preservePresentStateEntryPoint===true,asOf:g.historicalAsOfRequired===true,bundle:g.historicalEvidenceBundleRequired===true,
 provider:g.explicitHistoricalProviderRequired===true,capability:g.providerCapabilityDeclarationRequired===true,
 noFallback:g.presentStateEvaluatorFallbackAllowed===false,noGlobal:g.currentGlobalIndexesAllowed===false,
 canonical:g.historicalResultMustUseCanonicalHardening===true,noCompeting:g.competingCaliberModelAllowed===false,
 noAsOfBlocked:noAsOf.reason==="HISTORICAL_AS_OF_REQUIRED",noBundleBlocked:noBundle.reason==="HISTORICAL_EVIDENCE_BUNDLE_REQUIRED",
 unsafeBlocked:unsafe.reason==="CANONICAL_HISTORICAL_EVALUATION_PROVIDER_REQUIRED",
 unavailablePreserved:unavailable.reason==="INSUFFICIENT_HISTORICAL_EVIDENCE",
 noCalibration:g.calibrationAuthorized===false,noWeights:g.learnedWeightsAuthorized===false,noMutation:g.datasetMutationAuthorized===false
};
const bad=Object.entries(checks).filter(([,v])=>!v);
console.log(JSON.stringify({suite:"NFL Historical Canonical Evaluator Adapter",contractVersion:g.contractVersion,status:bad.length?"FAIL":"PASS",passed:Object.keys(checks).length-bad.length,failed:bad.length,checks},null,2));
assert.equal(bad.length,0);
