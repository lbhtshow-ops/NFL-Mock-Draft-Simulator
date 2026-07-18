const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
export function createPostgresqlRollbackReview(input={}){const v=obj(input),items=Array.isArray(v.items)?structuredClone(v.items):[];return Object.freeze({contract:"PostgresqlRollbackReview",items,reverseOrder:v.reverseOrder===true,rolePreserved:v.rolePreserved===true,executesNothing:true,reviewComplete:v.reviewComplete===true,validation:Object.freeze({valid:items.length===13&&v.reverseOrder===true,errors:items.length===13?[]:[{code:"THIRTEEN_ITEMS_REQUIRED"}]})});}
export const validatePostgresqlRollbackReview=v=>createPostgresqlRollbackReview(v).validation;
export default Object.freeze({createPostgresqlRollbackReview,validatePostgresqlRollbackReview});
