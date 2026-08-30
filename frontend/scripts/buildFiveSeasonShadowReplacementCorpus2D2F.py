#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path


CONTRACT_VERSION = (
    "FIE-NFL-FIVE-SEASON-SHADOW-REPLACEMENT-CORPUS-2D2F-1.0.0"
)

TARGET_SEASONS = {2020, 2021, 2022, 2023, 2024}
UNAVAILABLE_STATUSES = {"OUT", "DOUBTFUL"}


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
            raise RuntimeError(
                f"INVALID_JSONL:{path}:line={line_number}:{exc}"
            ) from exc
    return rows


def write_jsonl(path: Path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, separators=(",", ":")) + "\n")


def clean(value):
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def exact_position(value):
    return (clean(value) or "UNKNOWN").upper()


def position_group(value):
    p = exact_position(value)
    if p in {"C", "G", "OG", "T", "OT", "OL"}:
        return "OL"
    if p in {"CB", "S", "FS", "SS", "DB"}:
        return "DB"
    if p in {"DE", "DT", "NT", "DL"}:
        return "DL"
    if p in {"LB", "ILB", "OLB"}:
        return "LB"
    if p in {"RB", "HB", "FB"}:
        return "RB"
    return p


def snap_pct(row):
    g = position_group(row.get("position"))
    if g in {"QB", "RB", "WR", "TE", "OL"}:
        return float(row.get("offense_pct") or 0.0)
    if g in {"DB", "DL", "LB"}:
        return float(row.get("defense_pct") or 0.0)
    return float(row.get("st_pct") or 0.0)


def build_observation_map(rows):
    out = {}
    for row in rows:
        key = (row.get("season"), row.get("week"), row.get("team"))
        if None not in key:
            out[key] = row
    return out


def treatment_events(rows):
    events = []
    for obs in rows:
        season = obs.get("season")
        if season not in TARGET_SEASONS:
            continue

        evidence = obs.get("evidence") or {}
        availability = evidence.get("availabilityImpact") or {}
        for player in availability.get("players") or []:
            status = (player.get("reportStatus") or "").upper()
            if status not in UNAVAILABLE_STATUSES:
                continue
            player_id = player.get("playerId")
            if not player_id:
                continue
            events.append({
                "season": season,
                "week": obs.get("week"),
                "team": obs.get("team"),
                "gameId": obs.get("gameId"),
                "unavailablePlayerId": player_id,
                "unavailablePlayerName": player.get("playerName"),
                "position": player.get("position"),
                "availabilityStatus": status,
            })
    return events


def build_depth_index(rows):
    idx = defaultdict(list)
    for row in rows:
        season = row.get("season")
        week = row.get("week")
        team = row.get("club_code") or row.get("team")
        player_id = row.get("gsis_id")
        if (
            season in TARGET_SEASONS
            and week is not None
            and team
            and player_id
        ):
            idx[(season, week, team)].append(row)
    return idx


def usable_snap_rows(rows):
    return [
        row for row in rows
        if row.get("season") in TARGET_SEASONS
        and row.get("canonical_identity_resolved") is True
        and row.get("gsis_id")
    ]


def roster_ids(obs):
    if not obs:
        return set()

    evidence = obs.get("evidence") or {}
    roster = (evidence.get("rosterDepth") or {}).get("players") or []
    active = set()

    for row in roster:
        pid = row.get("playerId") or row.get("gsis_id")
        if not pid:
            continue
        status = (row.get("status") or row.get("rosterStatus") or "").upper()
        if status in {"IR", "RESERVE", "SUSPENDED", "PUP", "NFI", "OUT"}:
            continue
        active.add(pid)
    return active


