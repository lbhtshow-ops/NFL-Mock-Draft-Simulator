from pathlib import Path
import json

backend_root = Path(__file__).resolve().parents[1]
repo_root = backend_root.parent
runtime = (backend_root / 'apps' / 'runtime_draft_order.py').read_text(encoding='utf-8')
draft = (repo_root / 'frontend' / 'src' / 'pages' / 'Draft.jsx').read_text(encoding='utf-8')

checks = {
    'runtime_contract_1_1': 'RUNTIME_ORDER_CONTRACT_VERSION = "1.1"' in runtime,
    'partial_order_completion_declared': 'RUNTIME_ORDER_COMPLETED_STATUS' in runtime,
    'missing_pick_materializer_present': 'def _materialize_missing_requested_picks' in runtime,
    'completed_order_requeried': 'completed = _existing_requested_picks' in runtime,
    'requested_round_limit_preserved': 'models.DraftPick.round <= num_rounds' in runtime,
    'paused_manual_pick_allowed': 'Draft is paused. Please resume before selecting a player.' not in draft,
    'pause_still_stops_timer': 'if (paused)' in draft and 'do not start a new timer' in draft,
    'deploy_component_signature_preserved': 'function Draft()' in draft,
    'no_new_sports_intelligence_import_forced': 'SportsIntelligenceEngine' not in draft,
}
status = 'PASS' if all(checks.values()) else 'FAIL'
print(json.dumps({
    'status': status,
    'contract': 'MDS5B7BR2DeploymentIntegrationDiagnostics',
    'contractVersion': '1.0.0',
    'checks': checks,
}, indent=2))
raise SystemExit(0 if status == 'PASS' else 1)
