import { deepFreeze } from "./contractSupport.js";

export const REF_V1_7_PREDECESSOR_BASELINE = deepFreeze({
  model: "RefV1PredecessorFilesystemBaseline",
  modelVersion: "1.0.0",
  establishedDuring: "REF-V1.7",
  baselineTimestamp: null,
  deterministicTimestampNotSupplied: true,
  measuredScope: "REF_IMPLEMENTATION_AND_DOCUMENTATION_THROUGH_REF_V1_6",
  fileCount: 68,
  inventoryEncoding: "SORTED_RELATIVE_PATH_EQUALS_UPPERCASE_SHA256_JOINED_WITH_LF",
  inventoryAggregateSha256: "778B57736A3BD9ABF2964622E612185A1F45C4A19D2DC85A97150A27BB798A61",
  gitState: { trackedCount: 0, untrackedCount: 68, recordedSeparately: true },
  purpose: "CURRENT_FILESYSTEM_BASELINE_FOR_FUTURE_COMPARISON",
  disclaimers: ["CURRENT_FILESYSTEM_CONTENTS_MEASURED", "HISTORICAL_GIT_TRACKING_NOT_ESTABLISHED", "NO_RETROACTIVE_CUSTODY_CLAIM", "GIT_DOES_NOT_AUTHENTICATE_UNTRACKED_HISTORY", "FUTURE_COMPARISONS_MAY_USE_THIS_BASELINE", "REF_V1_7_ADDITIVE_FILES_EXCLUDED"],
});
