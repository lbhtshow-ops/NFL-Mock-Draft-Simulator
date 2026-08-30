#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import statistics
from collections import defaultdict
from pathlib import Path

CONTRACT_VERSION = "FIE-NFL-PLAYER-IMPACT-FINAL-TARGETED-SENSITIVITY-GATE-2D3A-1.0.0"
TARGET_SEASONS = [2020, 2021, 2022, 2023, 2024]

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

def treated(row):
    return row.get("treated") or {}

def control(row):
    return row.get("control") or {}

def team_game_key_from_effect(row):
    t = treated(row)
    return (t.get("season"), t.get("week"), t.get("gameId"), t.get("team"))

def team_game_key_from_observation(row):
    i = row.get("identity") or {}
    return (i.get("season"), i.get("week"), i.get("gameId"), i.get("team"))

def pos_group(pos):
    p = str(pos or "UNKNOWN").upper()
    if p in {"C","G","OG","T","OT","OL","IOL"}: return "OL"
    if p in {"CB","S","FS","SS","DB","SAF"}: return "SECONDARY"
    if p in {"DE","DT","NT","DL","EDGE"}: return "DL_EDGE"
    if p in {"LB","ILB","OLB","MLB"}: return "LB"
    if p in {"RB","HB","FB"}: return "RB"
    if p in {"K","P","LS","ST"}: return "SPECIALISTS"
    return p

def season_window(week):
    if not finite(week): return "UNKNOWN"
    w = int(week)
    if w <= 6: return "EARLY"
    if w <= 12: return "MID"
    return "LATE"

def summarize_effects(rows):
    vals=[r["effect"] for r in rows if finite(r.get("effect"))]
    return {
        "rows": len(rows),
        "usable": len(vals),
        "mean": mean(vals),
        "median": median(vals),
        "negativeShare": (sum(v < 0 for v in vals) / len(vals)) if vals else None,
    }