def prior_usage_candidates(event, snaps):
    by_player = defaultdict(list)
    for row in snaps:
        if row.get("season") != event["season"]:
            continue
        if row.get("team") != event["team"]:
            continue
        row_week = row.get("week")
        if not isinstance(row_week, int) or row_week >= event["week"]:
            continue
        player_id = row.get("gsis_id")
        if not player_id or player_id == event["unavailablePlayerId"]:
            continue
        if position_group(row.get("position")) != position_group(event["position"]):
            continue
        by_player[player_id].append(row)

    out = {}
    for player_id, rows in by_player.items():
        latest = max(rows, key=lambda r: r["week"])
        out[player_id] = {
            "playerId": player_id,
            "playerName": latest.get("player_name"),
            "position": exact_position(latest.get("position")),
            "exactPosition": (
                exact_position(latest.get("position"))
                == exact_position(event["position"])
            ),
            "priorWeek": latest.get("week"),
            "priorSnapPct": snap_pct(latest),
        }
    return out


def depth_candidates(event, depth_index):
    rows = depth_index.get(
        (event["season"], event["week"], event["team"]),
        [],
    )

    unavailable_rows = [
        row for row in rows
        if row.get("gsis_id") == event["unavailablePlayerId"]
    ]

    unavailable_depth_position = next(
        (
            row.get("depth_position")
            for row in unavailable_rows
            if row.get("depth_position")
        ),
        None,
    )

    out = {}
    for row in rows:
        player_id = row.get("gsis_id")
        if not player_id or player_id == event["unavailablePlayerId"]:
            continue
        if position_group(row.get("position")) != position_group(event["position"]):
            continue

        same_depth_position = (
            unavailable_depth_position is not None
            and row.get("depth_position") == unavailable_depth_position
        )

        payload = {
            "playerId": player_id,
            "playerName": row.get("full_name") or row.get("football_name"),
            "position": exact_position(row.get("position")),
            "exactPosition": (
                exact_position(row.get("position"))
                == exact_position(event["position"])
            ),
            "sameDepthPosition": same_depth_position,
            "depthPosition": row.get("depth_position"),
        }
        current = out.get(player_id)
        if current is None or (
            payload["sameDepthPosition"]
            and not current["sameDepthPosition"]
        ):
            out[player_id] = payload
    return out


def role_first_rank(candidate):
    # Frozen deterministic precedence from 2D.2E.
    # This is a selection ordering, not a learned impact/calibration weight.
    return (
        int(candidate["sameDepthPosition"]),
        int(candidate["exactPosition"]),
        int(candidate["rosterEligible"]),
        candidate["priorSnapPct"],
    )


def resolve_event(event, snaps, depth_index, observation_map):
    usage = prior_usage_candidates(event, snaps)
    depth = depth_candidates(event, depth_index)
    roster = roster_ids(
        observation_map.get(
            (event["season"], event["week"], event["team"])
        )
    )

    candidate_ids = set(usage) | set(depth)
    if not candidate_ids:
        return None

    candidates = []
    for player_id in candidate_ids:
        u = usage.get(player_id, {})
        d = depth.get(player_id, {})

        candidate = {
            "playerId": player_id,
            "playerName": d.get("playerName") or u.get("playerName"),
            "position": d.get("position") or u.get("position"),
            "sameDepthPosition": bool(d.get("sameDepthPosition")),
            "exactPosition": bool(
                d.get("exactPosition") or u.get("exactPosition")
            ),
            "rosterEligible": (
                player_id in roster
                if roster
                else True
            ),
            "priorWeek": u.get("priorWeek"),
            "priorSnapPct": float(u.get("priorSnapPct") or 0.0),
            "hasDepthContext": player_id in depth,
            "hasPriorUsage": player_id in usage,
        }
        candidate["rankTuple"] = role_first_rank(candidate)
        candidates.append(candidate)

    candidates.sort(key=lambda c: c["rankTuple"], reverse=True)
    winner = candidates[0]

    return {
        "replacementPlayerId": winner["playerId"],
        "replacementPlayerName": winner["playerName"],
        "replacementPosition": winner["position"],
        "candidateCount": len(candidates),
        "winnerEvidence": {
            key: winner[key]
            for key in [
                "sameDepthPosition",
                "exactPosition",
                "rosterEligible",
                "priorWeek",
                "priorSnapPct",
                "hasDepthContext",
                "hasPriorUsage",
            ]
        },
    }


