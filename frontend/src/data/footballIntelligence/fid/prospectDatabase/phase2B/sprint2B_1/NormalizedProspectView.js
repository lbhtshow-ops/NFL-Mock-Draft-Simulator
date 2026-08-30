export const NORMALIZED_PROSPECT_VIEW_CONTRACT = "NormalizedProspectView";
export const NORMALIZED_PROSPECT_VIEW_VERSION = "FID-NORMALIZED-PROSPECT-VIEW-1.0.0";

const deepFreeze = (value, seen = new WeakSet()) => {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach((child) => deepFreeze(child, seen));
  return Object.freeze(value);
};

const copy = (value) => value == null ? value : structuredClone(value);

export function createNormalizedProspectView(input) {
  const view = {
    contract: NORMALIZED_PROSPECT_VIEW_CONTRACT,
    contractVersion: NORMALIZED_PROSPECT_VIEW_VERSION,
    reference: input.reference,
    displayName: input.displayName,
    program: copy(input.program),
    officialPosition: input.officialPosition,
    projectedRole: input.projectedRole,
    height: copy(input.height),
    weight: copy(input.weight),
    productionSummary: copy(input.productionSummary),
    testingStatus: copy(input.testingStatus),
    strengths: copy(input.strengths ?? []),
    concerns: copy(input.concerns ?? []),
    eligibility: copy(input.eligibility),
    reviewStatus: input.reviewStatus,
    evidenceSummary: copy(input.evidenceSummary),
    sourceSummary: copy(input.sourceSummary),
    mappingReadiness: input.mappingReadiness,
    draftRoomReadiness: input.draftRoomReadiness,
    draftResultsReadiness: input.draftResultsReadiness,
    limitations: copy(input.limitations ?? [])
  };
  return deepFreeze(view);
}

export function isNormalizedProspectView(value) {
  return value?.contract === NORMALIZED_PROSPECT_VIEW_CONTRACT &&
    value.contractVersion === NORMALIZED_PROSPECT_VIEW_VERSION &&
    typeof value.reference === "string" && typeof value.displayName === "string" &&
    Object.isFrozen(value);
}

