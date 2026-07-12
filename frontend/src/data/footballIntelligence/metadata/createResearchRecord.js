// src/data/footballIntelligence/metadata/createResearchRecord.js

import { DATA_TYPES } from "./dataTypes";
import { createMetadata } from "./createMetadata";

export function createResearchRecord({
  id = "",
  subject = "",
  category = "",
  statement = "",
  tags = [],
  relatedEntities = [],
  metadata = {},
} = {}) {
  return {
    id,
    subject,
    category,
    statement,
    tags,
    relatedEntities,
    metadata: createMetadata({
      type: DATA_TYPES.INFERENCE,
      ...metadata,
    }),
  };
}