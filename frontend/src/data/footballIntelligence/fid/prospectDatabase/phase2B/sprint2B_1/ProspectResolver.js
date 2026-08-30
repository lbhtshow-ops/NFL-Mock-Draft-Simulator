import { createNormalizedProspectView } from "./NormalizedProspectView.js";
import { createResolution, RESOLUTION_STATUSES, RESOLVER_SOURCE_KINDS, SOURCE_SELECTION_POLICY } from "./ProspectResolverContract.js";

export class ProspectResolver {
  #sources;
  constructor(sources = []) {
    this.#sources = [...sources].sort((a, b) => {
      const rank = (source) => SOURCE_SELECTION_POLICY.find(({ sourceKind }) => sourceKind === source.kind)?.priority ?? Number.MAX_SAFE_INTEGER;
      return rank(a) - rank(b);
    });
    Object.freeze(this);
  }

  resolve(reference) {
    const normalizedReference = typeof reference === "string" ? reference.trim() : "";
    if (!normalizedReference) return createResolution(RESOLUTION_STATUSES.UNKNOWN, normalizedReference, null, "A non-empty prospect reference is required.");
    for (const source of this.#sources) {
      if (source.kind === RESOLVER_SOURCE_KINDS.CANONICAL && !SOURCE_SELECTION_POLICY[1].active) continue;
      const result = source.find(normalizedReference);
      if (!result) continue;
      if (result.blocked) return createResolution(RESOLUTION_STATUSES.BLOCKED, normalizedReference, null, result.reason ?? "The prospect is blocked from application resolution.");
      return createResolution(RESOLUTION_STATUSES.RESOLVED, normalizedReference, createNormalizedProspectView(source.project(result)));
    }
    return createResolution(RESOLUTION_STATUSES.UNKNOWN, normalizedReference, null, "No application prospect source recognizes this reference.");
  }

  resolveMany(references) { return Object.freeze(references.map((reference) => this.resolve(reference))); }
}

