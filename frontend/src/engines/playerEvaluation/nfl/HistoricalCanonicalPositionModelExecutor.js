import { evaluateQuarterback } from "../positionModels/QuarterbackEvaluationModel.js";
import { evaluateRunningBack } from "../positionModels/RunningBackEvaluationModel.js";
import { evaluateReceiver } from "../positionModels/ReceiverEvaluationModel.js";
import { evaluateOffensiveLine } from "../positionModels/OffensiveLineEvaluationModel.js";
import { evaluateDefensiveLine } from "../positionModels/DefensiveLineEvaluationModel.js";
import { evaluateLinebacker } from "../positionModels/LinebackerEvaluationModel.js";
import { evaluateSecondary } from "../positionModels/SecondaryEvaluationModel.js";
import { evaluateSpecialist } from "../positionModels/SpecialistEvaluationModel.js";

export const HISTORICAL_CANONICAL_POSITION_MODEL_EXECUTOR_VERSION =
  "FIE-NFL-HISTORICAL-CANONICAL-POSITION-MODEL-EXECUTOR-1.0.0";

function positionOf(player={}){
 return player?.identity?.position || player?.position || null;
}

function modelFor(position){
 if(position==="QB") return ["QB",evaluateQuarterback];
 if(["RB","FB"].includes(position)) return ["RB",evaluateRunningBack];
 if(["WR","TE"].includes(position)) return ["RECEIVER",evaluateReceiver];
 if(["OT","IOL"].includes(position)) return ["OFFENSIVE_LINE",evaluateOffensiveLine];
 if(["DL","EDGE"].includes(position)) return ["DEFENSIVE_LINE",evaluateDefensiveLine];
 if(position==="LB") return ["LB",evaluateLinebacker];
 if(["CB","S"].includes(position)) return ["SECONDARY",evaluateSecondary];
 if(["K","P","LS"].includes(position)) return ["SPECIALIST",evaluateSpecialist];
 return [null,null];
}

export function executeHistoricalCanonicalPositionModel({
 player={},
 context=null,
 allowProspectCarryover=false,
}={}){
 if(allowProspectCarryover===true){
  return Object.freeze({status:"UNAVAILABLE",reason:"HISTORICAL_PROSPECT_CARRYOVER_NOT_AUTHORIZED",evaluation:null});
 }
 if(!context?.historical || !context?.asOf){
  return Object.freeze({status:"UNAVAILABLE",reason:"HISTORICAL_CONTEXT_REQUIRED",evaluation:null});
 }

 const position=positionOf(player);
 const [family,fn]=modelFor(position);
 if(!fn){
  return Object.freeze({status:"UNAVAILABLE",reason:"UNSUPPORTED_CANONICAL_POSITION",position,evaluation:null});
 }

 const safeContext={...context,prospectCarryover:null};
 const evaluation=fn(player,safeContext);

 if(!evaluation || typeof evaluation!=="object"){
  return Object.freeze({status:"UNAVAILABLE",reason:"CANONICAL_POSITION_MODEL_RETURNED_NO_EVALUATION",position,family,evaluation:null});
 }

 return Object.freeze({
  status:"AVAILABLE",
  reason:null,
  position,
  family,
  evaluation,
  executorVersion:HISTORICAL_CANONICAL_POSITION_MODEL_EXECUTOR_VERSION,
 });
}

export default {executeHistoricalCanonicalPositionModel};
