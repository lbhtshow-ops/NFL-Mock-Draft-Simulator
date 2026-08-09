"""Read-only validation for MDS-5B.3D final available-source runtime inventory."""

import json
import sys
from pathlib import Path

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
if str(REPOSITORY_ROOT) not in sys.path:
    sys.path.insert(0, str(REPOSITORY_ROOT))

from backend.apps.application_inventory_2027 import runtime_inventory_diagnostics, runtime_inventory_rows


def main():
    diagnostics = runtime_inventory_diagnostics()
    rows = runtime_inventory_rows()
    checks = {
        "runtime_inventory_count_335": len(rows) == 335,
        "complete_seven_round_depth_available": len(rows) > 257,
        "published_source_count_336": diagnostics["published_source_count"] == 336,
        "materialized_base_source_count_333": diagnostics["base_source_count"] == 333,
        "identity_collisions_withheld": diagnostics["excluded_identity_collision_count"] == 3 and diagnostics["excluded_source_ordinals"] == [315, 335, 336],
        "references_unique": len({row["application_prospect_ref"] for row in rows}) == len(rows),
        "legacy_runtime_ranks_contiguous": [row["rank"] for row in rows] == list(range(1, len(rows) + 1)),
        "canonical_identifier_not_claimed": diagnostics["canonical_identifier_count"] == 0,
        "draft_intelligence_not_claimed": diagnostics["draft_intelligence_authority"] is False,
    }
    payload = {
        "status": "PASS" if all(checks.values()) else "FAIL",
        "contract": "Final2027RuntimeCatalogMaterializationDiagnostics",
        "contractVersion": "MDS-5B.3D-1.0.0",
        "checks": checks,
        "diagnostics": diagnostics,
        "samples": {
            "first": rows[0] if rows else None,
            "pick_257_depth": rows[256] if len(rows) > 256 else None,
            "last": rows[-1] if rows else None,
        },
    }
    print(json.dumps(payload, indent=2))
    raise SystemExit(0 if payload["status"] == "PASS" else 1)


if __name__ == "__main__":
    main()
