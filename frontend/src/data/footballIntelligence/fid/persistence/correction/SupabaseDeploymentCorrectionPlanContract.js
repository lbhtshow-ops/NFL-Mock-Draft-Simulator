const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
export function createSupabaseDeploymentCorrectionPlan(input={}){const v=obj(input),steps=Array.isArray(v.steps)?structuredClone(v.steps):[];return Object.freeze({contract:"SupabaseDeploymentCorrectionPlan",steps,sqlExecutionProhibited:true,deploymentProhibited:true,runtimeActivationProhibited:true,completed:v.completed===true,validation:Object.freeze({valid:steps.length>0,errors:steps.length?[]:[{code:"STEPS_REQUIRED"}]})});}
export const validateSupabaseDeploymentCorrectionPlan=v=>createSupabaseDeploymentCorrectionPlan(v).validation;
export default Object.freeze({createSupabaseDeploymentCorrectionPlan,validateSupabaseDeploymentCorrectionPlan});
