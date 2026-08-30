export const NFL_OPPONENT_ADJUSTMENT_EVIDENCE_BINDING_2D3A_R1 =
Object.freeze({
  contractVersion:
    "FIE-NFL-OPPONENT-ADJUSTMENT-EVIDENCE-BINDING-GOVERNANCE-1.0.0",
  sprint: "2D.3A-R1",
  canonicalPaths: Object.freeze({
    treatedActualMargin: "treated.outcome.actualTeamMargin",
    controlActualMargin: "control.outcome.actualTeamMargin",
    treatedExpectedMargin: "treated.outcome.expectedTeamMargin",
    controlExpectedMargin: "control.outcome.expectedTeamMargin",
    treatedResidual: "treated.outcome.gamePerformanceResidual",
    controlResidual: "control.outcome.gamePerformanceResidual",
  }),
  purpose:
    "Bind the existing matched outcome schema to the final opponent/context sensitivity gate without creating new historical or opponent models.",
  historicalConstructionReopeningAuthorized: false,
  newOpponentModelAuthorized: false,
  rawPointMarginMayBecomeObservedPlayerImpact: false,
  canonicalATTReconciliationRequired: true,
  fiveSeasonCoverageRequired: true,
  safeguards: Object.freeze({
    mode: "SHADOW_ONLY",
    productionWeightsFitAuthorized: false,
    calibrationAuthorized: false,
    teamStrengthMutationAuthorized: false,
    decisionModelMutationAuthorized: false,
    pickemMutationAuthorized: false,
  }),
});
