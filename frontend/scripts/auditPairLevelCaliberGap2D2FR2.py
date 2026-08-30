#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
from collections import Counter
from pathlib import Path

CONTRACT_VERSION = "FIE-NFL-PAIR-LEVEL-CALIBER-GAP-AUDIT-2D2F-R2-1.0.0"
TARGET_COMPLETE_PAIR_RATE = 0.75


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


def nested_get(obj, paths):
    for path in paths:
        cur = obj
        ok = True
        for part in path:
            if isinstance(cur, dict) and part in cur:
                cur = cur[part]
            else:
                ok = False
                break
        if ok and cur is not None:
            return cur
    return None


def row_key(row):
    season = nested_get(row, [("season",), ("identity", "season"), ("scope", "season")])
    week = nested_get(row, [("week",), ("identity", "week"), ("scope", "week")])
    team = nested_get(row, [("team",), ("teamCode",), ("identity", "team"), ("scope", "team")])
    player = nested_get(row, [
        ("playerId",), ("gsis_id",), ("gsisId",),
        ("identity", "playerId"), ("identity", "gsisId")
    ])
    if season is None or week is None or team is None or player is None:
        return None
    try:
        return (int(season), int(week), str(team), str(player))
    except Exception:
        return None


def index_rows(rows):
    out = {}
    for row in rows:
        key = row_key(row)
        if key is not None:
            out[key] = row
    return out


def build_snapshot_index(rows):
    """
    Match the authoritative 2D.2F caliber attachment semantics:
    index canonical snapshots by (season, playerId), then resolve the latest
    snapshot whose week is <= target week. Team is intentionally not part of
    the caliber lookup key because the canonical caliber snapshot represents
    the player evaluation, while the target-game artifacts remain exactly keyed.
    """
    out = {}
    for row in rows:
        season = nested_get(row, [("season",), ("identity", "season"), ("scope", "season")])
        player = nested_get(row, [
            ("playerId",), ("gsis_id",), ("gsisId",),
            ("identity", "playerId"), ("identity", "gsisId")
        ])
        week = nested_get(row, [("week",), ("identity", "week"), ("scope", "week")])
        if season is None or player is None:
            continue
        try:
            season = int(season)
        except Exception:
            continue
        if week is not None:
            try:
                week = int(week)
            except Exception:
                week = None
        key = (season, str(player))
        out.setdefault(key, []).append({
            "week": week,
            "row": row,
        })

    for values in out.values():
        values.sort(
            key=lambda item: (
                item["week"] is not None,
                item["week"] if item["week"] is not None else -1,
            )
        )
    return out


def resolve_snapshot(snapshot_index, season, week, player_id):
    candidates = snapshot_index.get((int(season), str(player_id)), [])
    if not candidates:
        return None

    prior = [
        item for item in candidates
        if item["week"] is None or item["week"] <= int(week)
    ]
    if prior:
        return prior[-1]["row"]

    # Preserve the same fallback used by 2D.2F when only season-level caliber
    # material exists for the player.
    return candidates[-1]["row"]


def caliber_value(row):
    if not row:
        return None
    values = [
        nested_get(row, [("caliber",)]),
        nested_get(row, [("playerQuality",)]),
        nested_get(row, [("playerCaliber",)]),
        nested_get(row, [("caliberScore",)]),
        nested_get(row, [("overallScore",)]),
        nested_get(row, [("score",)]),
        nested_get(row, [("caliber", "score")]),
        nested_get(row, [("caliber", "overall")]),
    ]
    for value in values:
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            return float(value)
    return None


def recursive_find_status(obj, target_key):
    found = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == target_key:
                if isinstance(v, str):
                    found.append(v)
                elif isinstance(v, dict):
                    for key in ("status", "state", "resolution"):
                        if isinstance(v.get(key), str):
                            found.append(v[key])
            found.extend(recursive_find_status(v, target_key))
    elif isinstance(obj, list):
        for item in obj:
            found.extend(recursive_find_status(item, target_key))
    return found


def field_status(row, field_name):
    if not row:
        return None
    vals = recursive_find_status(row, field_name)
    return vals[0] if vals else None


def residual_classification(row):
    if not row:
        return None
    value = nested_get(row, [
        ("classification",), ("reason",),
        ("residualClassification",), ("status",)
    ])
    return str(value).strip() if value is not None else None


def baseline_has_prior(row):
    if not row:
        return None
    value = nested_get(row, [
        ("hasAnyPriorNFLEvidence",),
        ("priorNFLEvidenceAvailable",),
        ("evidence", "hasAnyPriorNFLEvidence"),
    ])
    if isinstance(value, bool):
        return value
    return None


