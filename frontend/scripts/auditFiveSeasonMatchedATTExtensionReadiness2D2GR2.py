#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path

CONTRACT_VERSION = "FIE-NFL-FIVE-SEASON-MATCHED-ATT-EXPANSION-READINESS-2D2G-R2-1.0.0"
TARGET_EXPANSION_SEASONS = {2020, 2021}


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


def scan_source_files(frontend_root: Path):
    roots = [frontend_root / "scripts", frontend_root / "src"]
    patterns = [
        "NFLHistoricalAvailabilityMatchedATTEffectRecord",
        "NEAREST_WITH_REPLACEMENT",
        "TREATED_MINUS_MATCHED_CONTROL",
        "treatedMinusControlResidual",
    ]
    matches = []
    extensions = {".js", ".mjs", ".cjs", ".ts", ".tsx", ".py"}
    for base in roots:
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in extensions:
                continue
            try:
                text = path.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            hits = [p for p in patterns if p in text]
            if hits:
                matches.append({
                    "path": str(path),
                    "hits": hits,
                    "likelyBuilder": (
                        "NFLHistoricalAvailabilityMatchedATTEffectRecord" in hits
                        and (
                            "NEAREST_WITH_REPLACEMENT" in hits
                            or "treatedMinusControlResidual" in hits
                        )
                    ),
                })
    return matches


def legacy_spec(rows):
    methods = Counter()
    modes = Counter()
    calipers = Counter()
    orientations = Counter()
    semantics = Counter()
    computed = 0

    for row in rows:
        matching = row.get("matching") or {}
        effect = row.get("effect") or {}

        if matching.get("method") is not None:
            methods[str(matching["method"])] += 1
        if matching.get("mode") is not None:
            modes[str(matching["mode"])] += 1
        if isinstance(matching.get("caliper"), (int, float)):
            calipers[float(matching["caliper"])] += 1
        if effect.get("orientation") is not None:
            orientations[str(effect["orientation"])] += 1
        if effect.get("causalInterpretation") is not None:
            semantics[str(effect["causalInterpretation"])] += 1
        if effect.get("pairDifferenceComputed") is True:
            computed += 1

    return {
        "rows": len(rows),
        "methods": dict(methods),
        "modes": dict(modes),
        "calipers": {str(k): v for k, v in calipers.items()},
        "orientations": dict(orientations),
        "causalInterpretations": dict(semantics),
        "pairDifferenceComputedRows": computed,
        "frozenLegacySpecRecoverable": (
            len(methods) == 1
            and len(modes) == 1
            and len(calipers) == 1
            and len(orientations) == 1
            and len(semantics) == 1
            and computed == len(rows)
            and len(rows) > 0
        ),
    }


def summarize_shadow(rows):
    by_season = Counter()
    complete_caliber = Counter()
    for row in rows:
        season = row.get("season")
        if season not in TARGET_EXPANSION_SEASONS:
            continue
        by_season[season] += 1
        if isinstance(row.get("replacementCaliberDelta"), (int, float)):
            complete_caliber[season] += 1

    return {
        "rowsBySeason": dict(sorted(by_season.items())),
        "completeCaliberRowsBySeason": dict(sorted(complete_caliber.items())),
        "bothExpansionSeasonsPresent": all(by_season.get(s, 0) > 0 for s in TARGET_EXPANSION_SEASONS),
        "caliberEvidencePresentBothSeasons": all(complete_caliber.get(s, 0) > 0 for s in TARGET_EXPANSION_SEASONS),
    }


