import assert from "node:assert/strict";
import {
  historicalNFLPlayerEvaluationProvider,
  projectHistoricalNFLPlayerEvaluationContext,
} from "../playerEvaluation/nfl/HistoricalNFLPlayerEvaluationProvider.js";
import {
  getNFLHistoricalPlayerEvaluationProviderGovernance as getGovernance,
} from "../teamIntelligence/strength/calibration/index.js";

const g=getGovernance();

const blocked=historicalNFLPlayerEvaluationProvider({
  player:{id:"P1"},
  asOf:"2024-09-01T12:00:00Z",
  evidenceBundle:{
    targetWeekIncluded:true,
    futureWeekIncluded:false,
    futureSeasonIncluded:false,
  },
});

const ready=projectHistoricalNFLPlayerEvaluationContext({
  player:{id:"P1",position:"QB"},
  asOf:"2024-09-01T12:00:00Z",
  evidenceBundle:{
    targetWeekIncluded:false,
    futureWeekIncluded:false,
    futureSeasonIncluded:false,
    priorCurrentSeasonWeeklyStats:[
      {passingAttempts:30,passingYards:250,passingTDs:2,interceptions:1},
      {passingAttempts:25,passingYards:220,passingTDs:1,interceptions:0},
    ],
    priorSnapEvidence:[
      {offenseSnaps:65,defenseSnaps:0,specialTeamsSnaps:0,snapShare:0.98},
      {offenseSnaps:62,defenseSnaps:0,specialTeamsSnaps:0,snapShare:0.95},
    ],
  },
});

const providerResult=historicalNFLPlayerEvaluationProvider({
  player:{id:"P1",position:"QB"},
  asOf:"2024-09-01T12:00:00Z",
  evidenceBundle:{
    targetWeekIncluded:false,
    futureWeekIncluded:false,
    futureSeasonIncluded:false,
    priorCurrentSeasonWeeklyStats:[],
  },
});

const checks={
  contract:g.contractVersion==="FIE-NFL-HISTORICAL-PLAYER-EVALUATION-PROVIDER-GOVERNANCE-1.0.0",
  declaresSupport:historicalNFLPlayerEvaluationProvider.supportsHistoricalEvidence===true,
  unsafeBlocked:blocked.reason==="HISTORICAL_EVIDENCE_NOT_TEMPORALLY_SAFE",
  readyStatus:ready.status==="READY_FOR_CANONICAL_POSITION_MODEL_ADAPTER",
  usageBuilt:ready.context.usageProfile.totalSnaps===127,
  performanceBuilt:ready.context.performanceProfile.totals.passingYards===470,
  noScore:typeof ready.context.playerQuality==="undefined",
  providerStopsBeforeModel:providerResult.reason==="CANONICAL_POSITION_MODEL_HISTORICAL_ADAPTER_REQUIRED",
  noCurrentIndexes:g.currentIndexesAllowed===false,
  noCurrentRoster:g.currentRosterLookupAllowed===false,
  noCurrentRating:g.currentRatingBackfillAllowed===false,
  noSynthetic:g.syntheticCaliberAllowed===false,
  noTarget:g.targetWeekEvidenceAllowed===false,
  noFutureWeek:g.futureWeekEvidenceAllowed===false,
  noFutureSeason:g.futureSeasonEvidenceAllowed===false,
  canonicalOwner:g.positionModelMustRemainCanonicalOwner===true,
  noFormula:g.playerQualityFormulaMayNotBeReimplemented===true,
  scoringBlocked:g.scoringAuthorized===false,
  noCalibration:g.calibrationAuthorized===false,
  noWeights:g.learnedWeightsAuthorized===false,
  noMutation:g.datasetMutationAuthorized===false
};

const bad=Object.entries(checks).filter(([,v])=>!v);
console.log(JSON.stringify({
  suite:"NFL Historical Player Evaluation Provider Foundation",
  contractVersion:g.contractVersion,
  status:bad.length?"FAIL":"PASS",
  passed:Object.keys(checks).length-bad.length,
  failed:bad.length,
  checks
},null,2));
assert.equal(bad.length,0);
