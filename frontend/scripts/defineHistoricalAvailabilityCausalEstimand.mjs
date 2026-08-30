import { execFileSync } from "node:child_process";
import path from "node:path";

const SELECTOR = path.resolve("./scripts/selectHistoricalAvailabilityMatchingSpecification.mjs");

const UNMATCHED_TREATED_POLICY = "RETAIN_AS_OUT_OF_SUPPORT_DIAGNOSTIC; DO NOT FORCE MATCH";

function runSelector(){
  const stdout=execFileSync(process.execPath,[SELECTOR],{
    cwd:process.cwd(),encoding:"utf8",stdio:["ignore","pipe","pipe"],maxBuffer:32*1024*1024
  });
  return JSON.parse(stdout);
}

const selection=runSelector();
const c=selection?.candidate ?? {};
const spec=c?.specification ?? {};

const requiredSelection =
  selection?.decision === "SELECTED_FOR_CAUSAL_ESTIMAND_DESIGN" &&
  selection?.authorizationBoundary?.selectedSpecificationMayAdvanceToCausalEstimandDesign === true;

const estimand = {
  estimandId:"HISTORICAL-AVAILABILITY-MATCHED-ATT-V1",
  estimandFamily:"ATT",
  label:"Matched historical team-game availability effect among supported treated team-games",
  targetPopulation:{
    source:"Historical availability treated team-games in governed seasons",
    treatedAvailable:c?.treatedAvailable ?? null,
    supportedMatchedTreated:c?.treatedRetained ?? null,
    outOfSupportTreated:c?.treatedUnmatched ?? null,
    interpretation:"Effect target is the supported treated population retained by the preselected matching design; unmatched treated team-games are outside empirical support and are not assigned fabricated counterfactuals."
  },
  unitOfAnalysis:"TEAM_GAME",
  treatmentUnit:"TEAM_GAME_WITH_QUALIFYING_AVAILABILITY_TREATMENT",
  comparisonUnit:"CONTROL_CANDIDATE_TEAM_GAME",
  matchingSpecification:{
    mode:spec?.mode ?? null,
    method:spec?.method ?? null,
    caliperLabel:spec?.caliperLabel ?? null,
    caliper:spec?.caliper ?? null,
    withReplacement:spec?.method === "NEAREST_WITH_REPLACEMENT"
  },
  counterfactualDefinition:"For each supported treated team-game, the counterfactual is represented by its selected pregame-comparable control team-game under the locked matching specification.",
  controlWeighting:{
    pairLevelWeight:1,
    treatedPairWeight:1,
    reusedControlPolicy:"A control reused for multiple treated team-games contributes once per matched treated-control pair.",
    implication:"Control reuse changes a control record's aggregate contribution count but does not increase any individual treated pair above unit weight.",
    uniqueControlsUsed:c?.uniqueControlsUsed ?? null,
    maximumControlReuse:c?.maximumControlReuse ?? null
  },
  effectScale:{
    primaryOutcome:"TEAM_GAME_PERFORMANCE_RESIDUAL",
    orientation:"TREATED_MINUS_MATCHED_CONTROL",
    unit:"POINTS_OF_TEAM_GAME_PERFORMANCE_RESIDUAL",
    interpretation:"Negative values indicate the treated team-game underperformed its matched counterfactual on the locked residual scale; positive values indicate outperformance.",
    observedPlayerImpactEquivalent:false,
    playerPositionCoefficientEquivalent:false,
    teamStrengthPointValueEquivalent:false,
    productionAvailabilityPenaltyEquivalent:false
  },
  aggregation:{
    primaryEstimator:"MEAN_OF_PAIR_LEVEL_TREATED_MINUS_CONTROL_DIFFERENCES",
    estimandExpression:"ATT_supported = mean_i(Y_treated_i - Y_matched_control_i)",
    clusterAwarenessRequired:true,
    reason:"Matching is with replacement and multiple treated observations may reference the same control; uncertainty analysis must account for dependence/reuse before inferential claims."
  },
  scope:{
    causalLanguageStatus:"DESIGN_DEFINED_EFFECT_ESTIMAND",
    externalValidity:"SUPPORTED_MATCHED_TREATED_POPULATION_ONLY",
    unmatchedTreatedHandling:UNMATCHED_TREATED_POLICY,
    extrapolationToAllInjuriesAuthorized:false,
    extrapolationToPositionsAuthorized:false,
    extrapolationToPlayersAuthorized:false,
    extrapolationToFutureSeasonsAuthorized:false
  }
};

