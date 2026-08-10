from pathlib import Path
import json

here = Path(__file__).resolve()
source = (here.parents[1] / "apps" / "runtime_draft_order.py").read_text(encoding="utf-8")

checks = {
    "partial_existing_order_completed": "_materialize_missing_requested_picks" in source,
    "existing_pick_numbers_preserved": "existing_numbers" in source and "continue" in source,
    "completed_status_declared": "EXISTING_RUNTIME_ORDER_COMPLETED_FROM_TEMPLATE" in source,
    "completed_order_requeried": "completed = _existing_requested_picks" in source,
    "requested_round_limit_preserved": "models.DraftPick.round <= num_rounds" in source,
    "no_early_existing_return_before_template_check": "if existing:\n        return RuntimeDraftOrderResolution" not in source.split("source_year = _latest_template_year", 1)[0],
}

result = {
    "status": "PASS" if all(checks.values()) else "FAIL",
    "contract": "DraftRuntimeOrderCompletionSourceDiagnostics",
    "contractVersion": "MDS-5B.7B-R2-1.0.0",
    "checks": checks,
}
print(json.dumps(result, indent=2))
raise SystemExit(0 if result["status"] == "PASS" else 1)
