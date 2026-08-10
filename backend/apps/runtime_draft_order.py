"""Runtime draft-order materialization for application mock-draft sessions.

This module owns application/runtime draft-order preparation only. It does not create
Football Intelligence, does not represent canonical FID persistence, and does not claim
that a future NFL draft order is finalized.

For a requested draft year, the latest established draft-order year may be used as an
explicitly declared development template. Existing requested-year rows are preserved.
If the requested-year order is only partially materialized, missing requested picks are
filled from that template so the configured mock-draft length remains authoritative.
"""

from dataclasses import dataclass
from typing import List

from sqlalchemy import func
from sqlalchemy.orm import Session

from . import models


RUNTIME_ORDER_CONTRACT_VERSION = "1.1"
RUNTIME_ORDER_STATUS = "DEVELOPMENT_TEMPLATE_MATERIALIZED"
RUNTIME_ORDER_EXISTING_STATUS = "EXISTING_RUNTIME_ORDER"
RUNTIME_ORDER_COMPLETED_STATUS = "EXISTING_RUNTIME_ORDER_COMPLETED_FROM_TEMPLATE"


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


def _template_picks(db: Session, source_year: int, num_rounds: int):
    return (
        db.query(models.DraftPick)
        .filter(
            models.DraftPick.year == int(source_year),
            models.DraftPick.round <= num_rounds,
        )
        .order_by(models.DraftPick.pick_number.asc())
        .all()
    )


def _materialize_missing_requested_picks(
    db: Session,
    *,
    requested_year: int,
    existing,
    template_picks,
):
    """Preserve existing requested-year picks and add only missing template pick numbers."""
    existing_numbers = {int(pick.pick_number) for pick in existing}
    materialized = []

    for template in template_picks:
        if int(template.pick_number) in existing_numbers:
            continue

        row = models.DraftPick(
            pick_number=template.pick_number,
            round=template.round,
            year=requested_year,
            current_team_id=template.current_team_id,
            original_team_id=template.original_team_id,
        )
        db.add(row)
        materialized.append(row)

    if materialized:
        # Assign primary keys so MockDraftPick can reference the newly completed order
        # within the same bootstrap transaction without committing early.
        db.flush()

    return materialized


def resolve_runtime_draft_order(
    db: Session,
    *,
    requested_year: int,
    num_rounds: int,
) -> RuntimeDraftOrderResolution:
    """Resolve a complete runtime draft order for the requested mock-draft length.

    Existing requested-year rows are authoritative for rows already materialized, but a
    partial requested-year order is not treated as a complete order. Missing pick numbers
    for the requested rounds are materialized from the latest established template year.
    The caller controls transaction commit/rollback.
    """
    existing = _existing_requested_picks(db, requested_year, num_rounds)
    source_year = _latest_template_year(db, requested_year)

    if source_year is None:
        if existing:
            return RuntimeDraftOrderResolution(
                requested_year=requested_year,
                source_year=requested_year,
                materialized=False,
                status=RUNTIME_ORDER_EXISTING_STATUS,
                picks=existing,
            )
        raise ValueError(
            f"No draft-order template is available for runtime year={requested_year}"
        )

    template_picks = _template_picks(db, int(source_year), num_rounds)
    if not template_picks:
        if existing:
            return RuntimeDraftOrderResolution(
                requested_year=requested_year,
                source_year=requested_year,
                materialized=False,
                status=RUNTIME_ORDER_EXISTING_STATUS,
                picks=existing,
            )
        raise ValueError(
            f"No draft-order template rows found for source year={source_year}, "
            f"rounds<={num_rounds}"
        )

    if existing:
        materialized = _materialize_missing_requested_picks(
            db,
            requested_year=requested_year,
            existing=existing,
            template_picks=template_picks,
        )
        if not materialized:
            return RuntimeDraftOrderResolution(
                requested_year=requested_year,
                source_year=requested_year,
                materialized=False,
                status=RUNTIME_ORDER_EXISTING_STATUS,
                picks=existing,
            )

        completed = _existing_requested_picks(db, requested_year, num_rounds)
        return RuntimeDraftOrderResolution(
            requested_year=requested_year,
            source_year=int(source_year),
            materialized=True,
            status=RUNTIME_ORDER_COMPLETED_STATUS,
            picks=completed,
        )

    materialized = _materialize_missing_requested_picks(
        db,
        requested_year=requested_year,
        existing=[],
        template_picks=template_picks,
    )

    return RuntimeDraftOrderResolution(
        requested_year=requested_year,
        source_year=int(source_year),
        materialized=True,
        status=RUNTIME_ORDER_STATUS,
        picks=materialized,
    )
