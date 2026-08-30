export const PROSPECT_DATA_QUALITY_CONTRACT = "ProspectDataQualityRegistry";
export const PROSPECT_DATA_QUALITY_VERSION = "FIP-PROSPECT-DATA-QUALITY-1.1.0";

export const PROSPECT_DATA_QUALITY_STATUS = Object.freeze({
  VERIFIED: "VERIFIED",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  UNREVIEWED: "UNREVIEWED",
});

export const PROSPECT_DATA_QUALITY_REASON = Object.freeze({
  OFFICIAL_ROSTER_CONFLICT: "OFFICIAL_ROSTER_CONFLICT",
  SOURCE_METADATA_CONFLICT: "SOURCE_METADATA_CONFLICT",
  AUTHORITATIVE_SOURCE_CORRECTION: "AUTHORITATIVE_SOURCE_CORRECTION",
});

const REVIEWED_AT = "2026-08-09";

const records = Object.freeze({
  "app-prospect:2027:carter-smith": Object.freeze({
    contract: PROSPECT_DATA_QUALITY_CONTRACT,
    contractVersion: PROSPECT_DATA_QUALITY_VERSION,
    applicationProspectRef: "app-prospect:2027:carter-smith",
    status: PROSPECT_DATA_QUALITY_STATUS.VERIFIED,
    severity: "NONE",
    reviewedAt: REVIEWED_AT,
    reasonCodes: Object.freeze([]),
    disposition: "SOURCE_FACTS_SUPPORTED_BY_OFFICIAL_ROSTER",
    evidence: Object.freeze([
      Object.freeze({
        sourceType: "OFFICIAL_TEAM_BIO",
        publisher: "Indiana University Athletics",
        url: "https://iuhoosiers.com/sports/football/roster/carter-smith/20978",
        supports: "Carter Smith is an Indiana offensive lineman; the official biography documents his left-tackle career.",
      }),
    ]),
  }),
  "app-prospect:2027:carter-smith:source-315": Object.freeze({
    contract: PROSPECT_DATA_QUALITY_CONTRACT,
    contractVersion: PROSPECT_DATA_QUALITY_VERSION,
    applicationProspectRef: "app-prospect:2027:carter-smith:source-315",
    status: PROSPECT_DATA_QUALITY_STATUS.VERIFIED,
    severity: "NONE",
    reviewedAt: REVIEWED_AT,
    reasonCodes: Object.freeze([
      PROSPECT_DATA_QUALITY_REASON.SOURCE_METADATA_CONFLICT,
      PROSPECT_DATA_QUALITY_REASON.AUTHORITATIVE_SOURCE_CORRECTION,
    ]),
    disposition: "VERIFIED_WITH_AUTHORITATIVE_PROGRAM_CORRECTION",
    correction: Object.freeze({
      field: "program",
      sourceReportedValue: "Indiana",
      verifiedValue: "Wisconsin",
      applicationReferencePreserved: true,
    }),
    evidence: Object.freeze([
      Object.freeze({
        sourceType: "SOURCE_RECORD",
        publisher: "NFL Draft Buzz",
        url: "https://www.nfldraftbuzz.com/Player/Carter-Smith-QB-Wisconsin",
        supports: "The page heading reports Indiana, while its URL and biography identify the Wisconsin quarterback context.",
      }),
      Object.freeze({
        sourceType: "OFFICIAL_TEAM_ROSTER",
        publisher: "Wisconsin Athletics",
        url: "https://uwbadgers.com/sports/football/roster",
        supports: "Wisconsin's official 2026 roster establishes Carter Smith as a quarterback in the Wisconsin program.",
      }),
      Object.freeze({
        sourceType: "OFFICIAL_TEAM_BIO",
        publisher: "Indiana University Athletics",
        url: "https://iuhoosiers.com/sports/football/roster/carter-smith/20978",
        supports: "Indiana's Carter Smith is a separate offensive lineman, eliminating Indiana as the program for the quarterback record.",
      }),
    ]),
    limitations: Object.freeze([
      "The original NFL Draft Buzz program value is retained in source provenance.",
      "Roster verification does not independently establish 2027 NFL Draft eligibility.",
    ]),
  }),
});

export function getProspectDataQualityRecord(applicationProspectRef) {
  if (!applicationProspectRef) return null;
  return records[applicationProspectRef] || null;
}

export function getProspectDataQualityStatus(applicationProspectRef) {
  return getProspectDataQualityRecord(applicationProspectRef)?.status || PROSPECT_DATA_QUALITY_STATUS.UNREVIEWED;
}

export function listProspectDataQualityRecords({ status } = {}) {
  const values = Object.values(records);
  return Object.freeze(status ? values.filter((record) => record.status === status) : [...values]);
}

export function getProspectDataQualityDiagnostics() {
  const values = Object.values(records);
  return Object.freeze({
    contract: PROSPECT_DATA_QUALITY_CONTRACT,
    contractVersion: PROSPECT_DATA_QUALITY_VERSION,
    reviewedRecordCount: values.length,
    verifiedCount: values.filter((record) => record.status === PROSPECT_DATA_QUALITY_STATUS.VERIFIED).length,
    reviewRequiredCount: values.filter((record) => record.status === PROSPECT_DATA_QUALITY_STATUS.REVIEW_REQUIRED).length,
    authoritativeCorrectionCount: values.filter((record) => record.reasonCodes?.includes(PROSPECT_DATA_QUALITY_REASON.AUTHORITATIVE_SOURCE_CORRECTION)).length,
  });
}

export default Object.freeze({
  getProspectDataQualityRecord,
  getProspectDataQualityStatus,
  listProspectDataQualityRecords,
  getProspectDataQualityDiagnostics,
});
