import fs from "node:fs";

const checks = [
  {
    path:"src/engines/gameDecisionSupport/canonical/NFLGameIntelligenceDirectionalExplainabilityProjector.js",
    tokens:[
      "POSITIVE_HOME_NEGATIVE_AWAY",
      "keyAdvantages",
      "counterweights",
      "favoriteCode",
      "readOnlyExplainability: true",
      "matchupScoringMutated: false",
      "decisionScoringMutated: false",
    ],
  },
  {
    path:"services/fieDecisionApi/decisionMapper.mjs",
    tokens:[
      "projectNFLGameIntelligenceDirectionalExplainability",
      "matchupExplainability",
      "evidenceQuality:m?.evidenceQuality",
      "matchupEdge:m?.matchupEdge",
      "factors:factors(m)",
    ],
  },
  {
    path:"services/decisionMapper.mjs",
    tokens:[
      "projectNFLGameIntelligenceDirectionalExplainability",
      "matchupExplainability",
      "factors:factors(m)",
    ],
  },
  {
    path:"src/engines/teamIntelligence/strength/calibration/playerEvidence/NFLGameIntelligenceDirectionalExplainabilityGovernance.js",
    tokens:[
      "existingFactorsPreserved: true",
      "pickemMayInferDirection: false",
      "playerImpactActivationAuthorized: false",
      "teamStrengthMutationAuthorized: false",
      "matchupScoringMutationAuthorized: false",
      "decisionModelMutationAuthorized: false",
      "pickemScoringMutationAuthorized: false",
    ],
  },
];

const reports=checks.map(spec=>{
  const exists=fs.existsSync(spec.path);
  const text=exists?fs.readFileSync(spec.path,"utf8"):"";
  const tokenChecks=Object.fromEntries(spec.tokens.map(token=>[token,text.includes(token)]));
  return{path:spec.path,exists,tokenChecks,passed:exists&&Object.values(tokenChecks).every(Boolean)};
});

const passed=reports.every(r=>r.passed);
console.log(JSON.stringify({
  contractVersion:"FIE-NFL-GAME-INTELLIGENCE-DIRECTIONAL-EXPLAINABILITY-AUDIT-2D5C-1.0.0",
  sprint:"2D.5C",
  mode:"READ_ONLY_CONTRACT_PREFLIGHT",
  decision:passed
    ?"GAME_INTELLIGENCE_DIRECTIONAL_EXPLAINABILITY_READY_FOR_PICKEM_CONSUMER_VALIDATION"
    :"GAME_INTELLIGENCE_DIRECTIONAL_EXPLAINABILITY_BINDING_INCOMPLETE",
  reports,
  safeguards:{
    matchupEngineWeightsChanged:false,
    matchupEdgeChanged:false,
    playerImpactActivated:false,
    teamStrengthMutated:false,
    decisionModelMutated:false,
    probabilityChanged:false,
    expectedMarginChanged:false,
    pickemScoringMutated:false,
    databaseMutated:false,
  },
},null,2));
if(!passed)process.exitCode=2;
