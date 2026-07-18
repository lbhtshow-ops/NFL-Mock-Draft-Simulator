import { FID_DEPLOYMENT_DECISION_TYPES } from "./fidTestDeploymentRunbookConstants.js";
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
export function createFidDeploymentStopDecision(input={}){const v=obj(input),type=FID_DEPLOYMENT_DECISION_TYPES.includes(v.decisionType)?v.decisionType:"STOP";return Object.freeze({contract:"FidDeploymentStopDecision",decisionId:typeof v.decisionId==="string"?v.decisionId:null,decisionType:type,trigger:typeof v.trigger==="string"?v.trigger:null,evidenceReferences:Array.isArray(v.evidenceReferences)?structuredClone(v.evidenceReferences):[],operatorApproved:false,reviewerApproved:false,automaticOverrideAllowed:false,executionPerformed:false,validation:Object.freeze({valid:typeof v.decisionId==="string"&&typeof v.trigger==="string",errors:[]})});}
export const validateFidDeploymentStopDecision=v=>createFidDeploymentStopDecision(v).validation;
export default Object.freeze({createFidDeploymentStopDecision,validateFidDeploymentStopDecision});
