import { auditHistoricalReplacementCaliberHeterogeneousEffect } from "./auditHistoricalReplacementCaliberHeterogeneousEffect.mjs";

const result=auditHistoricalReplacementCaliberHeterogeneousEffect();
const r=result.report;
let passed=0,failed=0;
function check(label,condition){
  if(condition){console.log(`PASS ${label}`);passed++;}
  else{console.log(`FAIL ${label}`);failed++;}
}

check("286 governed calibration observations present",r.source.observationCount===286);
check("286 complete caliber observations present",r.source.completeObservationCount===286);
check("replacement delta arithmetic has zero violations",r.deltaSemantics.arithmeticViolationCount===0);
check("replacement delta convention is player minus replacement",r.deltaSemantics.formula==="PLAYER_CALIBER_MINUS_EXPECTED_REPLACEMENT_CALIBER");
check("positive delta means larger expected caliber loss",r.deltaSemantics.positiveMeansLargerExpectedCaliberLoss===true);
check("131 matched ATT effects present",r.source.matchedEffectCount===131);
check("131 matched effects reconciled to treatment summaries",r.source.matchedHeterogeneousRecordCount===131&&r.reconciliation.all131MatchedEffectsReconciled===true);
check("no matched effect missing cohort treatment",r.reconciliation.missingCohortCount===0);
check("no matched effect reconciled to non-treated cohort",r.reconciliation.nonTreatedCohortCount===0);
check("cohort replacement delta sums match observation sums",r.reconciliation.cohortDeltaMismatchCount===0);
check("matched treatments have complete replacement delta coverage",r.reconciliation.incompleteMatchedTreatmentCount===0);
check("overall heterogeneous regression computed",Number.isFinite(r.descriptive.regression.slope));
check("overall heterogeneous correlation computed",Number.isFinite(r.descriptive.regression.correlation));
check("non-positive caliber band populated",r.descriptive.bands.NON_POSITIVE_DELTA.count>0);
check("1-5 caliber loss band populated",r.descriptive.bands.POSITIVE_1_TO_5.count>0);
check("6-10 caliber loss band populated",r.descriptive.bands.POSITIVE_6_TO_10.count>0);
check("11+ caliber loss band populated",r.descriptive.bands.POSITIVE_11_PLUS.count>0);
check("season diagnostics cover 2022",Boolean(r.descriptive.bySeason["2022"]));
check("season diagnostics cover 2023",Boolean(r.descriptive.bySeason["2023"]));
check("season diagnostics cover 2024",Boolean(r.descriptive.bySeason["2024"]));
check("position results remain descriptive only",r.descriptive.positionResultsAreDescriptiveOnly===true);
check("p95 outlier sensitivity executed",r.outlierSensitivity.removedRecords>0&&r.outlierSensitivity.retainedRecords>0);
check("primary clustered slope bootstrap completed",r.uncertainty.primarySlope.replicatesUsable===10000);
check("trimmed clustered slope bootstrap completed",r.uncertainty.trimmedSlope.replicatesUsable===10000);
check("inferential claims remain unauthorized",r.uncertainty.inferentialClaimAuthorized===false);
check("statistical significance language remains unauthorized",r.uncertainty.statisticalSignificanceLanguageAuthorized===false);
check("heterogeneous effect audit complete",r.readiness.heterogeneousEffectAuditComplete===true);
check("position role dependency sensitivity may advance",r.readiness.positionRoleDependencySensitivityMayAdvance===true);
check("production calibration remains unauthorized",r.readiness.calibrationAuthorized===false);
check("production impact policy remains unauthorized",r.readiness.productionImpactPolicyAuthorized===false);
check("team strength point value remains unauthorized",r.safeguards.teamStrengthPointValueAuthorized===false);
check("team strength remains unmutated",r.safeguards.teamStrengthMutated===false);
check("decision model remains unmutated",r.safeguards.decisionModelMutated===false);
check("Pick'em remains unmutated",r.safeguards.pickemScoringMutated===false);
check("shadow-only boundary preserved",r.safeguards.shadowOnlyPreserved===true);

console.log(`\nHistorical Replacement-Caliber Heterogeneous Effect diagnostics: ${passed}/${passed+failed} passed; ${failed} failed.`);
console.log(r.decision);
if(failed>0) process.exitCode=2;
