"""add partnership approval config

Revision ID: a7b8c9d0e1f2
Revises: 9c2d3e4f5a6b
Create Date: 2026-06-16
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, None] = "9c2d3e4f5a6b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "approval_workflows",
        sa.Column("partner_approval_mode", sa.String(), nullable=True),
    )
    op.add_column(
        "approval_workflows",
        sa.Column("partner_approval_min_count", sa.Integer(), nullable=True),
    )
    op.add_column(
        "approval_workflows",
        sa.Column("partner_role_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_approval_workflows_partner_role_id_roles",
        "approval_workflows",
        "roles",
        ["partner_role_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_approval_workflows_partner_role_id_roles",
        "approval_workflows",
        type_="foreignkey",
    )
    op.drop_column("approval_workflows", "partner_role_id")
    op.drop_column("approval_workflows", "partner_approval_min_count")
    op.drop_column("approval_workflows", "partner_approval_mode")
