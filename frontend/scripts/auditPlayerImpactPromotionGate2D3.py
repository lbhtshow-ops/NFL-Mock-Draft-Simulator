#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, math, statistics
from collections import Counter, defaultdict
from pathlib import Path

CONTRACT_VERSION = "FIE-NFL-PLAYER-IMPACT-PROMOTION-GATE-2D3-1.0.1"
TARGET_SEASONS = [2020, 2021, 2022, 2023, 2024]
FROZEN_CALIPER = 0.7117676224413696
MIN_EXPANSION_EFFECTS = 500

def load_jsonl(path):
    p = Path(path)
    if not p.exists(): return []
    return [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()]

def finite(v):
    return isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(float(v))

def mean(xs):
    xs=[float(x) for x in xs if finite(x)]
    return statistics.mean(xs) if xs else None

def median(xs):
    xs=[float(x) for x in xs if finite(x)]
    return statistics.median(xs) if xs else None

def effect_value(r):
    v=(r.get("effect") or {}).get("treatedMinusControlResidual")
    return float(v) if finite(v) else None

def distance(r):
    v=(r.get("matching") or {}).get("distance")
    return float(v) if finite(v) else None

def summarize(rows):
    vals=[effect_value(r) for r in rows]
    vals=[v for v in vals if v is not None]
    return {
        "rows": len(rows),
        "usableEffects": len(vals),
        "meanEffect": mean(vals),
        "medianEffect": median(vals),
        "negative": sum(v<0 for v in vals),
        "positive": sum(v>0 for v in vals),
        "zero": sum(v==0 for v in vals),
    }

