export const NFL_PRIOR_USAGE_EXPECTED_REPLACEMENT_PROXY_GOVERNANCE =
Object.freeze({
  contractVersion:"FIE-NFL-PRIOR-USAGE-EXPECTED-REPLACEMENT-PROXY-GOVERNANCE-2D2D-R3-1.0.0",
  sprint:"2D.2D-R3",
  primaryProxy:"EXACT_POSITION_HIGHEST_MOST_RECENT_PRIOR_GAME_SNAP_PCT",
  minimumStrictLabelAgreementRate:0.60,
  minimumStrictLabelEstimableCoverageRate:0.75,
  priorGameEvidenceOnly:true,
  targetGameSnapEvidenceAllowed:false,
  futureSnapEvidenceAllowed:false,
  strictOfficialReplacementLabelsUsedForValidationOnly:true,
  targetWeekUntimestampedDepthChartAllowed:false,
  priorUsageAutomaticallyDefinesReplacement:false,
  canonicalReplacementMutationAuthorized:false,
  replacementCaliberFitAuthorized:false,
  productionPlayerImpactFitAuthorized:false,
  teamStrengthMutationAuthorized:false,
  decisionModelMutationAuthorized:false,
  pickemMutationAuthorized:false,
});
export function getNFLPriorUsageExpectedReplacementProxyGovernance(){
  return NFL_PRIOR_USAGE_EXPECTED_REPLACEMENT_PROXY_GOVERNANCE;
}
