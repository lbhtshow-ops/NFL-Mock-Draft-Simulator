"""CLI validation for the LBHT Mock Draft Simulator operational database."""

from __future__ import annotations

import json

from backend.database import SessionLocal
from backend.apps.runtime_database_diagnostics import collect_runtime_database_diagnostics


def main() -> None:
    db = SessionLocal()
    try:
        result = collect_runtime_database_diagnostics(db)
        print(json.dumps(result, indent=2, sort_keys=True))
        if not result["bootstrap_ready"]:
            raise SystemExit(2)
    finally:
        db.close()


if __name__ == "__main__":
    main()
