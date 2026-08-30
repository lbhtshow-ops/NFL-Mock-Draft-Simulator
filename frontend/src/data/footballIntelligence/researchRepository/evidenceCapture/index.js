export * from "./evidenceCaptureConstants.js";
export * from "./EvidenceCaptureInputContract.js";
export * from "./EvidenceCaptureWorkflow.js";
export * from "./EvidenceCaptureResultContract.js";
import constants from "./evidenceCaptureConstants.js";
import input from "./EvidenceCaptureInputContract.js";
import workflow from "./EvidenceCaptureWorkflow.js";
import result from "./EvidenceCaptureResultContract.js";
export default Object.freeze({ ...constants, ...input, ...workflow, ...result });