def extract_caliber_value(row):
    candidates = [
        row.get("playerCaliber"),
        row.get("caliber"),
        row.get("caliberScore"),
        row.get("score"),
        row.get("overallScore"),
        row.get("canonicalCaliber"),
    ]
    for value in candidates:
        if isinstance(value, (int, float)):
            return float(value)

    nested = row.get("caliber") if isinstance(row.get("caliber"), dict) else None
    if nested:
        for key in ["score", "overall", "value"]:
            value = nested.get(key)
            if isinstance(value, (int, float)):
                return float(value)
    return None


def caliber_player_id(row):
    return (
        row.get("playerId")
        or row.get("gsis_id")
        or row.get("gsisId")
        or (row.get("identity") or {}).get("playerId")
    )


def caliber_season(row):
    return (
        row.get("season")
        or (row.get("identity") or {}).get("season")
        or (row.get("scope") or {}).get("season")
    )


def caliber_week(row):
    return (
        row.get("week")
        or (row.get("identity") or {}).get("week")
        or (row.get("scope") or {}).get("week")
    )


def build_caliber_index(paths):
    index = defaultdict(list)
    loaded = []

    for path in paths:
        if not path.exists():
            continue

        rows = load_jsonl(path)
        loaded.append({
            "path": str(path),
            "rows": len(rows),
        })

        for row in rows:
            player_id = caliber_player_id(row)
            season = caliber_season(row)
            week = caliber_week(row)
            score = extract_caliber_value(row)

            if not player_id or season is None or score is None:
                continue

            index[(season, player_id)].append({
                "week": week,
                "score": score,
                "source": str(path),
            })

    for values in index.values():
        values.sort(
            key=lambda x: (
                x["week"] is not None,
                x["week"] if x["week"] is not None else -1,
            )
        )

    return index, loaded


def resolve_caliber(index, season, week, player_id):
    candidates = index.get((season, player_id), [])
    if not candidates:
        return None

    prior = [
        row for row in candidates
        if row["week"] is None or row["week"] <= week
    ]
    if prior:
        return prior[-1]

    return candidates[-1]


