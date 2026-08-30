export const NFL_TEAM_STRENGTH_FEATURE_GOVERNANCE = Object.freeze({
  contractVersion: "FIE-NFL-TEAM-STRENGTH-FEATURE-GOVERNANCE-1.0.0",
  rules: Object.freeze({
    featuresMustExistBeforeKickoff: true,
    postgameEvidenceAsPregameFeatureAllowed: false,
    gameOutcomeAsFeatureAllowed: false,
    futureAvailabilityAsFeatureAllowed: false,
    futureDepthChartAsFeatureAllowed: false,
    missingEvidenceImputedAsZero: false,
    missingPlayerCaliberMeansReplacementLevel: false,
    coachingSchemeNumericEncodingAuthorized: false,
    opponentAdjustmentAuthorized: false,
    learnedWeightsProductionAuthorized: false,
  }),
  temporalWindows: Object.freeze({
    seasonToDate: "CONFIGURABLE",
    recentForm: "CONFIGURABLE",
    playerAvailability: "AS_OF_EVIDENCE_CUTOFF",
    rosterDepth: "AS_OF_EVIDENCE_CUTOFF",
  }),
});
