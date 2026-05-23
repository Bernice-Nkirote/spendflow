"""add supplier password reset tokens

Revision ID: a8764009c660
Revises: 51378e68dd0a
Create Date: 2026-05-18 11:13:37.776041

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql



# revision identifiers, used by Alembic.
revision: str = 'a8764009c660'
down_revision: Union[str, Sequence[str], None] = '51378e68dd0a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "supplier_password_reset_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("supplier_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("supplier_user_id", postgresql.UUID(as_uuid=True), nullable=False),
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
        sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["supplier_user_id"],
            ["supplier_users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_supplier_password_reset_tokens_company_id",
        "supplier_password_reset_tokens",
        ["company_id"],
    )

    op.create_index(
        "ix_supplier_password_reset_tokens_supplier_id",
        "supplier_password_reset_tokens",
        ["supplier_id"],
    )

    op.create_index(
        "ix_supplier_password_reset_tokens_supplier_user_id",
        "supplier_password_reset_tokens",
        ["supplier_user_id"],
    )

    op.create_index(
        "ix_supplier_password_reset_tokens_token_hash",
        "supplier_password_reset_tokens",
        ["token_hash"],
        unique=True,
    )

    op.create_index(
        "ix_supplier_password_reset_tokens_company_supplier_user",
        "supplier_password_reset_tokens",
        ["company_id", "supplier_id", "supplier_user_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_supplier_password_reset_tokens_company_supplier_user",
        table_name="supplier_password_reset_tokens",
    )
    op.drop_index(
        "ix_supplier_password_reset_tokens_token_hash",
        table_name="supplier_password_reset_tokens",
    )
    op.drop_index(
        "ix_supplier_password_reset_tokens_supplier_user_id",
        table_name="supplier_password_reset_tokens",
    )
    op.drop_index(
        "ix_supplier_password_reset_tokens_supplier_id",
        table_name="supplier_password_reset_tokens",
    )
    op.drop_index(
        "ix_supplier_password_reset_tokens_company_id",
        table_name="supplier_password_reset_tokens",
    )
    op.drop_table("supplier_password_reset_tokens")