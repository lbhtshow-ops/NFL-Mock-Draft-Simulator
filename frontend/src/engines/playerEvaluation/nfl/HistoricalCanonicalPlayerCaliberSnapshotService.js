import { hardenNFLPlayerEvaluation } from "./NFLPlayerEvaluationGovernance.js";
import { adaptNFLPlayerEvaluationToCanonicalCaliber } from "../caliber/adapters/NFLPlayerCaliberAdapter.js";
import { createNFLHistoricalPlayerCaliberSnapshot } from "../../teamIntelligence/strength/calibration/playerEvidence/NFLHistoricalPlayerCaliberSnapshotContract.js";

export const HISTORICAL_CANONICAL_PLAYER_CALIBER_SNAPSHOT_SERVICE_VERSION=
 "FIE-NFL-HISTORICAL-CANONICAL-CALIBER-SNAPSHOT-SERVICE-1.0.0";

function finite(v){return typeof v==="number" && Number.isFinite(v);}

export function buildHistoricalRosterEvaluationEnvelope({
 rawPositionEvaluation=null,
 completedHistoricalInput=null,
 completedCanonicalInput=null,
}={}){
 const raw=rawPositionEvaluation && typeof rawPositionEvaluation==="object"
  ? rawPositionEvaluation : {};
 const input=completedHistoricalInput || {};
 const scores=completedCanonicalInput?.scores || {};
 const usage=input.usageProfile || null;
 const perf=input.performanceProfile || null;
 const recognition=input.recognitionSummary || null;

 return {
  playerTier:raw.playerTier || raw.tier || null,
  playerQuality:finite(raw.playerQuality) ? raw.playerQuality : null,
  rosterValue:finite(raw.rosterValue) ? raw.rosterValue : null,
  positionEvaluation:{
   model:raw.positionModel || raw.model || null,
   starterOutlook:raw.starterOutlook ?? null,
   longTermAnswer:raw.longTermAnswer ?? null,
   performanceEvaluation:raw.performanceEvaluation || null,
   prospectCarryover:null,
   notes:Array.isArray(raw.notes) ? raw.notes : [],
  },
  usage:{
   available:Boolean(usage?.available),
   usageScore:finite(scores.usageScore) ? scores.usageScore : null,
   gamesTracked:usage?.gamesTracked || 0,
   offenseSnaps:usage?.offenseSnaps || 0,
   defenseSnaps:usage?.defenseSnaps || 0,
   specialTeamsSnaps:usage?.specialTeamsSnaps || 0,
   totalSnaps:usage?.totalSnaps || 0,
   maxWeeklySnapShare:usage?.maxWeeklySnapShare || 0,
   matchedBy:usage?.matchedBy || null,
  },
  production:{
   available:Boolean(perf?.available),
   productionScore:finite(scores.productionScore) ? scores.productionScore : null,
   gamesTracked:perf?.gamesTracked || 0,
   matchedBy:perf?.matchedBy || null,
  },
  recognition:{
   available:Boolean(recognition?.available),
   recognitionScore:finite(scores.recognitionScore) ? scores.recognitionScore : null,
   tier:recognition?.tier || "No Major Recognition",
   awards:Array.isArray(recognition?.awards) ? recognition.awards : [],
   confidence:finite(recognition?.confidence) ? recognition.confidence : 0,
   summary:recognition?.summary || "No qualified historical recognition profile available.",
  },
 };
}

export function createCanonicalHistoricalCaliberSnapshot({
 player={},
 target={},
 rawPositionEvaluation=null,
 completedCanonicalInput=null,
 deterministicRepeat=false,
 gameId=null,
}={}){
 const envelope=buildHistoricalRosterEvaluationEnvelope({
  rawPositionEvaluation,
  completedHistoricalInput:target,
  completedCanonicalInput,
 });
 const hardened=hardenNFLPlayerEvaluation({player,evaluation:envelope});
 const caliber=adaptNFLPlayerEvaluationToCanonicalCaliber({
  player,
  evaluation:hardened,
 });

 const modelVersion=
  caliber?.versions?.model ||
  caliber?.versions?.evaluator ||
  hardened?.versions?.model ||
  hardened?.versions?.evaluator ||
  null;

 const eligible=
  deterministicRepeat===true &&
  caliber?.available===true &&
  finite(caliber?.caliberGrade) &&
  finite(caliber?.confidence) &&
  Boolean(modelVersion);

 const snapshot=createNFLHistoricalPlayerCaliberSnapshot({
  playerId:target?.playerId || player?.playerId || player?.id || null,
  team:target?.team || player?.identity?.team || null,
  position:target?.normalizedPosition || player?.identity?.position || player?.position || null,
  season:target?.season,
  week:target?.week,
  gameId,
  asOf:target?.asOf,
  kickoffAt:target?.kickoffAt,
  status:eligible ? "AVAILABLE" : "UNAVAILABLE",
  caliber:eligible ? caliber.caliberGrade : null,
  confidence:eligible ? caliber.confidence : null,
  modelVersion,
  evidenceVersion:"FIE-NFL-HISTORICAL-CANONICAL-INPUT-COMPLETION-1.0.0",
  provenance:{
   snapshotService:HISTORICAL_CANONICAL_PLAYER_CALIBER_SNAPSHOT_SERVICE_VERSION,
   canonicalSourceField:"playerQuality",
   rosterValueNotUsedAsCaliber:true,
   canonicalReadiness:caliber?.readiness || null,
   missingEvidence:caliber?.missingEvidence || [],
   evidenceRefs:caliber?.evidenceRefs || [],
   sources:caliber?.sources || [],
   sourceEvaluation:caliber?.sourceEvaluation || null,
   versions:caliber?.versions || null,
   inputProvenance:target?.provenance || null,
   deterministicRepeat,
  },
 });

 return Object.freeze({
  status:snapshot.status,
  snapshot,
  hardenedEvaluation:hardened,
  canonicalCaliber:caliber,
 });
}

export default {
 buildHistoricalRosterEvaluationEnvelope,
 createCanonicalHistoricalCaliberSnapshot,
};
