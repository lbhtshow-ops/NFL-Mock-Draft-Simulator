export const NFL_DECISION_PLAYER_IMPACT_EXPLAINABILITY_VERSION =
  "FIE-NFL-DECISION-PLAYER-IMPACT-EXPLAINABILITY-1.0.0";

const finiteOrNull = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const stringOrNull = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const valueOrNull = (value) =>
  value === undefined || value === null ? null : value;

const tierFromCanonicalCaliber = (caliber) =>
  stringOrNull(
    caliber?.tier ??
      caliber?.caliberTier ??
      caliber?.playerCaliberTier ??
      caliber?.classification ??
      null
  );

const dependencyFromEvidence = (evidence) =>
  valueOrNull(
    evidence?.dependency ??
      evidence?.level ??
      evidence?.teamDependency ??
      null
  );

const positionImportanceFromContext = (context) =>
  valueOrNull(
    context?.positionImportance ??
      context?.role?.positionImportance ??
      context?.impactContext?.positionImportance ??
      null
  );

const canonicalReplacementGap = ({
  contextResolution,
  availabilityResult,
}) =>
  finiteOrNull(
    contextResolution?.replacementGap ??
      contextResolution?.caliberGap ??
      availabilityResult?.replacementGap ??
      null
  );

const canonicalRole = ({ integratedInputs, contextResolution }) =>
  stringOrNull(
    integratedInputs?.role ??
      integratedInputs?.usageEvidence?.role ??
      contextResolution?.role?.role ??
      contextResolution?.role?.depthPosition ??
      null
  );

const canonicalPosition = ({ integratedInputs, contextResolution }) =>
  stringOrNull(
    integratedInputs?.player?.position ??
      contextResolution?.player?.position ??
      contextResolution?.role?.position ??
      null
  );

const replacementIdentity = ({ integratedInputs, contextResolution }) => {
  const replacement =
    integratedInputs?.replacement ??
    contextResolution?.replacement ??
    null;

  return {
    playerId:
      stringOrNull(
        replacement?.playerId ??
          replacement?.player?.playerId ??
          null
      ),
    playerName:
      stringOrNull(
        replacement?.playerName ??
          replacement?.player?.playerName ??
          null
      ),
  };
};

export function projectCanonicalPlayerImpactExplainability({
  integratedInputs = null,
  availabilityResult = null,
} = {}) {
  const contextResolution = integratedInputs?.contextResolution ?? null;
  const replacement = replacementIdentity({
    integratedInputs,
    contextResolution,
  });

  return {
    contract: "NFLDecisionPlayerImpactExplainability",
    version: NFL_DECISION_PLAYER_IMPACT_EXPLAINABILITY_VERSION,

    playerId: stringOrNull(integratedInputs?.player?.playerId),
    playerName: stringOrNull(integratedInputs?.player?.playerName),
    team: stringOrNull(integratedInputs?.player?.team),
    position: canonicalPosition({ integratedInputs, contextResolution }),
    role: canonicalRole({ integratedInputs, contextResolution }),

    availabilityStatus: stringOrNull(
      availabilityResult?.availabilityStatus ??
        contextResolution?.availabilityStatus ??
        null
    ),

    playerCaliberTier: tierFromCanonicalCaliber(
      integratedInputs?.canonicalCaliber
    ),

    expectedReplacementPlayerId: replacement.playerId,
    expectedReplacementName: replacement.playerName,
    expectedReplacementCaliberTier: tierFromCanonicalCaliber(
      integratedInputs?.replacementCaliber
    ),

    // IMPORTANT: adapter never computes caliber/replacement gap.
    // It only projects a canonical upstream value when one exists.
    replacementGap: canonicalReplacementGap({
      contextResolution,
      availabilityResult,
    }),

    teamDependency: dependencyFromEvidence(
      integratedInputs?.teamDependencyEvidence
    ),

    // IMPORTANT: adapter never invents position importance.
    positionImportance: positionImportanceFromContext(contextResolution),

    basePlayerImpact: finiteOrNull(availabilityResult?.basePlayerImpact),
    adjustedPlayerImpact: finiteOrNull(
      availabilityResult?.adjustedPlayerImpact
    ),
    availabilityImpactDelta: finiteOrNull(
      availabilityResult?.availabilityImpactDelta
    ),

    policyVersion: stringOrNull(availabilityResult?.policyVersion),

    provenance: {
      playerImpactInputVersion:
        stringOrNull(integratedInputs?.version),
      caliberContractVersion:
        stringOrNull(integratedInputs?.canonicalCaliber?.version),
      replacementCaliberContractVersion:
        stringOrNull(integratedInputs?.replacementCaliber?.version),
      teamDependencyContractVersion:
        stringOrNull(integratedInputs?.teamDependencyEvidence?.version),
      availabilityPolicyContractVersion:
        stringOrNull(availabilityResult?.contractVersion),
      availabilityPolicyId:
        stringOrNull(availabilityResult?.policyId),
    },

    safeguards: {
      readOnlyExplainability: true,
      caliberInferredByAdapter: false,
      replacementQualityInferredByAdapter: false,
      replacementGapCalculatedByAdapter: false,
      positionImportanceInventedByAdapter: false,
      playerImpactRecalculatedByAdapter: false,
      availabilityMathReappliedByAdapter: false,
    },
  };
}

export default {
  NFL_DECISION_PLAYER_IMPACT_EXPLAINABILITY_VERSION,
  projectCanonicalPlayerImpactExplainability,
};
