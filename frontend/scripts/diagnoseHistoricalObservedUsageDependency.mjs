import { execFileSync } from "node:child_process";
import path from "node:path";

const MATERIALIZE=path.resolve("./scripts/materializeHistoricalObservedUsageDependency.mjs");
const AUDIT=path.resolve("./scripts/auditHistoricalObservedUsageDependency.mjs");
const materialization=JSON.parse(execFileSync(process.execPath,[MATERIALIZE],{cwd:process.cwd(),encoding:"utf8",stdio:["ignore","pipe","pipe"],maxBuffer:64*1024*1024}));
const audit=JSON.parse(execFileSync(process.execPath,[AUDIT],{cwd:process.cwd(),encoding:"utf8",stdio:["ignore","pipe","pipe"],maxBuffer:64*1024*1024}));
const tests=[];const t=(name,pass)=>tests.push({name,pass:!!pass});
t("286 historical calibration observations materialized",materialization?.source?.observations===286&&materialization?.output?.records===286);
t("resolved historical snap evidence loaded",materialization?.source?.snapRows>0);
t("historical player stats evidence loaded",materialization?.source?.playerStatRows>0);
t("historical usage materialized",materialization?.output?.usageAvailable>0);
t("historical dependency materialized where canonical components permit",materialization?.output?.dependencyAvailable>0);
t("target-week and future evidence excluded",materialization?.temporalGovernance?.targetWeekAndFutureEvidenceExcluded===true);
t("zero temporal violations",materialization?.temporalGovernance?.temporalViolations===0);
t("zero safeguard timing violations",materialization?.temporalGovernance?.targetOrFutureSafeguardViolations===0);
t("all 131 matched effects reconcile",audit?.source?.matchedEffectCount===131&&audit?.reconciliation?.allMatchedEffectsReconciled===true);
t("matched usage evidence now present",audit?.evidenceCoverage?.matchedWithUsage>0);
t("matched dependency evidence now present",audit?.evidenceCoverage?.matchedWithDependency>0);
t("usage sensitivity now testable",audit?.interpretation?.usageSensitivityNowTestable===true);
t("dependency sensitivity now testable",audit?.interpretation?.dependencySensitivityNowTestable===true);
t("usage results remain descriptive",audit?.interpretation?.usageResultsRemainDescriptiveOnly===true);
t("dependency results remain descriptive",audit?.interpretation?.dependencyResultsRemainDescriptiveOnly===true);
t("full Player Impact transformation remains outside holdout",audit?.readiness?.fullPlayerImpactTransformationReadyForHoldout===false);
t("calibration remains unauthorized",audit?.readiness?.calibrationAuthorized===false);
t("production policy remains unauthorized",audit?.readiness?.productionImpactPolicyAuthorized===false);
t("no production coefficient created",materialization?.safeguards?.productionCoefficientCreated===false);
t("Team Strength remains unmutated",audit?.safeguards?.teamStrengthMutated===false);
t("Decision Model remains unmutated",audit?.safeguards?.decisionModelMutated===false);
t("Pick'em remains unmutated",audit?.safeguards?.pickemScoringMutated===false);
t("database remains unmutated",audit?.safeguards?.databaseMutated===false);
t("shadow-only boundary preserved",audit?.safeguards?.shadowOnlyPreserved===true);
let pass=0;for(const x of tests){console.log(`${x.pass?"PASS":"FAIL"} ${x.name}`);if(x.pass)pass++;}
const fail=tests.length-pass;
console.log(`\nHistorical Observed Usage & Dependency Materialization diagnostics: ${pass}/${tests.length} passed; ${fail} failed.`);
const status = fail===0
  ? "HISTORICAL_USAGE_DEPENDENCY_EVIDENCE_MATERIALIZED_DESCRIPTIVE_ONLY_HOLD_SHADOW"
  : "HISTORICAL_USAGE_DEPENDENCY_MATERIALIZATION_INCOMPLETE_HOLD_SHADOW";
console.log(status);
if(fail) process.exitCode=2;
