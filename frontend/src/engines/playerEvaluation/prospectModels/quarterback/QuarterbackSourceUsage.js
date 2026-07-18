const DIRECT_DATA_STATE = "AVAILABLE";
const CONTEXT_DATA_STATES = new Set([
  "AVAILABLE",
  "INSUFFICIENT_SAMPLE",
  "NOT_APPLICABLE",
]);

function hasAuthorizedAdapterState(source, expectedDomain) {
  return Boolean(
    source?.validShape === true &&
      source?.available === true &&
      source?.validation?.valid === true &&
      source?.domain === expectedDomain
  );
}

export function canUseScalarSourceForScore(
  source,
  expectedDomain
) {
  return Boolean(
    hasAuthorizedAdapterState(source, expectedDomain) &&
      source.dataState === DIRECT_DATA_STATE &&
      source.usability?.usableForScore === true
  );
}

export function canUseStructuredSourceForScore(
  source,
  expectedDomain,
  valueType
) {
  return Boolean(
    hasAuthorizedAdapterState(source, expectedDomain) &&
      source.dataState === DIRECT_DATA_STATE &&
      source.usability?.usableForContext === true &&
      source.value?.type === valueType &&
      source.value?.data &&
      typeof source.value.data === "object" &&
      !Array.isArray(source.value.data)
  );
}

export function canUseSourceForSupport(
  source,
  expectedDomain
) {
  return canUseScalarSourceForScore(
    source,
    expectedDomain
  );
}

export function canUseSourceForContext(
  source,
  expectedDomain
) {
  return Boolean(
    hasAuthorizedAdapterState(source, expectedDomain) &&
      CONTEXT_DATA_STATES.has(source.dataState) &&
      source.usability?.usableForContext === true
  );
}

export function readStructuredScoreData(
  source,
  expectedDomain,
  valueType
) {
  return canUseStructuredSourceForScore(
    source,
    expectedDomain,
    valueType
  )
    ? source.value.data
    : {};
}

export function readScoreProfile(source, expectedDomain) {
  return canUseScalarSourceForScore(
    source,
    expectedDomain
  )
    ? source.sourceResult?.rawData?.profile || {}
    : {};
}

export function readSupportProfile(source, expectedDomain) {
  return canUseSourceForSupport(source, expectedDomain)
    ? source.sourceResult?.rawData?.profile || {}
    : {};
}

export default {
  canUseScalarSourceForScore,
  canUseStructuredSourceForScore,
  canUseSourceForSupport,
  canUseSourceForContext,
  readStructuredScoreData,
  readScoreProfile,
  readSupportProfile,
};
