"""update approval instance logic

Revision ID: 1e1258345b26
Revises: 192e23ecd3d3
Create Date: 2026-03-20 22:30:31.703901

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1e1258345b26'
down_revision: Union[str, Sequence[str], None] = '192e23ecd3d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create the ENUM type first
    approval_status_enum = sa.Enum(
        'PENDING', 'APPROVED', 'REJECTED',
        name='approvalstatus'
    )
    approval_status_enum.create(op.get_bind(), checkfirst=True)

    # 2. Alter column WITH explicit casting
    op.execute(
        "ALTER TABLE approval_instances "
        "ALTER COLUMN status TYPE approvalstatus "
        "USING status::approvalstatus"
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE approval_instances "
        "ALTER COLUMN status TYPE VARCHAR "
        "USING status::text"
    )

    # Optional: drop enum
    approval_status_enum = sa.Enum(
        'PENDING', 'APPROVED', 'REJECTED',
        name='approvalstatus'
    )
    approval_status_enum.drop(op.get_bind(), checkfirst=True)
