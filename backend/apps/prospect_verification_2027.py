"""Authoritative identity verification overlays for the 2027 application prospect catalog.

This module does not rewrite imported provenance. It applies higher-authority verified facts
at the application/runtime boundary while preserving source-reported values for audit.
"""

from typing import Dict, Mapping

from .prospect_eligibility_2027 import apply_draft_eligibility

VERIFICATION_CONTRACT_VERSION = "FIP-PROSPECT-VERIFICATION-1.0.0"
VERIFIED_AT = "2026-08-09"

VERIFIED_IDENTITY_OVERRIDES: Dict[str, Mapping[str, object]] = {
    "app-prospect:2027:carter-smith": {
        "status": "VERIFIED",
        "verified_at": VERIFIED_AT,
        "name": "Carter Smith",
        "position": "OT",
        "college": "Indiana",
        "authority": {
            "type": "OFFICIAL_TEAM_BIO",
            "publisher": "Indiana University Athletics",
            "url": "https://iuhoosiers.com/sports/football/roster/carter-smith/20978",
        },
    },
    "app-prospect:2027:carter-smith:source-315": {
        "status": "VERIFIED",
        "verified_at": VERIFIED_AT,
        "name": "Carter Smith",
        "position": "QB",
        "college": "Wisconsin",
        "authority": {
            "type": "OFFICIAL_TEAM_ROSTER",
            "publisher": "Wisconsin Athletics",
            "url": "https://uwbadgers.com/sports/football/roster",
        },
        "source_correction": {
            "field": "college",
            "source_reported_value": "Indiana",
            "verified_value": "Wisconsin",
            "application_reference_preserved": True,
        },
    },
}


def get_verified_identity(application_prospect_ref: str):
    return VERIFIED_IDENTITY_OVERRIDES.get(application_prospect_ref)


def apply_verified_identity(row: Mapping[str, object]) -> Dict[str, object]:
    result = dict(row)
    application_ref = str(result.get("application_prospect_ref") or "")
    verified = get_verified_identity(application_ref)
    result["source_reported_name"] = result.get("name")
    result["source_reported_position"] = result.get("position")
    result["source_reported_college"] = result.get("college")
    if not verified:
        result["verification_status"] = "SOURCE_REPORTED"
        return apply_draft_eligibility(result)

    result["name"] = verified["name"]
    result["position"] = verified["position"]
    result["college"] = verified["college"]
    result["verification_status"] = verified["status"]
    result["verification_authority"] = verified["authority"]
    result["verified_at"] = verified["verified_at"]
    if "source_correction" in verified:
        result["source_correction"] = verified["source_correction"]
    return apply_draft_eligibility(result)
