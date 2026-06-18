from uuid import NAMESPACE_URL, UUID, uuid5

from app.models.role import Role
from app.models.user import User
from app.repositories.global_search_repository import GlobalSearchRepository
from app.repositories.role_repository import RoleRepository
from app.schemas.global_search_schema import GlobalSearchItem, GlobalSearchResponse
from app.services.permission_service import PermissionService
from app.utils.value_helper.enum_utils import enum_value


REPORT_SEARCH_DEFINITIONS = [
    {
        "label": "PR Report",
        "value": "purchase-requisitions",
        "permission": "reports.pr.view",
        "description": "Purchase requisition reporting and exports.",
    },
    {
        "label": "PO Report",
        "value": "purchase-orders",
        "permission": "reports.po.view",
        "description": "Purchase order reporting and exports.",
    },
    {
        "label": "Invoice Report",
        "value": "invoices",
        "permission": "reports.invoices.view",
        "description": "Invoice reporting and exports.",
    },
    {
        "label": "Outstanding Invoice",
        "value": "outstanding-invoices",
        "permission": "reports.outstanding_invoices.view",
        "description": "Outstanding invoice balances and follow-up.",
    },
    {
        "label": "Payment Report",
        "value": "payments",
        "permission": "reports.payments.view",
        "description": "Payment reporting and exports.",
    },
    {
        "label": "Supplier Spend",
        "value": "supplier-spend",
        "permission": "reports.supplier_spend.view",
        "description": "Supplier spend by supplier, category, and period.",
    },
    {
        "label": "Supplier Lead Time",
        "value": "supplier-lead-time",
        "permission": "reports.supplier_lead_time.view",
        "description": "Supplier delivery and lead-time performance.",
    },
]


