import fs from "fs";
import path from "path";
import {pathToFileURL} from "url";
import {fitNFLCandidateModel} from "../src/engines/gameDecisionSupport/models/NFLCandidateModelFitter.js";

const CANDIDATE_ID="QUALITY_WEIGHTED_MATCHUP";
const MODEL_VERSION="NFL-GAME-DECISION-MODEL-V1.0.0";

const datasetPath=path.resolve("src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalDecisionDataset.js");
const validationPath=path.resolve("src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLDecisionModelValidationReport.json");
const outputPath=path.resolve("src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLCanonicalGameDecisionModelV1.js");

if(!fs.existsSync(validationPath)) throw new Error("5D validation report missing. Run validateNFLCandidateDecisionModels.mjs first.");
const validation=JSON.parse(fs.readFileSync(validationPath,"utf8"));
const gate=(validation.promotionGates||[]).find(x=>x.candidateId===CANDIDATE_ID);
if(!gate) throw new Error(`Promotion gate missing for ${CANDIDATE_ID}.`);
if(gate.status!=="PROMOTION_ELIGIBLE") throw new Error(`${CANDIDATE_ID} is not promotion eligible: ${gate.status}.`);
if(validation.productionAuthorityGranted===true) throw new Error("5D research report must not itself grant production authority.");

const datasetModule=await import(`${pathToFileURL(datasetPath).href}?t=${Date.now()}`);
const records=datasetModule.default||[];
if(records.length!==2227) throw new Error(`Promotion expects reconciled 2,227-record dataset; found ${records.length}.`);

const fit=fitNFLCandidateModel({modelId:CANDIDATE_ID,trainingRecords:records});
const config={
  contract:"NFLCanonicalGameDecisionModelConfig",version:"1.0.0",
  modelId:CANDIDATE_ID,modelVersion:MODEL_VERSION,parameters:fit.parameters,
  fittedRecords:records.length,fitSummary:{trainingMarginMAE:fit.trainingMarginMAE??null},
  promotionEvidenceVersion:validation.version||"1.0.0",
  holdoutSeasons:validation.holdoutSeasons||[],
  productionAuthorityGranted:true,
  authorityGrantedBy:"EXPLICIT_SPRINT_5E_PROMOTION",
  source:"LBHT_FIE_HISTORICAL_DECISION_DATASET",
  generatedAt:new Date().toISOString()
};

fs.writeFileSync(outputPath,
`export const generatedNFLCanonicalGameDecisionModelV1 = ${JSON.stringify(config,null,2)};\n\nexport default generatedNFLCanonicalGameDecisionModelV1;\n`,"utf8");

console.log(`Promoted canonical model: ${config.modelId}`);
console.log(`Model version: ${config.modelVersion}`);
console.log(`Fitted records: ${config.fittedRecords}`);
console.log(`Home-field points: ${config.parameters.homeFieldPoints}`);
console.log(`Edge scale: ${config.parameters.edgeScale}`);
console.log(`Probability scale: ${config.parameters.probabilityScale}`);
console.log("Production authority granted: YES — explicit Sprint 5E promotion");
console.log(`Wrote canonical model config to:\n${outputPath}`);
