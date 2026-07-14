"""update payment approval flow

Revision ID: c4d5e6f7a8b9
Revises: a7b8c9d0e1f2
Create Date: 2026-07-14
"""

from alembic import op
import sqlalchemy as sa


revision = "c4d5e6f7a8b9"
down_revision = "a7b8c9d0e1f2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE paymentstatusenum ADD VALUE IF NOT EXISTS 'APPROVED'")
    op.alter_column(
        "payments",
        "paid_at",
        existing_type=sa.DateTime(timezone=True),
        nullable=True,
        server_default=None,
    )


def downgrade() -> None:
    op.execute("UPDATE payments SET status = 'PENDING_APPROVAL' WHERE status = 'APPROVED'")
    op.alter_column(
        "payments",
        "paid_at",
        existing_type=sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.text("now()"),
    )
