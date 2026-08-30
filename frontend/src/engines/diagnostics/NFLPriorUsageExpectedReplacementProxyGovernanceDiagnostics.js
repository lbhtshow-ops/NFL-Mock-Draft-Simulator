import {
 NFL_PRIOR_USAGE_EXPECTED_REPLACEMENT_PROXY_GOVERNANCE,
 getNFLPriorUsageExpectedReplacementProxyGovernance,
} from "../teamIntelligence/strength/calibration/playerEvidence/NFLPriorUsageExpectedReplacementProxyGovernance.js";
const g=getNFLPriorUsageExpectedReplacementProxyGovernance();
const checks={
 contractExported:g===NFL_PRIOR_USAGE_EXPECTED_REPLACEMENT_PROXY_GOVERNANCE,
 exactPrimary:g.primaryProxy==="EXACT_POSITION_HIGHEST_MOST_RECENT_PRIOR_GAME_SNAP_PCT",
 agreementFrozen:g.minimumStrictLabelAgreementRate===0.60,
 coverageFrozen:g.minimumStrictLabelEstimableCoverageRate===0.75,
 priorOnly:g.priorGameEvidenceOnly===true,
 targetBlocked:g.targetGameSnapEvidenceAllowed===false,
 futureBlocked:g.futureSnapEvidenceAllowed===false,
 labelsValidationOnly:g.strictOfficialReplacementLabelsUsedForValidationOnly===true,
 untimestampedDepthBlocked:g.targetWeekUntimestampedDepthChartAllowed===false,
 noAutomaticReplacement:g.priorUsageAutomaticallyDefinesReplacement===false,
 canonicalMutationBlocked:g.canonicalReplacementMutationAuthorized===false,
 caliberFitBlocked:g.replacementCaliberFitAuthorized===false,
 impactFitBlocked:g.productionPlayerImpactFitAuthorized===false,
 teamStrengthBlocked:g.teamStrengthMutationAuthorized===false,
 decisionModelBlocked:g.decisionModelMutationAuthorized===false,
 pickemBlocked:g.pickemMutationAuthorized===false,
};
const failures=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
console.log(JSON.stringify({
 suite:"NFL Prior-Usage Expected Replacement Proxy Governance",
 contractVersion:"FIE-NFL-PRIOR-USAGE-EXPECTED-REPLACEMENT-PROXY-GOVERNANCE-DIAGNOSTIC-1.0.0",
 status:failures.length?"FAIL":"PASS",passed:Object.keys(checks).length-failures.length,
 failed:failures.length,checks,failures
},null,2));
if(failures.length)process.exitCode=1;
