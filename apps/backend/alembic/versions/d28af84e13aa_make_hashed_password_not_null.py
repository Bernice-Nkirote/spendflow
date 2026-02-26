"""make hashed_password not null

Revision ID: d28af84e13aa
Revises: 6eb08ded0c66
Create Date: 2026-02-26 16:09:50.153070

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd28af84e13aa'
down_revision: Union[str, Sequence[str], None] = '6eb08ded0c66'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
   op.alter_column(
       "users",
       "hashed_password",
       existing_type=sa.String(),
       nullable=False
   )


def downgrade() -> None:
    op.alter_column(
        "users",
        "hashed_password",
        existing_type=sa.String(),
        nullable=True
    )
