export * from "./canonicalRecordOwnershipConstants.js";
export * from "./CanonicalRecordOwnershipPolicy.js";

import constants from "./canonicalRecordOwnershipConstants.js";
import policy from "./CanonicalRecordOwnershipPolicy.js";

export default Object.freeze({ ...constants, ...policy });
