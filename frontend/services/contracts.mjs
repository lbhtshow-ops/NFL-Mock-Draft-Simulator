export const REQUEST_CONTRACT="LBHTPickemFIEDecisionRequest";
export const RESPONSE_CONTRACT="LBHTPickemFIEDecisionBundle";
export const CONTRACT_VERSION="1.0.0";
export const createErrorResponse=(code,message,detail=null)=>({contract:"LBHTFIEDecisionApiError",version:CONTRACT_VERSION,error:{code,message,detail}});
export const createDecisionBundle=(decisions,generatedAt)=>({contract:RESPONSE_CONTRACT,version:CONTRACT_VERSION,generatedAt,decisions});
