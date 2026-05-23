"""add supplier refresh tokens

Revision ID: 16755d1154e7
Revises: 71518ee219fb
Create Date: 2026-05-21 16:39:19.660958

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '16755d1154e7'
down_revision: Union[str, Sequence[str], None] = '71518ee219fb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "supplier_refresh_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("supplier_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("supplier_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token_hash", sa.String(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "is_revoked",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["supplier_user_id"],
            ["supplier_users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_supplier_refresh_tokens_supplier_id",
        "supplier_refresh_tokens",
        ["supplier_id"],
    )

    op.create_index(
        "ix_supplier_refresh_tokens_supplier_user_id",
        "supplier_refresh_tokens",
        ["supplier_user_id"],
    )

    op.create_index(
        "ix_supplier_refresh_tokens_token_hash",
        "supplier_refresh_tokens",
        ["token_hash"],
        unique=True,
    )

    op.create_index(
        "ix_supplier_refresh_tokens_supplier_user",
        "supplier_refresh_tokens",
        ["supplier_id", "supplier_user_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_supplier_refresh_tokens_supplier_user",
        table_name="supplier_refresh_tokens",
    )
    op.drop_index(
        "ix_supplier_refresh_tokens_token_hash",
        table_name="supplier_refresh_tokens",
    )
    op.drop_index(
        "ix_supplier_refresh_tokens_supplier_user_id",
        table_name="supplier_refresh_tokens",
    )
    op.drop_index(
        "ix_supplier_refresh_tokens_supplier_id",
        table_name="supplier_refresh_tokens",
    )
    op.drop_table("supplier_refresh_tokens")