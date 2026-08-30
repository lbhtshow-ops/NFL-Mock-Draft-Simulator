import {
  acquireNFLVerseCurrentRosterDepthSignals,
} from "../src/data/footballIntelligence/nfl/availability/providers/nflverse/NFLVerseCurrentAvailabilityAcquisition.js";

import {
  createNFLProviderNeutralAvailabilityResearchBundle,
} from "../src/data/footballIntelligence/nfl/availability/research/NFLProviderNeutralAvailabilityResearchCapture.js";

const acquired = await acquireNFLVerseCurrentRosterDepthSignals({
  season: 2026,
  week: 1,
  gameType: "REG",
  team: "BAL",
  observedAt: new Date().toISOString(),
});

const checkedAt = new Date().toISOString();
const bundle = createNFLProviderNeutralAvailabilityResearchBundle(
  acquired.signals,
  { checkedAt }
);

const validationErrors = bundle.observations.flatMap((observation) =>
  (observation.validation?.errors || []).map((error) => ({
    observationId: observation.observationId,
    code: error.code,
    path: error.path,
    message: error.message,
  }))
);

const validCount = bundle.observations.filter(
  (observation) => observation.validation?.valid === true
).length;

const invalidCount = bundle.observations.length - validCount;

const requiredSemanticsValid = bundle.observations.every(
  (observation) =>
    observation.temporal?.type === "INSTANT" &&
    observation.temporal?.precision === "EXACT" &&
    observation.temporal?.timezone === "UTC" &&
    observation.spatial?.type === "NOT_APPLICABLE" &&
    observation.record?.field === "availability_signal" &&
    observation.record?.effectiveAt === observation.temporal?.occurredAt &&
    observation.verification?.state === "VERIFIED_WITH_LIMITATIONS" &&
    observation.verification?.method === "AUTOMATED_PROVIDER_NORMALIZATION"
);

const sourceRefsProviderNeutral = bundle.observations.every(
  (observation) =>
    Array.isArray(observation.sourceRefs) &&
    observation.sourceRefs.length === 1 &&
    observation.sourceRefs[0] ===
      "research-source:lbht-nfl-availability-multisignal"
);

const providerProvenancePreserved = bundle.observations.every((observation) => {
  try {
    const snapshot = JSON.parse(observation.record?.valueText || "{}");
    return String(snapshot.provenance?.source || "").startsWith("nflverse-");
  } catch {
    return false;
  }
});

const report = {
  suite: "NFL Provider-Neutral Availability Real-Data No-Write Probe",
  version: "1.0.0",
  scope: acquired.scope,
  rosterSignals: acquired.roster?.signalCount ?? null,
  depthSignals: acquired.depth?.signalCount ?? null,
  totalSignals: acquired.signals?.length ?? 0,
  observations: bundle.observations.length,
  validObservations: validCount,
  invalidObservations: invalidCount,
  validationErrorCount: validationErrors.length,
  requiredSemanticsValid,
  sourceRefsProviderNeutral,
  providerProvenancePreserved,
  sportradarRequired: false,
  persistenceCalled: false,
  databaseMutated: false,
  firstErrors: validationErrors.slice(0, 10),
};

console.log(JSON.stringify(report, null, 2));

if (
  report.totalSignals === 0 ||
  report.observations !== report.totalSignals ||
  report.invalidObservations !== 0 ||
  report.validationErrorCount !== 0 ||
  !report.requiredSemanticsValid ||
  !report.sourceRefsProviderNeutral ||
  !report.providerProvenancePreserved
) {
  process.exitCode = 1;
}
