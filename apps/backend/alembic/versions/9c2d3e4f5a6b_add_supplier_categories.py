"""add supplier categories

Revision ID: 9c2d3e4f5a6b
Revises: 8b1f2c3d4e5a
Create Date: 2026-06-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9c2d3e4f5a6b"
down_revision: Union[str, Sequence[str], None] = "8b1f2c3d4e5a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "suppliers",
        sa.Column("category", sa.String(), nullable=True),
    )
    op.add_column(
        "suppliers",
        sa.Column("sub_category", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("suppliers", "sub_category")
    op.drop_column("suppliers", "category")