def summarize_observations(rows):
    by_season = Counter()
    final_by_season = Counter()
    for row in rows:
        season = row.get("season")
        if season is None:
            season = (row.get("identity") or {}).get("season")
        if season not in TARGET_EXPANSION_SEASONS:
            continue
        by_season[season] += 1

        outcome = row.get("outcome") or {}
        if outcome.get("status") == "FINAL" or row.get("final") is True:
            final_by_season[season] += 1

    return {
        "rowsBySeason": dict(sorted(by_season.items())),
        "finalOutcomeRowsBySeason": dict(sorted(final_by_season.items())),
        "bothExpansionSeasonsPresent": all(by_season.get(s, 0) > 0 for s in TARGET_EXPANSION_SEASONS),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--frontend-root", default=".")
    parser.add_argument(
        "--legacy-matched-effects",
        default="data/calibration/historical/v1/historical-availability-matched-att-effects-v1.jsonl",
    )
    parser.add_argument(
        "--five-season-shadow-corpus",
        default="data/calibration/historical/expansion-2020-2021/player-impact/five-season-shadow-replacement-corpus-v1.jsonl",
    )
    parser.add_argument(
        "--five-season-observations",
        default="data/calibration/historical/expansion-2020-2021/player-impact/caliber/five-season-evidence/five-season-observations.jsonl",
    )
    parser.add_argument(
        "--report",
        default="data/calibration/historical/expansion-2020-2021/player-impact/five-season-matched-att-expansion-readiness-2d2g-r2-v1.json",
    )
    args = parser.parse_args()

    frontend_root = Path(args.frontend_root).resolve()
    matched_path = frontend_root / args.legacy_matched_effects
    shadow_path = frontend_root / args.five_season_shadow_corpus
    observations_path = frontend_root / args.five_season_observations

    required = [matched_path, shadow_path, observations_path]
    missing = [str(p) for p in required if not p.exists()]
    if missing:
        report = {
            "contractVersion": CONTRACT_VERSION,
            "sprint": "2D.2G-R2",
            "decision": "MATCHED_ATT_EXPANSION_REQUIRED_INPUTS_MISSING",
            "missingInputs": missing,
        }
        print(json.dumps(report, indent=2))
        raise SystemExit(2)

    legacy_rows = load_jsonl(matched_path)
    shadow_rows = load_jsonl(shadow_path)
    observation_rows = load_jsonl(observations_path)

    spec = legacy_spec(legacy_rows)
    source_matches = scan_source_files(frontend_root)
    likely_builders = [m for m in source_matches if m["likelyBuilder"]]

    shadow_summary = summarize_shadow(shadow_rows)
    observation_summary = summarize_observations(observation_rows)

    exact_contract_source_found = any(
        "NFLHistoricalAvailabilityMatchedATTEffectRecord" in m["hits"]
        for m in source_matches
    )
    frozen_algorithm_source_found = any(
        "NEAREST_WITH_REPLACEMENT" in m["hits"]
        and "treatedMinusControlResidual" in m["hits"]
        for m in source_matches
    )

    construction_ready = (
        spec["frozenLegacySpecRecoverable"]
        and exact_contract_source_found
        and frozen_algorithm_source_found
        and shadow_summary["bothExpansionSeasonsPresent"]
        and shadow_summary["caliberEvidencePresentBothSeasons"]
        and observation_summary["bothExpansionSeasonsPresent"]
    )

    if construction_ready and likely_builders:
        decision = "CANONICAL_MATCHER_AND_2020_2021_INPUTS_DISCOVERED_EXTENSION_IMPLEMENTATION_READY"
    elif construction_ready:
        decision = "CANONICAL_MATCHING_SEMANTICS_RECOVERED_SOURCE_ENTRYPOINT_NEEDS_EXACT_BINDING"
    else:
        decision = "FIVE_SEASON_MATCHED_ATT_EXTENSION_BLOCKED_DO_NOT_APPROXIMATE_MATCHER"

    report = {
        "contractVersion": CONTRACT_VERSION,
        "sprint": "2D.2G-R2",
        "mode": "READ_ONLY_CANONICAL_MATCHER_REUSE_READINESS",
        "decision": decision,
        "legacyFrozenMatchingSpecification": spec,
        "canonicalMatcherDiscovery": {
            "candidateSourceFiles": source_matches,
            "likelyBuilderFiles": likely_builders,
            "exactContractSourceFound": exact_contract_source_found,
            "frozenAlgorithmSourceFound": frozen_algorithm_source_found,
        },
        "expansionInputs": {
            "shadowCorpus": shadow_summary,
            "fiveSeasonObservations": observation_summary,
        },
        "nextAction": {
            "canonical2020_2021MatchedEffectConstructionAuthorized":
                decision == "CANONICAL_MATCHER_AND_2020_2021_INPUTS_DISCOVERED_EXTENSION_IMPLEMENTATION_READY",
            "approximateMatcherAuthorized": False,
            "legacyMatchingThresholdRetuningAuthorized": False,
            "newMatchingCovariatesAuthorized": False,
            "rawPointMarginAsObservedPlayerImpactAuthorized": False,
            "productionPlayerImpactCalibrationAuthorized": False,
            "teamStrengthPromotionAuthorized": False,
            "decisionModelPromotionAuthorized": False,
            "pickemHandoffAuthorized": False,
        },
        "safeguards": {
            "legacyMatchedEffectArtifactMutated": False,
            "fiveSeasonShadowCorpusMutated": False,
            "matchingAlgorithmReimplementedFromGuesswork": False,
            "matchingThresholdRetuned": False,
            "causalClaimCreated": False,
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

    out = frontend_root / args.report
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
