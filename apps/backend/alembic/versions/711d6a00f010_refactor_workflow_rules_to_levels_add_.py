"""refactor workflow rules to levels , add level_roles

Revision ID: 711d6a00f010
Revises: 1ebfec87ab5f
Create Date: 2026-02-26 11:46:45.560196

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '711d6a00f010'
down_revision: Union[str, Sequence[str], None] = '1ebfec87ab5f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
