#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import statistics
from collections import Counter, defaultdict
from pathlib import Path

CONTRACT_VERSION = "FIE-NFL-HISTORICAL-VALIDATION-SCHEMA-RECONCILIATION-2D2G-R1-1.0.0"
TARGET_SEASONS = [2020, 2021, 2022, 2023, 2024]
MIN_POSITION_SAMPLE = 10
MIN_SEASON_SAMPLE = 20


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


def position_group(pos):
    p = str(pos or "UNKNOWN").upper()
    if p in {"C", "G", "OG", "T", "OT", "OL", "IOL"}:
        return "OL"
    if p in {"CB", "S", "FS", "SS", "DB", "SAF"}:
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


def pearson(xs, ys):
    pairs = [(x, y) for x, y in zip(xs, ys)
             if isinstance(x, (int, float)) and isinstance(y, (int, float))]
    if len(pairs) < 3:
        return None
    xvals = [float(x) for x, _ in pairs]
    yvals = [float(y) for _, y in pairs]
    mx = statistics.mean(xvals)
    my = statistics.mean(yvals)
    num = sum((x - mx) * (y - my) for x, y in pairs)
    denx = math.sqrt(sum((x - mx) ** 2 for x in xvals))
    deny = math.sqrt(sum((y - my) ** 2 for y in yvals))
    if denx == 0 or deny == 0:
        return None
    return num / (denx * deny)


def safe_mean(vals):
    vals = [float(v) for v in vals if isinstance(v, (int, float))]
    return statistics.mean(vals) if vals else None


def safe_median(vals):
    vals = [float(v) for v in vals if isinstance(v, (int, float))]
    return statistics.median(vals) if vals else None


def calibration_key(row):
    ident = row.get("identity") or {}
    return (
        ident.get("season"),
        ident.get("week"),
        ident.get("gameId"),
        ident.get("team"),
        ident.get("unavailablePlayerId"),
        ident.get("replacementPlayerId"),
    )


def treated_game_team_key(row):
    treated = row.get("treated") or {}
    return (
        treated.get("season"),
        treated.get("week"),
        treated.get("gameId"),
        treated.get("team"),
    )


def usage_key(row):
    ident = row.get("identity") or {}
    return (
        ident.get("season"),
        ident.get("week"),
        ident.get("gameId"),
        ident.get("team"),
        ident.get("unavailablePlayerId"),
        ident.get("replacementPlayerId"),
    )


