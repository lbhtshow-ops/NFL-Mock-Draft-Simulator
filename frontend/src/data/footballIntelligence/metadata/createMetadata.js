// src/data/footballIntelligence/metadata/createMetadata.js

import { DATA_TYPES } from "./dataTypes";

export function createMetadata({
  source = [],
  verifiedBy = "LBHT Research",
  confidence = 0,
  type = DATA_TYPES.MANUAL_INPUT,
  lastUpdated = "2026-06-19",
  notes = "",
} = {}) {
  return {
    source,
    verifiedBy,
    confidence,
    type,
    lastUpdated,
    notes,
  };
}