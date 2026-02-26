"""refactor workflow rules

Revision ID: dc84444f46ba
Revises: 711d6a00f010
Create Date: 2026-02-26 12:09:18.274734

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

revision = 'dc84444f46ba'
down_revision = '711d6a00f010'
branch_labels = None
depends_on = None

def upgrade():
    # 1️⃣ Create workflow_levels table
    op.create_table(
        'workflow_levels',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('workflow_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('level_order', sa.Integer(), nullable=False),
        sa.Column('min_amount', sa.Numeric(14, 2), nullable=True),
        sa.Column('max_amount', sa.Numeric(14, 2), nullable=True),
        sa.Column('department_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('condition_expression', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id']),
        sa.ForeignKeyConstraint(['workflow_id'], ['approval_workflows.id']),
        sa.UniqueConstraint('workflow_id', 'level_order', name='uq_workflow_levels_level_order')
    )

    # 2️⃣ Create workflow_level_roles table
    op.create_table(
        'workflow_level_roles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('level_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(['level_id'], ['workflow_levels.id']),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id']),
        sa.UniqueConstraint('level_id', 'role_id', name='uq_workflow_level_roles')
    )

    # 3️⃣ Drop old table safely if it exists
    conn = op.get_bind()
    result = conn.execute(sa.text("SELECT tablename FROM pg_tables WHERE schemaname='public';"))
    tables = [r[0] for r in result.fetchall()]
    if 'approval_workflow_rules' in tables:
        op.drop_table('approval_workflow_rules')


def downgrade():
    # 1️⃣ Recreate old table
    op.create_table(
        'approval_workflow_rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('workflow_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('level_order', sa.Integer(), nullable=False),
        sa.Column('min_amount', sa.Numeric(14, 2), nullable=True),
        sa.Column('max_amount', sa.Numeric(14, 2), nullable=True),
        sa.Column('department_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('condition_expression', sa.JSON(), nullable=True),
        sa.Column('role_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id']),
        sa.ForeignKeyConstraint(['workflow_id'], ['approval_workflows.id']),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id']),
        sa.UniqueConstraint('workflow_id', 'level_order', name='uq_workflow_level')
    )

    # 2️⃣ Drop new tables
    op.drop_table('workflow_level_roles')
    op.drop_table('workflow_levels')