def summarize_by(rows, key):
    groups = defaultdict(list)
    for row in rows:
        groups[row[key]].append(row)
    out = {}
    for group, vals in sorted(groups.items(), key=lambda kv: str(kv[0])):
        effects = [r["matchedEffect"] for r in vals]
        deltas = [r["expectedReplacementDelta"] for r in vals]
        usage = [r["selectedSnapPct"] for r in vals if r.get("selectedSnapPct") is not None]
        dep = [r["dependencyIndex"] for r in vals if r.get("dependencyIndex") is not None]
        out[str(group)] = {
            "rows": len(vals),
            "meanMatchedEffect": safe_mean(effects),
            "medianMatchedEffect": safe_median(effects),
            "meanExpectedReplacementDelta": safe_mean(deltas),
            "meanSelectedSnapPct": safe_mean(usage),
            "meanDependencyIndex": safe_mean(dep),
        }
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--matched-effects",
        default="data/calibration/historical/v1/historical-availability-matched-att-effects-v1.jsonl",
    )
    parser.add_argument(
        "--calibration-observations",
        default="data/calibration/historical/v1/historical-availability-impact-calibration-observations-v1.jsonl",
    )
    parser.add_argument(
        "--usage-dependency",
        default="data/calibration/historical/v1/historical-observed-usage-dependency-v1.jsonl",
    )
    parser.add_argument(
        "--report",
        default="data/calibration/historical/expansion-2020-2021/player-impact/five-season-player-impact-validation-2d2g-r1-v1.json",
    )
    args = parser.parse_args()

    required = [
        Path(args.matched_effects),
        Path(args.calibration_observations),
        Path(args.usage_dependency),
    ]
    missing = [str(p) for p in required if not p.exists()]
    if missing:
        print(json.dumps({
            "contractVersion": CONTRACT_VERSION,
            "status": "REQUIRED_INPUTS_MISSING",
            "missingInputs": missing,
        }, indent=2))
        raise SystemExit(2)

    matched_rows = load_jsonl(Path(args.matched_effects))
    calibration_rows = load_jsonl(Path(args.calibration_observations))
    usage_rows = load_jsonl(Path(args.usage_dependency))

    calibration_by_game_team = defaultdict(list)
    calibration_by_exact = {}
    for row in calibration_rows:
        ident = row.get("identity") or {}
        gkey = (
            ident.get("season"),
            ident.get("week"),
            ident.get("gameId"),
            ident.get("team"),
        )
        calibration_by_game_team[gkey].append(row)
        calibration_by_exact[calibration_key(row)] = row

    usage_by_exact = {usage_key(row): row for row in usage_rows}

    joined = []
    unmatched_effect_rows = 0
    ambiguous_effect_joins = 0

    for effect_row in matched_rows:
        effect = (effect_row.get("effect") or {}).get("treatedMinusControlResidual")
        if not isinstance(effect, (int, float)):
            continue

        gkey = treated_game_team_key(effect_row)
        candidates = calibration_by_game_team.get(gkey, [])
        if not candidates:
            unmatched_effect_rows += 1
            continue
        if len(candidates) > 1:
            ambiguous_effect_joins += 1
            continue

        obs = candidates[0]
        ident = obs.get("identity") or {}
        pregame = obs.get("pregame") or {}
        exact_key = calibration_key(obs)
        usage_row = usage_by_exact.get(exact_key)

        selected_snap_pct = None
        dependency_index = None
        dependency_status = None
        dependency_reason = None

        if usage_row:
            usage_evidence = usage_row.get("usageEvidence") or {}
            if isinstance(usage_evidence.get("selectedSnapPct"), (int, float)):
                selected_snap_pct = float(usage_evidence["selectedSnapPct"])

            dep_evidence = usage_row.get("teamDependencyEvidence") or {}
            dependency_status = dep_evidence.get("status")
            dependency_reason = dep_evidence.get("reason")
            if isinstance(dep_evidence.get("dependencyIndex"), (int, float)):
                dependency_index = float(dep_evidence["dependencyIndex"])

        delta = pregame.get("expectedReplacementDelta")
        if not isinstance(delta, (int, float)):
            pcal = pregame.get("playerCaliber")
            rcal = pregame.get("replacementCaliber")
            if isinstance(pcal, (int, float)) and isinstance(rcal, (int, float)):
                delta = float(pcal) - float(rcal)

        if not isinstance(delta, (int, float)):
            continue

        joined.append({
            "season": ident.get("season"),
            "week": ident.get("week"),
            "gameId": ident.get("gameId"),
            "team": ident.get("team"),
            "opponent": ident.get("opponent"),
            "position": position_group(ident.get("position")),
            "unavailablePlayerId": ident.get("unavailablePlayerId"),
            "replacementPlayerId": ident.get("replacementPlayerId"),
            "availabilityStatus": pregame.get("unavailableStatus"),
            "playerCaliber": pregame.get("playerCaliber"),
            "replacementCaliber": pregame.get("replacementCaliber"),
            "expectedReplacementDelta": float(delta),
            "matchedEffect": float(effect),
            "matchedEffectSemantics": (effect_row.get("effect") or {}).get("causalInterpretation"),
            "selectedSnapPct": selected_snap_pct,
            "dependencyIndex": dependency_index,
            "dependencyStatus": dependency_status,
            "dependencyReason": dependency_reason,
        })

    seasons_present = sorted({r["season"] for r in joined if isinstance(r["season"], int)})
    by_position = summarize_by(joined, "position")
    by_season = summarize_by(joined, "season")

    caliber_corr = pearson(
        [r["expectedReplacementDelta"] for r in joined],
        [r["matchedEffect"] for r in joined],
    )

    usage_rows_joined = [r for r in joined if r["selectedSnapPct"] is not None]
    usage_corr = pearson(
        [r["selectedSnapPct"] for r in usage_rows_joined],
        [r["matchedEffect"] for r in usage_rows_joined],
    )

    dep_rows_joined = [r for r in joined if r["dependencyIndex"] is not None]
    dependency_corr = pearson(
        [r["dependencyIndex"] for r in dep_rows_joined],
        [r["matchedEffect"] for r in dep_rows_joined],
    )

    position_groups_estimable = [
        k for k, v in by_position.items() if v["rows"] >= MIN_POSITION_SAMPLE
    ]
    season_groups_estimable = [
        k for k, v in by_season.items() if v["rows"] >= MIN_SEASON_SAMPLE
    ]

    dimensions = {
        "replacementCaliberSensitivity": {
            "status": "PASS" if caliber_corr is not None and len(joined) >= 25 else "INSUFFICIENT_EVIDENCE",
            "sampleCount": len(joined),
            "evidence": {
                "correlationExpectedReplacementDeltaToMatchedEffect": caliber_corr,
                "matchedEffectSemantics": "DESCRIPTIVE_MATCHED_ATT_COMPONENT_ONLY",
            },
        },
        "positionSensitivity": {
            "status": "PASS" if len(position_groups_estimable) >= 5 else "INSUFFICIENT_EVIDENCE",
            "sampleCount": len(joined),
            "evidence": {
                "estimablePositionGroups": position_groups_estimable,
                "byPosition": by_position,
            },
        },
        "dependencyUsageSensitivity": {
            "status": "PASS" if usage_corr is not None and len(usage_rows_joined) >= 25 else "INSUFFICIENT_EVIDENCE",
            "sampleCount": len(usage_rows_joined),
            "evidence": {
                "observedUsageCorrelationWithMatchedEffect": usage_corr,
                "observedUsageField": "usageEvidence.selectedSnapPct",
                "canonicalDependencyIndexRows": len(dep_rows_joined),
                "canonicalDependencyIndexCorrelationWithMatchedEffect": dependency_corr,
                "canonicalDependencyIndexAvailabilityRate":
                    len(dep_rows_joined) / len(joined) if joined else 0.0,
                "dependencyIndexNotSynthesizedWhenUnavailable": True,
            },
        },
        "seasonEraStability": {
            "status": (
                "PASS"
                if len(season_groups_estimable) == 5
                else "INSUFFICIENT_EVIDENCE"
            ),
            "sampleCount": len(joined),
            "evidence": {
                "seasonsPresent": seasons_present,
                "estimableSeasons": season_groups_estimable,
                "bySeason": by_season,
                "note": (
                    "Legacy matched-ATT corpus presently governs only seasons represented in the joined evidence. "
                    "Absence of 2020-2021 matched effects is not silently treated as pass."
                ),
            },
        },
        "performanceWindowSensitivity": {
            "status": "INSUFFICIENT_EVIDENCE",
            "sampleCount": 0,
            "evidence": {
                "canonicalArtifactPresent": False,
                "reason": "NO_CANONICAL_PERFORMANCE_WINDOW_SENSITIVITY_ARTIFACT_SUPPLIED_OR_DISCOVERED_IN_2D2G",
            },
        },
        "opponentAdjustmentSensitivity": {
            "status": "INSUFFICIENT_EVIDENCE",
            "sampleCount": 0,
            "evidence": {
                "canonicalArtifactPresent": False,
                "reason": "NO_CANONICAL_OPPONENT_ADJUSTMENT_VALIDATION_ARTIFACT_SUPPLIED_OR_DISCOVERED_IN_2D2G",
            },
        },
    }

    counts = Counter(v["status"] for v in dimensions.values())
    if counts["INSUFFICIENT_EVIDENCE"] == 0:
        decision = "FIVE_SEASON_PLAYER_IMPACT_VALIDATION_PASSED_AFTER_SCHEMA_RECONCILIATION"
    else:
        decision = "FIVE_SEASON_PLAYER_IMPACT_VALIDATION_PARTIAL_TARGETED_VALIDATION_REMAINS"

    report = {
        "contractVersion": CONTRACT_VERSION,
        "sprint": "2D.2G-R1",
        "mode": "READ_ONLY_EXPLICIT_CANONICAL_SCHEMA_RECONCILIATION",
        "decision": decision,
        "sourceContracts": {
            "matchedEffect": {
                "contract": "NFLHistoricalAvailabilityMatchedATTEffectRecord",
                "numericField": "effect.treatedMinusControlResidual",
                "semantics": "DESCRIPTIVE_MATCHED_ATT_COMPONENT_ONLY",
                "rows": len(matched_rows),
            },
            "calibrationObservation": {
                "contract": "NFLHistoricalAvailabilityImpactCalibrationObservation",
                "identityField": "identity",
                "caliberDeltaField": "pregame.expectedReplacementDelta",
                "rawPointMarginUsedAsObservedPlayerImpact": False,
                "rows": len(calibration_rows),
            },
            "usageDependency": {
                "contract": "NFLHistoricalObservedUsageDependencyEvidence",
                "observedUsageField": "usageEvidence.selectedSnapPct",
                "canonicalDependencyField": "teamDependencyEvidence.dependencyIndex",
                "dependencyIndexSynthesizedWhenUnavailable": False,
                "rows": len(usage_rows),
            },
        },
        "join": {
            "joinedMatchedEffectCalibrationRows": len(joined),
            "unmatchedMatchedEffectRows": unmatched_effect_rows,
            "ambiguousMatchedEffectJoins": ambiguous_effect_joins,
            "seasonsPresent": seasons_present,
            "positionsPresent": sorted({r["position"] for r in joined}),
            "usageRowsJoined": len(usage_rows_joined),
            "dependencyIndexRowsJoined": len(dep_rows_joined),
        },
        "dimensions": dimensions,
        "summary": {
            "PASS": counts["PASS"],
            "INSUFFICIENT_EVIDENCE": counts["INSUFFICIENT_EVIDENCE"],
            "FAIL": counts["FAIL"],
        },
        "nextAction": {
            "fiveSeasonMatchedEffectExpansionRequired":
                set(seasons_present) != set(TARGET_SEASONS),
            "performanceWindowValidationRequired": True,
            "opponentAdjustmentValidationRequired": True,
            "calibrationAndHoldoutGateAuthorized":
                decision == "FIVE_SEASON_PLAYER_IMPACT_VALIDATION_PASSED_AFTER_SCHEMA_RECONCILIATION",
            "productionPlayerImpactCalibrationAuthorized": False,
            "teamStrengthPromotionAuthorized": False,
            "decisionModelPromotionAuthorized": False,
            "pickemHandoffAuthorized": False,
        },
        "safeguards": {
            "rawPointMarginUsedAsPlayerImpact": False,
            "causalClaimCreatedFromDescriptiveATT": False,
            "dependencyIndexSynthesized": False,
            "currentRatingBackfillUsed": False,
            "futureEvidenceUsed": False,
            "productionWeightsFit": False,
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
