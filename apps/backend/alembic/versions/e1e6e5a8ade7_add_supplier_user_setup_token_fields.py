"""add supplier user setup token fields

Revision ID: e1e6e5a8ade7
Revises: b94698714f93
Create Date: 2026-05-15 14:24:36.718552

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e1e6e5a8ade7'
down_revision: Union[str, Sequence[str], None] = 'b94698714f93'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "supplier_users",
        "hashed_password",
        existing_type=sa.String(),
        nullable=True,
)

    op.add_column(
        "supplier_users",
        sa.Column("password_setup_token", sa.String(), nullable=True),
    )

    op.add_column(
        "supplier_users",
        sa.Column("password_setup_expires_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.add_column(
        "supplier_users",
        sa.Column(
            "has_completed_onboarding",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    op.create_index(
        "ix_supplier_users_password_setup_token",
        "supplier_users",
        ["password_setup_token"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_supplier_users_password_setup_token",
        table_name="supplier_users",
)

    op.drop_column("supplier_users", "has_completed_onboarding")
    op.drop_column("supplier_users", "password_setup_expires_at")
    op.drop_column("supplier_users", "password_setup_token")

    op.alter_column(
        "supplier_users",
        "hashed_password",
        existing_type=sa.String(),
        nullable=False,
    )
