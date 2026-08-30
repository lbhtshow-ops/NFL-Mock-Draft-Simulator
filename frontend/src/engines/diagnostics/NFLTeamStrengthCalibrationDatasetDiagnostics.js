import assert from "node:assert/strict";
import {
  CALIBRATION_SPLIT,
  createNFLTeamStrengthCalibrationObservation,
  validateNFLTeamStrengthCalibrationObservation,
  createNFLTeamStrengthExperimentSpecification,
  NFL_TEAM_STRENGTH_FEATURE_GOVERNANCE,
  buildNFLTeamStrengthCalibrationDataset,
} from "../teamIntelligence/strength/calibration/index.js";

const tests=[]; const t=(name,fn)=>{try{fn();tests.push([name,true])}catch(e){tests.push([name,false,e.message])}};

const base = {
  observationId:"2025-W01-BAL-BUF-BAL",
  gameId:"2025_01_BAL_BUF",
  team:"BAL", opponent:"BUF", season:2025, week:1,
  kickoffAt:"2025-09-07T20:20:00Z",
  evidenceAsOf:"2025-09-07T19:00:00Z",
  split:CALIBRATION_SPLIT.TRAIN,
  evidence:{
    playerCaliber:{status:"AVAILABLE"},
    rosterDepth:{status:"AVAILABLE"},
    availabilityImpact:{status:"AVAILABLE"},
    unitState:{status:"AVAILABLE"},
    performance:{epaPerPlay:.05},
    recentForm:null,
    coaching:{status:"AVAILABLE"},
    scheme:{status:"AVAILABLE"},
  },
  outcome:{status:"FINAL",teamPoints:24,opponentPoints:20,won:true},
  provenance:{evidenceSourceIds:["research-repository"],outcomeSourceIds:["official-results"]},
};

const obs=createNFLTeamStrengthCalibrationObservation(base);
const validation=validateNFLTeamStrengthCalibrationObservation(obs);
const experiment=createNFLTeamStrengthExperimentSpecification({
  experimentId:"EXP-001", hypothesis:"Availability and replacement caliber improve current-strength estimation.",
  datasetVersion:"DATASET-001", featureSetVersion:"FEATURES-001"
});
const dataset=buildNFLTeamStrengthCalibrationDataset([
  base,
  {...base, observationId:"bad", evidenceAsOf:"2025-09-08T00:00:00Z", split:CALIBRATION_SPLIT.HOLDOUT}
],{datasetVersion:"DATASET-001"});

