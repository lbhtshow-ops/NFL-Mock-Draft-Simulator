#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import statistics
from pathlib import Path

CONTRACT_VERSION = "FIE-NFL-OPPONENT-ADJUSTMENT-EVIDENCE-BINDING-2D3A-R1-1.0.0"

def load_jsonl(path):
    p = Path(path)
    if not p.exists():
        return []
    return [json.loads(line) for line in p.read_text(encoding="utf-8").splitlines() if line.strip()]

def finite(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(float(v))

def mean(vals):
    vals = [float(v) for v in vals if finite(v)]
    return statistics.mean(vals) if vals else None

def median(vals):
    vals = [float(v) for v in vals if finite(v)]
    return statistics.median(vals) if vals else None

def corr(xs, ys):
    pairs = [(float(x), float(y)) for x, y in zip(xs, ys) if finite(x) and finite(y)]
    if len(pairs) < 3:
        return None
    mx = statistics.mean(x for x, _ in pairs)
    my = statistics.mean(y for _, y in pairs)
    num = sum((x-mx)*(y-my) for x,y in pairs)
    dx = math.sqrt(sum((x-mx)**2 for x,_ in pairs))
    dy = math.sqrt(sum((y-my)**2 for _,y in pairs))
    return num/(dx*dy) if dx and dy else None

def effect_value(row):
    v = (row.get("effect") or {}).get("treatedMinusControlResidual")
    return float(v) if finite(v) else None

def outcome_raw_effect(row):
    treated = ((row.get("treated") or {}).get("outcome") or {}).get("actualTeamMargin")
    control = ((row.get("control") or {}).get("outcome") or {}).get("actualTeamMargin")
    if not finite(treated) or not finite(control):
        return None
    return float(treated) - float(control)

def residual_pair_effect(row):
    treated = ((row.get("treated") or {}).get("outcome") or {}).get("gamePerformanceResidual")
    control = ((row.get("control") or {}).get("outcome") or {}).get("gamePerformanceResidual")
    if not finite(treated) or not finite(control):
        return None
    return float(treated) - float(control)

def expected_context_delta(row):
    treated = ((row.get("treated") or {}).get("outcome") or {}).get("expectedTeamMargin")
    control = ((row.get("control") or {}).get("outcome") or {}).get("expectedTeamMargin")
    if not finite(treated) or not finite(control):
        return None
    return float(treated) - float(control)

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--legacy-effects", default="data/calibration/historical/v1/historical-availability-matched-att-effects-v1.jsonl")
    p.add_argument("--expansion-effects", default="data/calibration/historical/expansion-2020-2021/player-impact/matched-att/historical-availability-matched-att-effects-2020-2021-v1.jsonl")
    p.add_argument("--legacy-outcomes", default="data/calibration/historical/v1/historical-availability-matched-outcomes-v1.jsonl")
    p.add_argument("--expansion-outcomes", default="data/calibration/historical/expansion-2020-2021/player-impact/matched-att/historical-availability-matched-outcomes-2020-2021-v1.jsonl")
    p.add_argument("--report", default="data/calibration/historical/expansion-2020-2021/player-impact/opponent-adjustment-evidence-binding-2d3a-r1-v1.json")
    args = p.parse_args()

    effects = load_jsonl(args.legacy_effects) + load_jsonl(args.expansion_effects)
    outcomes = load_jsonl(args.legacy_outcomes) + load_jsonl(args.expansion_outcomes)

    if len(effects) < 700:
        print(json.dumps({
            "contractVersion": CONTRACT_VERSION,
            "decision": "BLOCKED_EXPECTED_FIVE_SEASON_EFFECT_CORPUS_MISSING",
            "effectRows": len(effects),
        }, indent=2))
        raise SystemExit(2)

    outcome_by_pair = {row.get("pairId"): row for row in outcomes if row.get("pairId")}

    comparisons = []
    missing_outcome = 0
    missing_margin = 0
    effect_mismatch = 0

    for effect in effects:
        pair_id = effect.get("pairId")
        outcome = outcome_by_pair.get(pair_id)
        if not outcome:
            missing_outcome += 1
            continue

        raw = outcome_raw_effect(outcome)
        residual = residual_pair_effect(outcome)
        expected_delta = expected_context_delta(outcome)
        canonical_effect = effect_value(effect)

        if raw is None or residual is None or expected_delta is None or canonical_effect is None:
            missing_margin += 1
            continue

        if abs(residual - canonical_effect) > 1e-9:
            effect_mismatch += 1

        comparisons.append({
            "pairId": pair_id,
            "season": (outcome.get("treated") or {}).get("season"),
            "rawTreatedMinusControlMargin": raw,
            "expectedMarginContextDelta": expected_delta,
            "residualizedATT": residual,
            "canonicalATTEffect": canonical_effect,
            "contextAdjustment": residual - raw,
            "sameSignRawVsResidual": (
                raw == 0 and residual == 0
            ) or raw * residual > 0,
        })

    raw = [r["rawTreatedMinusControlMargin"] for r in comparisons]
    residual = [r["residualizedATT"] for r in comparisons]
    context = [r["contextAdjustment"] for r in comparisons]

    by_season = {}
    for season in [2020, 2021, 2022, 2023, 2024]:
        rows = [r for r in comparisons if r["season"] == season]
        by_season[str(season)] = {
            "rows": len(rows),
            "rawMean": mean([r["rawTreatedMinusControlMargin"] for r in rows]),
            "residualMean": mean([r["residualizedATT"] for r in rows]),
            "meanContextAdjustment": mean([r["contextAdjustment"] for r in rows]),
            "signAgreementRate": (
                sum(r["sameSignRawVsResidual"] for r in rows) / len(rows)
                if rows else None
            ),
        }

    enough_rows = len(comparisons) >= 700
    all_effects_reconcile = effect_mismatch == 0
    all_seasons_present = all(by_season[str(s)]["rows"] > 0 for s in [2020,2021,2022,2023,2024])

    decision = (
        "OPPONENT_ADJUSTMENT_EVIDENCE_BOUND_TARGETED_SENSITIVITY_COMPLETE_PROCEED_TO_2D4"
        if enough_rows and all_effects_reconcile and all_seasons_present
        else "OPPONENT_ADJUSTMENT_EVIDENCE_BINDING_INCOMPLETE"
    )

    report = {
        "contractVersion": CONTRACT_VERSION,
        "sprint": "2D.3A-R1",
        "mode": "READ_ONLY_OPPONENT_ADJUSTMENT_SCHEMA_BINDING",
        "decision": decision,
        "binding": {
            "treatedActualMarginPath": "treated.outcome.actualTeamMargin",
            "controlActualMarginPath": "control.outcome.actualTeamMargin",
            "treatedExpectedMarginPath": "treated.outcome.expectedTeamMargin",
            "controlExpectedMarginPath": "control.outcome.expectedTeamMargin",
            "treatedResidualPath": "treated.outcome.gamePerformanceResidual",
            "controlResidualPath": "control.outcome.gamePerformanceResidual",
        },
        "coverage": {
            "effectRows": len(effects),
            "outcomeRows": len(outcomes),
            "comparisonRows": len(comparisons),
            "missingOutcomeRows": missing_outcome,
            "missingMarginRows": missing_margin,
            "canonicalATTMismatchRows": effect_mismatch,
        },
        "opponentContextSensitivity": {
            "rawVsResidualCorrelation": corr(raw, residual),
            "rawMean": mean(raw),
            "rawMedian": median(raw),
            "residualizedMean": mean(residual),
            "residualizedMedian": median(residual),
            "meanContextAdjustment": mean(context),
            "medianContextAdjustment": median(context),
            "meanAbsoluteContextAdjustment": mean([abs(x) for x in context]),
            "signAgreementRate": (
                sum(r["sameSignRawVsResidual"] for r in comparisons) / len(comparisons)
                if comparisons else None
            ),
            "bySeason": by_season,
            "interpretation": (
                "Opponent/context sensitivity is measured as the difference between raw treated-control margin "
                "and the canonical expected-margin-residualized ATT. This does not create a new opponent model."
            ),
        },
        "gate": {
            "atLeast700ComparableRows": enough_rows,
            "canonicalATTExactlyReconcilesToOutcomeResidualDifference": all_effects_reconcile,
            "allFiveSeasonsPresent": all_seasons_present,
        },
        "nextAction": {
            "reopenHistoricalConstruction": False,
            "additionalOpponentAdjustmentResearchRequired": decision != "OPPONENT_ADJUSTMENT_EVIDENCE_BOUND_TARGETED_SENSITIVITY_COMPLETE_PROCEED_TO_2D4",
            "proceedTo2D4": decision == "OPPONENT_ADJUSTMENT_EVIDENCE_BOUND_TARGETED_SENSITIVITY_COMPLETE_PROCEED_TO_2D4",
            "productionPlayerImpactAuthorized": False,
            "productionTeamStrengthAuthorized": False,
            "pickemHandoffAuthorized": False,
        },
        "safeguards": {
            "historicalSourcesMutated": False,
            "matchedEffectsMutated": False,
            "matchedOutcomesMutated": False,
            "newOpponentModelCreated": False,
            "matchingThresholdRetuned": False,
            "productionWeightsFit": False,
            "calibrationExecuted": False,
            "playerImpactTeamStrengthMode": "SHADOW_ONLY",
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
