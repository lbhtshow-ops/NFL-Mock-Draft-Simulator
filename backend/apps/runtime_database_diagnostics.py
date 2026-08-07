"""Read-only diagnostics for the LBHT-owned Mock Draft Simulator runtime DB."""

from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from . import models

RUNTIME_DATABASE_SCHEMA_VERSION = "MDS-4G"
REQUIRED_TABLES = (
    "players",
    "teams",
    "draft_picks",
    "mock_drafts",
    "mock_draft_picks",
    "user_controlled_teams",
)


def _safe_count(db: Session, model) -> int:
    try:
        return int(db.query(model).count())
    except Exception:
        return -1


def _year_count(db: Session, model, year: int) -> int:
    try:
        return int(db.query(model).filter(model.year == year).count())
    except Exception:
        return -1


def collect_runtime_database_diagnostics(db: Session) -> dict:
    """Return non-secret runtime readiness information without mutating state."""
    bind = db.get_bind()
    inspector = inspect(bind)
    available_tables = set(inspector.get_table_names())
    missing_tables = [name for name in REQUIRED_TABLES if name not in available_tables]

    connection_ok = True
    connection_error = None
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:  # pragma: no cover - exercised only on connection failure
        connection_ok = False
        connection_error = type(exc).__name__

    counts = {
        "teams": _safe_count(db, models.Team) if "teams" in available_tables else -1,
        "teams_2026": _year_count(db, models.Team, 2026) if "teams" in available_tables else -1,
        "draft_picks": _safe_count(db, models.DraftPick) if "draft_picks" in available_tables else -1,
        "draft_picks_2026": _year_count(db, models.DraftPick, 2026) if "draft_picks" in available_tables else -1,
        "players": _safe_count(db, models.Player) if "players" in available_tables else -1,
        "players_2027": _year_count(db, models.Player, 2027) if "players" in available_tables else -1,
    }

    migration_ready = connection_ok and not missing_tables
    seed_ready = counts["teams_2026"] == 32 and counts["draft_picks_2026"] > 0
    bootstrap_ready = migration_ready and seed_ready

    return {
        "runtime_database_schema_version": RUNTIME_DATABASE_SCHEMA_VERSION,
        "connection_ok": connection_ok,
        "connection_error_type": connection_error,
        "required_tables": list(REQUIRED_TABLES),
        "missing_tables": missing_tables,
        "counts": counts,
        "migration_ready": migration_ready,
        "seed_ready": seed_ready,
        "bootstrap_ready": bootstrap_ready,
        "notes": [
            "This endpoint is read-only and never returns DATABASE_URL or credentials.",
            "2027 prospect application projection is materialized by the MDS-4D bootstrap path, not by this seed.",
            "FID/REF persistence is intentionally outside this runtime database.",
        ],
    }
