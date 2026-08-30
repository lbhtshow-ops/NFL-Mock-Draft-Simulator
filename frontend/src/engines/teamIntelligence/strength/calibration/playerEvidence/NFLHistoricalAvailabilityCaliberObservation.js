export function buildHistoricalAvailabilityCaliberObservation({availability,identity,caliber,replacementCaliber=null}={}){
  const unavailable=availability?.status==="OUT"||availability?.status==="DOUBTFUL";
  return Object.freeze({
    contractVersion:"FIE-NFL-HISTORICAL-AVAILABILITY-CALIBER-OBSERVATION-1.0.0",
    availabilityStatus:availability?.status??null,
    unavailable,
    playerId:identity?.status==="RESOLVED"?identity.canonicalPlayerId:null,
    playerCaliber:caliber?.status==="AVAILABLE"?caliber.caliber:null,
    playerCaliberConfidence:caliber?.status==="AVAILABLE"?caliber.confidence:null,
    replacementCaliber:Number.isFinite(replacementCaliber)?replacementCaliber:null,
    caliberDelta:caliber?.status==="AVAILABLE"&&Number.isFinite(replacementCaliber)?caliber.caliber-replacementCaliber:null,
    eligibleForAvailabilityOnlyExperiment:Boolean(availability?.status),
    eligibleForAvailabilityCaliberExperiment:Boolean(availability?.status)&&caliber?.status==="AVAILABLE",
    eligibleForReplacementCaliberExperiment:Boolean(availability?.status)&&caliber?.status==="AVAILABLE"&&Number.isFinite(replacementCaliber)
  });
}
