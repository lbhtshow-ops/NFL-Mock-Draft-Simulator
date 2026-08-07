"""Align the inherited runtime schema with the current SQLAlchemy Team model.

Revision ID: 20260807_4g
Revises: e7ca17d25a8b
Create Date: 2026-08-07

MDS-4G intentionally changes only the legacy Mock Draft Simulator runtime schema.
It does not create, alter, or activate FID/REF/Sports Intelligence persistence.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260807_4g"
down_revision: Union[str, None] = "e7ca17d25a8b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # The inherited initial migration predates Team.year.  New owned runtime
    # databases first run that migration, then this alignment migration.
    # A temporary default makes the NOT NULL add safe if a legacy database
    # already contains team rows; the default is removed immediately after.
    op.add_column(
        "teams",
        sa.Column("year", sa.Integer(), nullable=False, server_default=sa.text("2026")),
    )
    op.alter_column("teams", "year", server_default=None)


def downgrade() -> None:
    op.drop_column("teams", "year")
