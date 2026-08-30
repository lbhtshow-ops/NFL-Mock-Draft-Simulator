#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
from collections import Counter, defaultdict
from pathlib import Path


CONTRACT_VERSION = "FIE-NFL-HISTORICAL-SNAP-IDENTITY-MATERIALIZATION-2D1F-R1-1.0.0"
IDENTITY_METHOD = "EXACT_PFR_TO_GSIS"
QUARANTINE_REASON = "UNRESOLVED_PFR_TO_GSIS"


def clean(value):
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def read_jsonl(path):
    with Path(path).open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            if not line.strip():
                continue
            try:
                yield line_number, json.loads(line)
            except json.JSONDecodeError as exc:
                raise RuntimeError(
                    f"INVALID_JSONL:{path}:line={line_number}:{exc}"
                ) from exc


def build_pfr_to_gsis(players_file):
    mapping = {}
    conflicts = {}
    canonical_rows = 0
    usable_rows = 0

    with Path(players_file).open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        fields = reader.fieldnames or []
        if "pfr_id" not in fields or "gsis_id" not in fields:
            raise RuntimeError(
                f"PLAYER_DIRECTORY_MISSING_REQUIRED_COLUMNS:{players_file}:"
                f"required=pfr_id,gsis_id"
            )

        for row in reader:
            canonical_rows += 1
            pfr = clean(row.get("pfr_id"))
            gsis = clean(row.get("gsis_id"))
            if not pfr or not gsis:
                continue

            usable_rows += 1
            key = pfr.lower()
            prior = mapping.get(key)

            if prior is None:
                mapping[key] = gsis
            elif prior != gsis:
                conflicts.setdefault(key, set()).update([prior, gsis])

    for key in conflicts:
        mapping.pop(key, None)

    return mapping, {
        "playerDirectoryRows": canonical_rows,
        "usableExactIdentityRows": usable_rows,
        "uniqueExactPfrMappings": len(mapping),
        "conflictingPfrIds": len(conflicts),
        "conflicts": {
            key: sorted(values)
            for key, values in sorted(conflicts.items())
        },
    }


def dependency_flags(row):
    offense = (
        row.get("offense_snaps") is not None
        or row.get("offense_pct") is not None
    )
    defense = (
        row.get("defense_snaps") is not None
        or row.get("defense_pct") is not None
    )
    special_teams = (
        row.get("st_snaps") is not None
        or row.get("st_pct") is not None
    )
    any_unit = offense or defense or special_teams
    return offense, defense, special_teams, any_unit


