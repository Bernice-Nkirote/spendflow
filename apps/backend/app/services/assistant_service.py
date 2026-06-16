from uuid import UUID

from fastapi import HTTPException, status

from app.repositories.assistant_repository import AssistantRepository
from app.schemas.assistant_schema import (
    AssistantChatRequest,
    AssistantChatResponse,
    AssistantSupplierSuggestion,
    SupplierSuggestionRequest,
)


class AssistantService:
    GUIDE_TOPICS = {
        "setup": {
            "keywords": ("setup", "configure", "start", "getting started", "company", "business type", "first time"),
            "answer": (
                "Recommended setup order: confirm company and business type, add departments, configure roles and permissions, set approval workflows, add exchange rates if you use multiple currencies, add suppliers with categories, then start procurement with PRs and POs."
            ),
            "steps": [
                "Open Departments and add the teams that raise or approve requests.",
                "Open Roles and Permissions to decide who can view, create, update, approve, and export.",
                "Open Approval Workflows and configure levels for PR, PO, invoice, and payment approvals.",
                "Add Exchange Rates if you buy in foreign currencies.",
                "Add Suppliers with category, contact, location, and import data where possible.",
            ],
        },
        "purchase requisitions": {
            "keywords": ("purchase requisition", "requisition", "create pr", "draft pr", " pr "),
            "answer": (
                "To draft a PR, open Purchase Requisitions, click Create PR, enter the title, department, business reason, items, quantities, estimated unit prices, currency, and exchange rate if needed. Save the draft, review totals, then submit for approval. The assistant can help draft wording and check missing fields, but the user must submit it."
            ),
            "steps": [
                "Go to Purchase Requisitions.",
                "Click Create PR.",
                "Add department, reason, items, quantities, unit prices, and currency.",
                "Review totals, save, then submit for approval.",
            ],
        },
        "purchase orders": {
            "keywords": ("purchase order", "create po", " po ", "order supplier"),
            "answer": (
                "To create a PO, open Purchase Orders and click Create PO, or open an approved PR and choose Create PO from PR. Select a supplier, confirm item quantities, pricing, currency, department, and notes, then save or submit through the approval workflow. For supplier suggestions, ask with item names or a supplier category."
            ),
            "steps": [
                "Use Create PO from an approved PR where possible.",
                "Choose a supplier and review the supplier preview.",
                "Confirm items, pricing, totals, currency, department, and notes.",
                "Submit for approval only after the user reviews the PO.",
            ],
        },
        "suppliers": {
            "keywords": ("supplier", "suppliers", "vendor", "category", "source", "rfq", "add supplier", "import supplier", "supplier import"),
            "answer": (
                "Suppliers store vendor contact details, category, sub-category, location, and supply history. To add suppliers, open Suppliers, use the form for one supplier, or use Import Excel for many suppliers. Include clear headers such as name, email, phone, address, contact_person, category, and sub_category. Use categories such as Technology, Electronics, Building Materials, Catering Services, or a custom category. The More view shows contact details and recent supplied items, which helps users choose suppliers for PRs and POs."
            ),
            "steps": [
                "Go to Suppliers.",
                "Click Add Supplier for one supplier, or Import Excel for bulk upload.",
                "Include name, email, phone, address, contact person, category, and sub-category where possible.",
                "Use More to review supplier profile and supply history.",
                "Ask the assistant for supplier suggestions using item names or category.",
            ],
        },
        "departments": {
            "keywords": ("department", "departments", "create department", "add department", "team", "teams"),
            "answer": (
                "Departments organise procurement by team, branch, or cost centre. To create one, open Departments, add the department name and required details, then save. Users and procurement records can then be linked to departments, which helps approvals, reporting, and accountability."
            ),
            "steps": [
                "Open Departments.",
                "Click the add or create department action.",
                "Enter the department name clearly.",
                "Save, then use the department when creating users, PRs, POs, and reports.",
            ],
        },
        "roles": {
            "keywords": ("role", "roles", "create role", "add role", "assign role", "user role"),
            "answer": (
                "Roles group users by responsibility, such as Admin, Requester, Procurement Officer, Finance, or Approver. Create roles first, then assign permissions to those roles, then assign users to the right role. This keeps access controlled without editing every user one by one."
            ),
            "steps": [
                "Open Roles.",
                "Create a role that matches the user's job responsibility.",
                "Open Permissions and assign only the actions the role needs.",
                "Assign users to the role and test their access.",
            ],
        },
        "invoices": {
            "keywords": ("invoice", "invoices", "bill", "supplier invoice"),
            "answer": (
                "To create or review an invoice, open Invoices, click Create Invoice, select the supplier and linked PO where applicable, then verify invoice number, item descriptions, quantities, unit prices, totals, currency, and dates. To approve an invoice, a user with invoice approver permissions signs in, opens Tasks or Approvals, reviews the invoice, then approves or rejects manually."
            ),
            "steps": [
                "Open Invoices and create or view the invoice.",
                "Match invoice details against the PO and supplied items.",
                "Submit for approval if the invoice is ready.",
                "The authorised approver signs in and approves from Tasks or Approvals.",
            ],
        },
        "payments": {
            "keywords": ("payment", "payments", "pay", "paid", "record payment"),
            "answer": (
                "To record a payment, open an approved invoice, choose the payment action, enter the amount, payment method, reference, currency, and date, then review the outstanding balance before saving. Payment creation and approval remain controlled by permissions and workflow."
            ),
            "steps": [
                "Open the approved invoice.",
                "Create payment from the invoice page.",
                "Confirm amount, method, reference, currency, date, and remaining balance.",
                "Save or submit only after user review.",
            ],
        },
        "approvals": {
            "keywords": ("approve", "approval", "approvals", "reject", "task", "tasks", "task icon", "notification", "notification bell", "bell"),
            "answer": (
                "Approvals are handled by authorised users only. A user with the correct approver permissions signs in, watches the Tasks icon for pending approval tasks, and checks the notification bell for approval alerts. They can also open Approvals directly, review the PR, PO, invoice, or payment, check budget, supplier, totals, attachments, and workflow level, then approve or reject manually. The assistant can explain what to check but cannot approve or reject."
            ),
            "steps": [
                "Check the Tasks icon for pending work.",
                "Check the notification bell for approval alerts.",
                "Open Tasks, Approvals, or the notification item.",
                "Open the pending approval record.",
                "Review details, totals, supplier, requester, and workflow level.",
                "Approve or reject manually as the authorised user.",
            ],
        },
        "approval workflows": {
            "keywords": ("approval workflow", "approval workflows", "workflow", "levels", "approval level"),
            "answer": (
                "Approval Workflows define who must approve each record type and in what order. Admins configure levels for PRs, POs, invoices, and payments, then assign approver roles to each level. Sole proprietorships can use single-person workflows; partnerships and companies can use multiple levels for separation of duties."
            ),
            "steps": [
                "Open Approval Workflows.",
                "Choose the workflow for PR, PO, invoice, or payment.",
                "Add approval levels in the order they should happen.",
                "Assign the correct approver roles to each level.",
                "Test with a sample record before relying on the workflow.",
            ],
        },
        "permissions": {
            "keywords": ("permission", "permissions", "assign permission", "access control"),
            "answer": (
                "Permissions control what each role can view, create, update, approve, export, or administer. Assigning permissions to a role gives users in that role access to those actions. For example, pr.create lets a user create PRs, while pr.approve lets them approve PRs if they are part of the workflow."
            ),
            "steps": [
                "Open Roles to manage role names and assign users.",
                "Open Permissions to assign allowed actions to roles.",
                "Give each role only the access needed for that job.",
                "Test with a real user account before using the workflow in production.",
            ],
        },
        "exchange rates": {
            "keywords": ("exchange", "exchange rate", "currency", "foreign currency", "rate"),
            "answer": (
                "Exchange Rates help Tendaflow convert foreign-currency PRs, POs, invoices, and payments into the base currency for reporting. Before creating records in another currency, add or update the exchange rate, confirm the rate date, then review base-currency totals in reports."
            ),
            "steps": [
                "Open Exchange Rates.",
                "Add or update the currency rate and effective date.",
                "Use that currency on PR, PO, invoice, or payment records.",
                "Review base-currency totals in Reports.",
            ],
        },
        "audit logs": {
            "keywords": ("audit", "audit log", "audit logs", "logs", "history", "trace"),
            "answer": (
                "Audit Logs show important user actions for accountability: who did what, when, and on which record. Use them to verify setup changes, supplier updates, approvals, report exports, or suspicious activity. Audit logs are for traceability and review, not editing business records."
            ),
            "steps": [
                "Open Audit Logs.",
                "Filter by user, action, record, or date where available.",
                "Use the log to support investigations, audits, and dissertation evidence.",
            ],
        },
        "reports": {
            "keywords": ("report", "reports", "spend", "supplier spend", "lead time"),
            "answer": (
                "Reports help users review procurement activity, totals, outstanding invoices, payments, supplier spend, and supplier lead time. Use filters such as date, status, supplier, department, payment method, or supplier category, then export CSV or Excel for management review, audit support, or dissertation evidence."
            ),
            "steps": [
                "Open Reports.",
                "Choose the report tab.",
                "Apply filters and review the summary cards.",
                "Export CSV or Excel if needed.",
            ],
        },
        "supplier portal": {
            "keywords": ("supplier portal", "portal", "supplier login"),
            "answer": (
                "The Supplier Portal lets external suppliers sign in separately to view their POs, create invoices from eligible POs, and track invoice or payment status. Internal users manage suppliers and procurement records from the main Tendaflow workspace."
            ),
            "steps": [
                "Create or invite supplier users where supported.",
                "Supplier signs in through the supplier login.",
                "Supplier views POs and creates invoices from the portal.",
                "Internal users review submitted invoices in the main workspace.",
            ],
        },
        "user guide": {
            "keywords": ("user guide", "guide", "manual", "help page", "documentation", "how to use"),
            "answer": (
                "The user guide should become a dedicated in-app Help area covering setup, departments, roles, permissions, approval workflows, suppliers, PRs, POs, invoices, payments, exchange rates, reports, audit logs, tasks, notifications, and the supplier portal. The assistant can answer quick questions now, and the guide should provide structured step-by-step reference pages."
            ),
            "steps": [
                "Create a Help or User Guide page in the main navigation.",
                "Group guide content by Setup, Procurement, Approvals, Finance, Reporting, and Supplier Portal.",
                "Add short steps, screenshots later, and common mistakes for each area.",
                "Link assistant answers to the relevant guide sections in a later enhancement.",
            ],
        },
    }

    def __init__(
        self,
        repo: AssistantRepository,
        permission_service=None,
    ):
        self.repo = repo
        self.permission_service = permission_service

    def _role_has_permission(
        self,
        role_id: UUID,
        company_id: UUID,
        permission_name: str,
    ) -> bool:
        if self.permission_service is None:
            return False

        return self.permission_service.role_has_permission(
            role_id=role_id,
            permission_name=permission_name,
            company_id=company_id,
        )

    def _require_permission(
        self,
        role_id: UUID,
        company_id: UUID,
        permission_name: str,
        error_message: str,
    ) -> None:
        if not self._role_has_permission(role_id, company_id, permission_name):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_message,
            )

    def chat(
        self,
        request: AssistantChatRequest,
        company_id: UUID,
        actor_role_id: UUID,
    ) -> AssistantChatResponse:
        message = f" {request.message.strip()} "
        requested_supplier_help = self._mentions_supplier_help(
            message=message,
            item_names=request.item_names,
            category=request.category,
        )

        supplier_suggestions: list[AssistantSupplierSuggestion] = []
        if requested_supplier_help and self._role_has_permission(
            actor_role_id,
            company_id,
            "suppliers.view",
        ):
            supplier_suggestions = self.suggest_suppliers(
                request=SupplierSuggestionRequest(
                    item_names=request.item_names or self._extract_item_hints(message),
                    category=request.category,
                    limit=5,
                ),
                company_id=company_id,
                actor_role_id=actor_role_id,
            )

        return AssistantChatResponse(
            answer=self._build_guidance(message),
            cautions=[
                "I can suggest, draft, and explain, but I will not submit, approve, reject, issue, or record payments for you.",
                "Review supplier recommendations and document details before taking action.",
            ],
            suggested_next_steps=self._build_next_steps(message, supplier_suggestions),
            supplier_suggestions=supplier_suggestions,
        )

    def suggest_suppliers(
        self,
        request: SupplierSuggestionRequest,
        company_id: UUID,
        actor_role_id: UUID,
    ) -> list[AssistantSupplierSuggestion]:
        self._require_permission(
            role_id=actor_role_id,
            company_id=company_id,
            permission_name="suppliers.view",
            error_message="You do not have permission to view supplier suggestions.",
        )

        search_terms = self._normalise_terms(request.item_names)
        category = request.category.strip().lower() if request.category else None
        candidates = self.repo.get_supplier_candidates(company_id=company_id)
        suggestions: list[AssistantSupplierSuggestion] = []

        for candidate in candidates:
            recent_items = self.repo.get_recent_supplied_item_names(
                supplier_id=candidate.supplier_id,
                company_id=company_id,
                limit=6,
            )
            score, reasons = self._score_supplier(
                candidate,
                recent_items,
                search_terms,
                category,
            )

            if score <= 0 and (search_terms or category):
                continue

            suggestions.append(
                AssistantSupplierSuggestion(
                    supplier_id=candidate.supplier_id,
                    supplier_name=candidate.supplier_name,
                    category=candidate.category,
                    sub_category=candidate.sub_category,
                    contact_person=candidate.contact_person,
                    email=candidate.email,
                    phone=candidate.phone,
                    location=candidate.location,
                    recent_supplied_items=recent_items,
                    po_count=int(candidate.po_count or 0),
                    total_order_value=float(candidate.total_order_value or 0),
                    score=score,
                    reasons=reasons or ["Active supplier available for review."],
                )
            )

        suggestions.sort(
            key=lambda item: (item.score, item.po_count, item.total_order_value),
            reverse=True,
        )
        return suggestions[: request.limit]

    def _score_supplier(
        self,
        candidate,
        recent_items: list[str],
        search_terms: list[str],
        category: str | None,
    ) -> tuple[int, list[str]]:
        score = 0
        reasons: list[str] = []
        supplier_category = (candidate.category or "").lower()
        supplier_sub_category = (candidate.sub_category or "").lower()
        item_text = " ".join(recent_items).lower()

        if category and (
            category in supplier_category
            or category in supplier_sub_category
        ):
            score += 40
            reasons.append("Category matches the requested supplier type.")

        matched_terms = [
            term
            for term in search_terms
            if term in supplier_category
            or term in supplier_sub_category
            or term in item_text
            or term in (candidate.supplier_name or "").lower()
        ]
        if matched_terms:
            score += min(45, len(set(matched_terms)) * 15)
            reasons.append("Past supply history or profile matches requested items.")

        po_count = int(candidate.po_count or 0)
        if po_count > 0:
            score += min(20, po_count * 4)
            reasons.append("Has previous purchase order history.")

        if candidate.email or candidate.phone:
            score += 8
            reasons.append("Contact details are available.")

        if candidate.location:
            score += 5
            reasons.append("Location is recorded for follow-up.")

        return score, reasons

    def _mentions_supplier_help(
        self,
        message: str,
        item_names: list[str],
        category: str | None,
    ) -> bool:
        lower_message = message.lower()
        supplier_words = ("supplier", "vendor", "source", "quote", "rfq")
        return bool(item_names or category or any(word in lower_message for word in supplier_words))

    def _normalise_terms(self, values: list[str]) -> list[str]:
        terms: list[str] = []
        for value in values:
            for term in value.lower().replace(",", " ").split():
                cleaned = term.strip()
                if len(cleaned) >= 3:
                    terms.append(cleaned)
        return terms

    def _extract_item_hints(self, message: str) -> list[str]:
        stop_words = {
            "supplier",
            "suppliers",
            "vendor",
            "vendors",
            "recommend",
            "suggest",
            "create",
            "need",
            "for",
            "the",
            "and",
            "with",
            "from",
        }
        return [
            word
            for word in self._normalise_terms([message])
            if word not in stop_words
        ][:10]

    def _build_guidance(self, message: str) -> str:
        topic = self._match_topic(message)
        if topic:
            return topic["answer"]

        return (
            "I can guide users across Tendaflow setup, suppliers, PRs, POs, invoices, payments, approvals, approval workflows, permissions, exchange rates, reports, audit logs, and the supplier portal. Ask about a specific task, for example: How do I create a PR? How do I approve an invoice? Suggest suppliers for catering services."
        )

    def _build_next_steps(
        self,
        message: str,
        supplier_suggestions: list[AssistantSupplierSuggestion],
    ) -> list[str]:
        topic = self._match_topic(message)
        steps = list(topic["steps"]) if topic else [
            "Ask about a specific area such as PRs, POs, invoices, payments, suppliers, approvals, workflows, permissions, exchange rates, reports, audit logs, or supplier portal.",
            "Review assistant guidance before changing or submitting any record.",
            "Use the normal Tendaflow screen to save, submit, approve, or pay.",
        ]

        if supplier_suggestions:
            steps.insert(0, "Compare the suggested suppliers by category, contact details, and recent supplied items.")

        if "supplier" in message.lower() and not supplier_suggestions:
            steps.insert(0, "Add supplier category and supply history data to improve future recommendations.")

        return steps

    def _match_topic(self, message: str):
        lower_message = message.lower()
        matches = []

        for topic in self.GUIDE_TOPICS.values():
            if any(keyword in lower_message for keyword in topic["keywords"]):
                matches.append(topic)

        if not matches:
            return None

        return max(
            matches,
            key=lambda topic: max(
                len(keyword)
                for keyword in topic["keywords"]
                if keyword in lower_message
            ),
        )
