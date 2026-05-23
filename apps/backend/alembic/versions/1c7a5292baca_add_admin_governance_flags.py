"""add admin governance flags

Revision ID: 1c7a5292baca
Revises: e1e6e5a8ade7
Create Date: 2026-05-16 17:15:48.652048

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a3b9c2d4e5f6"
down_revision: Union[str, Sequence[str], None] = "e1e6e5a8ade7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "roles",
        sa.Column(
            "is_system_role",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "is_company_owner",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    op.execute(
        """
        UPDATE roles
        SET is_system_role = true
        WHERE lower(name) = 'admin'
        """
    )

    op.execute(
        """
        UPDATE users
        SET is_company_owner = true
        WHERE id IN (
            SELECT DISTINCT ON (u.company_id) u.id
            FROM users u
            JOIN roles r ON r.id = u.role_id
            WHERE lower(r.name) = 'admin'
            ORDER BY u.company_id, u.created_at ASC
        )
        """
    )


def downgrade() -> None:
    op.drop_column("users", "is_company_owner")
    op.drop_column("roles", "is_system_role")