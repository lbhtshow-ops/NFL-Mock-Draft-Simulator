export const generatedNFLFIEV2C3ShadowModel = {
  "contract": "NFLFIEV2C3ShadowModelConfig",
  "version": "1.0.0",
  "modelId": "LBHT_FIE_V2_C3_TEAM_PERFORMANCE",
  "modelVersion": "NFL-GAME-DECISION-MODEL-V2-C3-SHADOW-1.0.0",
  "status": "SHADOW_ONLY",
  "productionAuthorityGranted": false,
  "pickemPresentationAuthorityGranted": false,
  "trainingCutoffSeason": 2025,
  "source": "LBHT_FIE_HISTORICAL_PREGAME_SNAPSHOTS_AND_DECISION_DATASET",
  "frozenCandidate": "E1_C3_TEAM_PERFORMANCE",
  "featureKeys": [
    "teamEpaComposite",
    "teamSuccessRate",
    "teamExplosiveness",
    "opponentContextResidual"
  ],
  "opponentResidualizer": {
    "intercept": 0.6178008932769156,
    "coefficients": {
      "teamEpaComposite": 35.14994635845933,
      "teamSuccessRate": 2.4543528486171216,
      "teamExplosiveness": -2.45947522773725
    },
    "normalization": {
      "teamEpaComposite": {
        "mean": 0.001980888248105614,
        "sd": 0.16783173457059297
      },
      "teamSuccessRate": {
        "mean": -0.00016365204488066117,
        "sd": 0.05822190294022687
      },
      "teamExplosiveness": {
        "mean": 5.405145331863134e-05,
        "sd": 0.042007336038041944
      }
    },
    "trainingRows": 2127,
    "ridge": 0.05,
    "featureKeys": [
      "teamEpaComposite",
      "teamSuccessRate",
      "teamExplosiveness"
    ]
  },
  "marginModel": {
    "intercept": 1.5726375176304654,
    "coefficients": {
      "teamEpaComposite": 4.047990322251849,
      "teamSuccessRate": 1.7844942583894217,
      "teamExplosiveness": -0.0477157691975158,
      "opponentContextResidual": 0.4664533928946958
    },
    "normalization": {
      "teamEpaComposite": {
        "mean": 0.001980888248105614,
        "sd": 0.16783173457059297
      },
      "teamSuccessRate": {
        "mean": -0.00016365204488066117,
        "sd": 0.05822190294022687
      },
      "teamExplosiveness": {
        "mean": 5.405145331863134e-05,
        "sd": 0.042007336038041944
      },
      "opponentContextResidual": {
        "mean": -3.574427490659648e-16,
        "sd": 11.580119227800806
      }
    },
    "trainingRows": 2127,
    "ridge": 0.05,
    "featureKeys": [
      "teamEpaComposite",
      "teamSuccessRate",
      "teamExplosiveness",
      "opponentContextResidual"
    ]
  },
  "probabilityScale": 7.75,
  "trainingRows": 2127,
  "fitLogLoss": 0.6341153984623906,
  "generatedAt": "2026-08-31T00:00:00.000Z"
};

export default generatedNFLFIEV2C3ShadowModel;
