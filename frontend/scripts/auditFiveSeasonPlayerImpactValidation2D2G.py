#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import statistics
from collections import Counter, defaultdict
from pathlib import Path

CONTRACT_VERSION = "FIE-NFL-FIVE-SEASON-PLAYER-IMPACT-VALIDATION-2D2G-1.0.0"
TARGET_SEASONS = [2020, 2021, 2022, 2023, 2024]
MIN_CALIBER_PAIR_COVERAGE = 0.75
MIN_POSITION_SAMPLE = 25
MIN_SEASON_SAMPLE = 100


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


def load_json(path: Path):
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


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


def numeric(value):
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return float(value)
    return None


def position_group(pos):
    p = str(pos or "UNKNOWN").upper()
    if p in {"C", "G", "OG", "T", "OT", "OL", "IOL"}:
        return "OL"
    if p in {"CB", "S", "FS", "SS", "DB"}:
        return "SECONDARY"
    if p in {"DE", "DT", "NT", "DL", "EDGE"}:
        return "DL_EDGE"
    if p in {"LB", "ILB", "OLB", "MLB"}:
        return "LB"
    if p in {"RB", "HB", "FB"}:
        return "RB"
    if p in {"K", "P", "LS", "ST"}:
        return "SPECIALISTS"
    return p


def discover_files(root: Path, patterns):
    seen = set()
    out = []
    for pattern in patterns:
        for path in root.rglob(pattern):
            if path.is_file() and path not in seen:
                seen.add(path)
                out.append(path)
    return sorted(out)


def extract_effect(row):
    candidates = [
        ("matchedEffect",), ("effect",), ("observedEffect",), ("att",),
        ("effectSize",), ("teamEffect",), ("outcomeDelta",), ("delta",),
        ("result", "effect"), ("estimate", "effect"), ("matched", "effect"),
    ]
    for path in candidates:
        value = nested_get(row, [path])
        n = numeric(value)
        if n is not None:
            return n
    return None


def extract_dependency(row):
    candidates = [
        ("dependencyScore",), ("usageDependency",), ("dependency",),
        ("usageScore",), ("observedUsageDependency",), ("snapDependency",),
        ("result", "dependency"), ("evidence", "dependency"),
    ]
    for path in candidates:
        value = nested_get(row, [path])
        n = numeric(value)
        if n is not None:
            return n
    return None


def row_identity(row):
    season = nested_get(row, [("season",), ("identity", "season"), ("scope", "season")])
    week = nested_get(row, [("week",), ("identity", "week"), ("scope", "week")])
    team = nested_get(row, [("team",), ("teamCode",), ("identity", "team"), ("scope", "team")])
    unavailable = nested_get(row, [
        ("unavailablePlayerId",), ("playerId",), ("identity", "playerId")
    ])
    replacement = nested_get(row, [
        ("replacementPlayerId",), ("expectedReplacementPlayerId",)
    ])
    try:
        season = int(season) if season is not None else None
        week = int(week) if week is not None else None
    except Exception:
        pass
    return (season, week, str(team) if team is not None else None,
            str(unavailable) if unavailable is not None else None,
            str(replacement) if replacement is not None else None)


def index_effect_rows(files):
    exact = {}
    coarse = defaultdict(list)
    loaded = []
    total_with_effect = 0
    for path in files:
        rows = load_jsonl(path)
        loaded.append({"path": str(path), "rows": len(rows)})
        for row in rows:
            effect = extract_effect(row)
            if effect is None:
                continue
            total_with_effect += 1
            ident = row_identity(row)
            exact[ident] = effect
            coarse[ident[:4]].append(effect)
    return exact, coarse, loaded, total_with_effect


def index_dependency_rows(files):
    exact = {}
    coarse = defaultdict(list)
    loaded = []
    total_with_dependency = 0
    for path in files:
        rows = load_jsonl(path)
        loaded.append({"path": str(path), "rows": len(rows)})
        for row in rows:
            dep = extract_dependency(row)
            if dep is None:
                continue
            total_with_dependency += 1
            ident = row_identity(row)
            exact[ident] = dep
            coarse[ident[:4]].append(dep)
    return exact, coarse, loaded, total_with_dependency


def resolve_metric(row, exact, coarse):
    ident = (
        int(row["season"]), int(row["week"]), str(row["team"]),
        str(row["unavailablePlayerId"]), str(row["replacementPlayerId"])
    )
    if ident in exact:
        return exact[ident], "EXACT_PAIR"
    ckey = ident[:4]
    vals = coarse.get(ckey, [])
    if vals:
        return statistics.mean(vals), "TREATMENT_PLAYER_FALLBACK"
    return None, None


