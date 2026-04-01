"""add supplier user, update invoices, fix enums

Revision ID: 9475ffab1616
Revises: 76a2d037ce01
Create Date: 2026-03-26 10:27:52.436369
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '9475ffab1616'
down_revision: Union[str, Sequence[str], None] = '76a2d037ce01'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Create ENUM type first ---
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoicestatusenum') THEN
                CREATE TYPE invoicestatusenum AS ENUM ('PENDING', 'PAID', 'PARTIALLY PAID', 'CANCELLED');
            END IF;
        END$$;
    """)

    # --- Add new columns to invoices ---
    op.add_column('invoices', sa.Column('supplier_id', sa.UUID(), nullable=False))
    op.add_column('invoices', sa.Column('submitted_by_user_id', sa.UUID(), nullable=True))
    op.add_column('invoices', sa.Column('submitted_by_supplier_id', sa.UUID(), nullable=True))
    op.add_column('invoices', sa.Column('total_amount', sa.Numeric(12,2), nullable=False))
    op.add_column('invoices', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False))

    # --- Safely alter status column to use ENUM ---
    op.execute("""
        ALTER TABLE invoices 
        ALTER COLUMN status 
        TYPE invoicestatusenum 
        USING status::text::invoicestatusenum
    """)
    op.execute("ALTER TABLE invoices ALTER COLUMN status SET DEFAULT 'PENDING'")
    op.alter_column('invoices', 'status', nullable=False)

    # --- Alter created_at type ---
    op.alter_column('invoices', 'created_at',
                    existing_type=postgresql.TIMESTAMP(),
                    type_=sa.DateTime(timezone=True),
                    nullable=False)

    # --- Create foreign keys ---
    op.create_foreign_key(None, 'invoices', 'companies', ['company_id'], ['id'])
    op.create_foreign_key(None, 'invoices', 'suppliers', ['supplier_id'], ['id'])
    op.create_foreign_key(None, 'invoices', 'users', ['submitted_by_user_id'], ['id'])
    op.create_foreign_key(None, 'invoices', 'suppliers', ['submitted_by_supplier_id'], ['id'])

    # --- Drop old column ---
    op.drop_column('invoices', 'amount')

    # --- Create supplier_users table ---
    op.create_table(
        'supplier_users',
        sa.Column('id', sa.UUID(), primary_key=True, default=sa.text("gen_random_uuid()")),
        sa.Column('supplier_id', sa.UUID(), sa.ForeignKey('suppliers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    )

    # --- Create Invoice_line_items table ---
    op.create_table(
        'Invoice_line_items',
        sa.Column('id', sa.UUID(), primary_key=True, default=sa.text("gen_random_uuid()")),
        sa.Column('invoice_id', sa.UUID(), sa.ForeignKey('invoices.id'), nullable=False),
        sa.Column('purchase_order_item_id', sa.UUID(), sa.ForeignKey('purchase_order_items.id'), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('invoiced_quantity', sa.Numeric(12, 2), nullable=False),
        sa.Column('unit_price', sa.Numeric(12, 2), nullable=False),
        sa.Column('total_price', sa.Numeric(12, 2), nullable=False),
    )


def downgrade() -> None:
    # --- Add old amount column back ---
    op.add_column('invoices', sa.Column('amount', sa.NUMERIC(12, 2), nullable=False))

    # --- Drop new foreign keys ---
    op.drop_constraint(None, 'invoices', type_='foreignkey')
    op.drop_constraint(None, 'invoices', type_='foreignkey')
    op.drop_constraint(None, 'invoices', type_='foreignkey')
    op.drop_constraint(None, 'invoices', type_='foreignkey')

    # --- Revert created_at type ---
    op.alter_column('invoices', 'created_at',
                    existing_type=sa.DateTime(timezone=True),
                    type_=postgresql.TIMESTAMP(),
                    nullable=True)

    # --- Revert ENUM to VARCHAR ---
    op.execute("ALTER TABLE invoices ALTER COLUMN status TYPE VARCHAR USING status::text")
    op.alter_column('invoices', 'status', nullable=True)

    op.drop_column('invoices', 'updated_at')
    op.drop_column('invoices', 'total_amount')
    op.drop_column('invoices', 'submitted_by_supplier_id')
    op.drop_column('invoices', 'submitted_by_user_id')
    op.drop_column('invoices', 'supplier_id')

    op.drop_table('Invoice_line_items')
    op.drop_table('supplier_users')

    # --- Drop ENUM type ---
    op.execute("DROP TYPE IF EXISTS invoicestatusenum")