export * from "./draftSelectionConstants.js";
export * from "./DraftSelectionContract.js";
export * from "./draftSelectionReferenceConstants.js";
export * from "./DraftSelectionReferencePolicy.js";

import constants from "./draftSelectionConstants.js";
import contract from "./DraftSelectionContract.js";
import referenceConstants from "./draftSelectionReferenceConstants.js";
import referencePolicy from "./DraftSelectionReferencePolicy.js";

export default Object.freeze({ ...constants, ...contract, ...referenceConstants, ...referencePolicy });