def summarize_group(rows, keyfn):
    groups = defaultdict(list)
    for row in rows:
        groups[keyfn(row)].append(row)

    out = {}
    for key, vals in sorted(groups.items(), key=lambda kv: str(kv[0])):
        effects = [r["observedEffect"] for r in vals if r.get("observedEffect") is not None]
        deltas = [r["replacementCaliberDelta"] for r in vals if r.get("replacementCaliberDelta") is not None]
        deps = [r["dependencyScore"] for r in vals if r.get("dependencyScore") is not None]
        out[str(key)] = {
            "rows": len(vals),
            "effectRows": len(effects),
            "caliberDeltaRows": len(deltas),
            "dependencyRows": len(deps),
            "meanObservedEffect": statistics.mean(effects) if effects else None,
            "medianObservedEffect": statistics.median(effects) if effects else None,
            "meanReplacementCaliberDelta": statistics.mean(deltas) if deltas else None,
            "meanDependencyScore": statistics.mean(deps) if deps else None,
        }
    return out


def bucket(value, cuts, labels):
    if value is None:
        return "MISSING"
    for cut, label in zip(cuts, labels):
        if value < cut:
            return label
    return labels[-1]


def pearson(xs, ys):
    pairs = [(x, y) for x, y in zip(xs, ys) if x is not None and y is not None]
    if len(pairs) < 3:
        return None
    xvals = [p[0] for p in pairs]
    yvals = [p[1] for p in pairs]
    mx = statistics.mean(xvals)
    my = statistics.mean(yvals)
    num = sum((x-mx)*(y-my) for x, y in pairs)
    denx = math.sqrt(sum((x-mx)**2 for x in xvals))
    deny = math.sqrt(sum((y-my)**2 for y in yvals))
    if denx == 0 or deny == 0:
        return None
    return num / (denx * deny)


def sign(value, eps=1e-12):
    if value is None:
        return None
    if value > eps:
        return 1
    if value < -eps:
        return -1
    return 0


