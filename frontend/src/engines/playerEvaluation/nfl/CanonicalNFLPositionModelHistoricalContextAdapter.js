import { evaluateQuarterback } from "../positionModels/QuarterbackEvaluationModel.js";
import { evaluateRunningBack } from "../positionModels/RunningBackEvaluationModel.js";
import { evaluateReceiver } from "../positionModels/ReceiverEvaluationModel.js";
import { evaluateOffensiveLine } from "../positionModels/OffensiveLineEvaluationModel.js";
import { evaluateDefensiveLine } from "../positionModels/DefensiveLineEvaluationModel.js";
import { evaluateLinebacker } from "../positionModels/LinebackerEvaluationModel.js";
import { evaluateSecondary } from "../positionModels/SecondaryEvaluationModel.js";
import { evaluateSpecialist } from "../positionModels/SpecialistEvaluationModel.js";

export const NFL_HISTORICAL_POSITION_MODEL_CONTEXT_ADAPTER_VERSION =
  "FIE-NFL-HISTORICAL-POSITION-MODEL-CONTEXT-ADAPTER-1.0.0";

const finiteOrNull=(value)=>
  typeof value==="number" && Number.isFinite(value) ? value : null;

function resolvePosition(player={}){
 return player?.identity?.position || player?.position || null;
}

export function buildCanonicalHistoricalPositionModelContext({
 asOf=null,
 projectedHistoricalContext=null,
 historicalScores=null,
 historicalRecognitionSummary=null,
 historicalPerformanceProfile=null,
}={}){
 if(!asOf){
  return Object.freeze({status:"UNAVAILABLE",reason:"HISTORICAL_AS_OF_REQUIRED",context:null});
 }
 if(!projectedHistoricalContext){
  return Object.freeze({status:"UNAVAILABLE",reason:"PROJECTED_HISTORICAL_CONTEXT_REQUIRED",context:null});
 }

 const scores=historicalScores || {};
 const recognitionSummary=
   historicalRecognitionSummary ??
   projectedHistoricalContext?.recognitionSummary ??
   null;
 const performanceProfile=
   historicalPerformanceProfile ??
   projectedHistoricalContext?.performanceProfile ??
   null;

 const context=Object.freeze({
  statusScore:finiteOrNull(scores.statusScore),
  experienceScore:finiteOrNull(scores.experienceScore),
  usageScore:finiteOrNull(scores.usageScore),
  productionScore:finiteOrNull(scores.productionScore),
  recognitionScore:finiteOrNull(scores.recognitionScore),
  recognitionSummary,
  performanceProfile,
  historical:true,
  asOf,
  prospectCarryover:null,
 });

 const missingScoreFields=[
  ["statusScore",context.statusScore],
  ["experienceScore",context.experienceScore],
  ["usageScore",context.usageScore],
  ["productionScore",context.productionScore],
  ["recognitionScore",context.recognitionScore],
 ].filter(([,v])=>v===null).map(([k])=>k);

 return Object.freeze({
  status:"READY_FOR_POSITION_MODEL" ,
  reason:null,
  context,
  missingScoreFields:Object.freeze(missingScoreFields),
  adapterVersion:NFL_HISTORICAL_POSITION_MODEL_CONTEXT_ADAPTER_VERSION,
 });
}

export function evaluateCanonicalPositionModelWithHistoricalContext({
 player={},
 asOf=null,
 projectedHistoricalContext=null,
 historicalScores=null,
 historicalRecognitionSummary=null,
 historicalPerformanceProfile=null,
 allowHistoricalProspectCarryover=false,
}={}){
 if(allowHistoricalProspectCarryover===true){
  return Object.freeze({
   status:"UNAVAILABLE",
   reason:"HISTORICAL_PROSPECT_CARRYOVER_NOT_YET_QUALIFIED",
   evaluation:null,
  });
 }

 const projected=buildCanonicalHistoricalPositionModelContext({
  asOf,projectedHistoricalContext,historicalScores,
  historicalRecognitionSummary,historicalPerformanceProfile,
 });
 if(projected.status!=="READY_FOR_POSITION_MODEL"){
  return Object.freeze({status:"UNAVAILABLE",reason:projected.reason,evaluation:null});
 }

 // C8 does not authorize model execution yet. This function proves dispatch
 // ownership and the exact canonical context envelope while preserving a hard
 // gate before scoring. C9 can authorize a bounded sample after the historical
 // score projections are qualified.
 return Object.freeze({
  status:"READY_FOR_CONTROLLED_MODEL_EXECUTION",
  reason:null,
  position:resolvePosition(player),
  context:projected.context,
  missingScoreFields:projected.missingScoreFields,
  evaluation:null,
  dispatchOwner:"CANONICAL_NFL_POSITION_MODELS",
  supportedDispatch:Object.freeze({
   QB:evaluateQuarterback,
   RB:evaluateRunningBack,FB:evaluateRunningBack,
   WR:evaluateReceiver,TE:evaluateReceiver,
   OT:evaluateOffensiveLine,IOL:evaluateOffensiveLine,
   DL:evaluateDefensiveLine,EDGE:evaluateDefensiveLine,
   LB:evaluateLinebacker,
   CB:evaluateSecondary,S:evaluateSecondary,
   K:evaluateSpecialist,P:evaluateSpecialist,LS:evaluateSpecialist,
  }),
 });
}

export default {
 buildCanonicalHistoricalPositionModelContext,
 evaluateCanonicalPositionModelWithHistoricalContext,
};
