"""add user password reset tokens

Revision ID: 51378e68dd0a
Revises: a3b9c2d4e5f6
Create Date: 2026-05-16 18:37:31.412015

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '51378e68dd0a'
down_revision: Union[str, Sequence[str], None] = 'a3b9c2d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


def upgrade() -> None:
    op.create_table(
        "user_password_reset_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token_hash", sa.String(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "is_used",
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
        "ix_user_password_reset_tokens_company_id",
        "user_password_reset_tokens",
        ["company_id"],
    )

    op.create_index(
        "ix_user_password_reset_tokens_user_id",
        "user_password_reset_tokens",
        ["user_id"],
    )

    op.create_index(
        "ix_user_password_reset_tokens_token_hash",
        "user_password_reset_tokens",
        ["token_hash"],
        unique=True,
    )

    op.create_index(
        "ix_user_password_reset_tokens_company_user",
        "user_password_reset_tokens",
        ["company_id", "user_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_user_password_reset_tokens_company_user",
        table_name="user_password_reset_tokens",
    )
    op.drop_index(
        "ix_user_password_reset_tokens_token_hash",
        table_name="user_password_reset_tokens",
    )
    op.drop_index(
        "ix_user_password_reset_tokens_user_id",
        table_name="user_password_reset_tokens",
    )
    op.drop_index(
        "ix_user_password_reset_tokens_company_id",
        table_name="user_password_reset_tokens",
    )
    op.drop_table("user_password_reset_tokens")