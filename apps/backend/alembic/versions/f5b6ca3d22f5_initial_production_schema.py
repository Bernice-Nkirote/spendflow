"""initial production schema

Revision ID: f5b6ca3d22f5
Revises:
Create Date: 2026-05-27 10:46:08.640576

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "f5b6ca3d22f5"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


entity_type_enum = postgresql.ENUM(
    "PR",
    "PO",
    "INVOICE",
    "PAYMENT",
    name="entitytypeenum",
    create_type=False,
)

approval_status_enum = postgresql.ENUM(
    "PENDING",
    "APPROVED",
    "REJECTED",
    name="approvalstatusenum",
    create_type=False,
)

action_type_enum = postgresql.ENUM(
    "APPROVED",
    "REJECTED",
    name="actiontypeenum",
    create_type=False,
)

pr_status_enum = postgresql.ENUM(
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "REJECTED",
    "CANCELLED",
    "CONVERTED_TO_PO",
    name="prstatusenum",
    create_type=False,
)

po_status_enum = postgresql.ENUM(
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "REJECTED",
    "SENT",
    "PARTIALLY_RECEIVED",
    "RECEIVED",
    "CANCELLED",
    name="postatusenum",
    create_type=False,
)

invoice_status_enum = postgresql.ENUM(
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "REJECTED",
    "SENT",
    "PARTIALLY_PAID",
    "PAID",
    "CANCELLED",
    name="invoicestatusenum",
    create_type=False,
)

email_status_enum = postgresql.ENUM(
    "SENT",
    "FAILED",
    "PENDING",
    name="emailstatusenum",
    create_type=False,
)

payment_method_enum = postgresql.ENUM(
    "BANK_TRANSFER",
    "MPESA",
    "CASH",
    name="paymentmethodenum",
    create_type=False,
)

payment_status_enum = postgresql.ENUM(
    "DRAFT",
    "PENDING_APPROVAL",
    "COMPLETED",
    "FAILED",
    "REJECTED",
    name="paymentstatusenum",
    create_type=False,
)


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()

    entity_type_enum.create(bind, checkfirst=True)
    approval_status_enum.create(bind, checkfirst=True)
    action_type_enum.create(bind, checkfirst=True)
    pr_status_enum.create(bind, checkfirst=True)
    po_status_enum.create(bind, checkfirst=True)
    invoice_status_enum.create(bind, checkfirst=True)
    email_status_enum.create(bind, checkfirst=True)
    payment_method_enum.create(bind, checkfirst=True)
    payment_status_enum.create(bind, checkfirst=True)

    op.create_table(
        "companies",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("currency", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_companies_name"),
    )
    op.create_index("ix_companies_name", "companies", ["name"], unique=False)

    op.create_table(
        "approval_workflows",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("entity_type", entity_type_enum, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "name", name="uq_workflow_name_per_company"),
    )
    op.create_index(
        "ix_approval_workflows_company_entity_type",
        "approval_workflows",
        ["company_id", "entity_type"],
        unique=False,
    )
    op.create_index(
        "ix_approval_workflows_company_id",
        "approval_workflows",
        ["company_id"],
        unique=False,
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("entity_type", sa.String(), nullable=False),
        sa.Column("entity_id", sa.UUID(), nullable=False),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("actor_user_id", sa.UUID(), nullable=True),
        sa.Column("actor_supplier_user_id", sa.UUID(), nullable=True),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("details_json", sa.JSON(), nullable=True),
        sa.Column("old_values_json", sa.JSON(), nullable=True),
        sa.Column("new_values_json", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_audit_logs_action"), "audit_logs", ["action"], unique=False)
    op.create_index(
        op.f("ix_audit_logs_actor_supplier_user_id"),
        "audit_logs",
        ["actor_supplier_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_audit_logs_actor_user_id"),
        "audit_logs",
        ["actor_user_id"],
        unique=False,
    )
    op.create_index(
        "ix_audit_logs_company_action",
        "audit_logs",
        ["company_id", "action"],
        unique=False,
    )
    op.create_index(
        "ix_audit_logs_company_created_at",
        "audit_logs",
        ["company_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_audit_logs_company_entity",
        "audit_logs",
        ["company_id", "entity_type", "entity_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_audit_logs_company_id"),
        "audit_logs",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_audit_logs_entity_id"), "audit_logs", ["entity_id"], unique=False
    )
    op.create_index(
        op.f("ix_audit_logs_entity_type"),
        "audit_logs",
        ["entity_type"],
        unique=False,
    )

    op.create_table(
        "departments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "name", name="uq_departments_company_name"),
    )
    op.create_index(
        op.f("ix_departments_company_id"),
        "departments",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_departments_company_id_name",
        "departments",
        ["company_id", "name"],
        unique=False,
    )

    op.create_table(
        "permissions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "name", name="uq_company_permission_name"),
    )
    op.create_index(
        op.f("ix_permissions_company_id"),
        "permissions",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_permissions_company_id_name",
        "permissions",
        ["company_id", "name"],
        unique=False,
    )

    op.create_table(
        "roles",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("is_system_role", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "name", name="uq_company_role_name"),
    )
    op.create_index(op.f("ix_roles_company_id"), "roles", ["company_id"], unique=False)
    op.create_index(
        "ix_roles_company_id_name",
        "roles",
        ["company_id", "name"],
        unique=False,
    )

    op.create_table(
        "suppliers",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("address", sa.String(), nullable=True),
        sa.Column("contact_person", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "name", name="uq_suppliers_company_name"),
    )
    op.create_index(
        op.f("ix_suppliers_company_id"), "suppliers", ["company_id"], unique=False
    )
    op.create_index(
        "ix_suppliers_company_id_name",
        "suppliers",
        ["company_id", "name"],
        unique=False,
    )
    op.create_index(op.f("ix_suppliers_email"), "suppliers", ["email"], unique=False)
    op.create_index(op.f("ix_suppliers_phone"), "suppliers", ["phone"], unique=False)

    op.create_table(
        "role_permissions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("role_id", sa.UUID(), nullable=False),
        sa.Column("permission_id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["permission_id"], ["permissions.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "company_id",
            "role_id",
            "permission_id",
            name="uq_company_role_permission",
        ),
    )
    op.create_index(
        op.f("ix_role_permissions_company_id"),
        "role_permissions",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_role_permissions_company_id_permission_id",
        "role_permissions",
        ["company_id", "permission_id"],
        unique=False,
    )
    op.create_index(
        "ix_role_permissions_company_id_role_id",
        "role_permissions",
        ["company_id", "role_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_role_permissions_permission_id"),
        "role_permissions",
        ["permission_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_role_permissions_role_id"),
        "role_permissions",
        ["role_id"],
        unique=False,
    )

    op.create_table(
        "supplier_users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("supplier_id", sa.UUID(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=True),
        sa.Column("password_setup_token", sa.String(), nullable=True),
        sa.Column("password_setup_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("has_completed_onboarding", sa.Boolean(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "supplier_id", "email", name="uq_supplier_users_supplier_email"
        ),
    )
    op.create_index(
        op.f("ix_supplier_users_email"),
        "supplier_users",
        ["email"],
        unique=False,
    )
    op.create_index(
        op.f("ix_supplier_users_password_setup_token"),
        "supplier_users",
        ["password_setup_token"],
        unique=False,
    )
    op.create_index(
        op.f("ix_supplier_users_supplier_id"),
        "supplier_users",
        ["supplier_id"],
        unique=False,
    )
    op.create_index(
        "ix_supplier_users_supplier_id_email",
        "supplier_users",
        ["supplier_id", "email"],
        unique=False,
    )

    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("department_id", sa.UUID(), nullable=True),
        sa.Column("role_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("phone_number", sa.String(), nullable=True),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("is_company_owner", sa.Boolean(), nullable=False),
        sa.Column("has_completed_onboarding", sa.Boolean(), nullable=False),
        sa.Column("onboarded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["department_id"], ["departments.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "email", name="uq_users_company_email"),
    )
    op.create_index(op.f("ix_users_company_id"), "users", ["company_id"], unique=False)
    op.create_index(
        "ix_users_company_id_department_id",
        "users",
        ["company_id", "department_id"],
        unique=False,
    )
    op.create_index(
        "ix_users_company_id_email",
        "users",
        ["company_id", "email"],
        unique=False,
    )
    op.create_index(
        "ix_users_company_id_role_id",
        "users",
        ["company_id", "role_id"],
        unique=False,
    )
    op.create_index(op.f("ix_users_department_id"), "users", ["department_id"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)
    op.create_index(op.f("ix_users_role_id"), "users", ["role_id"], unique=False)

    op.create_table(
        "workflow_levels",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("workflow_id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("level_order", sa.Integer(), nullable=False),
        sa.Column("min_amount", sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column("max_amount", sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column("department_id", sa.UUID(), nullable=False),
        sa.Column("condition_expression", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["department_id"], ["departments.id"]),
        sa.ForeignKeyConstraint(["workflow_id"], ["approval_workflows.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "workflow_id", "level_order", name="uq_workflow_level_level_order"
        ),
    )
    op.create_index(
        "ix_workflow_levels_company_id",
        "workflow_levels",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_workflow_levels_department_id",
        "workflow_levels",
        ["department_id"],
        unique=False,
    )
    op.create_index(
        "ix_workflow_levels_workflow_id",
        "workflow_levels",
        ["workflow_id"],
        unique=False,
    )
    op.create_index(
        "ix_workflow_levels_workflow_level_order",
        "workflow_levels",
        ["workflow_id", "level_order"],
        unique=False,
    )

    op.create_table(
        "approval_instances",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("workflow_id", sa.UUID(), nullable=False),
        sa.Column("entity_id", sa.UUID(), nullable=False),
        sa.Column("entity_type", entity_type_enum, nullable=False),
        sa.Column("current_level_id", sa.UUID(), nullable=True),
        sa.Column(
            "status",
            approval_status_enum,
            server_default="PENDING",
            nullable=False,
        ),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["current_level_id"], ["workflow_levels.id"]),
        sa.ForeignKeyConstraint(["workflow_id"], ["approval_workflows.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_approval_instances_company_entity",
        "approval_instances",
        ["company_id", "entity_id"],
        unique=False,
    )
    op.create_index(
        "idx_approval_instances_company_id",
        "approval_instances",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "idx_approval_instances_entity_id",
        "approval_instances",
        ["entity_id"],
        unique=False,
    )
    op.create_index(
        "idx_approval_instances_workflow_id",
        "approval_instances",
        ["workflow_id"],
        unique=False,
    )

    op.create_table(
        "exchange_rates",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("from_currency", sa.String(length=3), nullable=False),
        sa.Column("to_currency", sa.String(length=3), nullable=False),
        sa.Column("rate", sa.Numeric(precision=18, scale=6), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("effective_date", sa.Date(), nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "company_id",
            "from_currency",
            "to_currency",
            "effective_date",
            name="uq_exchange_rate_company_currency_date",
        ),
    )
    op.create_index(
        op.f("ix_exchange_rates_company_id"),
        "exchange_rates",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_exchange_rates_company_pair_date",
        "exchange_rates",
        ["company_id", "from_currency", "to_currency", "effective_date"],
        unique=False,
    )
    op.create_index(
        op.f("ix_exchange_rates_created_by"),
        "exchange_rates",
        ["created_by"],
        unique=False,
    )

    op.create_table(
        "purchase_requisitions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("pr_number", sa.String(), nullable=False),
        sa.Column("department_id", sa.UUID(), nullable=True),
        sa.Column("requested_by", sa.UUID(), nullable=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("total_amount", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("currency", sa.String(), nullable=False),
        sa.Column("exchange_rate", sa.Numeric(precision=18, scale=6), nullable=True),
        sa.Column("base_currency", sa.String(length=3), nullable=True),
        sa.Column("base_amount", sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column("exchange_rate_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", pr_status_enum, server_default="DRAFT", nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["department_id"], ["departments.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(["requested_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "pr_number", name="uq_pr_company_pr_number"),
    )
    op.create_index(
        "ix_pr_company_id_department_id",
        "purchase_requisitions",
        ["company_id", "department_id"],
        unique=False,
    )
    op.create_index(
        "ix_pr_company_id_pr_number",
        "purchase_requisitions",
        ["company_id", "pr_number"],
        unique=False,
    )
    op.create_index(
        "ix_pr_company_id_requested_by",
        "purchase_requisitions",
        ["company_id", "requested_by"],
        unique=False,
    )
    op.create_index(
        "ix_pr_company_id_status",
        "purchase_requisitions",
        ["company_id", "status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_purchase_requisitions_company_id"),
        "purchase_requisitions",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_purchase_requisitions_department_id"),
        "purchase_requisitions",
        ["department_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_purchase_requisitions_requested_by"),
        "purchase_requisitions",
        ["requested_by"],
        unique=False,
    )
    op.create_index(
        op.f("ix_purchase_requisitions_status"),
        "purchase_requisitions",
        ["status"],
        unique=False,
    )

    op.create_table(
        "report_export_logs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("report_type", sa.String(), nullable=False),
        sa.Column("export_format", sa.String(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_report_export_logs_company_id"),
        "report_export_logs",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_report_export_logs_user_id"),
        "report_export_logs",
        ["user_id"],
        unique=False,
    )

    op.create_table(
        "supplier_password_reset_tokens",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("supplier_id", sa.UUID(), nullable=False),
        sa.Column("supplier_user_id", sa.UUID(), nullable=False),
        sa.Column("token_hash", sa.String(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_used", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["supplier_user_id"], ["supplier_users.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_supplier_password_reset_tokens_company_id"),
        "supplier_password_reset_tokens",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_supplier_password_reset_tokens_company_supplier_user",
        "supplier_password_reset_tokens",
        ["company_id", "supplier_id", "supplier_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_supplier_password_reset_tokens_supplier_id"),
        "supplier_password_reset_tokens",
        ["supplier_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_supplier_password_reset_tokens_supplier_user_id"),
        "supplier_password_reset_tokens",
        ["supplier_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_supplier_password_reset_tokens_token_hash"),
        "supplier_password_reset_tokens",
        ["token_hash"],
        unique=True,
    )

    op.create_table(
        "supplier_refresh_tokens",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("supplier_id", sa.UUID(), nullable=False),
        sa.Column("supplier_user_id", sa.UUID(), nullable=False),
        sa.Column("token_hash", sa.String(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_revoked", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["supplier_user_id"], ["supplier_users.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_supplier_refresh_tokens_supplier_id"),
        "supplier_refresh_tokens",
        ["supplier_id"],
        unique=False,
    )
    op.create_index(
        "ix_supplier_refresh_tokens_supplier_user",
        "supplier_refresh_tokens",
        ["supplier_id", "supplier_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_supplier_refresh_tokens_supplier_user_id"),
        "supplier_refresh_tokens",
        ["supplier_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_supplier_refresh_tokens_token_hash"),
        "supplier_refresh_tokens",
        ["token_hash"],
        unique=True,
    )

    op.create_table(
        "user_onboarding_tokens",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("token_hash", sa.String(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_used", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_user_onboarding_tokens_company_id"),
        "user_onboarding_tokens",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_user_onboarding_tokens_company_user",
        "user_onboarding_tokens",
        ["company_id", "user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_user_onboarding_tokens_token_hash"),
        "user_onboarding_tokens",
        ["token_hash"],
        unique=True,
    )
    op.create_index(
        op.f("ix_user_onboarding_tokens_user_id"),
        "user_onboarding_tokens",
        ["user_id"],
        unique=False,
    )

    op.create_table(
        "user_password_reset_tokens",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("token_hash", sa.String(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_used", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_user_password_reset_tokens_company_id"),
        "user_password_reset_tokens",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_user_password_reset_tokens_company_user",
        "user_password_reset_tokens",
        ["company_id", "user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_user_password_reset_tokens_token_hash"),
        "user_password_reset_tokens",
        ["token_hash"],
        unique=True,
    )
    op.create_index(
        op.f("ix_user_password_reset_tokens_user_id"),
        "user_password_reset_tokens",
        ["user_id"],
        unique=False,
    )

    op.create_table(
        "user_refresh_tokens",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("token_hash", sa.String(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_revoked", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_user_refresh_tokens_company_id"),
        "user_refresh_tokens",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_user_refresh_tokens_company_user",
        "user_refresh_tokens",
        ["company_id", "user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_user_refresh_tokens_token_hash"),
        "user_refresh_tokens",
        ["token_hash"],
        unique=True,
    )
    op.create_index(
        op.f("ix_user_refresh_tokens_user_id"),
        "user_refresh_tokens",
        ["user_id"],
        unique=False,
    )

    op.create_table(
        "workflow_level_roles",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("level_id", sa.UUID(), nullable=False),
        sa.Column("role_id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["level_id"], ["workflow_levels.id"]),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("level_id", "role_id", name="uq_workflow_level_roles"),
    )
    op.create_index(
        "ix_workflow_level_roles_company_id",
        "workflow_level_roles",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_workflow_level_roles_level_id",
        "workflow_level_roles",
        ["level_id"],
        unique=False,
    )
    op.create_index(
        "ix_workflow_level_roles_role_id",
        "workflow_level_roles",
        ["role_id"],
        unique=False,
    )

    op.create_table(
        "approval_actions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("instance_id", sa.UUID(), nullable=False),
        sa.Column("level_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("action", action_type_enum, nullable=False),
        sa.Column("comment", sa.String(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["instance_id"], ["approval_instances.id"]),
        sa.ForeignKeyConstraint(["level_id"], ["workflow_levels.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("instance_id", "level_id", "user_id", name="uq_user_level_action"),
    )
    op.create_index(
        "ix_approval_actions_company_id",
        "approval_actions",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_approval_actions_instance_id",
        "approval_actions",
        ["instance_id"],
        unique=False,
    )
    op.create_index(
        "ix_approval_actions_level_id",
        "approval_actions",
        ["level_id"],
        unique=False,
    )
    op.create_index(
        "ix_approval_actions_user_id",
        "approval_actions",
        ["user_id"],
        unique=False,
    )

    op.create_table(
        "purchase_orders",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("po_number", sa.String(), nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=False),
        sa.Column("submitted_by", sa.UUID(), nullable=True),
        sa.Column("issued_by", sa.UUID(), nullable=True),
        sa.Column("purchase_requisition_id", sa.UUID(), nullable=True),
        sa.Column("supplier_id", sa.UUID(), nullable=False),
        sa.Column("department_id", sa.UUID(), nullable=True),
        sa.Column("status", po_status_enum, server_default="DRAFT", nullable=False),
        sa.Column("total_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("currency", sa.String(), server_default="KES", nullable=False),
        sa.Column("exchange_rate", sa.Numeric(precision=18, scale=6), nullable=True),
        sa.Column("base_currency", sa.String(length=3), nullable=True),
        sa.Column("base_amount", sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column("exchange_rate_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("signed_pdf_file_path", sa.String(), nullable=True),
        sa.Column("signed_pdf_original_filename", sa.String(), nullable=True),
        sa.Column("signed_pdf_uploaded_by", sa.UUID(), nullable=True),
        sa.Column("signed_pdf_uploaded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["department_id"], ["departments.id"]),
        sa.ForeignKeyConstraint(["issued_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["purchase_requisition_id"], ["purchase_requisitions.id"]),
        sa.ForeignKeyConstraint(["signed_pdf_uploaded_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["submitted_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "po_number", name="uq_po_company_po_number"),
    )
    op.create_index(
        "ix_po_company_id_po_number",
        "purchase_orders",
        ["company_id", "po_number"],
        unique=False,
    )
    op.create_index(
        "ix_po_company_id_status",
        "purchase_orders",
        ["company_id", "status"],
        unique=False,
    )
    op.create_index(
        "ix_purchase_orders_company_id",
        "purchase_orders",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_purchase_orders_created_by",
        "purchase_orders",
        ["created_by"],
        unique=False,
    )
    op.create_index(
        "ix_purchase_orders_department_id",
        "purchase_orders",
        ["department_id"],
        unique=False,
    )
    op.create_index(
        "ix_purchase_orders_issued_by",
        "purchase_orders",
        ["issued_by"],
        unique=False,
    )
    op.create_index(
        "ix_purchase_orders_purchase_requisition_id",
        "purchase_orders",
        ["purchase_requisition_id"],
        unique=False,
    )
    op.create_index(
        "ix_purchase_orders_submitted_by",
        "purchase_orders",
        ["submitted_by"],
        unique=False,
    )
    op.create_index(
        "ix_purchase_orders_supplier_id",
        "purchase_orders",
        ["supplier_id"],
        unique=False,
    )

    op.create_table(
        "purchase_requisition_items",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("requisition_id", sa.UUID(), nullable=False),
        sa.Column("item_name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=False),
        sa.Column("quantity", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("unit_price", sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column("line_total", sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["requisition_id"], ["purchase_requisitions.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_pr_item_company_id_requisition_id",
        "purchase_requisition_items",
        ["company_id", "requisition_id"],
        unique=False,
    )
    op.create_index(
        "ix_pr_item_item_name",
        "purchase_requisition_items",
        ["item_name"],
        unique=False,
    )
    op.create_index(
        op.f("ix_purchase_requisition_items_company_id"),
        "purchase_requisition_items",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_purchase_requisition_items_requisition_id"),
        "purchase_requisition_items",
        ["requisition_id"],
        unique=False,
    )

    op.create_table(
        "invoices",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("purchase_order_id", sa.UUID(), nullable=True),
        sa.Column("supplier_id", sa.UUID(), nullable=False),
        sa.Column("submitted_by_user_id", sa.UUID(), nullable=True),
        sa.Column("submitted_by_supplier_user_id", sa.UUID(), nullable=True),
        sa.Column("invoice_number", sa.String(), nullable=False),
        sa.Column("total_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=3), server_default="KES", nullable=False),
        sa.Column("exchange_rate", sa.Numeric(precision=18, scale=6), nullable=True),
        sa.Column("base_currency", sa.String(length=3), nullable=True),
        sa.Column("base_amount", sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column("exchange_rate_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", invoice_status_enum, server_default="DRAFT", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            """
            (
                submitted_by_user_id IS NOT NULL
                AND submitted_by_supplier_user_id IS NULL
            )
            OR
            (
                submitted_by_user_id IS NULL
                AND submitted_by_supplier_user_id IS NOT NULL
            )
            """,
            name="ck_invoice_only_one_submitter",
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["purchase_order_id"], ["purchase_orders.id"]),
        sa.ForeignKeyConstraint(["submitted_by_supplier_user_id"], ["supplier_users.id"]),
        sa.ForeignKeyConstraint(["submitted_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "company_id",
            "invoice_number",
            name="uq_invoices_company_invoice_number",
        ),
    )
    op.create_index(op.f("ix_invoices_company_id"), "invoices", ["company_id"], unique=False)
    op.create_index(
        "ix_invoices_company_po",
        "invoices",
        ["company_id", "purchase_order_id"],
        unique=False,
    )
    op.create_index(
        "ix_invoices_company_supplier",
        "invoices",
        ["company_id", "supplier_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_invoices_purchase_order_id"),
        "invoices",
        ["purchase_order_id"],
        unique=False,
    )
    op.create_index(op.f("ix_invoices_status"), "invoices", ["status"], unique=False)
    op.create_index(
        op.f("ix_invoices_submitted_by_supplier_user_id"),
        "invoices",
        ["submitted_by_supplier_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_invoices_submitted_by_user_id"),
        "invoices",
        ["submitted_by_user_id"],
        unique=False,
    )
    op.create_index(op.f("ix_invoices_supplier_id"), "invoices", ["supplier_id"], unique=False)

    op.create_table(
        "po_email_logs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("purchase_order_id", sa.UUID(), nullable=False),
        sa.Column("supplier_id", sa.UUID(), nullable=False),
        sa.Column("recipient_email", sa.String(), nullable=False),
        sa.Column("subject", sa.String(), nullable=False),
        sa.Column("status", email_status_enum, server_default="SENT", nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("sent_by", sa.UUID(), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["purchase_order_id"], ["purchase_orders.id"]),
        sa.ForeignKeyConstraint(["sent_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_po_email_logs_company_id",
        "po_email_logs",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_po_email_logs_purchase_order_id",
        "po_email_logs",
        ["purchase_order_id"],
        unique=False,
    )
    op.create_index(
        "ix_po_email_logs_sent_by",
        "po_email_logs",
        ["sent_by"],
        unique=False,
    )
    op.create_index(
        "ix_po_email_logs_status",
        "po_email_logs",
        ["status"],
        unique=False,
    )
    op.create_index(
        "ix_po_email_logs_supplier_id",
        "po_email_logs",
        ["supplier_id"],
        unique=False,
    )

    op.create_table(
        "purchase_order_items",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("purchase_order_id", sa.UUID(), nullable=False),
        sa.Column("item_name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("quantity", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("unit_price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("total_price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["purchase_order_id"], ["purchase_orders.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_purchase_order_items_company_id",
        "purchase_order_items",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_purchase_order_items_item_name",
        "purchase_order_items",
        ["item_name"],
        unique=False,
    )
    op.create_index(
        "ix_purchase_order_items_purchase_order_id",
        "purchase_order_items",
        ["purchase_order_id"],
        unique=False,
    )

    op.create_table(
        "invoice_line_items",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("invoice_id", sa.UUID(), nullable=False),
        sa.Column("purchase_order_item_id", sa.UUID(), nullable=False),
        sa.Column("description", sa.String(), nullable=False),
        sa.Column("invoiced_quantity", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("unit_price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("total_price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"]),
        sa.ForeignKeyConstraint(["purchase_order_item_id"], ["purchase_order_items.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_invoice_line_items_company_id"),
        "invoice_line_items",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_invoice_line_items_company_invoice",
        "invoice_line_items",
        ["company_id", "invoice_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_invoice_line_items_invoice_id"),
        "invoice_line_items",
        ["invoice_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_invoice_line_items_purchase_order_item_id"),
        "invoice_line_items",
        ["purchase_order_item_id"],
        unique=False,
    )

    op.create_table(
        "payments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("invoice_id", sa.UUID(), nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=3), server_default="KES", nullable=False),
        sa.Column("exchange_rate", sa.Numeric(precision=18, scale=6), nullable=True),
        sa.Column("base_currency", sa.String(length=3), nullable=True),
        sa.Column("base_amount", sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column("exchange_rate_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("payment_method", payment_method_enum, nullable=False),
        sa.Column("status", payment_status_enum, server_default="DRAFT", nullable=False),
        sa.Column("reference", sa.String(), nullable=True),
        sa.Column(
            "paid_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_payments_company_id"), "payments", ["company_id"], unique=False)
    op.create_index(
        "ix_payments_company_invoice",
        "payments",
        ["company_id", "invoice_id"],
        unique=False,
    )
    op.create_index(op.f("ix_payments_created_by"), "payments", ["created_by"], unique=False)
    op.create_index(op.f("ix_payments_invoice_id"), "payments", ["invoice_id"], unique=False)
    op.create_index(
        op.f("ix_payments_payment_method"),
        "payments",
        ["payment_method"],
        unique=False,
    )
    op.create_index(op.f("ix_payments_reference"), "payments", ["reference"], unique=False)
    op.create_index(op.f("ix_payments_status"), "payments", ["status"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_payments_status"), table_name="payments")
    op.drop_index(op.f("ix_payments_reference"), table_name="payments")
    op.drop_index(op.f("ix_payments_payment_method"), table_name="payments")
    op.drop_index(op.f("ix_payments_invoice_id"), table_name="payments")
    op.drop_index(op.f("ix_payments_created_by"), table_name="payments")
    op.drop_index("ix_payments_company_invoice", table_name="payments")
    op.drop_index(op.f("ix_payments_company_id"), table_name="payments")
    op.drop_table("payments")

    op.drop_index(
        op.f("ix_invoice_line_items_purchase_order_item_id"),
        table_name="invoice_line_items",
    )
    op.drop_index(op.f("ix_invoice_line_items_invoice_id"), table_name="invoice_line_items")
    op.drop_index("ix_invoice_line_items_company_invoice", table_name="invoice_line_items")
    op.drop_index(op.f("ix_invoice_line_items_company_id"), table_name="invoice_line_items")
    op.drop_table("invoice_line_items")

    op.drop_index("ix_purchase_order_items_purchase_order_id", table_name="purchase_order_items")
    op.drop_index("ix_purchase_order_items_item_name", table_name="purchase_order_items")
    op.drop_index("ix_purchase_order_items_company_id", table_name="purchase_order_items")
    op.drop_table("purchase_order_items")

    op.drop_index("ix_po_email_logs_supplier_id", table_name="po_email_logs")
    op.drop_index("ix_po_email_logs_status", table_name="po_email_logs")
    op.drop_index("ix_po_email_logs_sent_by", table_name="po_email_logs")
    op.drop_index("ix_po_email_logs_purchase_order_id", table_name="po_email_logs")
    op.drop_index("ix_po_email_logs_company_id", table_name="po_email_logs")
    op.drop_table("po_email_logs")

    op.drop_index(op.f("ix_invoices_supplier_id"), table_name="invoices")
    op.drop_index(op.f("ix_invoices_submitted_by_user_id"), table_name="invoices")
    op.drop_index(op.f("ix_invoices_submitted_by_supplier_user_id"), table_name="invoices")
    op.drop_index(op.f("ix_invoices_status"), table_name="invoices")
    op.drop_index(op.f("ix_invoices_purchase_order_id"), table_name="invoices")
    op.drop_index("ix_invoices_company_supplier", table_name="invoices")
    op.drop_index("ix_invoices_company_po", table_name="invoices")
    op.drop_index(op.f("ix_invoices_company_id"), table_name="invoices")
    op.drop_table("invoices")

    op.drop_index(
        op.f("ix_purchase_requisition_items_requisition_id"),
        table_name="purchase_requisition_items",
    )
    op.drop_index(
        op.f("ix_purchase_requisition_items_company_id"),
        table_name="purchase_requisition_items",
    )
    op.drop_index("ix_pr_item_item_name", table_name="purchase_requisition_items")
    op.drop_index(
        "ix_pr_item_company_id_requisition_id",
        table_name="purchase_requisition_items",
    )
    op.drop_table("purchase_requisition_items")

    op.drop_index("ix_purchase_orders_supplier_id", table_name="purchase_orders")
    op.drop_index("ix_purchase_orders_submitted_by", table_name="purchase_orders")
    op.drop_index("ix_purchase_orders_purchase_requisition_id", table_name="purchase_orders")
    op.drop_index("ix_purchase_orders_issued_by", table_name="purchase_orders")
    op.drop_index("ix_purchase_orders_department_id", table_name="purchase_orders")
    op.drop_index("ix_purchase_orders_created_by", table_name="purchase_orders")
    op.drop_index("ix_purchase_orders_company_id", table_name="purchase_orders")
    op.drop_index("ix_po_company_id_status", table_name="purchase_orders")
    op.drop_index("ix_po_company_id_po_number", table_name="purchase_orders")
    op.drop_table("purchase_orders")

    op.drop_index("ix_approval_actions_user_id", table_name="approval_actions")
    op.drop_index("ix_approval_actions_level_id", table_name="approval_actions")
    op.drop_index("ix_approval_actions_instance_id", table_name="approval_actions")
    op.drop_index("ix_approval_actions_company_id", table_name="approval_actions")
    op.drop_table("approval_actions")

    op.drop_index("ix_workflow_level_roles_role_id", table_name="workflow_level_roles")
    op.drop_index("ix_workflow_level_roles_level_id", table_name="workflow_level_roles")
    op.drop_index("ix_workflow_level_roles_company_id", table_name="workflow_level_roles")
    op.drop_table("workflow_level_roles")

    op.drop_index(op.f("ix_user_refresh_tokens_user_id"), table_name="user_refresh_tokens")
    op.drop_index(op.f("ix_user_refresh_tokens_token_hash"), table_name="user_refresh_tokens")
    op.drop_index("ix_user_refresh_tokens_company_user", table_name="user_refresh_tokens")
    op.drop_index(op.f("ix_user_refresh_tokens_company_id"), table_name="user_refresh_tokens")
    op.drop_table("user_refresh_tokens")

    op.drop_index(op.f("ix_user_password_reset_tokens_user_id"), table_name="user_password_reset_tokens")
    op.drop_index(
        op.f("ix_user_password_reset_tokens_token_hash"),
        table_name="user_password_reset_tokens",
    )
    op.drop_index(
        "ix_user_password_reset_tokens_company_user",
        table_name="user_password_reset_tokens",
    )
    op.drop_index(
        op.f("ix_user_password_reset_tokens_company_id"),
        table_name="user_password_reset_tokens",
    )
    op.drop_table("user_password_reset_tokens")

    op.drop_index(op.f("ix_user_onboarding_tokens_user_id"), table_name="user_onboarding_tokens")
    op.drop_index(
        op.f("ix_user_onboarding_tokens_token_hash"),
        table_name="user_onboarding_tokens",
    )
    op.drop_index(
        "ix_user_onboarding_tokens_company_user",
        table_name="user_onboarding_tokens",
    )
    op.drop_index(
        op.f("ix_user_onboarding_tokens_company_id"),
        table_name="user_onboarding_tokens",
    )
    op.drop_table("user_onboarding_tokens")

    op.drop_index(
        op.f("ix_supplier_refresh_tokens_token_hash"),
        table_name="supplier_refresh_tokens",
    )
    op.drop_index(
        op.f("ix_supplier_refresh_tokens_supplier_user_id"),
        table_name="supplier_refresh_tokens",
    )
    op.drop_index(
        "ix_supplier_refresh_tokens_supplier_user",
        table_name="supplier_refresh_tokens",
    )
    op.drop_index(
        op.f("ix_supplier_refresh_tokens_supplier_id"),
        table_name="supplier_refresh_tokens",
    )
    op.drop_table("supplier_refresh_tokens")

    op.drop_index(
        op.f("ix_supplier_password_reset_tokens_token_hash"),
        table_name="supplier_password_reset_tokens",
    )
    op.drop_index(
        op.f("ix_supplier_password_reset_tokens_supplier_user_id"),
        table_name="supplier_password_reset_tokens",
    )
    op.drop_index(
        op.f("ix_supplier_password_reset_tokens_supplier_id"),
        table_name="supplier_password_reset_tokens",
    )
    op.drop_index(
        "ix_supplier_password_reset_tokens_company_supplier_user",
        table_name="supplier_password_reset_tokens",
    )
    op.drop_index(
        op.f("ix_supplier_password_reset_tokens_company_id"),
        table_name="supplier_password_reset_tokens",
    )
    op.drop_table("supplier_password_reset_tokens")

    op.drop_index(op.f("ix_report_export_logs_user_id"), table_name="report_export_logs")
    op.drop_index(op.f("ix_report_export_logs_company_id"), table_name="report_export_logs")
    op.drop_table("report_export_logs")

    op.drop_index(op.f("ix_purchase_requisitions_status"), table_name="purchase_requisitions")
    op.drop_index(op.f("ix_purchase_requisitions_requested_by"), table_name="purchase_requisitions")
    op.drop_index(op.f("ix_purchase_requisitions_department_id"), table_name="purchase_requisitions")
    op.drop_index(op.f("ix_purchase_requisitions_company_id"), table_name="purchase_requisitions")
    op.drop_index("ix_pr_company_id_status", table_name="purchase_requisitions")
    op.drop_index("ix_pr_company_id_requested_by", table_name="purchase_requisitions")
    op.drop_index("ix_pr_company_id_pr_number", table_name="purchase_requisitions")
    op.drop_index("ix_pr_company_id_department_id", table_name="purchase_requisitions")
    op.drop_table("purchase_requisitions")

    op.drop_index(op.f("ix_exchange_rates_created_by"), table_name="exchange_rates")
    op.drop_index("ix_exchange_rates_company_pair_date", table_name="exchange_rates")
    op.drop_index(op.f("ix_exchange_rates_company_id"), table_name="exchange_rates")
    op.drop_table("exchange_rates")

    op.drop_index("idx_approval_instances_workflow_id", table_name="approval_instances")
    op.drop_index("idx_approval_instances_entity_id", table_name="approval_instances")
    op.drop_index("idx_approval_instances_company_id", table_name="approval_instances")
    op.drop_index("idx_approval_instances_company_entity", table_name="approval_instances")
    op.drop_table("approval_instances")

    op.drop_index("ix_workflow_levels_workflow_level_order", table_name="workflow_levels")
    op.drop_index("ix_workflow_levels_workflow_id", table_name="workflow_levels")
    op.drop_index("ix_workflow_levels_department_id", table_name="workflow_levels")
    op.drop_index("ix_workflow_levels_company_id", table_name="workflow_levels")
    op.drop_table("workflow_levels")

    op.drop_index(op.f("ix_users_role_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_department_id"), table_name="users")
    op.drop_index("ix_users_company_id_role_id", table_name="users")
    op.drop_index("ix_users_company_id_email", table_name="users")
    op.drop_index("ix_users_company_id_department_id", table_name="users")
    op.drop_index(op.f("ix_users_company_id"), table_name="users")
    op.drop_table("users")

    op.drop_index("ix_supplier_users_supplier_id_email", table_name="supplier_users")
    op.drop_index(op.f("ix_supplier_users_supplier_id"), table_name="supplier_users")
    op.drop_index(op.f("ix_supplier_users_password_setup_token"), table_name="supplier_users")
    op.drop_index(op.f("ix_supplier_users_email"), table_name="supplier_users")
    op.drop_table("supplier_users")

    op.drop_index(op.f("ix_role_permissions_role_id"), table_name="role_permissions")
    op.drop_index(op.f("ix_role_permissions_permission_id"), table_name="role_permissions")
    op.drop_index("ix_role_permissions_company_id_role_id", table_name="role_permissions")
    op.drop_index("ix_role_permissions_company_id_permission_id", table_name="role_permissions")
    op.drop_index(op.f("ix_role_permissions_company_id"), table_name="role_permissions")
    op.drop_table("role_permissions")

    op.drop_index(op.f("ix_suppliers_phone"), table_name="suppliers")
    op.drop_index(op.f("ix_suppliers_email"), table_name="suppliers")
    op.drop_index("ix_suppliers_company_id_name", table_name="suppliers")
    op.drop_index(op.f("ix_suppliers_company_id"), table_name="suppliers")
    op.drop_table("suppliers")

    op.drop_index("ix_roles_company_id_name", table_name="roles")
    op.drop_index(op.f("ix_roles_company_id"), table_name="roles")
    op.drop_table("roles")

    op.drop_index("ix_permissions_company_id_name", table_name="permissions")
    op.drop_index(op.f("ix_permissions_company_id"), table_name="permissions")
    op.drop_table("permissions")

    op.drop_index("ix_departments_company_id_name", table_name="departments")
    op.drop_index(op.f("ix_departments_company_id"), table_name="departments")
    op.drop_table("departments")

    op.drop_index(op.f("ix_audit_logs_entity_type"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_entity_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_company_id"), table_name="audit_logs")
    op.drop_index("ix_audit_logs_company_entity", table_name="audit_logs")
    op.drop_index("ix_audit_logs_company_created_at", table_name="audit_logs")
    op.drop_index("ix_audit_logs_company_action", table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_actor_user_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_actor_supplier_user_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_action"), table_name="audit_logs")
    op.drop_table("audit_logs")

    op.drop_index("ix_approval_workflows_company_id", table_name="approval_workflows")
    op.drop_index("ix_approval_workflows_company_entity_type", table_name="approval_workflows")
    op.drop_table("approval_workflows")

    op.drop_index("ix_companies_name", table_name="companies")
    op.drop_table("companies")

    bind = op.get_bind()

    payment_status_enum.drop(bind, checkfirst=True)
    payment_method_enum.drop(bind, checkfirst=True)
    email_status_enum.drop(bind, checkfirst=True)
    invoice_status_enum.drop(bind, checkfirst=True)
    po_status_enum.drop(bind, checkfirst=True)
    pr_status_enum.drop(bind, checkfirst=True)
    action_type_enum.drop(bind, checkfirst=True)
    approval_status_enum.drop(bind, checkfirst=True)
    entity_type_enum.drop(bind, checkfirst=True)