def materialize(
    source,
    players_file,
    resolved_output,
    quarantine_output,
    report_output,
    seasons,
):
    mapping, directory_report = build_pfr_to_gsis(players_file)

    resolved_path = Path(resolved_output)
    quarantine_path = Path(quarantine_output)
    report_path = Path(report_output)

    resolved_path.parent.mkdir(parents=True, exist_ok=True)
    quarantine_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.parent.mkdir(parents=True, exist_ok=True)

    source_rows = 0
    in_scope_rows = 0
    resolved_rows = 0
    quarantined_rows = 0
    rows_without_source_identity = 0
    source_identity_present = 0
    rows_by_season = Counter()
    resolved_by_season = Counter()
    quarantine_by_season = Counter()
    quarantine_by_pfr = Counter()
    dependency = Counter()
    game_ids = set()
    teams = set()
    positions = Counter()

    with (
        resolved_path.open("w", encoding="utf-8") as resolved_handle,
        quarantine_path.open("w", encoding="utf-8") as quarantine_handle,
    ):
        for line_number, original in read_jsonl(source):
            source_rows += 1

            season = original.get("season")
            if seasons and season not in seasons:
                continue

            in_scope_rows += 1
            rows_by_season[season] += 1

            row = dict(original)
            pfr = clean(row.get("pfr_player_id"))
            if pfr:
                source_identity_present += 1

            if pfr and pfr.lower() in mapping:
                gsis = mapping[pfr.lower()]
                row["gsis_id"] = gsis
                row["canonical_identity_resolved"] = True

                # Explicitly remove accidental exploratory fields if present.
                row.pop("gsisId", None)
                row.pop("identityResolution", None)

                resolved_handle.write(
                    json.dumps(row, separators=(",", ":")) + "\n"
                )

                resolved_rows += 1
                resolved_by_season[season] += 1

                offense, defense, special_teams, any_unit = dependency_flags(row)
                dependency["offenseEvidenceRows"] += int(offense)
                dependency["defenseEvidenceRows"] += int(defense)
                dependency["specialTeamsEvidenceRows"] += int(special_teams)
                dependency["anyDependencyEvidenceRows"] += int(any_unit)

                if clean(row.get("game_id")):
                    game_ids.add(row["game_id"])
                if clean(row.get("team")):
                    teams.add(row["team"])
                positions[clean(row.get("position")) or "UNKNOWN"] += 1
            else:
                if not pfr:
                    rows_without_source_identity += 1

                quarantine = dict(original)
                quarantine["canonical_identity_resolved"] = False
                quarantine["quarantine_reason"] = QUARANTINE_REASON
                quarantine["source_line_number"] = line_number
                quarantine.pop("gsisId", None)
                quarantine.pop("identityResolution", None)

                quarantine_handle.write(
                    json.dumps(quarantine, separators=(",", ":")) + "\n"
                )

                quarantined_rows += 1
                quarantine_by_season[season] += 1
                quarantine_by_pfr[pfr or "__MISSING__"] += 1

    reconciled = resolved_rows + quarantined_rows
    if reconciled != in_scope_rows:
        raise RuntimeError(
            "ROW_RECONCILIATION_FAILED:"
            f"inScope={in_scope_rows}:resolved={resolved_rows}:"
            f"quarantined={quarantined_rows}"
        )

    resolution_rate = (
        resolved_rows / in_scope_rows if in_scope_rows else 0.0
    )

    report = {
        "contractVersion": CONTRACT_VERSION,
        "mode": "ISOLATED_EXPANSION_MATERIALIZATION",
        "identityMethod": IDENTITY_METHOD,
        "scope": {
            "seasons": sorted(seasons) if seasons else "ALL_SOURCE_SEASONS",
            "source": str(Path(source)),
            "playersFile": str(Path(players_file)),
            "resolvedOutput": str(resolved_path),
            "quarantineOutput": str(quarantine_path),
        },
        "identityDirectory": directory_report,
        "totals": {
            "sourceRows": source_rows,
            "inScopeRows": in_scope_rows,
            "rowsWithPfrIdentity": source_identity_present,
            "resolvedRows": resolved_rows,
            "quarantinedRows": quarantined_rows,
            "rowsWithoutSourceIdentity": rows_without_source_identity,
            "exactResolutionRate": resolution_rate,
            "rowReconciliationPassed": reconciled == in_scope_rows,
        },
        "bySeason": {
            str(season): {
                "sourceRows": rows_by_season[season],
                "resolvedRows": resolved_by_season[season],
                "quarantinedRows": quarantine_by_season[season],
                "resolutionRate": (
                    resolved_by_season[season] / rows_by_season[season]
                    if rows_by_season[season]
                    else 0.0
                ),
            }
            for season in sorted(rows_by_season)
        },
        "quarantine": {
            "uniquePfrIds": len(quarantine_by_pfr),
            "topPfrIds": [
                {"pfrId": key, "rows": count}
                for key, count in quarantine_by_pfr.most_common(50)
            ],
        },
        "dependencyReadiness": {
            "evidenceTiming": "POSTGAME_PARTICIPATION",
            "resolvedRows": resolved_rows,
            "offenseEvidenceRows": dependency["offenseEvidenceRows"],
            "defenseEvidenceRows": dependency["defenseEvidenceRows"],
            "specialTeamsEvidenceRows": dependency["specialTeamsEvidenceRows"],
            "anyDependencyEvidenceRows": dependency["anyDependencyEvidenceRows"],
            "anyDependencyEvidenceCoverageRate": (
                dependency["anyDependencyEvidenceRows"] / resolved_rows
                if resolved_rows
                else 0.0
            ),
            "uniqueGames": len(game_ids),
            "uniqueTeams": len(teams),
            "rowsByPosition": dict(sorted(positions.items())),
            "qualifiedForPostgameDependencyCandidate": bool(
                resolved_rows
                and resolution_rate >= 0.95
                and (
                    dependency["anyDependencyEvidenceRows"] / resolved_rows
                    if resolved_rows
                    else 0.0
                ) >= 0.95
            ),
            "qualifiedForPregameReplacementDetermination": False,
        },
        "governance": {
            "canonicalIdentityField": "gsis_id",
            "canonicalIdentityResolvedField": "canonical_identity_resolved",
            "sourceIdentityField": "pfr_player_id",
            "sourceIdentityMayMasqueradeAsCanonicalIdentity": False,
            "nameMatchingUsed": False,
            "fuzzyMatchingUsed": False,
            "teamPositionGuessUsed": False,
            "unresolvedRowsQuarantined": True,
            "postgameParticipationEvidenceOnly": True,
            "pregameReplacementDeterminationAuthorized": False,
            "canonicalV1DatasetMutated": False,
            "calibrationExecuted": False,
            "learnedWeights": None,
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
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--players", required=True)
    parser.add_argument("--resolved-output", required=True)
    parser.add_argument("--quarantine-output", required=True)
    parser.add_argument("--report", required=True)
    parser.add_argument("--seasons", default="")
    args = parser.parse_args()

    seasons = {
        int(value.strip())
        for value in args.seasons.split(",")
        if value.strip()
    }

    report = materialize(
        source=args.source,
        players_file=args.players,
        resolved_output=args.resolved_output,
        quarantine_output=args.quarantine_output,
        report_output=args.report,
        seasons=seasons,
    )

    if not report["totals"]["rowReconciliationPassed"]:
        raise SystemExit(1)

    if report["identityDirectory"]["conflictingPfrIds"] != 0:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
