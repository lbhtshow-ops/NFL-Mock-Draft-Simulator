import { PROSPECT_DRAFT_ELIGIBILITY_STATUS } from "./EligibilityStatuses.js";
import { VERIFICATION_AUTHORITY_TYPE } from "./VerificationAuthority.js";

export const PROSPECT_ELIGIBILITY_CONTRACT = "ProspectDraftEligibilityContract";
export const PROSPECT_ELIGIBILITY_VERSION = "FIP-PROSPECT-ELIGIBILITY-1.0.0";
export const NFL_THREE_YEARS_REMOVED_RULE = "NFL_THREE_YEARS_REMOVED_FROM_HIGH_SCHOOL";

const records = Object.freeze({
  "app-prospect:2027:carter-smith:source-315": Object.freeze({
    contract: PROSPECT_ELIGIBILITY_CONTRACT,
    contractVersion: PROSPECT_ELIGIBILITY_VERSION,
    applicationProspectRef: "app-prospect:2027:carter-smith:source-315",
    draftYear: 2027,
    status: PROSPECT_DRAFT_ELIGIBILITY_STATUS.NOT_ELIGIBLE,
    earliestDraftYear: 2028,
    highSchoolClassYear: 2025,
    rule: NFL_THREE_YEARS_REMOVED_RULE,
    verifiedAt: "2026-08-09",
    disposition: "EXCLUDE_FROM_2027_DRAFTABLE_RUNTIME_PRESERVE_SOURCE_PROVENANCE",
    authority: Object.freeze([
      Object.freeze({
        type: VERIFICATION_AUTHORITY_TYPE.OFFICIAL_TEAM_BIO,
        publisher: "Wisconsin Athletics",
        url: "https://uwbadgers.com/sports/football/roster/carter-smith/15400",
        supports: "Wisconsin lists Carter Smith as a true freshman in 2025 and redshirt freshman in 2026.",
      }),
      Object.freeze({
        type: "NFL_ELIGIBILITY_RULE",
        publisher: "NFL.com",
        url: "https://www.nfl.com/news/ncaa-eligibility-decision-leaves-2021-nfl-draft-pool-murky",
        supports: "NFL draft eligibility requires players to be at least three years removed from high school.",
      }),
    ]),
  }),
});

export function getProspectDraftEligibility(applicationProspectRef) {
  return records[applicationProspectRef] || Object.freeze({
    contract: PROSPECT_ELIGIBILITY_CONTRACT,
    contractVersion: PROSPECT_ELIGIBILITY_VERSION,
    applicationProspectRef: applicationProspectRef || null,
    draftYear: 2027,
    status: PROSPECT_DRAFT_ELIGIBILITY_STATUS.UNKNOWN,
    earliestDraftYear: null,
    highSchoolClassYear: null,
    rule: NFL_THREE_YEARS_REMOVED_RULE,
    verifiedAt: null,
    disposition: "ELIGIBILITY_REVIEW_REQUIRED",
    authority: Object.freeze([]),
  });
}

export function isKnownIneligibleForDraft(applicationProspectRef) {
  return getProspectDraftEligibility(applicationProspectRef).status === PROSPECT_DRAFT_ELIGIBILITY_STATUS.NOT_ELIGIBLE;
}
