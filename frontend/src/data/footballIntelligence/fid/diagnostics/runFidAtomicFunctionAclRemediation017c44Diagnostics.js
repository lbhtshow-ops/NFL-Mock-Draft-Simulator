import fs from "node:fs";import path from "node:path";import crypto from "node:crypto";import {fileURLToPath} from "node:url";
import declaration from "../persistence/deployment/FidAtomicFunctionAclRemediation017c44Declaration.js";
import review from "../persistence/deployment/FidAtomicFunctionAclRemediation017c44IndependentReview.js";
import {evaluateFidAtomicFunctionAclState017c44} from "../persistence/deployment/FidAtomicFunctionAclRemediation017c44Evaluator.js";
import scenarios from "../persistence/deployment/FidAtomicFunctionAclRemediation017c44Scenarios.js";
import {reviewFidAtomicFunctionAclSql017c44} from "../persistence/deployment/FidAtomicFunctionAclRemediation017c44StaticOracle.js";
const here=path.dirname(fileURLToPath(import.meta.url));const reviewDir=path.resolve(here,"../persistence/deployment/review");const sqlByMode={};
for(const [mode,item] of Object.entries(declaration.artifacts)){const sql=fs.readFileSync(path.join(reviewDir,item.filename),"utf8");sqlByMode[mode]=sql;const hash=crypto.createHash("sha256").update(sql).digest("hex").toUpperCase();if(hash!==item.sha256)throw new Error(`17C.44 hash mismatch: ${mode}`);}
if(review.result!=="SPRINT_17C43_FINDINGS_CONFIRMED"||review.authorizationCreated||review.sqlExecuted)throw new Error("17C.44 review declaration failed");
for(const test of scenarios)if(evaluateFidAtomicFunctionAclState017c44(test.input)!==test.expected)throw new Error(`17C.44 scenario failed: ${test.name}`);
const staticReview=reviewFidAtomicFunctionAclSql017c44(sqlByMode);if(!staticReview.accepted)throw new Error(`17C.44 static review failed: ${staticReview.failures.join(",")}`);
console.log(JSON.stringify({status:"READY_FOR_FID_ATOMIC_FUNCTION_ACL_REMEDIATION_CONTROLLED_DEPLOYMENT_REVIEW",sqlHashes:Object.fromEntries(Object.entries(declaration.artifacts).map(([key,value])=>[key,value.sha256])),scenarios:scenarios.length,governanceUnits:declaration.matrix.governanceUnits,sqlExecuted:false,authorizationCreated:false}));
