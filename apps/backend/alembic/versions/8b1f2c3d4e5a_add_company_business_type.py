"""add company business type

Revision ID: 8b1f2c3d4e5a
Revises: f5b6ca3d22f5
Create Date: 2026-06-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8b1f2c3d4e5a"
down_revision: Union[str, Sequence[str], None] = "f5b6ca3d22f5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "companies",
        sa.Column(
            "business_type",
            sa.String(),
            nullable=False,
            server_default="company",
        ),
    )
    op.create_check_constraint(
        "ck_companies_business_type",
        "companies",
        "business_type IN ('sole_proprietorship', 'partnership', 'company')",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_companies_business_type",
        "companies",
        type_="check",
    )
    op.drop_column("companies", "business_type")