"""Draft-class eligibility overlays for the 2027 application prospect catalog.

Eligibility is intentionally separate from identity verification. A player can have a verified
identity while still being ineligible or not yet verified for a specific NFL Draft class.
Known NOT_ELIGIBLE records are excluded from the 2027 draftable runtime while their source
provenance remains available in the application catalog/audit trail.
"""

from typing import Dict, Mapping

ELIGIBILITY_CONTRACT_VERSION = "FIP-PROSPECT-ELIGIBILITY-1.0.0"
ELIGIBILITY_RULE = "NFL_THREE_YEARS_REMOVED_FROM_HIGH_SCHOOL"
ELIGIBILITY_VERIFIED_AT = "2026-08-09"

ELIGIBILITY_STATUS = {
    "ELIGIBLE": "ELIGIBLE",
    "NOT_ELIGIBLE": "NOT_ELIGIBLE",
    "REVIEW_REQUIRED": "REVIEW_REQUIRED",
    "UNKNOWN": "UNKNOWN",
}

PROSPECT_ELIGIBILITY_2027: Dict[str, Mapping[str, object]] = {
    "app-prospect:2027:carter-smith:source-315": {
        "status": "NOT_ELIGIBLE",
        "verified_at": ELIGIBILITY_VERIFIED_AT,
        "draft_year": 2027,
        "earliest_draft_year": 2028,
        "high_school_class_year": 2025,
        "basis": "Wisconsin lists Carter Smith as a true freshman in 2025 and a redshirt freshman in 2026. NFL draft eligibility requires prospects to be at least three years removed from high school.",
        "rule": ELIGIBILITY_RULE,
        "authority": [
            {
                "type": "OFFICIAL_TEAM_BIO",
                "publisher": "Wisconsin Athletics",
                "url": "https://uwbadgers.com/sports/football/roster/carter-smith/15400",
                "supports": "2025 true freshman season; 2026 roster class is redshirt freshman.",
            },
            {
                "type": "NFL_ELIGIBILITY_RULE",
                "publisher": "NFL.com",
                "url": "https://www.nfl.com/news/ncaa-eligibility-decision-leaves-2021-nfl-draft-pool-murky",
                "supports": "NFL draft eligibility requires players to be three years removed from high school.",
            },
        ],
        "disposition": "EXCLUDE_FROM_2027_DRAFTABLE_RUNTIME_PRESERVE_SOURCE_PROVENANCE",
    },
}


def get_prospect_eligibility(application_prospect_ref: str):
    return PROSPECT_ELIGIBILITY_2027.get(application_prospect_ref)


def apply_draft_eligibility(row: Mapping[str, object]):
    result = dict(row)
    application_ref = str(result.get("application_prospect_ref") or "")
    eligibility = get_prospect_eligibility(application_ref)
    if eligibility:
        result["draft_eligibility_status"] = eligibility["status"]
        result["draft_eligibility"] = dict(eligibility)
    else:
        result["draft_eligibility_status"] = "UNKNOWN"
    return result


def is_known_ineligible_for_2027(row: Mapping[str, object]) -> bool:
    return row.get("draft_eligibility_status") == "NOT_ELIGIBLE"
