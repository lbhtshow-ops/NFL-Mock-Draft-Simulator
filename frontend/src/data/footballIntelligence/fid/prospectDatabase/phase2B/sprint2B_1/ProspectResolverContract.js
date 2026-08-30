export const PROSPECT_RESOLVER_CONTRACT = "ProspectResolverContract";
export const PROSPECT_RESOLVER_VERSION = "FID-PROSPECT-RESOLVER-1.0.0";
export const RESOLVER_SOURCE_KINDS = Object.freeze({ PREPARATION: "PREPARATION_RECORD", CANONICAL: "CANONICAL_PROSPECT_PROFILE" });
export const RESOLUTION_STATUSES = Object.freeze({ RESOLVED: "RESOLVED", UNKNOWN: "UNKNOWN_REFERENCE", BLOCKED: "BLOCKED_REFERENCE" });
export const SOURCE_SELECTION_POLICY = Object.freeze([
  Object.freeze({ priority: 1, sourceKind: RESOLVER_SOURCE_KINDS.PREPARATION, active: true }),
  Object.freeze({ priority: 2, sourceKind: RESOLVER_SOURCE_KINDS.CANONICAL, active: false })
]);

export function createResolution(status, reference, prospect = null, reason = null) {
  return Object.freeze({ contract: PROSPECT_RESOLVER_CONTRACT, contractVersion: PROSPECT_RESOLVER_VERSION, status, reference, prospect, reason });
}