def main():
    parser = argparse.ArgumentParser()
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
        "--legacy-snaps",
        default="data/calibration/historical/v1/historical-snap-counts-resolved.jsonl",
    )
    parser.add_argument(
        "--expansion-snaps",
        default=(
            "data/calibration/historical/expansion-2020-2021/"
            "snap-counts/historical-snap-counts-resolved-v1.jsonl"
        ),
    )
    parser.add_argument(
        "--legacy-depth",
        default="data/calibration/historical/v1/historical-depth-charts.jsonl",
    )
    parser.add_argument(
        "--expansion-depth",
        default=(
            "data/calibration/historical/expansion-2020-2021/"
            "depth-charts/historical-depth-charts.jsonl"
        ),
    )
    parser.add_argument(
        "--legacy-caliber",
        default=(
            "data/calibration/historical/v1/"
            "historical-player-caliber-snapshots-v1.jsonl"
        ),
    )
    parser.add_argument(
        "--expansion-caliber",
        default=(
            "data/calibration/historical/expansion-2020-2021/"
            "caliber/historical-player-caliber-snapshots-v1.jsonl"
        ),
    )
    parser.add_argument(
        "--output",
        default=(
            "data/calibration/historical/expansion-2020-2021/"
            "player-impact/five-season-shadow-replacement-corpus-v1.jsonl"
        ),
    )
    parser.add_argument(
        "--report",
        default=(
            "data/calibration/historical/expansion-2020-2021/"
            "player-impact/five-season-shadow-replacement-corpus-v1-report.json"
        ),
    )
    args = parser.parse_args()

    required = [
        Path(args.legacy_observations),
        Path(args.expansion_observations),
        Path(args.legacy_snaps),
        Path(args.expansion_snaps),
        Path(args.legacy_depth),
        Path(args.expansion_depth),
    ]

    missing_required = [str(path) for path in required if not path.exists()]
    if missing_required:
        print(json.dumps({
            "contractVersion": CONTRACT_VERSION,
            "status": "REQUIRED_INPUTS_MISSING",
            "missingInputs": missing_required,
        }, indent=2))
        raise SystemExit(2)

    observations = (
        load_jsonl(Path(args.legacy_observations))
        + load_jsonl(Path(args.expansion_observations))
    )
    snaps = usable_snap_rows(
        load_jsonl(Path(args.legacy_snaps))
        + load_jsonl(Path(args.expansion_snaps))
    )
    depth = (
        load_jsonl(Path(args.legacy_depth))
        + load_jsonl(Path(args.expansion_depth))
    )

    observation_map = build_observation_map(observations)
    depth_idx = build_depth_index(depth)
    events = treatment_events(observations)

    replacement_rows = []
    unresolved = 0
    by_season = Counter()
    by_position = Counter()

    for event in events:
        result = resolve_event(
            event,
            snaps,
            depth_idx,
            observation_map,
        )
        if not result:
            unresolved += 1
            continue

        row = {
            **event,
            **result,
            "resolverVersion":
                "FIE-NFL-MULTI-SIGNAL-REPLACEMENT-SUCCESSION-ROLE-FIRST-2D2E-1.0.0",
            "resolverMode": "SHADOW_ONLY",
            "replacementIdentityStatus": "RESOLVED_SHADOW",
            "strictOfficialTruthUsedForThisRow": False,
            "targetGameSnapEvidenceUsed": False,
            "futureSnapEvidenceUsed": False,
            "targetWeekDepthRoleClaimedAsPregameProof": False,
        }
        replacement_rows.append(row)
        by_season[event["season"]] += 1
        by_position[position_group(event["position"])] += 1

    caliber_paths = [
        Path(args.legacy_caliber),
        Path(args.expansion_caliber),
    ]
    caliber_index, loaded_caliber_sources = build_caliber_index(caliber_paths)

    unavailable_caliber_resolved = 0
    replacement_caliber_resolved = 0
    both_caliber_resolved = 0

    for row in replacement_rows:
        unavailable = resolve_caliber(
            caliber_index,
            row["season"],
            row["week"],
            row["unavailablePlayerId"],
        )
        replacement = resolve_caliber(
            caliber_index,
            row["season"],
            row["week"],
            row["replacementPlayerId"],
        )

        row["unavailablePlayerCaliber"] = (
            unavailable["score"] if unavailable else None
        )
        row["replacementPlayerCaliber"] = (
            replacement["score"] if replacement else None
        )
        row["replacementCaliberDelta"] = (
            row["unavailablePlayerCaliber"]
            - row["replacementPlayerCaliber"]
            if (
                row["unavailablePlayerCaliber"] is not None
                and row["replacementPlayerCaliber"] is not None
            )
            else None
        )
        row["caliberStatus"] = (
            "COMPLETE"
            if row["replacementCaliberDelta"] is not None
            else "INCOMPLETE"
        )

        if unavailable:
            unavailable_caliber_resolved += 1
        if replacement:
            replacement_caliber_resolved += 1
        if unavailable and replacement:
            both_caliber_resolved += 1

    output_path = Path(args.output)
    report_path = Path(args.report)
    write_jsonl(output_path, replacement_rows)
    report_path.parent.mkdir(parents=True, exist_ok=True)

    five_seasons = sorted(set(row["season"] for row in replacement_rows))
    all_five_present = five_seasons == [2020, 2021, 2022, 2023, 2024]

    expansion_caliber_present = Path(args.expansion_caliber).exists()
    complete_caliber_rate = (
        both_caliber_resolved / len(replacement_rows)
        if replacement_rows
        else 0.0
    )

    if not all_five_present:
        decision = "FIVE_SEASON_SHADOW_REPLACEMENT_CORPUS_INCOMPLETE"
    elif not expansion_caliber_present:
        decision = (
            "FIVE_SEASON_SHADOW_REPLACEMENT_CORPUS_BUILT_"
            "EXPANSION_CALIBER_SOURCE_MISSING"
        )
    elif complete_caliber_rate < 0.75:
        decision = (
            "FIVE_SEASON_SHADOW_REPLACEMENT_CORPUS_BUILT_"
            "CALIBER_COVERAGE_INSUFFICIENT"
        )
    else:
        decision = (
            "FIVE_SEASON_SHADOW_REPLACEMENT_CORPUS_AND_"
            "CALIBER_READY_FOR_PLAYER_IMPACT_VALIDATION"
        )

    report = {
        "contractVersion": CONTRACT_VERSION,
        "sprint": "2D.2F",
        "mode": "SHADOW_ONLY_RESEARCH_CORPUS_CONSTRUCTION",
        "decision": decision,
        "scope": {
            "targetSeasons": [2020, 2021, 2022, 2023, 2024],
            "resolver":
                "ROLE_FIRST_FROM_VALIDATED_2D2E",
            "output": str(output_path),
        },
        "replacementCorpus": {
            "treatmentEvents": len(events),
            "resolvedReplacementRows": len(replacement_rows),
            "unresolvedTreatmentEvents": unresolved,
            "replacementCoverageRate": (
                len(replacement_rows) / len(events)
                if events else 0.0
            ),
            "seasons": five_seasons,
            "allFiveSeasonsPresent": all_five_present,
            "resolvedBySeason": dict(sorted(by_season.items())),
            "resolvedByPosition": dict(sorted(by_position.items())),
        },
        "caliberAttachment": {
            "loadedSources": loaded_caliber_sources,
            "legacyCaliberSourcePresent": Path(args.legacy_caliber).exists(),
            "expansionCaliberSourcePresent": expansion_caliber_present,
            "unavailablePlayerCaliberResolvedRows":
                unavailable_caliber_resolved,
            "replacementPlayerCaliberResolvedRows":
                replacement_caliber_resolved,
            "bothCalibersResolvedRows":
                both_caliber_resolved,
            "completeCaliberCoverageRate":
                complete_caliber_rate,
            "replacementCaliberDeltaComputedRows":
                both_caliber_resolved,
        },
        "nextAction": {
            "playerImpactValidationAuthorized": (
                decision
                == "FIVE_SEASON_SHADOW_REPLACEMENT_CORPUS_AND_CALIBER_READY_FOR_PLAYER_IMPACT_VALIDATION"
            ),
            "buildExpansionCaliberSnapshotsRequired":
                not expansion_caliber_present,
            "productionPlayerImpactCalibrationAuthorized": False,
            "productionReplacementResolverAuthorized": False,
            "teamStrengthPromotionAuthorized": False,
            "pickemHandoffAuthorized": False,
        },
        "safeguards": {
            "strictOfficialTruthLabelsInjectedIntoCorpus": False,
            "learnedResolverWeightsCreated": False,
            "targetGameSnapEvidenceUsed": False,
            "futureSnapEvidenceUsed": False,
            "untimestampedDepthRoleClaimedAsPregameProof": False,
            "canonicalLegacyReplacementArtifactMutated": False,
            "canonicalLegacyCaliberArtifactMutated": False,
            "calibrationExecuted": False,
            "learnedPlayerImpactWeightsCreated": False,
            "playerImpactTeamStrengthMode": "SHADOW_ONLY",
            "playerImpactTeamStrengthAuthorized": False,
            "numericDelta": None,
            "adjustedTeamStrength": None,
            "teamStrengthMutated": False,
            "decisionModelMutated": False,
            "pickemMutated": False,
        },
    }

    report_path.write_text(
        json.dumps(report, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
