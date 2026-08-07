"""Read-only diagnostics for the mock-draft runtime bootstrap boundary.

This module exists to prove which runtime implementation is deployed and whether the
application database has enough legacy runtime data to materialize a future-year draft
order. It performs no writes, no migrations, and no FID/REF persistence operations.
"""

from collections import OrderedDict
from typing import Any, Dict

from sqlalchemy import func
from sqlalchemy.orm import Session

from . import models
from .application_projection_2027 import (
    PROJECTION_SOURCE,
    PROJECTION_STATUS,
    PROJECTION_VERSION,
    PROSPECTS_2027,
)
from .runtime_draft_order import (
    RUNTIME_ORDER_CONTRACT_VERSION,
    RUNTIME_ORDER_EXISTING_STATUS,
    RUNTIME_ORDER_STATUS,
)


RUNTIME_BUILD_MARKER = "MDS-4F_RUNTIME_BOOTSTRAP_DIAGNOSTICS_1.0"
BOOTSTRAP_IMPLEMENTATION = "RUNTIME_TEMPLATE_MATERIALIZATION_2.1"


def _draft_pick_counts_by_year(db: Session) -> Dict[str, int]:
    rows = (
        db.query(models.DraftPick.year, func.count(models.DraftPick.id))
        .group_by(models.DraftPick.year)
        .order_by(models.DraftPick.year.asc())
        .all()
    )
    return OrderedDict((str(int(year)), int(count)) for year, count in rows)


def _player_counts_by_year(db: Session) -> Dict[str, int]:
    rows = (
        db.query(models.Player.year, func.count(models.Player.id))
        .group_by(models.Player.year)
        .order_by(models.Player.year.asc())
        .all()
    )
    return OrderedDict((str(int(year)), int(count)) for year, count in rows)


def collect_bootstrap_diagnostics(
    db: Session,
    *,
    requested_year: int = 2027,
    num_rounds: int = 1,
) -> Dict[str, Any]:
    """Return a sanitized, read-only view of bootstrap readiness.

    No database URL, host, credential, role, or other sensitive connection detail is
    returned. The diagnostic is intentionally application/runtime scoped.
    """
    requested_rows = (
        db.query(func.count(models.DraftPick.id))
        .filter(
            models.DraftPick.year == requested_year,
            models.DraftPick.round <= num_rounds,
        )
        .scalar()
        or 0
    )

    latest_template_year = (
        db.query(func.max(models.DraftPick.year))
        .filter(models.DraftPick.year != requested_year)
        .scalar()
    )

    template_rows = 0
    if latest_template_year is not None:
        template_rows = (
            db.query(func.count(models.DraftPick.id))
            .filter(
                models.DraftPick.year == int(latest_template_year),
                models.DraftPick.round <= num_rounds,
            )
            .scalar()
            or 0
        )

    projected_2027_rows = (
        db.query(func.count(models.Player.id))
        .filter(models.Player.year == 2027)
        .scalar()
        or 0
    )

    if requested_rows:
        readiness = "READY_EXISTING_RUNTIME_ORDER"
        expected_path = RUNTIME_ORDER_EXISTING_STATUS
    elif latest_template_year is not None and template_rows:
        readiness = "READY_TO_MATERIALIZE_RUNTIME_TEMPLATE"
        expected_path = RUNTIME_ORDER_STATUS
    else:
        readiness = "BLOCKED_NO_RUNTIME_ORDER_TEMPLATE"
        expected_path = "NO_TEMPLATE_AVAILABLE"

    return {
        "runtime_build_marker": RUNTIME_BUILD_MARKER,
        "bootstrap_implementation": BOOTSTRAP_IMPLEMENTATION,
        "runtime_order_contract_version": RUNTIME_ORDER_CONTRACT_VERSION,
        "requested_year": int(requested_year),
        "num_rounds": int(num_rounds),
        "readiness": readiness,
        "expected_order_path": expected_path,
        "requested_year_order_rows": int(requested_rows),
        "latest_template_year": int(latest_template_year) if latest_template_year is not None else None,
        "template_rows_for_requested_rounds": int(template_rows),
        "draft_pick_counts_by_year": _draft_pick_counts_by_year(db),
        "player_counts_by_year": _player_counts_by_year(db),
        "database_2027_player_rows": int(projected_2027_rows),
        "development_projection": {
            "status": PROJECTION_STATUS,
            "source": PROJECTION_SOURCE,
            "version": PROJECTION_VERSION,
            "declared_cohort_size": len(PROSPECTS_2027),
        },
        "writes_performed": False,
        "fid_production_persistence_touched": False,
        "ref_sprint_17c_touched": False,
    }
