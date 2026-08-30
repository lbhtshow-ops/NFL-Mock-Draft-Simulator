export const NFL_HISTORICAL_AVAILABILITY_SOURCE_GOVERNANCE=Object.freeze({
  contractVersion:"FIE-NFL-HISTORICAL-AVAILABILITY-SOURCE-GOVERNANCE-1.0.0",
  purpose:"PREGAME_PLAYER_AVAILABILITY_EVIDENCE",
  sources:Object.freeze({
    nflverseInjuries:Object.freeze({
      id:"NFLVERSE_INJURIES",
      role:"CANDIDATE_PRIMARY_HISTORICAL_INJURY_REPORT_SOURCE",
      status:"QUALIFICATION_REQUIRED",
      canonicality:"NFLVERSE_DERIVED_PRACTICE_REPORT_INJURY_DATA",
      knownLimitation:"CURRENT_NFLREADR_LOAD_INJURIES_PATH_HAS_A_REPORTED_2025_FAILURE",
      mayAuthorize2025Acquisition:false,
      mayFabricateMissingWeeks:false
    }),
    weeklyRosters:Object.freeze({
      id:"NFLVERSE_WEEKLY_ROSTERS",
      role:"ROSTER_MEMBERSHIP_CONTEXT_ONLY",
      status:"APPROVED_CONTEXT",
      mayInferInjuryFromRosterStatus:false
    })
  }),
  temporalPolicy:Object.freeze({
    evidenceMustExistBeforeKickoff:true,
    finalGameInactiveStatusMayBeUsedAsPregameEvidence:false,
    postKickoffUpdatesAllowed:false,
    unknownRemainsNull:true
  }),
  calibrationPolicy:Object.freeze({
    sourceQualificationRequiredBeforeAvailabilityCalibration:true,
    availabilityCoverageMustBeMeasuredBySeason:true,
    partialSeasonCoverageMustRemainExplicit:true,
    learnedAvailabilityWeightsAuthorized:false
  })
});
export function getNFLHistoricalAvailabilitySourceGovernance(){
  return NFL_HISTORICAL_AVAILABILITY_SOURCE_GOVERNANCE;
}
