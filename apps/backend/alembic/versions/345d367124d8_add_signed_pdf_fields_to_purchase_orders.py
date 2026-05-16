"""add signed pdf fields to purchase orders

Revision ID: 345d367124d8
Revises: e5bec8f7ab99
Create Date: 2026-05-14 11:46:29.694211

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "345d367124d8"
down_revision: Union[str, Sequence[str], None] = "e5bec8f7ab99"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("purchase_orders", sa.Column("signed_pdf_file_path", sa.String(), nullable=True))
    op.add_column("purchase_orders", sa.Column("signed_pdf_original_filename", sa.String(), nullable=True))
    op.add_column("purchase_orders", sa.Column("signed_pdf_uploaded_by", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("purchase_orders", sa.Column("signed_pdf_uploaded_at", sa.DateTime(timezone=True), nullable=True))

    op.create_foreign_key(
        "fk_purchase_orders_signed_pdf_uploaded_by_users",
        "purchase_orders",
        "users",
        ["signed_pdf_uploaded_by"],
        ["id"],
    )

    op.create_index(
        "ix_purchase_orders_signed_pdf_uploaded_by",
        "purchase_orders",
        ["signed_pdf_uploaded_by"],
    )


def downgrade() -> None:
    op.drop_index("ix_purchase_orders_signed_pdf_uploaded_by", table_name="purchase_orders")

    op.drop_constraint(
        "fk_purchase_orders_signed_pdf_uploaded_by_users",
        "purchase_orders",
        type_="foreignkey",
    )

    op.drop_column("purchase_orders", "signed_pdf_uploaded_at")
    op.drop_column("purchase_orders", "signed_pdf_uploaded_by")
    op.drop_column("purchase_orders", "signed_pdf_original_filename")
    op.drop_column("purchase_orders", "signed_pdf_file_path")