class GlobalSearchService:
    def __init__(
        self,
        repo: GlobalSearchRepository,
        permission_service: PermissionService,
        role_repo: RoleRepository,
    ):
        self.repo = repo
        self.permission_service = permission_service
        self.role_repo = role_repo

    def _has_permission(
        self,
        current_user: User,
        permission_name: str,
    ) -> bool:
        if current_user.is_company_owner:
            return True

        return self.permission_service.role_has_permission(
            role_id=current_user.role_id,
            permission_name=permission_name,
            company_id=current_user.company_id,
        )

    def _is_admin_user(self, current_user: User) -> bool:
        if current_user.is_company_owner:
            return True

        role: Role | None = self.role_repo.get_by_id(
            role_id=current_user.role_id,
            company_id=current_user.company_id,
        )

        return bool(role and role.name.strip().lower() == "admin")

    def _static_entity_id(self, key: str) -> UUID:
        return uuid5(NAMESPACE_URL, f"tendaflow:global-search:{key}")

    def _query_matches(self, query: str, *values: str | None) -> bool:
        normalized_query = query.strip().lower()

        return any(
            normalized_query in value.strip().lower()
            for value in values
            if value
        )

    def search(
        self,
        current_user: User,
        query: str,
        limit: int = 5,
    ) -> GlobalSearchResponse:
        normalized_query = query.strip()

        if len(normalized_query) < 2:
            return GlobalSearchResponse(
                purchase_requisitions=[],
                purchase_orders=[],
                invoices=[],
                payments=[],
                suppliers=[],
                users=[],
                roles=[],
                departments=[],
                permissions=[],
                audit_logs=[],
                exchange_rates=[],
                reports=[],
            )

        company_id = current_user.company_id

        purchase_requisitions: list[GlobalSearchItem] = []
        purchase_orders: list[GlobalSearchItem] = []
        invoices: list[GlobalSearchItem] = []
        payments: list[GlobalSearchItem] = []
        suppliers: list[GlobalSearchItem] = []
        users: list[GlobalSearchItem] = []
        roles: list[GlobalSearchItem] = []
        departments: list[GlobalSearchItem] = []
        permissions: list[GlobalSearchItem] = []
        audit_logs: list[GlobalSearchItem] = []
        exchange_rates: list[GlobalSearchItem] = []
        reports: list[GlobalSearchItem] = []

        if self._has_permission(current_user, "pr.view"):
            purchase_requisitions = [
                GlobalSearchItem(
                    entity_type="purchase_requisition",
                    entity_id=item.id,
                    title=item.pr_number,
                    subtitle=item.title,
                    reference=item.pr_number,
                    status=enum_value(item.status),
                    route=f"/purchase-requisitions/{item.id}",
                    created_at=item.created_at,
                )
                for item in self.repo.search_purchase_requisitions(
                    company_id=company_id,
                    query=normalized_query,
                    limit=limit,
                )
            ]

        if self._has_permission(current_user, "po.view"):
            purchase_orders = [
                GlobalSearchItem(
                    entity_type="purchase_order",
                    entity_id=item.id,
                    title=item.po_number,
                    subtitle=item.supplier.name if item.supplier else None,
                    reference=item.po_number,
                    status=enum_value(item.status),
                    route=f"/purchase-orders/{item.id}",
                    created_at=item.created_at,
                )
                for item in self.repo.search_purchase_orders(
                    company_id=company_id,
                    query=normalized_query,
                    limit=limit,
                )
            ]

        if self._has_permission(current_user, "invoice.view"):
            invoices = [
                GlobalSearchItem(
                    entity_type="invoice",
                    entity_id=item.id,
                    title=item.invoice_number,
                    subtitle=item.supplier.name if item.supplier else None,
                    reference=item.invoice_number,
                    status=enum_value(item.status),
                    route=f"/invoices/{item.id}",
                    created_at=item.created_at,
                )
                for item in self.repo.search_invoices(
                    company_id=company_id,
                    query=normalized_query,
                    limit=limit,
                )
            ]

        if self._has_permission(current_user, "payment.view"):
            payments = [
                GlobalSearchItem(
                    entity_type="payment",
                    entity_id=item.id,
                    title=item.reference or "Payment",
                    subtitle=(
                        item.invoice.invoice_number
                        if item.invoice
                        else None
                    ),
                    reference=item.reference,
                    status=enum_value(item.status),
                    route=f"/payments/{item.id}",
                    created_at=item.created_at,
                )
                for item in self.repo.search_payments(
                    company_id=company_id,
                    query=normalized_query,
                    limit=limit,
                )
            ]

        if self._has_permission(current_user, "suppliers.view"):
            suppliers = [
                GlobalSearchItem(
                    entity_type="supplier",
                    entity_id=item.id,
                    title=item.name,
                    subtitle=item.email or item.contact_person,
                    reference=item.name,
                    status="ACTIVE" if item.is_active else "INACTIVE",
                    route=f"/suppliers/{item.id}",
                    created_at=item.created_at,
                )
                for item in self.repo.search_suppliers(
                    company_id=company_id,
                    query=normalized_query,
                    limit=limit,
                )
            ]

        if self._has_permission(current_user, "exchange_rates.view"):
            exchange_rates = [
                GlobalSearchItem(
                    entity_type="exchange_rate",
                    entity_id=item.id,
                    title=f"{item.from_currency} to {item.to_currency}",
                    subtitle=f"Rate {item.rate} effective {item.effective_date}",
                    reference=f"{item.from_currency}/{item.to_currency}",
                    status=item.source,
                    route="/exchange-rates",
                    created_at=item.created_at,
                )
                for item in self.repo.search_exchange_rates(
                    company_id=company_id,
                    query=normalized_query,
                    limit=limit,
                )
            ]

        reports = [
            GlobalSearchItem(
                entity_type="report",
                entity_id=self._static_entity_id(f"report:{report['value']}"),
                title=report["label"],
                subtitle=report["description"],
                reference=report["value"],
                status="Report",
                route=f"/reports?report={report['value']}",
                created_at=None,
            )
            for report in REPORT_SEARCH_DEFINITIONS
            if self._has_permission(current_user, report["permission"])
            and self._query_matches(
                normalized_query,
                report["label"],
                report["value"],
                report["description"],
                "report",
                "reports",
            )
        ][:limit]

        if self._is_admin_user(current_user):
            users = [
                GlobalSearchItem(
                    entity_type="user",
                    entity_id=item.id,
                    title=item.name,
                    subtitle=item.email,
                    reference=item.email,
                    status="ACTIVE" if item.is_active else "INACTIVE",
                    route="/users",
                    created_at=item.created_at,
                )
                for item in self.repo.search_users(
                    company_id=company_id,
                    query=normalized_query,
                    limit=limit,
                )
            ]

            roles = [
                GlobalSearchItem(
                    entity_type="role",
                    entity_id=item.id,
                    title=item.name,
                    subtitle=item.description,
                    reference=item.name,
                    status="ACTIVE" if item.is_active else "INACTIVE",
                    route="/roles",
                    created_at=item.created_at,
                )
                for item in self.repo.search_roles(
                    company_id=company_id,
                    query=normalized_query,
                    limit=limit,
                )
            ]

            departments = [
                GlobalSearchItem(
                    entity_type="department",
                    entity_id=item.id,
                    title=item.name,
                    subtitle="Department",
                    reference=item.name,
                    status="ACTIVE" if item.is_active else "INACTIVE",
                    route="/departments",
                    created_at=item.created_at,
                )
                for item in self.repo.search_departments(
                    company_id=company_id,
                    query=normalized_query,
                    limit=limit,
                )
            ]

            permissions = [
                GlobalSearchItem(
                    entity_type="permission",
                    entity_id=item.id,
                    title=item.name,
                    subtitle=item.description,
                    reference=item.name,
                    status="ACTIVE" if item.is_active else "INACTIVE",
                    route="/permissions",
                    created_at=item.created_at,
                )
                for item in self.repo.search_permissions(
                    company_id=company_id,
                    query=normalized_query,
                    limit=limit,
                )
            ]

        if self._has_permission(current_user, "audit_logs.view"):
            audit_logs = [
                GlobalSearchItem(
                    entity_type="audit_log",
                    entity_id=item.id,
                    title=item.description or item.action,
                    subtitle=f"{item.entity_type} - {item.action}",
                    reference=str(item.entity_id),
                    status=item.action,
                    route="/audit-logs",
                    created_at=item.created_at,
                )
                for item in self.repo.search_audit_logs(
                    company_id=company_id,
                    query=normalized_query,
                    limit=limit,
                )
            ]

        return GlobalSearchResponse(
            purchase_requisitions=purchase_requisitions,
            purchase_orders=purchase_orders,
            invoices=invoices,
            payments=payments,
            suppliers=suppliers,
            users=users,
            roles=roles,
            departments=departments,
            permissions=permissions,
            audit_logs=audit_logs,
            exchange_rates=exchange_rates,
            reports=reports,
        )
