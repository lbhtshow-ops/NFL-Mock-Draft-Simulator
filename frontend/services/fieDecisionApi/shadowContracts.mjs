export const SHADOW_REQUEST_CONTRACT = "LBHTFIEV2C3ShadowDecisionRequest";
export const SHADOW_RESPONSE_CONTRACT = "LBHTFIEV2C3ShadowDecisionBundle";
export const SHADOW_CONTRACT_VERSION = "1.0.0";
export const SHADOW_MODEL_ID = "LBHT_FIE_V2_C3_TEAM_PERFORMANCE";
export const SHADOW_MODEL_VERSION = "NFL-GAME-DECISION-MODEL-V2-C3-SHADOW-1.0.0";

export const createShadowError = (code, message, detail = null) => ({
  contract: "LBHTFIEV2C3ShadowDecisionError",
  version: SHADOW_CONTRACT_VERSION,
  error: { code, message, detail },
});

export const createShadowBundle = (decisions, generatedAt) => ({
  contract: SHADOW_RESPONSE_CONTRACT,
  version: SHADOW_CONTRACT_VERSION,
  status: "SHADOW_ONLY",
  generatedAt,
  model: {
    id: SHADOW_MODEL_ID,
    version: SHADOW_MODEL_VERSION,
    status: "SHADOW_ONLY",
  },
  governance: {
    productionAuthorityGranted: false,
    pickemPresentationAuthorityGranted: false,
    decisionCacheWriteAuthorized: false,
    shadowSnapshotPersistenceAuthorized: true,
    persistenceScope: "PICKEM_FIE_PREDICTION_SNAPSHOTS_ONLY",
  },
  decisions,
});