const checks={
  priorSelectionPassed:requiredSelection,
  attFamilyDefined:estimand.estimandFamily==="ATT",
  teamGameUnitDefined:estimand.unitOfAnalysis==="TEAM_GAME",
  supportedPopulationDefined:Number.isFinite(Number(c?.treatedRetained)) && Number(c.treatedRetained)>0,
  unmatchedCasesPreserved:Number.isFinite(Number(c?.treatedUnmatched)) && Number(c.treatedUnmatched)>=0,
  replacementWeightingDefined:estimand.controlWeighting.reusedControlPolicy.length>0,
  pairDifferenceOrientationDefined:estimand.effectScale.orientation==="TREATED_MINUS_MATCHED_CONTROL",
  forcedMatchingProhibited:
    estimand.scope.unmatchedTreatedHandling === UNMATCHED_TREATED_POLICY &&
    estimand.scope.unmatchedTreatedHandling.includes("DO NOT FORCE MATCH"),
  playerCoefficientNotClaimed:estimand.effectScale.playerPositionCoefficientEquivalent===false,
  teamStrengthValueNotClaimed:estimand.effectScale.teamStrengthPointValueEquivalent===false,
  productionPenaltyNotClaimed:estimand.effectScale.productionAvailabilityPenaltyEquivalent===false,
  inferenceDependencyVisible:estimand.aggregation.clusterAwarenessRequired===true
};

const allChecksPass=Object.values(checks).every(Boolean);

console.log(JSON.stringify({
  contractVersion:"FIE-NFL-HISTORICAL-AVAILABILITY-CAUSAL-ESTIMAND-1.0.0",
  sprint:"2.18.15-RC1",
  mode:"READ_ONLY_ESTIMAND_DEFINITION",
  decision:allChecksPass?"ESTIMAND_DEFINED_FOR_MATCHED_COHORT_CONSTRUCTION":"ESTIMAND_REJECTED_REQUIRES_REVIEW",
  policyConstants:{ unmatchedTreatedPolicy:UNMATCHED_TREATED_POLICY },
  sourceSelection:{
    contractVersion:selection?.contractVersion??null,
    sprint:selection?.sprint??null,
    decision:selection?.decision??null
  },
  estimand,
  checks,
  policyRuntimeAudit:{
    estimandPolicyEqualsConstant:
      estimand.scope.unmatchedTreatedHandling === UNMATCHED_TREATED_POLICY,
    estimandPolicyIncludesDoNotForceMatch:
      estimand.scope.unmatchedTreatedHandling.includes("DO NOT FORCE MATCH"),
    estimandPolicyLength:estimand.scope.unmatchedTreatedHandling.length,
    constantPolicyLength:UNMATCHED_TREATED_POLICY.length,
    estimandPolicyCodePoints:[...estimand.scope.unmatchedTreatedHandling].map(ch=>ch.codePointAt(0)),
    constantPolicyCodePoints:[...UNMATCHED_TREATED_POLICY].map(ch=>ch.codePointAt(0))
  },
  authorizationBoundary:{
    matchedCohortConstructionMayAdvance:allChecksPass,
    matchedDatasetPersistenceAuthorized:false,
    outcomesMayBeJoinedDuringNextGovernedConstruction:false,
    causalEffectEstimationAuthorized:false,
    inferentialClaimsAuthorized:false,
    learnedWeightsAuthorized:false,
    calibrationAuthorized:false,
    teamStrengthMutationAuthorized:false,
    decisionModelMutationAuthorized:false,
    pickemMutationAuthorized:false
  },
  safeguards:{
    outcomeValuesRead:false,
    effectEstimated:false,
    matchedDatasetPersisted:false,
    unmatchedTreatedForcedIntoSupport:false,
    learnedWeightsCreated:false,
    calibrationExecuted:false,
    decisionModelMutated:false,
    teamStrengthMutated:false,
    pickemScoringMutated:false,
    databaseMutated:false
  }
},null,2));

if(!allChecksPass) process.exitCode=2;
