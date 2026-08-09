"""Read-only validation for MDS-5B.4 unified application identity and runtime materialization."""
import json, sys
from pathlib import Path
REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
if str(REPOSITORY_ROOT) not in sys.path: sys.path.insert(0, str(REPOSITORY_ROOT))
from backend.apps.application_inventory_2027 import runtime_inventory_diagnostics, runtime_inventory_rows

def main():
    diagnostics = runtime_inventory_diagnostics(); rows = runtime_inventory_rows(); refs = {r["application_prospect_ref"]: r for r in rows}
    checks = {
        "runtime_inventory_count_338": len(rows) == 338,
        "complete_seven_round_depth_available": len(rows) > 257,
        "published_source_count_336": diagnostics["published_source_count"] == 336,
        "materialized_base_source_count_336": diagnostics["base_source_count"] == 336,
        "identity_collisions_no_longer_withheld": diagnostics["excluded_identity_collision_count"] == 0,
        "three_source_scoped_disambiguations": diagnostics["disambiguated_identity_count"] == 3 and diagnostics["disambiguated_source_ordinals"] == [315, 335, 336],
        "references_unique": len(refs) == len(rows),
        "carter_qb_reference_present": refs.get("app-prospect:2027:carter-smith:source-315", {}).get("position") == "QB",
        "jamari_cb_reference_present": refs.get("app-prospect:2027:jamari-johnson:source-335", {}).get("position") == "CB",
        "anthony_dl_reference_present": refs.get("app-prospect:2027:anthony-smith:source-336", {}).get("position") == "DL",
        "legacy_runtime_ranks_contiguous": [r["rank"] for r in rows] == list(range(1, len(rows)+1)),
        "canonical_identifier_not_claimed": diagnostics["canonical_identifier_count"] == 0,
        "draft_intelligence_not_claimed": diagnostics["draft_intelligence_authority"] is False,
    }
    payload = {"status": "PASS" if all(checks.values()) else "FAIL", "contract": "UnifiedApplicationProspectRuntimeIdentityDiagnostics", "contractVersion": "MDS-5B.4-1.0.0", "checks": checks, "diagnostics": diagnostics, "collisionSamples": {k: refs.get(k) for k in ["app-prospect:2027:carter-smith", "app-prospect:2027:carter-smith:source-315", "app-prospect:2027:jamari-johnson:source-335", "app-prospect:2027:anthony-smith:source-336"]}}
    print(json.dumps(payload, indent=2)); raise SystemExit(0 if payload["status"] == "PASS" else 1)
if __name__ == "__main__": main()
