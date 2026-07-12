/**
 * Creates a standardized intelligence summary.
 *
 * Every Football Intelligence engine should return this structure.
 */
export function createIntelligenceSummary({
  available = false,
  playerId = null,
  confidence = 0,
  source = "Unknown",
  lastUpdated = null,
  summary = "",
  notes = "",
  data = {},
} = {}) {
  return {
    available,
    playerId,
    confidence,
    source,
    lastUpdated,
    summary,
    notes,
    data,
  };
}

export default createIntelligenceSummary;