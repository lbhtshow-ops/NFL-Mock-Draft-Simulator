#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


CONTRACT_VERSION = (
    "FIE-NFL-STRICT-REPLACEMENT-EVIDENCE-COVERAGE-EXPANSION-RUNNER-2D2D-1.0.0"
)


def run(cmd):
    print("\n[2D.2D] RUN:", " ".join(str(x) for x in cmd), flush=True)
    completed = subprocess.run(cmd)
    if completed.returncode != 0:
        raise SystemExit(completed.returncode)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--seasons", default="2020,2021")
    parser.add_argument(
        "--schedules",
        default="data/calibration/historical/v1/raw/games.csv",
    )
    parser.add_argument(
        "--workspace",
        default="data/calibration/historical/expansion-2020-2021/"
        "official-publications-2d2d",
    )
    parser.add_argument("--request-timeout", type=float, default=5.0)
    parser.add_argument("--max-articles-per-team-season", type=int, default=120)
    parser.add_argument("--months", default="8,9,10,11,12")
    args = parser.parse_args()

    workspace = Path(args.workspace)
    workspace.mkdir(parents=True, exist_ok=True)

    raw_output = workspace / "official-team-pregame-publications-2020-2021.jsonl"
    raw_report = workspace / "official-team-pregame-publication-discovery-report.json"
    checkpoint = workspace / "official-team-pregame-publication-checkpoint.json"

    resolved_output = (
        workspace / "official-team-pregame-publications-2020-2021-resolved.jsonl"
    )
    resolved_report = (
        workspace / "official-team-pregame-publication-week-resolution-report.json"
    )

    python = sys.executable

    run([
        python,
        "scripts/discoverHistoricalOfficialTeamPregamePublications.py",
        "--seasons", args.seasons,
        "--schedules", args.schedules,
        "--output", str(raw_output),
        "--report", str(raw_report),
        "--checkpoint", str(checkpoint),
        "--request-timeout", str(args.request_timeout),
        "--max-articles-per-team-season",
        str(args.max_articles_per_team_season),
        "--months", args.months,
    ])

    run([
        python,
        "scripts/resolveHistoricalOfficialTeamPublicationWeeks.py",
        "--source", str(raw_output),
        "--schedules", args.schedules,
        "--output", str(resolved_output),
        "--report", str(resolved_report),
        # Existing canonical source-coverage thresholds.
        "--min-team-breadth", "16",
        "--min-season-breadth", "2",
        "--min-pregame-safe", "50",
    ])

    result = {
        "contractVersion": CONTRACT_VERSION,
        "sprint": "2D.2D",
        "mode": "ISOLATED_OFFICIAL_PUBLICATION_EXPANSION",
        "seasons": [
            int(x.strip()) for x in args.seasons.split(",") if x.strip()
        ],
        "workspace": str(workspace),
        "rawEvidence": str(raw_output),
        "rawReport": str(raw_report),
        "checkpoint": str(checkpoint),
        "resolvedEvidence": str(resolved_output),
        "resolvedReport": str(resolved_report),
        "canonicalArtifactsMutated": False,
        "replacementMappingsGenerated": False,
        "calibrationExecuted": False,
        "learnedWeights": None,
        "teamStrengthMutated": False,
        "decisionModelMutated": False,
        "pickemMutated": False,
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
