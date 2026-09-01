import { buildNFLFIEV2C3LiveFeatureInput } from "../../src/engines/gameDecisionSupport/v2/NFLFIEV2C3LiveFeatureAdapter.js";
import { evaluateNFLFIEV2C3ShadowDecision } from "../../src/engines/gameDecisionSupport/v2/NFLFIEV2C3ShadowRuntime.js";

export function createFieV2C3ShadowComposition({
  buildFeatureInput = buildNFLFIEV2C3LiveFeatureInput,
  evaluateDecision = evaluateNFLFIEV2C3ShadowDecision,
} = {}) {
  return Object.freeze({
    async getShadowDecision({ game, generatedAt }) {
      const feature = buildFeatureInput(game);
      const decision = evaluateDecision({
        game,
        featureInput: feature.featureInput,
        generatedAt,
      });
      return Object.freeze({ decision, featureProvenance: feature.provenance });
    },
    governance: Object.freeze({
      productionAuthorityGranted: false,
      pickemPresentationAuthorityGranted: false,
      decisionCacheWriteAuthorized: false,
      shadowSnapshotPersistenceAuthorized: true,
      persistenceScope: "PICKEM_FIE_PREDICTION_SNAPSHOTS_ONLY",
    }),
  });
}

export default { createFieV2C3ShadowComposition };
