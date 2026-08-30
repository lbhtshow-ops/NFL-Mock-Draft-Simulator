#!/usr/bin/env python3
import csv
import importlib.util
import json
import pathlib
import tempfile


def load_module():
    script = pathlib.Path(__file__).with_name(
        "materializeHistoricalNFLverseSnapIdentity.py"
    )
    spec = importlib.util.spec_from_file_location("snap_materializer", script)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


module = load_module()

with tempfile.TemporaryDirectory() as temp_dir:
    root = pathlib.Path(temp_dir)
    players = root / "players.csv"
    source = root / "snaps.jsonl"
    resolved = root / "resolved.jsonl"
    quarantine = root / "quarantine.jsonl"
    report = root / "report.json"

    with players.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["pfr_id", "gsis_id"])
        writer.writeheader()
        writer.writerow({"pfr_id": "Alpha01", "gsis_id": "00-0000001"})
        writer.writerow({"pfr_id": "Bravo02", "gsis_id": "00-0000002"})

    rows = [
        {
            "season": 2020,
            "game_id": "g1",
            "week": 1,
            "pfr_player_id": "Alpha01",
            "gsis_id": None,
            "canonical_identity_resolved": False,
            "offense_snaps": 60.0,
            "offense_pct": 1.0,
            "defense_snaps": 0.0,
            "defense_pct": 0.0,
            "st_snaps": 2.0,
            "st_pct": 0.1,
            "evidence_timing": "POSTGAME_PARTICIPATION",
        },
        {
            "season": 2020,
            "game_id": "g2",
            "week": 2,
            "pfr_player_id": "Missing99",
            "gsis_id": None,
            "canonical_identity_resolved": False,
            "offense_snaps": 20.0,
            "offense_pct": 0.3,
            "defense_snaps": 0.0,
            "defense_pct": 0.0,
            "st_snaps": 0.0,
            "st_pct": 0.0,
            "evidence_timing": "POSTGAME_PARTICIPATION",
        },
        {
            "season": 2021,
            "game_id": "g3",
            "week": 1,
            "pfr_player_id": "Bravo02",
            "gsis_id": None,
            "canonical_identity_resolved": False,
            "offense_snaps": 0.0,
            "offense_pct": 0.0,
            "defense_snaps": 55.0,
            "defense_pct": 0.9,
            "st_snaps": 5.0,
            "st_pct": 0.2,
            "evidence_timing": "POSTGAME_PARTICIPATION",
        },
    ]
    source.write_text(
        "\n".join(json.dumps(row) for row in rows) + "\n",
        encoding="utf-8",
    )

    result = module.materialize(
        source,
        players,
        resolved,
        quarantine,
        report,
        {2020, 2021},
    )

    resolved_rows = [
        json.loads(line)
        for line in resolved.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    quarantine_rows = [
        json.loads(line)
        for line in quarantine.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]

checks = {
    "row_reconciliation": result["totals"]["rowReconciliationPassed"] is True,
    "source_three": result["totals"]["inScopeRows"] == 3,
    "resolved_two": result["totals"]["resolvedRows"] == 2,
    "quarantine_one": result["totals"]["quarantinedRows"] == 1,
    "canonical_field_written": resolved_rows[0]["gsis_id"] == "00-0000001",
    "canonical_flag_true": resolved_rows[0]["canonical_identity_resolved"] is True,
    "no_parallel_gsisId": "gsisId" not in resolved_rows[0],
    "quarantine_reason": quarantine_rows[0]["quarantine_reason"] == "UNRESOLVED_PFR_TO_GSIS",
    "postgame_only": result["dependencyReadiness"]["qualifiedForPregameReplacementDetermination"] is False,
    "no_calibration": result["governance"]["calibrationExecuted"] is False,
    "no_team_strength": result["governance"]["teamStrengthMutated"] is False,
    "no_pickem": result["governance"]["pickemMutated"] is False,
}

failures = [name for name, passed in checks.items() if not passed]

print(json.dumps({
    "suite": "Historical NFLverse Snap Identity Materialization",
    "contractVersion": "FIE-NFL-HISTORICAL-SNAP-IDENTITY-MATERIALIZATION-DIAGNOSTIC-1.0.0",
    "status": "FAIL" if failures else "PASS",
    "passed": len(checks) - len(failures),
    "failed": len(failures),
    "checks": checks,
    "failures": failures,
}, indent=2))

raise SystemExit(1 if failures else 0)
