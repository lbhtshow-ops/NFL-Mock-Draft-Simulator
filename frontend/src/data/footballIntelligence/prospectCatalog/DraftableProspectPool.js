import { PROSPECT_DRAFT_ELIGIBILITY_STATUS } from "../verification/EligibilityStatuses.js";
import { getProspectDraftEligibility } from "../verification/ProspectEligibilityEngine.js";
import { PROSPECT_VERIFICATION_STATUS } from "../verification/VerificationStatuses.js";
import { verifyApplicationProspect } from "../verification/ProspectVerificationEngine.js";
import { resolveApplicationProspectResolution } from "./ApplicationProspectCatalog.js";
import { APPLICATION_PROSPECT_RESOLUTION_STATUS } from "./UnifiedApplicationProspectResolver.js";

export const DRAFTABLE_PROSPECT_POOL_CONTRACT = "DraftableProspectPool";
export const DRAFTABLE_PROSPECT_POOL_VERSION = "MDS-5B.7A-1.0.0";

function verifiedIdentityFor(entry) {
  if (!entry) return null;
  const verification = entry.verification || verifyApplicationProspect(entry);
  if (verification?.status !== PROSPECT_VERIFICATION_STATUS.VERIFIED) return null;
  return verification.effectiveIdentity || null;
}

function applyIdentityToRuntimePlayer(player, applicationProspectRef, effectiveIdentity) {
  if (!player || typeof player !== "object") return player;
  if (!effectiveIdentity) {
    return applicationProspectRef
      ? { ...player, application_prospect_ref: player.application_prospect_ref || applicationProspectRef }
      : player;
  }

  const displayName = effectiveIdentity.displayName || player.name || player.player || player.displayName;
  const position = effectiveIdentity.position || player.position;
  const program = effectiveIdentity.program || player.school || player.college;

  return {
    ...player,
    application_prospect_ref: player.application_prospect_ref || applicationProspectRef,
    name: displayName,
    player: displayName,
    displayName,
    position,
    school: program,
    college: program,
  };
}

export function resolveDraftableProspectPolicy(player, { draftYear = 2027 } = {}) {
  if (!player) {
    return Object.freeze({
      contract: DRAFTABLE_PROSPECT_POOL_CONTRACT,
      contractVersion: DRAFTABLE_PROSPECT_POOL_VERSION,
      included: false,
      reason: "NO_PROSPECT",
      applicationProspectRef: null,
      eligibilityStatus: PROSPECT_DRAFT_ELIGIBILITY_STATUS.UNKNOWN,
      player: null,
    });
  }

  const resolutionInput = {
    ...player,
    draftYear: Number(player.draftYear ?? player.draftClass ?? player.year ?? draftYear),
  };
  const resolution = resolveApplicationProspectResolution(resolutionInput);

  if (resolution.status !== APPLICATION_PROSPECT_RESOLUTION_STATUS.RESOLVED || !resolution.prospect) {
    // 5B.7A intentionally preserves UNKNOWN/unresolved records until the full
    // 2027 class audit. Only a verified negative may remove a runtime prospect.
    return Object.freeze({
      contract: DRAFTABLE_PROSPECT_POOL_CONTRACT,
      contractVersion: DRAFTABLE_PROSPECT_POOL_VERSION,
      included: true,
      reason: resolution.status === APPLICATION_PROSPECT_RESOLUTION_STATUS.AMBIGUOUS
        ? "IDENTITY_AMBIGUOUS_REVIEW_REQUIRED"
        : "IDENTITY_UNRESOLVED_REVIEW_REQUIRED",
      applicationProspectRef: null,
      eligibilityStatus: PROSPECT_DRAFT_ELIGIBILITY_STATUS.UNKNOWN,
      player,
    });
  }

  const entry = resolution.prospect;
  const applicationProspectRef = entry.applicationProspectRef;
  const eligibility = getProspectDraftEligibility(applicationProspectRef);
  const effectiveIdentity = verifiedIdentityFor(entry);
  const effectivePlayer = applyIdentityToRuntimePlayer(player, applicationProspectRef, effectiveIdentity);
  const knownIneligible = eligibility.status === PROSPECT_DRAFT_ELIGIBILITY_STATUS.NOT_ELIGIBLE;

  return Object.freeze({
    contract: DRAFTABLE_PROSPECT_POOL_CONTRACT,
    contractVersion: DRAFTABLE_PROSPECT_POOL_VERSION,
    included: !knownIneligible,
    reason: knownIneligible ? "KNOWN_NOT_ELIGIBLE_FOR_DRAFT_CLASS" : "DRAFTABLE_RUNTIME_RECORD_RETAINED",
    applicationProspectRef,
    eligibilityStatus: eligibility.status,
    earliestDraftYear: eligibility.earliestDraftYear ?? null,
    identityCorrected: Boolean(effectiveIdentity),
    player: effectivePlayer,
  });
}

export function buildDraftableProspectPool(players, options = {}) {
  if (!Array.isArray(players)) return [];
  return players
    .map((player) => resolveDraftableProspectPolicy(player, options))
    .filter((policy) => policy.included)
    .map((policy) => policy.player);
}

export function getDraftableProspectPoolDiagnostics(players, options = {}) {
  const policies = Array.isArray(players)
    ? players.map((player) => resolveDraftableProspectPolicy(player, options))
    : [];

  return Object.freeze({
    contract: DRAFTABLE_PROSPECT_POOL_CONTRACT,
    contractVersion: DRAFTABLE_PROSPECT_POOL_VERSION,
    inputCount: policies.length,
    includedCount: policies.filter((policy) => policy.included).length,
    excludedKnownIneligibleCount: policies.filter((policy) => policy.reason === "KNOWN_NOT_ELIGIBLE_FOR_DRAFT_CLASS").length,
    unknownRetainedCount: policies.filter((policy) => policy.included && policy.eligibilityStatus === PROSPECT_DRAFT_ELIGIBILITY_STATUS.UNKNOWN).length,
  });
}

export default Object.freeze({
  resolveDraftableProspectPolicy,
  buildDraftableProspectPool,
  getDraftableProspectPoolDiagnostics,
});
