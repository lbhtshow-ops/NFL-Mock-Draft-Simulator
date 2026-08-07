"""Runtime draft-order materialization for application mock-draft sessions.

This module owns application/runtime draft-order preparation only. It does not create
Football Intelligence, does not represent canonical FID persistence, and does not claim
that a future NFL draft order is finalized.

For a requested draft year with no runtime rows, the latest existing draft-order year is
used as an explicitly declared development template. Rows are materialized into the
application database so the legacy relational runtime can reference stable draft_pick IDs
without requiring operators to pre-seed a future draft year manually.
"""

from dataclasses import dataclass
from typing import List

from sqlalchemy import func
from sqlalchemy.orm import Session

from . import models


RUNTIME_ORDER_CONTRACT_VERSION = "1.0"
RUNTIME_ORDER_STATUS = "DEVELOPMENT_TEMPLATE_MATERIALIZED"
RUNTIME_ORDER_EXISTING_STATUS = "EXISTING_RUNTIME_ORDER"


@dataclass(frozen=True)
class RuntimeDraftOrderResolution:
    requested_year: int
    source_year: int
    materialized: bool
    status: str
    picks: List[models.DraftPick]


def _existing_requested_picks(db: Session, requested_year: int, num_rounds: int):
    return (
        db.query(models.DraftPick)
        .filter(
            models.DraftPick.year == requested_year,
            models.DraftPick.round <= num_rounds,
        )
        .order_by(models.DraftPick.pick_number.asc())
        .all()
    )


def _latest_template_year(db: Session, requested_year: int):
    """Return the latest available year other than the requested future/runtime year."""
    return (
        db.query(func.max(models.DraftPick.year))
        .filter(models.DraftPick.year != requested_year)
        .scalar()
    )


def resolve_runtime_draft_order(
    db: Session,
    *,
    requested_year: int,
    num_rounds: int,
) -> RuntimeDraftOrderResolution:
    """Resolve or materialize runtime draft-pick rows for a mock-draft session.

    Existing requested-year rows always win. If none exist, the latest available draft
    order is copied as a bounded development template for the requested year. The caller
    controls transaction commit/rollback.
    """
    existing = _existing_requested_picks(db, requested_year, num_rounds)
    if existing:
        return RuntimeDraftOrderResolution(
            requested_year=requested_year,
            source_year=requested_year,
            materialized=False,
            status=RUNTIME_ORDER_EXISTING_STATUS,
            picks=existing,
        )

    source_year = _latest_template_year(db, requested_year)
    if source_year is None:
        raise ValueError(
            f"No draft-order template is available for runtime year={requested_year}"
        )

    template_picks = (
        db.query(models.DraftPick)
        .filter(
            models.DraftPick.year == int(source_year),
            models.DraftPick.round <= num_rounds,
        )
        .order_by(models.DraftPick.pick_number.asc())
        .all()
    )
    if not template_picks:
        raise ValueError(
            f"No draft-order template rows found for source year={source_year}, "
            f"rounds<={num_rounds}"
        )

    materialized = []
    for template in template_picks:
        row = models.DraftPick(
            pick_number=template.pick_number,
            round=template.round,
            year=requested_year,
            current_team_id=template.current_team_id,
            original_team_id=template.original_team_id,
        )
        db.add(row)
        materialized.append(row)

    # Assign primary keys so MockDraftPick can safely reference these rows in the same
    # transaction without committing early.
    db.flush()

    return RuntimeDraftOrderResolution(
        requested_year=requested_year,
        source_year=int(source_year),
        materialized=True,
        status=RUNTIME_ORDER_STATUS,
        picks=materialized,
    )