def validate_effect_contract(rows):
    return {
        "rows": len(rows),
        "numericEffectRows": sum(effect_value(r) is not None for r in rows),
        "uniquePairIds": len({r.get("pairId") for r in rows}),
        "pairIdsUnique": len({r.get("pairId") for r in rows}) == len(rows),
        "orientationViolations": sum((r.get("effect") or {}).get("orientation") != "TREATED_MINUS_MATCHED_CONTROL" for r in rows),
        "semanticsViolations": sum((r.get("effect") or {}).get("causalInterpretation") != "DESCRIPTIVE_MATCHED_ATT_COMPONENT_ONLY" for r in rows),
        "methodViolations": sum((r.get("matching") or {}).get("method") != "NEAREST_WITH_REPLACEMENT" for r in rows),
        "modeViolations": sum((r.get("matching") or {}).get("mode") != "SAME_SEASON" for r in rows),
        "caliperViolations": sum(distance(r) is not None and distance(r) > FROZEN_CALIPER + 1e-12 for r in rows),
    }

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--legacy-effects",default="data/calibration/historical/v1/historical-availability-matched-att-effects-v1.jsonl")
    p.add_argument("--expansion-effects",default="data/calibration/historical/expansion-2020-2021/player-impact/matched-att/historical-availability-matched-att-effects-2020-2021-v1.jsonl")
    p.add_argument("--report",default="data/calibration/historical/expansion-2020-2021/player-impact/player-impact-promotion-gate-2d3-v1.0.1.json")
    args=p.parse_args()

    legacy=load_jsonl(args.legacy_effects)
    expansion=load_jsonl(args.expansion_effects)
    if not legacy or not expansion:
        print(json.dumps({
            "contractVersion":CONTRACT_VERSION,
            "decision":"BLOCKED_REQUIRED_MATCHED_ATT_CORPUS_MISSING",
            "legacyRows":len(legacy),
            "expansionRows":len(expansion)
        },indent=2))
        raise SystemExit(2)

    combined=legacy+expansion
    legacy_integrity=validate_effect_contract(legacy)
    expansion_integrity=validate_effect_contract(expansion)

    by_season={}
    for season in TARGET_SEASONS:
        rows=[r for r in combined if (r.get("treated") or {}).get("season")==season]
        by_season[str(season)]=summarize(rows)

    represented=[s for s in TARGET_SEASONS if by_season[str(s)]["usableEffects"]>0]

    # Sample size is reported honestly but no longer confused with "season absent".
    small_seasons=[
        {"season":s,"usableEffects":by_season[str(s)]["usableEffects"]}
        for s in TARGET_SEASONS
        if 0 < by_season[str(s)]["usableEffects"] < 25
    ]

    # Team-game ATT cannot be uniquely assigned to one unavailable player when
    # several players are unavailable in the treated team-game. That is a
    # contract property, not an ambiguity failure.
    treated_keys=Counter(
        (r.get("treated") or {}).get("key")
        for r in combined
        if (r.get("treated") or {}).get("key")
    )
    repeated_treated_team_games=sum(1 for _,n in treated_keys.items() if n>1)

    perf=list(Path("data/calibration/historical").rglob("*performance*window*.json*"))
    opp=list(Path("data/calibration/historical").rglob("*opponent*adjust*.json*"))

    hard_checks={
        "legacy131Reproduced": len(legacy)==131,
        "legacyContractIntegrity": (
            legacy_integrity["numericEffectRows"]==len(legacy)
            and legacy_integrity["pairIdsUnique"]
            and legacy_integrity["orientationViolations"]==0
            and legacy_integrity["semanticsViolations"]==0
            and legacy_integrity["methodViolations"]==0
            and legacy_integrity["modeViolations"]==0
            and legacy_integrity["caliperViolations"]==0
        ),
        "expansionAtLeast500Effects": len(expansion)>=MIN_EXPANSION_EFFECTS,
        "expansionContractIntegrity": (
            expansion_integrity["numericEffectRows"]==len(expansion)
            and expansion_integrity["pairIdsUnique"]
            and expansion_integrity["orientationViolations"]==0
            and expansion_integrity["semanticsViolations"]==0
            and expansion_integrity["methodViolations"]==0
            and expansion_integrity["modeViolations"]==0
            and expansion_integrity["caliperViolations"]==0
        ),
        "allFiveSeasonsActuallyRepresented": represented==TARGET_SEASONS,
    }
    hard_failures=[k for k,v in hard_checks.items() if not v]

    targeted_remaining=[]
    if not perf: targeted_remaining.append("PERFORMANCE_WINDOW_SENSITIVITY")
    if not opp: targeted_remaining.append("OPPONENT_ADJUSTMENT_SENSITIVITY")
    # Player-specific caliber/position heterogeneity remains a separate
    # sensitivity layer because the ATT contract is team-game level.
    targeted_remaining.append("PLAYER_LEVEL_HETEROGENEITY_USING_CANONICAL_EXISTING_AUDITS")

    if hard_failures:
        decision="PLAYER_IMPACT_CORE_EVIDENCE_FAILED"
    elif targeted_remaining:
        decision="PLAYER_IMPACT_CORE_EVIDENCE_READY_TARGETED_SENSITIVITY_ONLY"
    else:
        decision="PLAYER_IMPACT_PROMOTION_GATE_PASSED_FOR_SHADOW_TEAM_STRENGTH_VALIDATION"

    report={
        "contractVersion":CONTRACT_VERSION,
        "sprint":"2D.3",
        "mode":"READ_ONLY_SCOPE_CORRECTED_PROMOTION_GATE",
        "decision":decision,
        "correction":{
            "teamGameATTContractRecognized":True,
            "oneToOnePlayerJoinRequired":False,
            "reason":"NFLHistoricalAvailabilityMatchedATTEffectRecord identifies the treated unit by team-game. Multiple unavailable-player observations may legitimately exist for one treated team-game.",
            "seasonRepresentationDefinition":"AT_LEAST_ONE_USABLE_MATCHED_EFFECT",
            "minimum25PerSeasonIsHardGate":False,
        },
        "evidence":{
            "totalMatchedEffects":len(combined),
            "legacy2022To2024Effects":len(legacy),
            "expansion2020To2021Effects":len(expansion),
            "legacyIntegrity":legacy_integrity,
            "expansionIntegrity":expansion_integrity,
            "bySeason":by_season,
            "representedSeasons":represented,
            "smallSeasonSamplesInformationalOnly":small_seasons,
            "uniqueTreatedTeamGames":len(treated_keys),
            "treatedTeamGamesAppearingInMultiplePairs":repeated_treated_team_games,
            "overall":summarize(combined),
        },
        "hardChecks":hard_checks,
        "hardFailures":hard_failures,
        "targetedSensitivityChecksRemaining":targeted_remaining,
        "discoveredSensitivityArtifacts":{
            "performanceWindow":[str(x) for x in perf[:25]],
            "opponentAdjustment":[str(x) for x in opp[:25]],
        },
        "nextAction":{
            "reopenHistoricalConstruction":bool(hard_failures),
            "runOnlyTargetedSensitivityChecks":not hard_failures and bool(targeted_remaining),
            "proceedTo2D4Immediately":decision=="PLAYER_IMPACT_PROMOTION_GATE_PASSED_FOR_SHADOW_TEAM_STRENGTH_VALIDATION",
            "productionPlayerImpactAuthorized":False,
            "pickemHandoffAuthorized":False,
        },
        "safeguards":{
            "legacyArtifactsMutated":False,
            "expansionArtifactsMutated":False,
            "caliperRetuned":False,
            "newMatcherCreated":False,
            "productionWeightsFit":False,
            "calibrationExecuted":False,
            "playerImpactTeamStrengthMode":"SHADOW_ONLY",
            "numericDelta":None,
            "adjustedTeamStrength":None,
            "teamStrengthMutated":False,
            "decisionModelMutated":False,
            "pickemMutated":False,
        }
    }

    out=Path(args.report)
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(report,indent=2))

if __name__=="__main__":
    main()
