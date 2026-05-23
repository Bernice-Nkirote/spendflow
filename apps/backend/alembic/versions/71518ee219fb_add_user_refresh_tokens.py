"""add user refresh tokens

Revision ID: 71518ee219fb
Revises: a8764009c660
Create Date: 2026-05-21 15:35:20.817421

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '71518ee219fb'
down_revision: Union[str, Sequence[str], None] = 'a8764009c660'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        "user_refresh_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
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
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_user_refresh_tokens_company_id",
        "user_refresh_tokens",
        ["company_id"],
    )

    op.create_index(
        "ix_user_refresh_tokens_user_id",
        "user_refresh_tokens",
        ["user_id"],
    )

    op.create_index(
        "ix_user_refresh_tokens_token_hash",
        "user_refresh_tokens",
        ["token_hash"],
        unique=True,
    )

    op.create_index(
        "ix_user_refresh_tokens_company_user",
        "user_refresh_tokens",
        ["company_id", "user_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_user_refresh_tokens_company_user",
        table_name="user_refresh_tokens",
    )
    op.drop_index(
        "ix_user_refresh_tokens_token_hash",
        table_name="user_refresh_tokens",
    )
    op.drop_index(
        "ix_user_refresh_tokens_user_id",
        table_name="user_refresh_tokens",
    )
    op.drop_index(
        "ix_user_refresh_tokens_company_id",
        table_name="user_refresh_tokens",
    )
    op.drop_table("user_refresh_tokens")