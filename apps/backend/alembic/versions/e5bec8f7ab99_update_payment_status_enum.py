"""update payment status enum

Revision ID: e5bec8f7ab99
Revises: 83b98ebc4aa3
Create Date: 2026-05-13 16:28:09.500026

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5bec8f7ab99'
down_revision: Union[str, Sequence[str], None] = '83b98ebc4aa3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE paymentstatusenum ADD VALUE IF NOT EXISTS 'DRAFT'")
    op.execute(
        "ALTER TYPE paymentstatusenum ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL'"
    )


def downgrade() -> None:
    """Downgrade schema."""
    pass