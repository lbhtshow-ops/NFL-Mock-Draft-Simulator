#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

CONTRACT_VERSION = "FIE-NFL-FIVE-SEASON-CANONICAL-EVIDENCE-MERGE-2D2F-R3-1.0.0"
TARGET_SEASONS = {2020, 2021, 2022, 2023, 2024}


def load_jsonl(path: Path):
    if not path.exists():
        raise FileNotFoundError(path)
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


def first(row, *keys):
    for key in keys:
        if row.get(key) is not None:
            return row.get(key)
    return None


def observation_key(row):
    game_id = first(row, "gameId", "game_id")
    team = first(row, "team", "teamCode")
    season = row.get("season")
    week = row.get("week")
    if game_id and team:
        return ("OBS", str(game_id), str(team))
    return ("OBS", season, week, team)


def snap_key(row):
    player = first(row, "gsis_id", "gsisId", "playerId")
    game = first(row, "game_id", "gameId", "pfr_game_id")
    team = row.get("team")
    season = row.get("season")
    week = row.get("week")
    if player and game:
        return ("SNAP", str(game), str(player), str(team))
    return ("SNAP", season, week, team, player)


def depth_key(row):
    # Depth charts can legitimately contain multiple distinct records for the
    # same season/week/team/player/formation/depth slot. For merge purposes,
    # deduplicate only exact semantic rows rather than collapsing them to a
    # coarse role key.
    return (
        "DEPTH_EXACT",
        json.dumps(row, sort_keys=True, separators=(",", ":")),
    )


def key_for(kind, row):
    if kind == "observations":
        return observation_key(row)
    if kind == "snaps":
        return snap_key(row)
    if kind == "depth":
        return depth_key(row)
    raise ValueError(f"UNKNOWN_KIND:{kind}")


def season_of(row):
    try:
        return int(row.get("season"))
    except Exception:
        return None


def source_owns_season(source_name, season):
    # Explicit historical ownership prevents source precedence ambiguity:
    # expansion artifacts own 2020-2021; existing canonical historical
    # artifacts own 2022-2024.
    if source_name == "EXPANSION_2020_2021":
        return season in {2020, 2021}
    if source_name == "LEGACY_2022_2024":
        return season in {2022, 2023, 2024}
    return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--kind", choices=["observations", "snaps", "depth"], required=True)
    parser.add_argument("--legacy", required=True)
    parser.add_argument("--expansion", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--report", required=True)
    args = parser.parse_args()

    legacy_path = Path(args.legacy)
    expansion_path = Path(args.expansion)
    output_path = Path(args.output)
    report_path = Path(args.report)

    legacy = load_jsonl(legacy_path)
    expansion = load_jsonl(expansion_path)

    merged = {}
    duplicate_identical = 0
    duplicate_conflict = 0
    source_counts = Counter()

    for source_name, rows in [("LEGACY_2022_2024", legacy), ("EXPANSION_2020_2021", expansion)]:
        for row in rows:
            season = season_of(row)
            if season not in TARGET_SEASONS:
                continue
            if not source_owns_season(source_name, season):
                continue

            key = key_for(args.kind, row)
            if key in merged:
                if merged[key]["row"] == row:
                    duplicate_identical += 1
                else:
                    # Do not silently override conflicting evidence. Keep the
                    # first record and report the conflict.
                    duplicate_conflict += 1
                continue

            merged[key] = {
                "row": row,
                "source": source_name,
            }
            source_counts[source_name] += 1

    rows = [item["row"] for item in merged.values()]
    rows.sort(
        key=lambda r: (
            season_of(r) if season_of(r) is not None else 9999,
            r.get("week") if isinstance(r.get("week"), int) else 999,
            str(first(r, "team", "teamCode", "club_code") or ""),
            str(first(r, "gsis_id", "gsisId", "playerId", "gameId", "game_id") or ""),
        )
    )

    write_jsonl(output_path, rows)

    by_season = Counter()
    for row in rows:
        season = season_of(row)
        if season is not None:
            by_season[season] += 1

    seasons = sorted(by_season)
    all_five = seasons == [2020, 2021, 2022, 2023, 2024]

    decision = (
        "FIVE_SEASON_CANONICAL_EVIDENCE_MERGE_READY"
        if all_five and duplicate_conflict == 0 and rows
        else "FIVE_SEASON_CANONICAL_EVIDENCE_MERGE_REQUIRES_REVIEW"
    )

    report = {
        "contractVersion": CONTRACT_VERSION,
        "sprint": "2D.2F-R3",
        "mode": "ISOLATED_READ_ONLY_SOURCE_MERGE",
        "kind": args.kind,
        "decision": decision,
        "seasonOwnership": {
            "EXPANSION_2020_2021": [2020, 2021],
            "LEGACY_2022_2024": [2022, 2023, 2024],
        },
        "deduplicationSemantics": (
            "EXACT_ROW_ONLY"
            if args.kind == "depth"
            else "EVIDENCE_SPECIFIC_CANONICAL_KEY"
        ),
        "inputs": {
            "legacy": str(legacy_path),
            "legacyRows": len(legacy),
            "expansion": str(expansion_path),
            "expansionRows": len(expansion),
        },
        "output": {
            "path": str(output_path),
            "rows": len(rows),
            "bySeason": dict(sorted(by_season.items())),
            "seasons": seasons,
            "allFiveSeasonsPresent": all_five,
            "sourceAcceptedRows": dict(source_counts),
            "identicalDuplicateRowsSkipped": duplicate_identical,
            "conflictingDuplicateKeys": duplicate_conflict,
        },
        "safeguards": {
            "legacyArtifactMutated": False,
            "expansionArtifactMutated": False,
            "conflictingEvidenceOverwritten": False,
            "calibrationExecuted": False,
            "learnedWeightsCreated": False,
            "teamStrengthMutated": False,
            "decisionModelMutated": False,
            "pickemMutated": False,
        },
    }

    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))

    if decision != "FIVE_SEASON_CANONICAL_EVIDENCE_MERGE_READY":
        raise SystemExit(3)


if __name__ == "__main__":
    main()
