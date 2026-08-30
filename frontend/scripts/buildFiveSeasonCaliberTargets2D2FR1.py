#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path

CONTRACT_VERSION = "FIE-NFL-FIVE-SEASON-CALIBER-TARGET-EXPANSION-2D2F-R1-1.0.0"
TARGET_SEASONS = {2020, 2021, 2022, 2023, 2024}


def load_jsonl(path: Path):
    if not path.exists():
        return []
    rows = []
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"INVALID_JSONL:{path}:line={line_number}:{exc}") from exc
    return rows


def write_jsonl(path: Path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, separators=(",", ":")) + "\n")


def observation_key(row):
    return (row.get("season"), row.get("week"), row.get("team"))


def build_observation_map(rows):
    out = {}
    for row in rows:
        key = observation_key(row)
        if None not in key:
            out[key] = row
    return out


def role_record(targets, season, week, team, player_id, role, source_row, obs):
    key = (season, week, team, player_id)
    if key not in targets:
        targets[key] = {
            "contractVersion": "FIE-NFL-HISTORICAL-PLAYER-CALIBER-TARGET-1.0.0",
            "season": season,
            "week": week,
            "team": team,
            "playerId": player_id,
            "roles": [],
            "asOf": obs.get("evidenceAsOf") or obs.get("asOf"),
            "kickoffAt": obs.get("kickoffAt"),
            "gameId": obs.get("gameId") or source_row.get("gameId"),
            "anchorSourceUrl": None,
            "historicalCaliberStatus": "PENDING_CANONICAL_HISTORICAL_EVALUATION",
            "caliber": None,
            "confidence": None,
            "modelVersion": None,
            "provenance": {
                "sourceCorpus":
                    "five-season-shadow-replacement-corpus-v1.jsonl",
                "sourceResolver":
                    source_row.get("resolverVersion"),
                "sourceResolverMode":
                    source_row.get("resolverMode"),
                "targetExpansionSprint": "2D.2F-R1",
                "strictOfficialTruthInjected": False,
            },
        }
    if role not in targets[key]["roles"]:
        targets[key]["roles"].append(role)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--shadow-corpus",
        default=(
            "data/calibration/historical/expansion-2020-2021/"
            "player-impact/five-season-shadow-replacement-corpus-v1.jsonl"
        ),
    )
    parser.add_argument(
        "--legacy-observations",
        default="data/calibration/historical/v1/observations-availability.jsonl",
    )
    parser.add_argument(
        "--expansion-observations",
        default=(
            "data/calibration/historical/expansion-2020-2021/"
            "availability/observations-availability.jsonl"
        ),
    )
    parser.add_argument(
        "--output",
        default=(
            "data/calibration/historical/expansion-2020-2021/"
            "player-impact/caliber/five-season-player-caliber-targets-v1.jsonl"
        ),
    )
    parser.add_argument(
        "--report",
        default=(
            "data/calibration/historical/expansion-2020-2021/"
            "player-impact/caliber/five-season-player-caliber-targets-v1-report.json"
        ),
    )
    args = parser.parse_args()

    required = [
        Path(args.shadow_corpus),
        Path(args.legacy_observations),
        Path(args.expansion_observations),
    ]
    missing = [str(p) for p in required if not p.exists()]
    if missing:
        print(json.dumps({
            "contractVersion": CONTRACT_VERSION,
            "status": "REQUIRED_INPUTS_MISSING",
            "missingInputs": missing,
        }, indent=2))
        raise SystemExit(2)

    corpus = load_jsonl(Path(args.shadow_corpus))
    observations = (
        load_jsonl(Path(args.legacy_observations))
        + load_jsonl(Path(args.expansion_observations))
    )
    omap = build_observation_map(observations)

    targets = {}
    skipped = Counter()
    corpus_by_season = Counter()
    targets_by_season = Counter()
    roles = Counter()

    for row in corpus:
        season = row.get("season")
        week = row.get("week")
        team = row.get("team")

        if season not in TARGET_SEASONS:
            skipped["OUTSIDE_TARGET_SEASONS"] += 1
            continue

        corpus_by_season[season] += 1

        unavailable_id = row.get("unavailablePlayerId")
        replacement_id = row.get("replacementPlayerId")
        if not unavailable_id or not replacement_id:
            skipped["MISSING_PLAYER_ID"] += 1
            continue

        obs = omap.get((season, week, team))
        if not obs:
            skipped["MISSING_OBSERVATION_ANCHOR"] += 1
            continue

        kickoff = obs.get("kickoffAt")
        as_of = obs.get("evidenceAsOf") or obs.get("asOf")
        if not kickoff:
            skipped["MISSING_KICKOFF"] += 1
            continue
        if not as_of:
            skipped["MISSING_AS_OF"] += 1
            continue

        role_record(
            targets, season, week, team, unavailable_id,
            "UNAVAILABLE_PLAYER", row, obs
        )
        role_record(
            targets, season, week, team, replacement_id,
            "EXPECTED_REPLACEMENT", row, obs
        )
        roles["UNAVAILABLE_PLAYER"] += 1
        roles["EXPECTED_REPLACEMENT"] += 1

    output_rows = sorted(
        targets.values(),
        key=lambda r: (
            r["season"], r["week"], r["team"], r["playerId"]
        ),
    )

    for row in output_rows:
        targets_by_season[row["season"]] += 1

    output = Path(args.output)
    report = Path(args.report)
    write_jsonl(output, output_rows)
    report.parent.mkdir(parents=True, exist_ok=True)

    all_five = sorted(targets_by_season) == [2020, 2021, 2022, 2023, 2024]
    kickoff_complete = all(bool(r.get("kickoffAt")) for r in output_rows)
    asof_complete = all(bool(r.get("asOf")) for r in output_rows)

    decision = (
        "FIVE_SEASON_CALIBER_TARGET_EXPANSION_READY_FOR_CANONICAL_EVALUATION"
        if output_rows and all_five and kickoff_complete and asof_complete
        else "FIVE_SEASON_CALIBER_TARGET_EXPANSION_INCOMPLETE"
    )

    payload = {
        "contractVersion": CONTRACT_VERSION,
        "sprint": "2D.2F-R1",
        "mode": "ISOLATED_CANONICAL_CALIBER_TARGET_EXPANSION",
        "decision": decision,
        "source": {
            "shadowCorpus": str(Path(args.shadow_corpus)),
            "sourceRows": len(corpus),
            "sourceRowsBySeason": dict(sorted(corpus_by_season.items())),
        },
        "targets": {
            "uniquePlayerGameTargets": len(output_rows),
            "bySeason": dict(sorted(targets_by_season.items())),
            "allFiveSeasonsPresent": all_five,
            "kickoffCoverageRate": (
                sum(bool(r.get("kickoffAt")) for r in output_rows) / len(output_rows)
                if output_rows else 0
            ),
            "asOfCoverageRate": (
                sum(bool(r.get("asOf")) for r in output_rows) / len(output_rows)
                if output_rows else 0
            ),
            "roleAssignments": dict(roles),
            "output": str(output),
        },
        "skipped": dict(skipped),
        "nextAction": {
            "canonicalHistoricalEvaluationAuthorized": decision.endswith("READY_FOR_CANONICAL_EVALUATION"),
            "canonicalSnapshotGenerationAuthorized": False,
            "playerImpactValidationAuthorized": False,
            "productionPlayerImpactCalibrationAuthorized": False,
            "teamStrengthPromotionAuthorized": False,
            "pickemHandoffAuthorized": False,
        },
        "safeguards": {
            "strictOfficialTruthLabelsInjected": False,
            "syntheticCaliberCreated": False,
            "currentRatingBackfillUsed": False,
            "targetGamePerformanceUsed": False,
            "futureEvidenceUsed": False,
            "legacyTargetArtifactMutated": False,
            "legacyCaliberArtifactMutated": False,
            "calibrationExecuted": False,
            "learnedWeightsCreated": False,
            "teamStrengthMutated": False,
            "decisionModelMutated": False,
            "pickemMutated": False,
        },
    }

    report.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
