from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission


DEFAULT_PERMISSIONS = [
    # Purchase Requisitions
    "pr.create",
    "pr.view",
    "pr.update",
    "pr.submit",
    "pr.cancel",
    "pr.approve",
    "pr.reject",
    "pr.convert_to_po",

    # Purchase Orders
    "po.create",
    "po.view",
    "po.update",
    "po.submit",
    "po.cancel",
    "po.approve",
    "po.reject",
    "po.dispatch",

    # Invoices
    "invoice.create",
    "invoice.view",
    "invoice.update",
    "invoice.submit",
    "invoice.approve",
    "invoice.reject",
    "invoice.cancel",

    # Payments
    "payment.create",
    "payment.view",
    "payment.update",
    "payment.submit",
    "payment.approve",
    "payment.reject",
    "payment.cancel",

    # Reports
    "reports.payments.view",
    "reports.payments.export",
    "reports.invoices.view",
    "reports.invoices.export",
    "reports.outstanding_invoices.view",
    "reports.outstanding_invoices.export",
    "reports.supplier_spend.view",
    "reports.supplier_spend.export",
    "reports.supplier_lead_time.view",
    "reports.supplier_lead_time.export",
    "reports.pr.view",
    "reports.pr.export",
    "reports.po.view",
    "reports.po.export",

    # Audit Logs
    "audit_logs.view",
]


ROLE_PERMISSION_MAP = {
    "Admin": DEFAULT_PERMISSIONS,

    "Procurement": [
        "pr.create",
        "pr.view",
        "pr.update",
        "pr.submit",
        "pr.cancel",
        "pr.convert_to_po",

        "po.create",
        "po.view",
        "po.update",
        "po.submit",
        "po.cancel",
        "po.dispatch",

        "invoice.view",

        "reports.pr.view",
        "reports.pr.export",
        "reports.po.view",
        "reports.po.export",
        "reports.supplier_spend.view",
        "reports.supplier_spend.export",
        "reports.supplier_lead_time.view",
        "reports.supplier_lead_time.export",
    ],

    "Finance": [
        "invoice.create",
        "invoice.view",
        "invoice.update",
        "invoice.submit",
        "invoice.cancel",

        "payment.create",
        "payment.view",
        "payment.update",
        "payment.submit",
        "payment.cancel",

        "reports.payments.view",
        "reports.payments.export",
        "reports.invoices.view",
        "reports.invoices.export",
        "reports.outstanding_invoices.view",
        "reports.outstanding_invoices.export",
        "reports.supplier_spend.view",
        "reports.supplier_spend.export",
        "reports.supplier_lead_time.view",
        "reports.supplier_lead_time.export",
    ],

    "Approver": [
        "pr.view",
        "pr.approve",
        "pr.reject",

        "po.view",
        "po.approve",
        "po.reject",

        "invoice.view",
        "invoice.approve",
        "invoice.reject",

        "payment.view",
        "payment.approve",
        "payment.reject",

        "reports.pr.view",
        "reports.po.view",
        "reports.invoices.view",
    ],
}


def seed_permissions_for_company(company_id, db):
    permission_by_name = {}

    unique_default_permissions = list(dict.fromkeys(DEFAULT_PERMISSIONS))

    for permission_name in unique_default_permissions:
        permission = (
            db.query(Permission)
            .filter(
                Permission.company_id == company_id,
                Permission.name == permission_name,
            )
            .first()
        )

        if not permission:
            permission = Permission(
                company_id=company_id,
                name=permission_name,
                description=permission_name.replace(".", " ").title(),
                is_active=True,
            )
            db.add(permission)
            db.flush()

        permission_by_name[permission_name] = permission

    for role_name, permission_names in ROLE_PERMISSION_MAP.items():
        role = (
            db.query(Role)
            .filter(
                Role.company_id == company_id,
                Role.name == role_name,
            )
            .first()
        )

        if not role:
            continue

        unique_permission_names = list(dict.fromkeys(permission_names))

        for permission_name in unique_permission_names:
            permission = permission_by_name.get(permission_name)

            if not permission:
                continue

            existing_assignment = (
                db.query(RolePermission)
                .filter(
                    RolePermission.company_id == company_id,
                    RolePermission.role_id == role.id,
                    RolePermission.permission_id == permission.id,
                )
                .first()
            )

            if existing_assignment:
                continue

            role_permission = RolePermission(
                company_id=company_id,
                role_id=role.id,
                permission_id=permission.id,
            )

            db.add(role_permission)

    db.flush()