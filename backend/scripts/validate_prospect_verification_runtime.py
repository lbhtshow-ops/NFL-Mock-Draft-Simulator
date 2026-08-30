"""Read-only validation for MDS-5B.6 Rev2 source verification + eligibility gate."""
import json
import sys
from pathlib import Path

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
if str(REPOSITORY_ROOT) not in sys.path:
    sys.path.insert(0, str(REPOSITORY_ROOT))

from backend.apps.application_inventory_2027 import runtime_inventory_rows, runtime_inventory_diagnostics
from backend.apps.prospect_eligibility_2027 import get_prospect_eligibility


def main():
    rows = runtime_inventory_rows()
    by_ref = {row["application_prospect_ref"]: row for row in rows}
    ot = by_ref["app-prospect:2027:carter-smith"]
    qb_ref = "app-prospect:2027:carter-smith:source-315"
    qb_eligibility = get_prospect_eligibility(qb_ref)
    diagnostics = runtime_inventory_diagnostics()
    checks = {
        "draftable_runtime_count_337": len(rows) == 337,
        "application_catalog_candidate_count_preserved_338": diagnostics.get("application_catalog_candidate_count") == 338,
        "carter_ot_verified_indiana": ot["position"] == "OT" and ot["college"] == "Indiana" and ot.get("verification_status") == "VERIFIED",
        "carter_qb_not_in_2027_draftable_runtime": qb_ref not in by_ref,
        "carter_qb_eligibility_not_eligible": qb_eligibility.get("status") == "NOT_ELIGIBLE",
        "carter_qb_earliest_draft_year_2028": qb_eligibility.get("earliest_draft_year") == 2028,
        "carter_qb_application_reference_preserved_for_audit": qb_ref == "app-prospect:2027:carter-smith:source-315",
        "known_ineligible_exclusion_count_one": diagnostics.get("known_ineligible_excluded_count") == 1,
        "draftable_runtime_ranks_contiguous": [row["rank"] for row in rows] == list(range(1, len(rows) + 1)),
        "no_canonical_identifier_claimed": not any(row.get("canonical_identifier") for row in rows),
    }
    result = {
        "status": "PASS" if all(checks.values()) else "FAIL",
        "contract": "ProspectSourceVerificationEligibilityRuntimeDiagnostics",
        "contractVersion": "MDS-5B.6-REV2-1.0.0",
        "checks": checks,
        "diagnostics": diagnostics,
        "samples": {"carterOt": ot, "carterQbEligibilityAudit": qb_eligibility},
    }
    print(json.dumps(result, indent=2))
    raise SystemExit(0 if result["status"] == "PASS" else 1)


if __name__ == "__main__":
    main()