t("observation_contract_version",()=>assert.equal(obs.contractVersion,"FIE-NFL-TEAM-STRENGTH-CALIBRATION-OBSERVATION-1.0.0"));
t("observation_id_preserved",()=>assert.equal(obs.observationId,base.observationId));
t("game_id_preserved",()=>assert.equal(obs.gameId,base.gameId));
t("team_preserved",()=>assert.equal(obs.team,"BAL"));
t("opponent_preserved",()=>assert.equal(obs.opponent,"BUF"));
t("season_preserved",()=>assert.equal(obs.season,2025));
t("week_preserved",()=>assert.equal(obs.week,1));
t("kickoff_preserved",()=>assert.equal(obs.kickoffAt,base.kickoffAt));
t("evidence_cutoff_preserved",()=>assert.equal(obs.evidenceAsOf,base.evidenceAsOf));
t("pregame_evidence_is_leakage_safe",()=>assert.equal(obs.leakageSafe,true));
t("future_evidence_is_not_safe",()=>assert.equal(createNFLTeamStrengthCalibrationObservation({...base,evidenceAsOf:"2025-09-08T00:00:00Z"}).leakageSafe,false));
t("valid_observation_passes",()=>assert.equal(validation.valid,true));
t("future_leakage_rejected",()=>assert.ok(validateNFLTeamStrengthCalibrationObservation(createNFLTeamStrengthCalibrationObservation({...base,evidenceAsOf:"2025-09-08T00:00:00Z"})).errors.includes("FUTURE_DATA_LEAKAGE")));
t("split_required",()=>assert.ok(validateNFLTeamStrengthCalibrationObservation(createNFLTeamStrengthCalibrationObservation({...base,split:null})).errors.includes("SPLIT_REQUIRED")));
t("train_split_supported",()=>assert.equal(obs.split,"TRAIN"));
t("holdout_split_supported",()=>assert.equal(createNFLTeamStrengthCalibrationObservation({...base,split:CALIBRATION_SPLIT.HOLDOUT}).split,"HOLDOUT"));
t("player_caliber_preserved",()=>assert.equal(obs.evidence.playerCaliber.status,"AVAILABLE"));
t("availability_preserved",()=>assert.equal(obs.evidence.availabilityImpact.status,"AVAILABLE"));
t("performance_preserved",()=>assert.equal(obs.evidence.performance.epaPerPlay,.05));
t("missing_recent_form_remains_null",()=>assert.equal(obs.evidence.recentForm,null));
t("final_outcome_preserved",()=>assert.equal(obs.outcome.status,"FINAL"));
t("point_differential_derived_from_final_result",()=>assert.equal(obs.outcome.pointDifferential,4));
t("win_result_preserved",()=>assert.equal(obs.outcome.won,true));
t("evidence_provenance_preserved",()=>assert.ok(obs.provenance.evidenceSourceIds.includes("research-repository")));
t("outcome_provenance_preserved",()=>assert.ok(obs.provenance.outcomeSourceIds.includes("official-results")));
t("experiment_contract_version",()=>assert.equal(experiment.contractVersion,"FIE-NFL-TEAM-STRENGTH-EXPERIMENT-1.0.0"));
t("experiment_not_executed",()=>assert.equal(experiment.status,"SPECIFIED_NOT_EXECUTED"));
t("chronological_split_required",()=>assert.equal(experiment.splitPolicy.chronological,true));
t("holdout_required",()=>assert.equal(experiment.splitPolicy.holdoutRequired,true));
t("future_season_leakage_blocked",()=>assert.equal(experiment.splitPolicy.futureSeasonLeakageAllowed,false));
t("future_week_leakage_blocked",()=>assert.equal(experiment.splitPolicy.futureWeekLeakageAllowed,false));
t("same_game_outcome_feature_blocked",()=>assert.equal(experiment.splitPolicy.sameGameOutcomeAsFeatureAllowed,false));
t("position_availability_analysis_required",()=>assert.ok(experiment.requiredAnalyses.includes("POSITION_AVAILABILITY_SENSITIVITY")));
t("player_caliber_analysis_required",()=>assert.ok(experiment.requiredAnalyses.includes("PLAYER_CALIBER_SENSITIVITY")));
t("replacement_analysis_required",()=>assert.ok(experiment.requiredAnalyses.includes("REPLACEMENT_CALIBER_SENSITIVITY")));
t("performance_window_analysis_required",()=>assert.ok(experiment.requiredAnalyses.includes("PERFORMANCE_WINDOW_SENSITIVITY")));
t("recent_form_decay_required",()=>assert.ok(experiment.requiredAnalyses.includes("RECENT_FORM_DECAY")));
t("coaching_incremental_value_required",()=>assert.ok(experiment.requiredAnalyses.includes("COACHING_INCREMENTAL_VALUE")));
t("scheme_incremental_value_required",()=>assert.ok(experiment.requiredAnalyses.includes("SCHEME_INCREMENTAL_VALUE")));
t("era_stability_required",()=>assert.ok(experiment.requiredAnalyses.includes("SEASON_ERA_STABILITY")));
t("holdout_generalization_required",()=>assert.ok(experiment.requiredAnalyses.includes("HOLDOUT_GENERALIZATION")));
t("learned_weights_null",()=>assert.equal(experiment.learnedWeights,null));
t("learned_coefficients_null",()=>assert.equal(experiment.learnedCoefficients,null));
t("team_strength_scores_null",()=>assert.equal(experiment.teamStrengthScores,null));
t("pregame_feature_rule",()=>assert.equal(NFL_TEAM_STRENGTH_FEATURE_GOVERNANCE.rules.featuresMustExistBeforeKickoff,true));
t("postgame_feature_blocked",()=>assert.equal(NFL_TEAM_STRENGTH_FEATURE_GOVERNANCE.rules.postgameEvidenceAsPregameFeatureAllowed,false));
t("outcome_feature_blocked",()=>assert.equal(NFL_TEAM_STRENGTH_FEATURE_GOVERNANCE.rules.gameOutcomeAsFeatureAllowed,false));
t("future_availability_blocked",()=>assert.equal(NFL_TEAM_STRENGTH_FEATURE_GOVERNANCE.rules.futureAvailabilityAsFeatureAllowed,false));
t("future_depth_chart_blocked",()=>assert.equal(NFL_TEAM_STRENGTH_FEATURE_GOVERNANCE.rules.futureDepthChartAsFeatureAllowed,false));
t("missing_not_imputed_zero",()=>assert.equal(NFL_TEAM_STRENGTH_FEATURE_GOVERNANCE.rules.missingEvidenceImputedAsZero,false));
t("missing_caliber_not_replacement_level",()=>assert.equal(NFL_TEAM_STRENGTH_FEATURE_GOVERNANCE.rules.missingPlayerCaliberMeansReplacementLevel,false));
t("coaching_numeric_encoding_blocked",()=>assert.equal(NFL_TEAM_STRENGTH_FEATURE_GOVERNANCE.rules.coachingSchemeNumericEncodingAuthorized,false));
t("opponent_adjustment_still_blocked",()=>assert.equal(NFL_TEAM_STRENGTH_FEATURE_GOVERNANCE.rules.opponentAdjustmentAuthorized,false));
t("production_weights_blocked",()=>assert.equal(NFL_TEAM_STRENGTH_FEATURE_GOVERNANCE.rules.learnedWeightsProductionAuthorized,false));
t("availability_uses_asof_cutoff",()=>assert.equal(NFL_TEAM_STRENGTH_FEATURE_GOVERNANCE.temporalWindows.playerAvailability,"AS_OF_EVIDENCE_CUTOFF"));
t("roster_uses_asof_cutoff",()=>assert.equal(NFL_TEAM_STRENGTH_FEATURE_GOVERNANCE.temporalWindows.rosterDepth,"AS_OF_EVIDENCE_CUTOFF"));
t("dataset_contract_version",()=>assert.equal(dataset.contractVersion,"FIE-NFL-TEAM-STRENGTH-CALIBRATION-DATASET-1.0.0"));
t("dataset_version_preserved",()=>assert.equal(dataset.datasetVersion,"DATASET-001"));
t("valid_observation_retained",()=>assert.equal(dataset.observations.length,1));
t("unsafe_observation_rejected",()=>assert.equal(dataset.rejected.length,1));
t("partial_status_when_rejected",()=>assert.equal(dataset.status,"PARTIAL_REJECTED_OBSERVATIONS"));
t("train_split_counted",()=>assert.equal(dataset.splitCounts.TRAIN,1));
t("dataset_learned_weights_null",()=>assert.equal(dataset.learnedWeights,null));
t("dataset_strength_scores_null",()=>assert.equal(dataset.teamStrengthScores,null));
t("dataset_does_not_mutate_source",()=>assert.equal(base.evidence.performance.epaPerPlay,.05));

const bad=tests.filter(x=>!x[1]);
console.log(JSON.stringify({
  suite:"NFL Team Strength Calibration Dataset & Experiment Foundation",
  contractVersion:"FIE-NFL-TEAM-STRENGTH-CALIBRATION-SPRINT-1.0.0",
  status:bad.length?"FAIL":"PASS",
  passed:tests.length-bad.length,
  failed:bad.length,
  checks:Object.fromEntries(tests.map(x=>[x[0],x[1]])),
  failures:bad.map(x=>x[0]+": "+x[2])
},null,2));
if(bad.length)process.exitCode=1;
