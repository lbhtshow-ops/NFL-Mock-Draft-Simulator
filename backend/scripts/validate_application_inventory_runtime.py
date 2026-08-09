"""Read-only validation for MDS-5B.3C runtime catalog materialization."""

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
        "inventory_materialized_beyond_16": len(rows) > 16,
        "runtime_inventory_count_242": len(rows) == 242,
        "references_unique": len({row["application_prospect_ref"] for row in rows}) == len(rows),
        "legacy_runtime_ranks_contiguous": [row["rank"] for row in rows] == list(range(1, len(rows) + 1)),
        "canonical_identifier_not_claimed": diagnostics["canonical_identifier_count"] == 0,
        "draft_intelligence_not_claimed": diagnostics["draft_intelligence_authority"] is False,
    }
    payload = {
        "status": "PASS" if all(checks.values()) else "FAIL",
        "contract": "RuntimeCatalogMaterializationDiagnostics",
        "contractVersion": "MDS-5B.3C-1.0.0",
        "checks": checks,
        "diagnostics": diagnostics,
        "samples": {
            "first": rows[0] if rows else None,
            "seventeenth": rows[16] if len(rows) > 16 else None,
            "last": rows[-1] if rows else None,
        },
    }
    print(json.dumps(payload, indent=2))
    raise SystemExit(0 if payload["status"] == "PASS" else 1)


if __name__ == "__main__":
    main()
