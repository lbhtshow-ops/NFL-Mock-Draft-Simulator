import { PROSPECT_VERIFICATION_CONTRACT, PROSPECT_VERIFICATION_VERSION, PROSPECT_VERIFICATION_RULE } from "./ProspectVerificationContract.js";
import { PROSPECT_VERIFICATION_STATUS, PROSPECT_VERIFICATION_FIELD_STATUS } from "./VerificationStatuses.js";
import { VERIFICATION_AUTHORITY_TYPE } from "./VerificationAuthority.js";
import { evaluateDeterministicVerificationRules } from "./VerificationRules.js";
import { getProspectDraftEligibility } from "./ProspectEligibilityEngine.js";
import { PROSPECT_DRAFT_ELIGIBILITY_STATUS } from "./EligibilityStatuses.js";

const VERIFIED_AT = "2026-08-09";

const authoritativeRecords = Object.freeze({
  "app-prospect:2027:carter-smith": Object.freeze({
    applicationProspectRef: "app-prospect:2027:carter-smith",
    verifiedIdentity: Object.freeze({ displayName: "Carter Smith", position: "OT", program: "Indiana" }),
    authority: Object.freeze({
      type: VERIFICATION_AUTHORITY_TYPE.OFFICIAL_TEAM_BIO,
      publisher: "Indiana University Athletics",
      url: "https://iuhoosiers.com/sports/football/roster/carter-smith/20978",
    }),
  }),
  "app-prospect:2027:carter-smith:source-315": Object.freeze({
    applicationProspectRef: "app-prospect:2027:carter-smith:source-315",
    verifiedIdentity: Object.freeze({ displayName: "Carter Smith", position: "QB", program: "Wisconsin" }),
    authority: Object.freeze({
      type: VERIFICATION_AUTHORITY_TYPE.OFFICIAL_TEAM_ROSTER,
      publisher: "Wisconsin Athletics",
      url: "https://uwbadgers.com/sports/football/roster",
    }),
    supportingEvidence: Object.freeze([
      Object.freeze({
        type: VERIFICATION_AUTHORITY_TYPE.PUBLIC_DRAFT_REFERENCE,
        publisher: "NFL Draft Buzz",
        url: "https://www.nfldraftbuzz.com/Player/Carter-Smith-QB-Wisconsin",
        note: "The source URL and biography identify the Wisconsin quarterback even though the page heading reports Indiana.",
      }),
    ]),
  }),
});

const deepFreeze = (value, seen = new WeakSet()) => {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach((child) => deepFreeze(child, seen));
  return Object.freeze(value);
};

function sourceIdentityFromEntry(entry) {
  return {
    displayName: entry?.identity?.displayName ?? null,
    position: entry?.inventoryMetadata?.sourceReportedIdentity?.position ?? entry?.identity?.officialPosition ?? null,
    program: entry?.inventoryMetadata?.sourceReportedIdentity?.program ?? entry?.identity?.program?.displayName ?? null,
  };
}

export function getAuthoritativeProspectVerification(applicationProspectRef) {
  return authoritativeRecords[applicationProspectRef] || null;
}

