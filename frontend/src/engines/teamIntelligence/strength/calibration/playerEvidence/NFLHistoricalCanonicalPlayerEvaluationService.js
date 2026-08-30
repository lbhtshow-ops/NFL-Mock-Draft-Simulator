
import { evaluateCanonicalNFLPlayer } from "../../../../playerEvaluation/nfl/CanonicalNFLPlayerEvaluationService.js";
import { resolveCanonicalPlayerCaliber } from "../../../../playerEvaluation/caliber/CanonicalPlayerCaliberService.js";
import { PLAYER_CALIBER_SUBJECT_KINDS } from "../../../../playerEvaluation/caliber/CanonicalPlayerCaliberContract.js";
import { createNFLHistoricalPlayerCaliberSnapshot, validateNFLHistoricalPlayerCaliberSnapshot } from "./NFLHistoricalPlayerCaliberSnapshotContract.js";
import { adaptHistoricalPlayerEvaluationInput } from "./NFLHistoricalPlayerEvaluationInputAdapter.js";

export const NFL_HISTORICAL_CANONICAL_PLAYER_EVALUATION_VERSION =
  "FIE-NFL-HISTORICAL-CANONICAL-PLAYER-EVALUATION-1.0.0";

export function evaluateHistoricalCanonicalNFLPlayer({bundle={},supplementalSnapRows=[],gameId=null}={}){
  const adapted=adaptHistoricalPlayerEvaluationInput({bundle,supplementalSnapRows});
  if(adapted.status!=="AVAILABLE"||!adapted.player) return Object.freeze({contract:"NFLHistoricalCanonicalPlayerEvaluation",
    version:NFL_HISTORICAL_CANONICAL_PLAYER_EVALUATION_VERSION,status:"UNAVAILABLE",reason:adapted.reason,
    canonicalEvaluation:null,canonicalCaliber:null,snapshot:null,snapshotValidation:null});

  const canonicalEvaluation=evaluateCanonicalNFLPlayer(adapted.player);
  const canonicalCaliber=resolveCanonicalPlayerCaliber({subjectKind:PLAYER_CALIBER_SUBJECT_KINDS.NFL_PLAYER,
    player:adapted.player,nflEvaluation:canonicalEvaluation});
  const available=canonicalCaliber?.available===true&&Number.isFinite(canonicalCaliber?.caliberGrade);

  const snapshot=createNFLHistoricalPlayerCaliberSnapshot({
    playerId:bundle?.playerId,team:bundle?.team,position:bundle?.position||adapted.player?.identity?.position||null,
    season:Number.isInteger(Number(bundle?.season))?Number(bundle.season):null,
    week:Number.isInteger(Number(bundle?.week))?Number(bundle.week):null,gameId:gameId||bundle?.gameId||null,
    asOf:bundle?.asOf,kickoffAt:bundle?.kickoffAt,status:available?"AVAILABLE":"UNAVAILABLE",
    caliber:available?canonicalCaliber.caliberGrade:null,confidence:available?canonicalCaliber.confidence:null,
    modelVersion:canonicalCaliber?.versions?.model||canonicalCaliber?.versions?.evaluator||null,
    evidenceVersion:bundle?.contractVersion||null,
    provenance:{adapter:"NFLHistoricalPlayerEvaluationInputAdapter",canonicalEvaluation:{engine:canonicalCaliber?.sourceEvaluation?.engine||null,
      model:canonicalCaliber?.sourceEvaluation?.model||null,evaluatorVersion:canonicalCaliber?.versions?.evaluator||null,
      modelVersion:canonicalCaliber?.versions?.model||null,weightVersion:canonicalCaliber?.versions?.weights||null},
      historicalEvidence:adapted.player?.historicalEvaluationEvidence?.provenance||null,
      evidenceRefs:canonicalCaliber?.evidenceRefs||[],sources:canonicalCaliber?.sources||[]}
  });
  const snapshotValidation=validateNFLHistoricalPlayerCaliberSnapshot(snapshot);
  return Object.freeze({contract:"NFLHistoricalCanonicalPlayerEvaluation",version:NFL_HISTORICAL_CANONICAL_PLAYER_EVALUATION_VERSION,
    status:available&&snapshotValidation.valid?"AVAILABLE":available?"PARTIAL":"UNAVAILABLE",
    reason:available&&!snapshotValidation.valid?"HISTORICAL_SNAPSHOT_IDENTITY_OR_TEMPORAL_FIELDS_INCOMPLETE":!available?"CANONICAL_CALIBER_UNAVAILABLE":null,
    canonicalEvaluation,canonicalCaliber,snapshot,snapshotValidation,
    safeguards:{currentRatingBackfillUsed:false,futureEvidenceUsed:false,targetWeekEvidenceUsed:false,currentRecognitionUsed:false,
      syntheticCaliberUsed:false,adapterCalculatedCaliber:false}});
}

export default { NFL_HISTORICAL_CANONICAL_PLAYER_EVALUATION_VERSION, evaluateHistoricalCanonicalNFLPlayer };