def classify_missing(completion_row, residual_row, baseline_row):
    status = field_status(completion_row, "statusScore")
    experience = field_status(completion_row, "experienceScore")
    usage = field_status(completion_row, "usageScore")
    production = field_status(completion_row, "productionScore")
    position = field_status(completion_row, "position")

    gaps = []
    if position and "UNRESOLVED" in position.upper():
        gaps.append("POSITION_UNRESOLVED")
    if status and "MISSING" in status.upper():
        gaps.append("MISSING_HISTORICAL_STATUS")
    if experience and "MISSING" in experience.upper():
        gaps.append("MISSING_HISTORICAL_EXPERIENCE")
    if usage and "MISSING" in usage.upper():
        gaps.append("MISSING_HISTORICAL_USAGE_PROFILE")
    if production:
        up = production.upper()
        if "UNSUPPORTED_POSITION" in up:
            gaps.append("UNSUPPORTED_POSITION")
        elif "MISSING" in up:
            gaps.append("MISSING_HISTORICAL_PERFORMANCE")

    residual = residual_classification(residual_row)
    if residual:
        gaps.append(residual)

    if baseline_has_prior(baseline_row) is False:
        gaps.append("NO_PRIOR_NFL_EVIDENCE")

    seen = set()
    gaps = [g for g in gaps if not (g in seen or seen.add(g))]

    if not gaps:
        return {
            "primaryReason": "CANONICAL_SNAPSHOT_NOT_AVAILABLE_OTHER",
            "gaps": [],
            "recoverabilityTier": "REVIEW_REQUIRED",
        }

    hard = {"NO_PRIOR_NFL_EVIDENCE", "UNSUPPORTED_POSITION", "POSITION_UNRESOLVED"}
    if any(g in hard or "NO_PRIOR" in g or "POSITION_UNRESOLVED" in g for g in gaps):
        tier = "HARD_EVIDENCE_GAP"
    elif any(
        key in g for g in gaps
        for key in (
            "MISSING_HISTORICAL_STATUS",
            "MISSING_HISTORICAL_USAGE_PROFILE",
            "MISSING_HISTORICAL_PERFORMANCE",
            "MISSING_HISTORICAL_EXPERIENCE",
            "COVERAGE_GAP",
        )
    ):
        tier = "TARGETED_CANONICAL_RECOVERY_CANDIDATE"
    else:
        tier = "REVIEW_REQUIRED"

    return {
        "primaryReason": gaps[0],
        "gaps": gaps,
        "recoverabilityTier": tier,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--shadow-corpus", default="data/calibration/historical/expansion-2020-2021/player-impact/five-season-shadow-replacement-corpus-v1.jsonl")
    parser.add_argument("--snapshots", default="data/calibration/historical/expansion-2020-2021/player-impact/caliber/five-season-canonical-player-caliber-snapshots-v1.jsonl")
    parser.add_argument("--completion", default="data/calibration/historical/expansion-2020-2021/player-impact/caliber/five-season-canonical-input-completion-v1.jsonl")
    parser.add_argument("--baselines", default="data/calibration/historical/expansion-2020-2021/player-impact/caliber/five-season-player-career-baselines-v1.jsonl")
    parser.add_argument("--residuals", default="data/calibration/historical/expansion-2020-2021/player-impact/caliber/five-season-player-caliber-residuals-v1.jsonl")
    parser.add_argument("--recovery-targets", default="data/calibration/historical/expansion-2020-2021/player-impact/caliber/five-season-pair-recovery-targets-v1.jsonl")
    parser.add_argument("--report", default="data/calibration/historical/expansion-2020-2021/player-impact/caliber/five-season-pair-caliber-gap-audit-v1.json")
    args = parser.parse_args()

    required = [Path(args.shadow_corpus), Path(args.snapshots), Path(args.completion), Path(args.baselines)]
    missing = [str(p) for p in required if not p.exists()]
    if missing:
        print(json.dumps({"contractVersion": CONTRACT_VERSION, "status": "REQUIRED_INPUTS_MISSING", "missingInputs": missing}, indent=2))
        raise SystemExit(2)

    corpus = load_jsonl(Path(args.shadow_corpus))
    snapshot_rows = load_jsonl(Path(args.snapshots))
    snapshots = build_snapshot_index(snapshot_rows)
    completion = index_rows(load_jsonl(Path(args.completion)))
    baselines = index_rows(load_jsonl(Path(args.baselines)))
    residuals = index_rows(load_jsonl(Path(args.residuals))) if Path(args.residuals).exists() else {}

    total_pairs = len(corpus)
    current_complete_pairs = 0
    incomplete_pairs = 0
    one_side_missing_pairs = 0
    both_sides_missing_pairs = 0
    side_missing = Counter()
    missing_by_season = Counter()
    missing_by_position = Counter()
    reason_counts = Counter()
    tier_counts = Counter()
    recovery_targets = []

    for row in corpus:
        season = int(row["season"])
        week = int(row["week"])
        team = str(row["team"])
        position = str(row.get("position") or "UNKNOWN")

        keys = {
            "UNAVAILABLE_PLAYER": (season, week, team, str(row["unavailablePlayerId"])),
            "EXPECTED_REPLACEMENT": (season, week, team, str(row["replacementPlayerId"])),
        }
        resolved_snapshots = {
            side: resolve_snapshot(
                snapshots,
                season,
                week,
                key[3],
            )
            for side, key in keys.items()
        }
        ready = {
            side: caliber_value(resolved_snapshots[side]) is not None
            for side in keys
        }

        if all(ready.values()):
            current_complete_pairs += 1
            continue

        incomplete_pairs += 1
        missing_sides = [side for side, ok in ready.items() if not ok]
        if len(missing_sides) == 1:
            one_side_missing_pairs += 1
        else:
            both_sides_missing_pairs += 1

        pair_key = f"{season}:{week}:{team}:{row['unavailablePlayerId']}:{row['replacementPlayerId']}"

        for side in missing_sides:
            key = keys[side]
            player_id = key[3]
            side_missing[side] += 1
            missing_by_season[season] += 1
            missing_by_position[position] += 1

            classification = classify_missing(
                completion.get(key),
                residuals.get(key),
                baselines.get(key),
            )
            reason_counts[classification["primaryReason"]] += 1
            tier_counts[classification["recoverabilityTier"]] += 1

            other_side = "EXPECTED_REPLACEMENT" if side == "UNAVAILABLE_PLAYER" else "UNAVAILABLE_PLAYER"
            priority = "HIGH" if ready[other_side] else "MEDIUM"

            recovery_targets.append({
                "contractVersion": "FIE-NFL-PAIR-CALIBER-RECOVERY-TARGET-1.0.0",
                "season": season,
                "week": week,
                "team": team,
                "gameId": row.get("gameId"),
                "playerId": player_id,
                "pairRole": side,
                "position": position,
                "availabilityStatus": row.get("availabilityStatus"),
                "pairKey": pair_key,
                "pairCompletingPriority": priority,
                "primaryReason": classification["primaryReason"],
                "gaps": classification["gaps"],
                "recoverabilityTier": classification["recoverabilityTier"],
                "syntheticCaliberAllowed": False,
                "currentRatingBackfillAllowed": False,
                "targetGamePerformanceAllowed": False,
                "futureEvidenceAllowed": False,
            })

    required_complete_pairs = math.ceil(total_pairs * TARGET_COMPLETE_PAIR_RATE)
    additional_needed = max(0, required_complete_pairs - current_complete_pairs)

    # 2D.2F immediately preceding this audit established 3,301 complete pairs
    # from this same shadow corpus + snapshot artifact. A zero/implausibly low
    # result here indicates schema/index drift and must block recovery planning.
    expected_prior_complete_pairs = 3301
    baseline_reconciled = current_complete_pairs == expected_prior_complete_pairs

    def sort_key(r):
        priority_rank = 0 if r["pairCompletingPriority"] == "HIGH" else 1
        tier_rank = {
            "TARGETED_CANONICAL_RECOVERY_CANDIDATE": 0,
            "REVIEW_REQUIRED": 1,
            "HARD_EVIDENCE_GAP": 2,
        }.get(r["recoverabilityTier"], 3)
        return (priority_rank, tier_rank, r["season"], r["week"], r["team"], r["playerId"])

    recovery_targets.sort(key=sort_key)
    for i, row in enumerate(recovery_targets, start=1):
        row["recoveryPriorityRank"] = i

    write_jsonl(Path(args.recovery_targets), recovery_targets)

    high_targeted_pair_keys = {
        r["pairKey"]
        for r in recovery_targets
        if r["pairCompletingPriority"] == "HIGH"
        and r["recoverabilityTier"] == "TARGETED_CANONICAL_RECOVERY_CANDIDATE"
    }
    theoretical_gain = len(high_targeted_pair_keys)

    if not baseline_reconciled:
        decision = "PAIR_LEVEL_CALIBER_BASELINE_RECONCILIATION_FAILED"
    elif current_complete_pairs >= required_complete_pairs:
        decision = "PAIR_LEVEL_CALIBER_GATE_ALREADY_SATISFIED"
    elif theoretical_gain >= additional_needed:
        decision = "TARGETED_CANONICAL_RECOVERY_POOL_LARGE_ENOUGH_TO_CLEAR_75_PERCENT_GATE"
    else:
        decision = "TARGETED_CANONICAL_RECOVERY_POOL_INSUFFICIENT_FOR_75_PERCENT_GATE"

    report = {
        "contractVersion": CONTRACT_VERSION,
        "sprint": "2D.2F-R2",
        "mode": "READ_ONLY_PAIR_GAP_AUDIT_AND_RECOVERY_PLANNING",
        "decision": decision,
        "snapshotResolution": {
            "semantics": "MATCH_2D2F_SEASON_PLAYER_LATEST_AT_OR_BEFORE_TARGET_WEEK",
            "snapshotRows": len(snapshot_rows),
            "exactTargetGameKeyRequiredForSnapshot": False,
            "completionBaselineResidualArtifactsRemainExactTargetGameKeyed": True,
        },
        "gate": {
            "targetCompletePairRate": TARGET_COMPLETE_PAIR_RATE,
            "totalPairs": total_pairs,
            "currentCompletePairs": current_complete_pairs,
            "currentCompletePairRate": current_complete_pairs / total_pairs if total_pairs else 0.0,
            "requiredCompletePairs": required_complete_pairs,
            "additionalCompletePairsNeeded": additional_needed,
            "expectedPrior2D2FCompletePairs": expected_prior_complete_pairs,
            "baselineReconciledTo2D2F": baseline_reconciled,
        },
        "gapProfile": {
            "incompletePairs": incomplete_pairs,
            "oneSideMissingPairs": one_side_missing_pairs,
            "bothSidesMissingPairs": both_sides_missing_pairs,
            "missingSides": dict(side_missing),
            "missingBySeason": dict(sorted(missing_by_season.items())),
            "missingByPosition": dict(sorted(missing_by_position.items())),
            "primaryReasons": dict(reason_counts.most_common()),
            "recoverabilityTiers": dict(tier_counts.most_common()),
        },
        "targetedRecovery": {
            "recoveryTargetRows": len(recovery_targets),
            "highPrioritySingleSideTargets": sum(1 for r in recovery_targets if r["pairCompletingPriority"] == "HIGH"),
            "highPriorityTargetedCanonicalRecoveryTargets": sum(
                1 for r in recovery_targets
                if r["pairCompletingPriority"] == "HIGH"
                and r["recoverabilityTier"] == "TARGETED_CANONICAL_RECOVERY_CANDIDATE"
            ),
            "theoreticalAdditionalCompletePairsFromHighPriorityTargetedRecovery": theoretical_gain,
            "enoughTargetedHighPriorityPairsToClearGate": theoretical_gain >= additional_needed,
            "recoveryTargetArtifact": str(Path(args.recovery_targets)),
        },
        "nextAction": {
            "targetedCanonicalRecoveryAuthorized": (
                baseline_reconciled
                and decision == "TARGETED_CANONICAL_RECOVERY_POOL_LARGE_ENOUGH_TO_CLEAR_75_PERCENT_GATE"
            ),
            "lowerCaliberCoverageThresholdAuthorized": False,
            "syntheticCaliberAuthorized": False,
            "currentRatingBackfillAuthorized": False,
            "targetGamePerformanceAuthorized": False,
            "futureEvidenceAuthorized": False,
            "productionPlayerImpactCalibrationAuthorized": False,
            "teamStrengthPromotionAuthorized": False,
            "pickemHandoffAuthorized": False,
        },
        "safeguards": {
            "snapshotArtifactMutated": False,
            "completionArtifactMutated": False,
            "shadowReplacementCorpusMutated": False,
            "calibrationExecuted": False,
            "learnedWeightsCreated": False,
            "playerImpactTeamStrengthMode": "SHADOW_ONLY",
            "playerImpactTeamStrengthAuthorized": False,
            "numericDelta": None,
            "adjustedTeamStrength": None,
            "teamStrengthMutated": False,
            "decisionModelMutated": False,
            "pickemMutated": False,
        },
    }

    Path(args.report).parent.mkdir(parents=True, exist_ok=True)
    Path(args.report).write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