export function verifyApplicationProspect(entry) {
  const applicationProspectRef = entry?.applicationProspectRef || null;
  const sourceIdentity = sourceIdentityFromEntry(entry);
  const authoritative = getAuthoritativeProspectVerification(applicationProspectRef);

  const draftEligibility = getProspectDraftEligibility(applicationProspectRef);

  if (!authoritative) {
    return deepFreeze({
      contract: PROSPECT_VERIFICATION_CONTRACT,
      contractVersion: PROSPECT_VERIFICATION_VERSION,
      applicationProspectRef,
      status: PROSPECT_VERIFICATION_STATUS.SOURCE_REPORTED,
      verifiedAt: null,
      sourceIdentity,
      effectiveIdentity: sourceIdentity,
      verifiedFields: {
        identity: PROSPECT_VERIFICATION_FIELD_STATUS.SOURCE_REPORTED,
        position: PROSPECT_VERIFICATION_FIELD_STATUS.SOURCE_REPORTED,
        program: PROSPECT_VERIFICATION_FIELD_STATUS.SOURCE_REPORTED,
        eligibility: draftEligibility.status === PROSPECT_DRAFT_ELIGIBILITY_STATUS.UNKNOWN ? PROSPECT_VERIFICATION_FIELD_STATUS.UNKNOWN : PROSPECT_VERIFICATION_FIELD_STATUS.VERIFIED,
      },
      draftEligibility,
      authority: null,
      findings: evaluateDeterministicVerificationRules({
        applicationProspectRef,
        sourceIdentity,
        verifiedIdentity: null,
        sourceMetadata: entry?.inventoryMetadata,
      }),
      footballIntelligenceEligible: false,
      reviewRequired: true,
      limitations: ["No authoritative roster verification is registered for this application prospect."],
    });
  }

  const findings = [...evaluateDeterministicVerificationRules({
    applicationProspectRef,
    sourceIdentity,
    verifiedIdentity: authoritative.verifiedIdentity,
    sourceMetadata: entry?.inventoryMetadata,
  })];

  const corrected = findings.some((finding) => finding.rule === PROSPECT_VERIFICATION_RULE.PROGRAM_MISMATCH || finding.rule === PROSPECT_VERIFICATION_RULE.POSITION_MISMATCH);
  if (corrected) findings.push(Object.freeze({ rule: PROSPECT_VERIFICATION_RULE.AUTHORITATIVE_CORRECTION_APPLIED, severity: "INFO" }));

  return deepFreeze({
    contract: PROSPECT_VERIFICATION_CONTRACT,
    contractVersion: PROSPECT_VERIFICATION_VERSION,
    applicationProspectRef,
    status: PROSPECT_VERIFICATION_STATUS.VERIFIED,
    verifiedAt: VERIFIED_AT,
    sourceIdentity,
    effectiveIdentity: authoritative.verifiedIdentity,
    verifiedFields: {
      identity: PROSPECT_VERIFICATION_FIELD_STATUS.VERIFIED,
      position: PROSPECT_VERIFICATION_FIELD_STATUS.VERIFIED,
      program: PROSPECT_VERIFICATION_FIELD_STATUS.VERIFIED,
      eligibility: draftEligibility.status === PROSPECT_DRAFT_ELIGIBILITY_STATUS.UNKNOWN ? PROSPECT_VERIFICATION_FIELD_STATUS.UNKNOWN : PROSPECT_VERIFICATION_FIELD_STATUS.VERIFIED,
    },
    draftEligibility,
    authority: authoritative.authority,
    supportingEvidence: authoritative.supportingEvidence || [],
    findings,
    footballIntelligenceEligible: draftEligibility.status === PROSPECT_DRAFT_ELIGIBILITY_STATUS.ELIGIBLE,
    reviewRequired: draftEligibility.status !== PROSPECT_DRAFT_ELIGIBILITY_STATUS.ELIGIBLE,
    limitations: draftEligibility.status === PROSPECT_DRAFT_ELIGIBILITY_STATUS.NOT_ELIGIBLE
      ? ["Identity is verified, but this prospect is not eligible for the 2027 NFL Draft."]
      : ["Identity is verified; Draft eligibility remains separately governed until established."],
  });
}

export function applyVerifiedIdentity(entry) {
  const verification = verifyApplicationProspect(entry);
  if (verification.status !== PROSPECT_VERIFICATION_STATUS.VERIFIED) return entry;
  return deepFreeze({
    ...entry,
    identity: {
      ...entry.identity,
      displayName: verification.effectiveIdentity.displayName,
      officialPosition: verification.effectiveIdentity.position,
      program: {
        ...entry.identity?.program,
        displayName: verification.effectiveIdentity.program,
        status: "VERIFIED_APPLICATION_IDENTITY",
      },
    },
    verification,
  });
}

export function footballIntelligenceVerificationGate(entry) {
  const verification = entry?.verification || verifyApplicationProspect(entry);
  const identityVerified = verification.status === PROSPECT_VERIFICATION_STATUS.VERIFIED;
  const eligibilityStatus = verification.draftEligibility?.status || PROSPECT_DRAFT_ELIGIBILITY_STATUS.UNKNOWN;
  const allowed = identityVerified && eligibilityStatus === PROSPECT_DRAFT_ELIGIBILITY_STATUS.ELIGIBLE;
  let reason = "IDENTITY_VERIFICATION_REQUIRED";
  if (identityVerified && eligibilityStatus === PROSPECT_DRAFT_ELIGIBILITY_STATUS.NOT_ELIGIBLE) reason = "DRAFT_CLASS_NOT_ELIGIBLE";
  else if (identityVerified && eligibilityStatus !== PROSPECT_DRAFT_ELIGIBILITY_STATUS.ELIGIBLE) reason = "DRAFT_ELIGIBILITY_VERIFICATION_REQUIRED";
  else if (allowed) reason = "VERIFIED_IDENTITY_AND_DRAFT_ELIGIBILITY";
  return deepFreeze({ allowed, status: verification.status, eligibilityStatus, applicationProspectRef: verification.applicationProspectRef, reason });
}