def evaluate_dimension(name, sample_count, checks, evidence):
    if sample_count <= 0:
        return {
            "status": "INSUFFICIENT_EVIDENCE",
            "sampleCount": sample_count,
            "checks": checks,
            "evidence": evidence,
        }
    failures = [k for k, v in checks.items() if v is False]
    unknown = [k for k, v in checks.items() if v is None]
    if failures:
        status = "FAIL"
    elif unknown:
        status = "INSUFFICIENT_EVIDENCE"
    else:
        status = "PASS"
    return {
        "status": status,
        "sampleCount": sample_count,
        "checks": checks,
        "evidence": evidence,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--shadow-corpus",
        default="data/calibration/historical/expansion-2020-2021/player-impact/five-season-shadow-replacement-corpus-v1.jsonl",
    )
    parser.add_argument(
        "--r3-snapshot-report",
        default="data/calibration/historical/expansion-2020-2021/player-impact/caliber/five-season-canonical-player-caliber-snapshots-r3-v1-report.json",
    )
    parser.add_argument(
        "--search-root",
        default="data/calibration/historical",
    )
    parser.add_argument(
        "--report",
        default="data/calibration/historical/expansion-2020-2021/player-impact/five-season-player-impact-validation-2d2g-v1.json",
    )
    args = parser.parse_args()

    shadow_path = Path(args.shadow_corpus)
    if not shadow_path.exists():
        print(json.dumps({
            "contractVersion": CONTRACT_VERSION,
            "status": "REQUIRED_INPUTS_MISSING",
            "missingInputs": [str(shadow_path)],
        }, indent=2))
        raise SystemExit(2)

    corpus = load_jsonl(shadow_path)
    search_root = Path(args.search_root)

    effect_files = discover_files(search_root, [
        "*matched*effect*.jsonl",
        "*matched-effects*.jsonl",
        "*calibration*observation*.jsonl",
        "*player-impact*effect*.jsonl",
    ])
    dependency_files = discover_files(search_root, [
        "*usage*dependency*.jsonl",
        "*dependency*.jsonl",
        "*observed-usage*.jsonl",
    ])

    effect_exact, effect_coarse, effect_loaded, effect_source_rows = index_effect_rows(effect_files)
    dep_exact, dep_coarse, dep_loaded, dep_source_rows = index_dependency_rows(dependency_files)

    rows = []
    caliber_complete = 0
    effect_resolved = 0
    dependency_resolved = 0
    effect_resolution_modes = Counter()
    dependency_resolution_modes = Counter()

    for row in corpus:
        delta = numeric(row.get("replacementCaliberDelta"))
        if delta is not None:
            caliber_complete += 1

        effect, effect_mode = resolve_metric(row, effect_exact, effect_coarse)
        dep, dep_mode = resolve_metric(row, dep_exact, dep_coarse)

        if effect is not None:
            effect_resolved += 1
            effect_resolution_modes[effect_mode] += 1
        if dep is not None:
            dependency_resolved += 1
            dependency_resolution_modes[dep_mode] += 1

        rows.append({
            "season": int(row["season"]),
            "week": int(row["week"]),
            "team": row["team"],
            "position": position_group(row.get("position")),
            "availabilityStatus": row.get("availabilityStatus"),
            "unavailablePlayerId": row.get("unavailablePlayerId"),
            "replacementPlayerId": row.get("replacementPlayerId"),
            "replacementCaliberDelta": delta,
            "observedEffect": effect,
            "dependencyScore": dep,
            "effectResolutionMode": effect_mode,
            "dependencyResolutionMode": dep_mode,
        })

    total = len(rows)
    caliber_rate = caliber_complete / total if total else 0.0
    effect_rate = effect_resolved / total if total else 0.0
    dependency_rate = dependency_resolved / total if total else 0.0

    effect_rows = [r for r in rows if r["observedEffect"] is not None and r["replacementCaliberDelta"] is not None]

    # Caliber-gap sensitivity
    xs = [r["replacementCaliberDelta"] for r in effect_rows]
    ys = [r["observedEffect"] for r in effect_rows]
    overall_corr = pearson(xs, ys)

    caliber_bucketed = []
    for r in effect_rows:
        clone = dict(r)
        clone["caliberGapBucket"] = bucket(
            r["replacementCaliberDelta"],
            [-5, 0, 5, 10],
            ["LARGE_NEGATIVE", "SMALL_NEGATIVE", "SMALL_POSITIVE", "MODERATE_POSITIVE", "LARGE_POSITIVE"],
        )
        caliber_bucketed.append(clone)
    caliber_buckets = summarize_group(caliber_bucketed, lambda r: r["caliberGapBucket"])

    caliber_dimension = evaluate_dimension(
        "replacementCaliberSensitivity",
        len(effect_rows),
        {
            "pairCoverageAtLeast75Pct": caliber_rate >= MIN_CALIBER_PAIR_COVERAGE,
            "observedEffectCoveragePresent": effect_rate > 0,
            "correlationEstimable": overall_corr is not None,
        },
        {
            "overallCorrelation": overall_corr,
            "buckets": caliber_buckets,
        },
    )

    # Position sensitivity
    by_position = summarize_group(effect_rows, lambda r: r["position"])
    position_effect_means = [
        v["meanObservedEffect"]
        for v in by_position.values()
        if v["effectRows"] >= MIN_POSITION_SAMPLE and v["meanObservedEffect"] is not None
    ]
    position_dimension = evaluate_dimension(
        "positionSensitivity",
        len(effect_rows),
        {
            "multiplePositionGroups": len([v for v in by_position.values() if v["effectRows"] >= MIN_POSITION_SAMPLE]) >= 5,
            "positionEffectsEstimable": len(position_effect_means) >= 5,
        },
        {"byPosition": by_position},
    )

    # Dependency sensitivity
    dep_effect_rows = [r for r in effect_rows if r["dependencyScore"] is not None]
    dep_corr = pearson(
        [r["dependencyScore"] for r in dep_effect_rows],
        [r["observedEffect"] for r in dep_effect_rows],
    )
    dependency_dimension = evaluate_dimension(
        "dependencyUsageSensitivity",
        len(dep_effect_rows),
        {
            "dependencyCoveragePresent": dependency_rate > 0,
            "dependencyCorrelationEstimable": dep_corr is not None,
        },
        {
            "dependencyCorrelationWithObservedEffect": dep_corr,
            "dependencyCoverageRate": dependency_rate,
        },
    )

    # Season / era stability
    by_season = summarize_group(effect_rows, lambda r: r["season"])
    season_corrs = {}
    for season in TARGET_SEASONS:
        srows = [r for r in effect_rows if r["season"] == season]
        season_corrs[str(season)] = pearson(
            [r["replacementCaliberDelta"] for r in srows],
            [r["observedEffect"] for r in srows],
        )
    estimable_season_corrs = [v for v in season_corrs.values() if v is not None]
    nonzero_signs = [sign(v) for v in estimable_season_corrs if sign(v) != 0]
    same_direction = (
        len(set(nonzero_signs)) <= 1
        if len(nonzero_signs) >= 2
        else None
    )
    season_dimension = evaluate_dimension(
        "seasonEraStability",
        len(effect_rows),
        {
            "allFiveSeasonsRepresented": all(str(s) in by_season and by_season[str(s)]["effectRows"] >= MIN_SEASON_SAMPLE for s in TARGET_SEASONS),
            "seasonCorrelationsEstimable": len(estimable_season_corrs) == 5,
            "directionStableAcrossSeasons": same_direction,
        },
        {
            "bySeason": by_season,
            "correlationBySeason": season_corrs,
        },
    )

    # Performance-window and opponent adjustment:
    # This sprint must not pretend these are validated if the repository does
    # not expose corresponding five-season artifacts. Discover evidence and
    # report readiness conservatively.
    perf_window_files = discover_files(search_root, [
        "*performance*window*.json*",
        "*window*sensitivity*.json*",
    ])
    opponent_files = discover_files(search_root, [
        "*opponent*adjust*.json*",
        "*opponent-adjust*.json*",
    ])

    performance_dimension = evaluate_dimension(
        "performanceWindowSensitivity",
        len(perf_window_files),
        {
            "canonicalPerformanceWindowArtifactsPresent": len(perf_window_files) > 0,
        },
        {"files": [str(p) for p in perf_window_files]},
    )

    opponent_dimension = evaluate_dimension(
        "opponentAdjustmentSensitivity",
        len(opponent_files),
        {
            "canonicalOpponentAdjustmentArtifactsPresent": len(opponent_files) > 0,
        },
        {"files": [str(p) for p in opponent_files]},
    )

    dimensions = {
        "replacementCaliberSensitivity": caliber_dimension,
        "positionSensitivity": position_dimension,
        "dependencyUsageSensitivity": dependency_dimension,
        "seasonEraStability": season_dimension,
        "performanceWindowSensitivity": performance_dimension,
        "opponentAdjustmentSensitivity": opponent_dimension,
    }

    statuses = Counter(v["status"] for v in dimensions.values())
    if statuses["FAIL"] > 0:
        decision = "FIVE_SEASON_PLAYER_IMPACT_VALIDATION_FAILED"
    elif statuses["INSUFFICIENT_EVIDENCE"] > 0:
        decision = "FIVE_SEASON_PLAYER_IMPACT_VALIDATION_PARTIAL_ADDITIONAL_VALIDATION_REQUIRED"
    else:
        decision = "FIVE_SEASON_PLAYER_IMPACT_VALIDATION_PASSED"

    report = {
        "contractVersion": CONTRACT_VERSION,
        "sprint": "2D.2G",
        "mode": "READ_ONLY_FIVE_SEASON_PLAYER_IMPACT_VALIDATION",
        "decision": decision,
        "scope": {
            "seasons": TARGET_SEASONS,
            "shadowCorpus": str(shadow_path),
            "shadowRows": total,
            "caliberCompleteRows": caliber_complete,
            "caliberCompleteCoverageRate": caliber_rate,
        },
        "sourceDiscovery": {
            "effectFiles": effect_loaded,
            "effectRowsWithNumericEffect": effect_source_rows,
            "dependencyFiles": dep_loaded,
            "dependencyRowsWithNumericDependency": dep_source_rows,
            "performanceWindowFiles": [str(p) for p in perf_window_files],
            "opponentAdjustmentFiles": [str(p) for p in opponent_files],
        },
        "joinedValidationEvidence": {
            "observedEffectRows": effect_resolved,
            "observedEffectCoverageRate": effect_rate,
            "dependencyRows": dependency_resolved,
            "dependencyCoverageRate": dependency_rate,
            "effectResolutionModes": dict(effect_resolution_modes),
            "dependencyResolutionModes": dict(dependency_resolution_modes),
        },
        "dimensions": dimensions,
        "summary": {
            "PASS": statuses["PASS"],
            "FAIL": statuses["FAIL"],
            "INSUFFICIENT_EVIDENCE": statuses["INSUFFICIENT_EVIDENCE"],
        },
        "nextAction": {
            "calibrationAndHoldoutGateAuthorized": decision == "FIVE_SEASON_PLAYER_IMPACT_VALIDATION_PASSED",
            "targetedValidationExtensionRequired": decision == "FIVE_SEASON_PLAYER_IMPACT_VALIDATION_PARTIAL_ADDITIONAL_VALIDATION_REQUIRED",
            "productionPlayerImpactCalibrationAuthorized": False,
            "productionReplacementResolverAuthorized": False,
            "teamStrengthPromotionAuthorized": False,
            "decisionModelPromotionAuthorized": False,
            "pickemHandoffAuthorized": False,
        },
        "safeguards": {
            "validationThresholdsRetunedAfterInspection": False,
            "productionWeightsFit": False,
            "learnedWeightsCreated": False,
            "calibrationExecuted": False,
            "playerImpactTeamStrengthMode": "SHADOW_ONLY",
            "playerImpactTeamStrengthAuthorized": False,
            "numericDelta": None,
            "adjustedTeamStrength": None,
            "teamStrengthMutated": False,
            "decisionModelMutated": False,
            "pickemMutated": False,
        },
    }

    out = Path(args.report)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