def nested_number(obj, paths):
    for parts in paths:
        cur = obj
        ok = True
        for part in parts:
            if isinstance(cur, dict) and part in cur:
                cur = cur[part]
            else:
                ok = False
                break
        if ok and finite(cur):
            return float(cur)
    return None

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--legacy-effects", default="data/calibration/historical/v1/historical-availability-matched-att-effects-v1.jsonl")
    p.add_argument("--expansion-effects", default="data/calibration/historical/expansion-2020-2021/player-impact/matched-att/historical-availability-matched-att-effects-2020-2021-v1.jsonl")
    p.add_argument("--legacy-observations", default="data/calibration/historical/v1/historical-availability-impact-calibration-observations-v1.jsonl")
    p.add_argument("--expansion-observations", default="data/calibration/historical/expansion-2020-2021/player-impact/matched-att/historical-availability-impact-calibration-observations-2020-2021-v1.jsonl")
    p.add_argument("--legacy-outcomes", default="data/calibration/historical/v1/historical-availability-matched-outcomes-v1.jsonl")
    p.add_argument("--expansion-outcomes", default="data/calibration/historical/expansion-2020-2021/player-impact/matched-att/historical-availability-matched-outcomes-2020-2021-v1.jsonl")
    p.add_argument("--report", default="data/calibration/historical/expansion-2020-2021/player-impact/player-impact-final-targeted-sensitivity-gate-2d3a-v1.json")
    args = p.parse_args()

    legacy_effects = load_jsonl(args.legacy_effects)
    expansion_effects = load_jsonl(args.expansion_effects)
    legacy_obs = load_jsonl(args.legacy_observations)
    expansion_obs = load_jsonl(args.expansion_observations)
    legacy_outcomes = load_jsonl(args.legacy_outcomes)
    expansion_outcomes = load_jsonl(args.expansion_outcomes)

    combined_effects = legacy_effects + expansion_effects
    combined_obs = legacy_obs + expansion_obs
    combined_outcomes = legacy_outcomes + expansion_outcomes

    if len(legacy_effects) != 131 or len(expansion_effects) < 500:
        print(json.dumps({
            "contractVersion": CONTRACT_VERSION,
            "decision": "BLOCKED_CORE_2D3_EVIDENCE_NOT_PRESENT",
            "legacyEffects": len(legacy_effects),
            "expansionEffects": len(expansion_effects),
        }, indent=2))
        raise SystemExit(2)

    effect_rows = []
    for row in combined_effects:
        ev = effect_value(row)
        if ev is None:
            continue
        t = treated(row)
        effect_rows.append({
            "effect": ev,
            "season": t.get("season"),
            "week": t.get("week"),
            "gameId": t.get("gameId"),
            "team": t.get("team"),
            "window": season_window(t.get("week")),
        })

    # 1) Performance-window sensitivity: early/mid/late season and by-season windows.
    window_groups = {}
    for window in ("EARLY","MID","LATE"):
        rows = [r for r in effect_rows if r["window"] == window]
        window_groups[window] = summarize_effects(rows)

    season_window_groups = {}
    for season in TARGET_SEASONS:
        season_window_groups[str(season)] = {}
        for window in ("EARLY","MID","LATE"):
            rows = [r for r in effect_rows if r["season"] == season and r["window"] == window]
            season_window_groups[str(season)][window] = summarize_effects(rows)

    window_means = [window_groups[w]["mean"] for w in ("EARLY","MID","LATE")]
    window_signs = [0 if m == 0 else (1 if m > 0 else -1) for m in window_means if m is not None]
    performance_window_status = (
        "PASS"
        if len(window_signs) == 3 and len(set(window_signs)) == 1
        else "REVIEW"
    )

    # 2) Opponent/context adjustment sensitivity.
    # Compare raw treated-control margin difference against canonical residualized ATT
    # when the matched outcome artifact exposes actual margins.
    outcome_by_pair = {}
    for row in combined_outcomes:
        pair_id = row.get("pairId")
        if pair_id:
            outcome_by_pair[pair_id] = row

    raw_vs_residual = []
    missing_raw_context = 0
    for effect_row in combined_effects:
        pair_id = effect_row.get("pairId")
        out = outcome_by_pair.get(pair_id)
        if not out:
            missing_raw_context += 1
            continue

        treated_margin = nested_number(out, [
            ("treated","actualTeamMargin"),
            ("treated","teamMargin"),
            ("treated","outcome","pointMargin"),
            ("treatedOutcome","pointMargin"),
        ])
        control_margin = nested_number(out, [
            ("control","actualTeamMargin"),
            ("control","teamMargin"),
            ("control","outcome","pointMargin"),
            ("controlOutcome","pointMargin"),
        ])
        residual_effect = effect_value(effect_row)
        if treated_margin is None or control_margin is None or residual_effect is None:
            missing_raw_context += 1
            continue
        raw_effect = treated_margin - control_margin
        raw_vs_residual.append({
            "rawEffect": raw_effect,
            "residualEffect": residual_effect,
            "sameSign": (raw_effect == 0 and residual_effect == 0) or (raw_effect * residual_effect > 0),
            "absoluteChange": abs(residual_effect - raw_effect),
        })

    raw_residual_corr = corr(
        [r["rawEffect"] for r in raw_vs_residual],
        [r["residualEffect"] for r in raw_vs_residual],
    )
    sign_agreement = (
        sum(r["sameSign"] for r in raw_vs_residual) / len(raw_vs_residual)
        if raw_vs_residual else None
    )
    mean_abs_change = mean([r["absoluteChange"] for r in raw_vs_residual])

    # The sensitivity question is whether canonical opponent/context residualization
    # materially changes the raw comparison. Either outcome is informative; lack of
    # comparable data is the only blocker.
    opponent_adjustment_status = "PASS" if len(raw_vs_residual) >= 100 else "INSUFFICIENT_EVIDENCE"

    # 3) Player-level heterogeneity using the canonical calibration observations.
    obs_by_team_game = defaultdict(list)
    for obs in combined_obs:
        obs_by_team_game[team_game_key_from_observation(obs)].append(obs)

    heterogeneity_rows = []
    for er in effect_rows:
        key = (er["season"], er["week"], er["gameId"], er["team"])
        observations = obs_by_team_game.get(key, [])
        if not observations:
            continue

        deltas = []
        positions = []
        for obs in observations:
            pre = obs.get("pregame") or {}
            delta = pre.get("expectedReplacementDelta")
            if finite(delta):
                deltas.append(float(delta))
            pos = (obs.get("identity") or {}).get("position")
            if pos:
                positions.append(pos_group(pos))

        heterogeneity_rows.append({
            "effect": er["effect"],
            "playerObservationCount": len(observations),
            "deltaSum": sum(deltas) if deltas else None,
            "deltaMax": max(deltas) if deltas else None,
            "distinctPositionGroups": len(set(positions)),
            "positions": sorted(set(positions)),
        })

    delta_sum_rows = [r for r in heterogeneity_rows if finite(r["deltaSum"])]
    delta_max_rows = [r for r in heterogeneity_rows if finite(r["deltaMax"])]
    delta_sum_corr = corr([r["deltaSum"] for r in delta_sum_rows], [r["effect"] for r in delta_sum_rows])
    delta_max_corr = corr([r["deltaMax"] for r in delta_max_rows], [r["effect"] for r in delta_max_rows])

    by_player_count = {}
    for label, predicate in {
        "ONE_UNAVAILABLE_PLAYER": lambda r: r["playerObservationCount"] == 1,
        "TWO_UNAVAILABLE_PLAYERS": lambda r: r["playerObservationCount"] == 2,
        "THREE_PLUS_UNAVAILABLE_PLAYERS": lambda r: r["playerObservationCount"] >= 3,
    }.items():
        rows = [r for r in heterogeneity_rows if predicate(r)]
        by_player_count[label] = {
            "rows": len(rows),
            "meanEffect": mean([r["effect"] for r in rows]),
            "medianEffect": median([r["effect"] for r in rows]),
        }

    position_presence = defaultdict(list)
    for r in heterogeneity_rows:
        for pos in r["positions"]:
            position_presence[pos].append(r["effect"])
    by_position_presence = {
        pos: {
            "rows": len(vals),
            "meanEffect": mean(vals),
            "medianEffect": median(vals),
        }
        for pos, vals in sorted(position_presence.items())
    }

    heterogeneity_status = (
        "PASS"
        if len(heterogeneity_rows) >= 250
        and delta_sum_corr is not None
        and len([v for v in by_position_presence.values() if v["rows"] >= 20]) >= 5
        else "INSUFFICIENT_EVIDENCE"
    )

    hard_failures = []
    if performance_window_status == "REVIEW":
        # Review is not automatic falsification. Only mark it for inspection.
        pass
    if opponent_adjustment_status != "PASS":
        hard_failures.append("OPPONENT_ADJUSTMENT_EVIDENCE_INSUFFICIENT")
    if heterogeneity_status != "PASS":
        hard_failures.append("PLAYER_LEVEL_HETEROGENEITY_EVIDENCE_INSUFFICIENT")

    if hard_failures:
        decision = "PLAYER_IMPACT_TARGETED_SENSITIVITY_GATE_INCOMPLETE"
    else:
        decision = "PLAYER_IMPACT_TARGETED_SENSITIVITY_GATE_PASSED_PROCEED_TO_2D4"

    report = {
        "contractVersion": CONTRACT_VERSION,
        "sprint": "2D.3A",
        "mode": "READ_ONLY_FINAL_TARGETED_SENSITIVITY_GATE",
        "decision": decision,
        "coreEvidence": {
            "legacyEffects": len(legacy_effects),
            "expansionEffects": len(expansion_effects),
            "totalEffects": len(combined_effects),
            "historicalConstructionReopened": False,
        },
        "performanceWindowSensitivity": {
            "status": performance_window_status,
            "interpretation": (
                "PASS means early/mid/late means share direction. REVIEW means the effect magnitude/direction varies by window and must be considered in 2D.4 shadow behavior; it does not itself invalidate the historical corpus."
            ),
            "byWindow": window_groups,
            "bySeasonAndWindow": season_window_groups,
        },
        "opponentAdjustmentSensitivity": {
            "status": opponent_adjustment_status,
            "comparisonRows": len(raw_vs_residual),
            "missingComparableRows": missing_raw_context,
            "rawVsResidualCorrelation": raw_residual_corr,
            "signAgreementRate": sign_agreement,
            "meanAbsoluteOpponentContextAdjustment": mean_abs_change,
            "interpretation": (
                "Compares raw treated-control margin difference with the canonical residualized matched ATT effect. This measures whether canonical expected-margin/opponent context materially alters the raw comparison."
            ),
        },
        "playerLevelHeterogeneity": {
            "status": heterogeneity_status,
            "teamGameRowsWithPlayerObservations": len(heterogeneity_rows),
            "deltaSumRows": len(delta_sum_rows),
            "deltaSumEffectCorrelation": delta_sum_corr,
            "deltaMaxRows": len(delta_max_rows),
            "deltaMaxEffectCorrelation": delta_max_corr,
            "byUnavailablePlayerCount": by_player_count,
            "byPositionPresence": by_position_presence,
            "interpretation": (
                "ATT remains a team-game effect. Player caliber/position evidence is aggregated within the treated team-game; no individual ATT is invented."
            ),
        },
        "hardFailures": hard_failures,
        "nextAction": {
            "reopenHistoricalConstruction": False,
            "proceedTo2D4": decision == "PLAYER_IMPACT_TARGETED_SENSITIVITY_GATE_PASSED_PROCEED_TO_2D4",
            "productionPlayerImpactAuthorized": False,
            "productionTeamStrengthAuthorized": False,
            "pickemHandoffAuthorized": False,
        },
        "safeguards": {
            "legacyArtifactsMutated": False,
            "expansionArtifactsMutated": False,
            "matchingThresholdRetuned": False,
            "newMatcherCreated": False,
            "individualPlayerATTInvented": False,
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
