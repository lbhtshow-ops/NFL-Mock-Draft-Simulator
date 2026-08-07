"""Seed the LBHT-owned Mock Draft Simulator operational database.

This script is explicit and idempotent.  It seeds only the runtime data needed
for the existing simulator mechanics: 2026 teams and a 2026 draft-order
reference template.  It does not seed FID/REF data and does not claim the 2027
NFL Draft order is known.
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

from backend.database import SessionLocal
from backend.apps import models

POSITIONS = ("qb", "rb", "wr", "te", "ot", "iol", "de", "dt", "lb", "cb", "s")
REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SEED_ROOT = REPO_ROOT / "data" / "runtime_seed" / "2026"


def _as_int(row: dict, key: str) -> int:
    value = row.get(key)
    if value is None or str(value).strip() == "":
        raise ValueError(f"Missing required integer field: {key}")
    return int(str(value).strip())


def load_team_rows(path: Path) -> list[dict]:
    rows: list[dict] = []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for raw in reader:
            name = (raw.get("Name") or "").strip()
            if not name:
                continue
            row = {"name": name, "year": 2026}
            for position in POSITIONS:
                row[position] = _as_int(raw, position.upper())
            rows.append(row)
    if len(rows) != 32:
        raise ValueError(f"Expected exactly 32 teams, found {len(rows)} in {path}")
    return rows


def load_pick_rows(path: Path) -> list[dict]:
    rows: list[dict] = []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for raw in reader:
            rows.append(
                {
                    "round": _as_int(raw, "Round"),
                    "pick_number": _as_int(raw, "Pick Number"),
                    "current_team": (raw.get("Current Team") or "").strip(),
                    "original_team": (raw.get("Original Team") or "").strip(),
                    "year": _as_int(raw, "Year"),
                }
            )
    if not rows:
        raise ValueError(f"No draft picks found in {path}")
    return rows


def seed_runtime_database(seed_root: Path = DEFAULT_SEED_ROOT) -> dict:
    team_rows = load_team_rows(seed_root / "teams.csv")
    pick_rows = load_pick_rows(seed_root / "draft_picks.csv")

    db = SessionLocal()
    try:
        created_teams = 0
        updated_teams = 0
        team_by_name: dict[str, models.Team] = {}

        for row in team_rows:
            team = (
                db.query(models.Team)
                .filter(models.Team.name == row["name"], models.Team.year == row["year"])
                .first()
            )
            if team is None:
                team = models.Team(**row)
                db.add(team)
                db.flush()
                created_teams += 1
            else:
                for position in POSITIONS:
                    setattr(team, position, row[position])
                updated_teams += 1
            team_by_name[row["name"]] = team

        db.flush()

        created_picks = 0
        updated_picks = 0
        for row in pick_rows:
            current_team = team_by_name.get(row["current_team"])
            original_team = team_by_name.get(row["original_team"])
            if current_team is None or original_team is None:
                raise ValueError(
                    "Draft order references an unknown team: "
                    f"current={row['current_team']!r}, original={row['original_team']!r}"
                )

            pick = (
                db.query(models.DraftPick)
                .filter(
                    models.DraftPick.year == row["year"],
                    models.DraftPick.pick_number == row["pick_number"],
                )
                .first()
            )
            if pick is None:
                pick = models.DraftPick(
                    round=row["round"],
                    pick_number=row["pick_number"],
                    year=row["year"],
                    current_team_id=current_team.id,
                    original_team_id=original_team.id,
                )
                db.add(pick)
                created_picks += 1
            else:
                pick.round = row["round"]
                pick.current_team_id = current_team.id
                pick.original_team_id = original_team.id
                updated_picks += 1

        db.commit()
        return {
            "teams_created": created_teams,
            "teams_updated": updated_teams,
            "draft_picks_created": created_picks,
            "draft_picks_updated": updated_picks,
            "team_count_2026": db.query(models.Team).filter(models.Team.year == 2026).count(),
            "draft_pick_count_2026": db.query(models.DraftPick).filter(models.DraftPick.year == 2026).count(),
        }
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed LBHT Mock Draft Simulator runtime data")
    parser.add_argument(
        "--seed-root",
        type=Path,
        default=DEFAULT_SEED_ROOT,
        help="Directory containing teams.csv and draft_picks.csv",
    )
    args = parser.parse_args()
    result = seed_runtime_database(args.seed_root)
    for key, value in result.items():
        print(f"{key}: {value}")


if __name__ == "__main__":
    main()
