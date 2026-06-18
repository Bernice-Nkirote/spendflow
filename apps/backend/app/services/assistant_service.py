import json
from uuid import UUID

from fastapi import HTTPException, status
from pydantic import ValidationError

from app.core.config import settings
from app.repositories.assistant_repository import AssistantRepository
from app.schemas.assistant_schema import (
    AssistantActionLink,
    AssistantChatRequest,
    AssistantChatResponse,
    AssistantSupplierSuggestion,
    SupplierSuggestionRequest,
)


class AssistantService:
    ACTION_CATALOG = {
        "/approval-workflows": "Approval Workflows",
        "/approvals": "Approvals",
        "/audit-logs": "Audit Logs",
        "/departments": "Departments",
        "/exchange-rates": "Exchange Rates",
        "/invoices": "Invoices",
        "/invoices/new": "Create Invoice",
        "/payments": "Payments",
        "/permissions": "Permissions",
        "/purchase-orders": "Purchase Orders",
        "/purchase-orders/new": "Create PO",
        "/purchase-requisitions": "Purchase Requisitions",
        "/purchase-requisitions/new": "Create PR",
        "/reports": "Reports",
        "/roles": "Roles",
        "/supplier-login": "Supplier Login",
        "/suppliers": "Suppliers",
        "/users": "Users",
        "/user-guide": "User Guide",
    }

    GUIDE_TOPICS = {
        "getting started": {
            "keywords": (
                "where to start",
                "where do i start",
                "how do i start",
                "start from",
                "getting started",
                "new user",
                "first time",
                "setup order",
                "what do i do first",
            ),
            "answer": "Start with the User Guide, then set up the workspace in order. That keeps roles, permissions, approvals, suppliers, and reports from feeling tangled later.",
            "steps": [
                "Open the User Guide and read Getting Started first.",
                "Confirm the company business type.",
                "Create departments for teams, branches, or cost centres.",
                "Review default roles: Procurement can create PRs and POs; Finance can create invoices and payments.",
                "Check permissions and adjust only where your workflow needs it.",
                "Configure approval workflows, then add suppliers and exchange rates.",
            ],
            "actions": [
                ("User Guide", "/user-guide"),
                ("Departments", "/departments"),
                ("Roles", "/roles"),
                ("Approval Workflows", "/approval-workflows"),
            ],
            "guardrail": "Use the User Guide for the full setup path before creating live procurement records.",
        },
        "purchase requisitions": {
            "keywords": ("purchase requisition", "requisition", "create pr", "draft pr", " pr "),
            "answer": "No worries, PRs are the clean starting point. Create the request, add the items, review the totals, then submit when it looks right.",
            "steps": [
                "Open Purchase Requisitions.",
                "Click Create PR.",
                "Add department, reason, items, quantities, estimated prices, and currency.",
                "Review totals, then submit for approval yourself.",
            ],
            "actions": [
                ("Create PR", "/purchase-requisitions/new"),
                ("View PRs", "/purchase-requisitions"),
            ],
            "guardrail": "I can guide the PR, but I will not submit it for you.",
        },
        "purchase orders": {
            "keywords": ("purchase order", "create po", " po ", "order supplier"),
            "answer": "You are at the buying step now. If there is an approved PR, use it to create the PO so the record stays traceable.",
            "steps": [
                "Open Purchase Orders, or open the approved PR.",
                "Choose Create PO or Create PO from PR.",
                "Select a supplier and review the supplier preview.",
                "Check item quantities, prices, currency, notes, then submit yourself.",
            ],
            "actions": [
                ("Create PO", "/purchase-orders/new"),
                ("View POs", "/purchase-orders"),
                ("View PRs", "/purchase-requisitions"),
            ],
            "guardrail": "I can suggest suppliers and next steps, but I will not create or submit the PO.",
        },
        "suppliers": {
            "keywords": ("supplier", "suppliers", "vendor", "category", "source", "rfq", "add supplier", "import supplier", "supplier import"),
            "answer": "Supplier setup is where Tendaflow gets much smarter. Good categories and contacts make PO selection, reports, and supplier suggestions easier later.",
            "steps": [
                "Open Suppliers.",
                "Add one supplier manually, or use Import Excel for many suppliers.",
                "Include name, email, phone, address, contact person, category, and sub-category.",
                "Use the More button to review profile, contacts, and supply history.",
            ],
            "actions": [("Open Suppliers", "/suppliers")],
            "guardrail": "Review supplier details before using a supplier on a PO.",
        },
        "business types": {
            "keywords": ("business type", "business types", "sole proprietorship", "partnership", "company type"),
            "answer": "Tiny map, big difference: business type helps Tendaflow fit how the organisation actually approves work.",
            "steps": [
                "Use Sole Proprietorship for one-person businesses and simple owner approvals.",
                "Use Partnership when partner approvals need flexible configuration.",
                "Use Company for departments, roles, permissions, and multi-level approvals.",
                "For partnerships, configure partner approval options in Approval Workflows.",
            ],
            "actions": [
                ("Approval Workflows", "/approval-workflows"),
                ("User Guide", "/user-guide"),
            ],
            "guardrail": "Approval workflows still control the actual approval route.",
        },
        "departments": {
            "keywords": ("department", "departments", "create department", "add department", "team", "teams"),
            "answer": "Departments are your tidy boxes for teams, branches, and cost centres. They make approvals and reports easier to understand.",
            "steps": [
                "Open Departments.",
                "Create a department with a clear name.",
                "Assign users to the right department.",
                "Use departments in PRs, POs, workflows, and reports.",
            ],
            "actions": [("Open Departments", "/departments")],
            "guardrail": "Approvers may need the correct department to act on a workflow level.",
        },
        "roles": {
            "keywords": ("role", "roles", "create role", "add role", "assign role", "user role"),
            "answer": "Roles are the job hats people wear in Tendaflow. Some useful roles are already prepared so teams can start faster, then admins can adjust permissions if needed.",
            "steps": [
                "Open Roles to review the available roles.",
                "Procurement-style roles are intended to create procurement work such as PRs and POs.",
                "Finance-style roles are intended to create finance work such as invoices and payments.",
                "Open Permissions if you need to fine-tune what each role can view, create, approve, export, or administer.",
                "Assign users to the right role, then test with a real user before relying on the workflow.",
            ],
            "actions": [
                ("Open Roles", "/roles"),
                ("Open Permissions", "/permissions"),
            ],
            "guardrail": "Creation permissions are helpful defaults, but approve, payment, export, and admin permissions should still be reviewed carefully.",
        },
        "permissions": {
            "keywords": ("permission", "permissions", "assign permission", "access control"),
            "answer": "Permissions are the system's guardrails. They decide who can view, create, update, approve, export, or administer.",
            "steps": [
                "Open Permissions.",
                "Check the default role setup first: Procurement can create PRs and POs; Finance can create invoices and payments.",
                "Assign permissions to roles based on job responsibility.",
                "Keep requester, approver, finance, and admin access separate where possible.",
                "Test the role with a user account.",
            ],
            "actions": [
                ("Open Permissions", "/permissions"),
                ("Open Roles", "/roles"),
            ],
            "guardrail": "Only give users the permissions they truly need.",
        },
        "invoices": {
            "keywords": ("invoice", "invoices", "bill", "supplier invoice"),
            "answer": "Invoices need a careful match. Think PO, quantities, prices, totals, and supplier before approval.",
            "steps": [
                "Open Invoices.",
                "Create or open the invoice.",
                "Match it to the supplier and PO where applicable.",
                "Check quantities, prices, totals, currency, then submit or approve manually.",
            ],
            "actions": [
                ("Create Invoice", "/invoices/new"),
                ("View Invoices", "/invoices"),
                ("View Approvals", "/approvals"),
            ],
            "guardrail": "I cannot approve or reject invoices for you.",
        },
        "payments": {
            "keywords": ("payment", "payments", "pay", "paid", "record payment"),
            "answer": "Payments are finance-sensitive, so slow and steady wins. Start from the approved invoice and check the outstanding balance.",
            "steps": [
                "Open the approved invoice.",
                "Create the payment from that invoice.",
                "Enter amount, method, reference, currency, and date.",
                "Review the remaining balance before saving or submitting.",
            ],
            "actions": [
                ("View Invoices", "/invoices"),
                ("View Payments", "/payments"),
            ],
            "guardrail": "I cannot create, approve, or complete payments.",
        },
        "approvals": {
            "keywords": ("approve", "approval", "approvals", "reject", "task", "tasks", "task icon", "notification", "notification bell", "bell"),
            "answer": "You are not lost. Approvals live in two useful places: the Tasks icon for work waiting on you, and the notification bell for alerts.",
            "steps": [
                "Check the Tasks icon.",
                "Check the notification bell.",
                "Open the approval record.",
                "Review totals, requester, supplier, department, and workflow level.",
                "Approve or reject manually if you are authorised.",
            ],
            "actions": [("View Approvals", "/approvals")],
            "guardrail": "I can help you review, but I cannot approve or reject anything.",
        },
        "approval workflows": {
            "keywords": ("approval workflow", "approval workflows", "workflow", "levels", "approval level"),
            "answer": "Approval workflows are the route map. They decide who reviews PRs, POs, invoices, and payments, and in what order.",
            "steps": [
                "Open Approval Workflows.",
                "Choose the workflow for PR, PO, invoice, or payment.",
                "Add levels in approval order.",
                "Assign approver roles to each level.",
                "For partnerships, configure partner approval options if needed.",
            ],
            "actions": [
                ("Approval Workflows", "/approval-workflows"),
                ("User Guide", "/user-guide"),
            ],
            "guardrail": "Changing workflows affects future approval routing, so test carefully.",
        },
        "exchange rates": {
            "keywords": ("exchange", "exchange rate", "currency", "foreign currency", "rate"),
            "answer": "Exchange rates keep foreign-currency records readable in your base currency. Very useful for reports.",
            "steps": [
                "Open Exchange Rates.",
                "Add or update the currency rate and date.",
                "Use that currency on PRs, POs, invoices, or payments.",
                "Check base-currency totals in Reports.",
            ],
            "actions": [
                ("Exchange Rates", "/exchange-rates"),
                ("Reports", "/reports"),
            ],
            "guardrail": "Use accurate rates before creating foreign-currency records.",
        },
        "reports": {
            "keywords": ("report", "reports", "spend", "supplier spend", "lead time"),
            "answer": "Reports are where the story of procurement becomes visible: spend, payments, suppliers, outstanding invoices, and lead time.",
            "steps": [
                "Open Reports.",
                "Choose the report tab.",
                "Apply filters such as date, status, supplier, department, or supplier category.",
                "Review summary cards before exporting.",
            ],
            "actions": [("Open Reports", "/reports")],
            "guardrail": "Exports may contain sensitive procurement and payment data.",
        },
        "audit logs": {
            "keywords": ("audit", "audit log", "audit logs", "logs", "history", "trace"),
            "answer": "Audit logs are your accountability trail. They help answer: who changed what, and when?",
            "steps": [
                "Open Audit Logs.",
                "Search or filter for the user, action, record, or date.",
                "Review changes for approvals, suppliers, reports, and setup activity.",
            ],
            "actions": [("Audit Logs", "/audit-logs")],
            "guardrail": "Audit logs are for traceability, not editing records.",
        },
        "supplier portal": {
            "keywords": ("supplier portal", "portal", "supplier login", "portal user", "supplier user", "create supplier portal user"),
            "answer": "Supplier portal access starts from the supplier profile. Create the supplier first, then add a portal user from that supplier's details page so the setup email goes to the right external contact.",
            "steps": [
                "Open Suppliers.",
                "Open the supplier record that needs portal access.",
                "Go to the Portal Users section.",
                "Enter the supplier user's email and create the portal user.",
                "Ask the supplier to use the emailed setup link, then sign in through Supplier Login.",
                "After login, the supplier can view assigned POs, create eligible invoices, and track invoices or payments.",
            ],
            "actions": [
                ("Open Suppliers", "/suppliers"),
                ("Supplier Login", "/supplier-login"),
                ("User Guide", "/user-guide"),
            ],
            "guardrail": "You need supplier update or admin access to manage supplier portal users.",
        },
        "user guide": {
            "keywords": ("user guide", "guide", "manual", "help page", "documentation", "how to use", "faq", "common tasks"),
            "answer": "For deep learning, the User Guide is the calmer library. I am the quick helper at your elbow.",
            "steps": [
                "Open the User Guide.",
                "Search for the area you need.",
                "Use me for quick next-step questions while you work.",
            ],
            "actions": [("User Guide", "/user-guide")],
            "guardrail": "Use the guide for detailed learning and me for quick direction.",
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
        topic = self._match_topic(message)
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

        model_response = self._build_model_response(
            request=request,
            topic=topic,
            supplier_suggestions=supplier_suggestions,
        )
        if model_response:
            return model_response

        return AssistantChatResponse(
            answer=self._build_guidance(topic),
            response_mode="fallback",
            cautions=[self._build_guardrail(topic, supplier_suggestions)],
            suggested_next_steps=self._build_next_steps(topic, supplier_suggestions),
            actions=self._build_actions(topic, supplier_suggestions),
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

    def _build_guidance(self, topic) -> str:
        if topic:
            return topic["answer"]

        return (
            "I can help, but I need one more detail. Tell me the record or task you are working on, for example: create a PR, make a PO from an approved PR, create a supplier portal user, approve an invoice, configure workflows, or suggest suppliers."
        )

    def _build_next_steps(
        self,
        topic,
        supplier_suggestions: list[AssistantSupplierSuggestion],
    ) -> list[str]:
        steps = list(topic["steps"]) if topic else [
            "Tell me what you are trying to do.",
            "I will point you to the right screen and the next safe action.",
            "Use the normal Tendaflow page to complete the action yourself.",
        ]

        if supplier_suggestions:
            steps.insert(0, "Compare the suggested suppliers before selecting one.")

        return steps[:6]

    def _build_actions(
        self,
        topic,
        supplier_suggestions: list[AssistantSupplierSuggestion],
    ) -> list[AssistantActionLink]:
        actions = []

        if topic:
            actions.extend(
                AssistantActionLink(label=label, path=path)
                for label, path in topic["actions"]
            )
        else:
            actions.append(AssistantActionLink(label="User Guide", path="/user-guide"))

        if supplier_suggestions and not any(action.path == "/suppliers" for action in actions):
            actions.append(AssistantActionLink(label="Open Suppliers", path="/suppliers"))

        return actions[:4]

    def _build_model_response(
        self,
        request: AssistantChatRequest,
        topic,
        supplier_suggestions: list[AssistantSupplierSuggestion],
    ) -> AssistantChatResponse | None:
        if not settings.OPENAI_API_KEY:
            return None

        try:
            from openai import OpenAI
        except ImportError:
            return None

        prompt_messages = self._build_model_messages(request=request, topic=topic)

        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.responses.create(
                model=settings.OPENAI_MODEL,
                input=prompt_messages,
                text={
                    "format": {
                        "type": "json_schema",
                        "name": "tendaflow_assistant_response",
                        "strict": True,
                        "schema": self._model_response_schema(),
                    }
                },
            )
            payload = json.loads(response.output_text)
        except Exception:
            return None

        try:
            actions = self._normalise_model_actions(payload.get("actions", []))
            return AssistantChatResponse(
                answer=str(payload.get("answer", "")).strip()
                or self._build_guidance(topic),
                response_mode="ai",
                cautions=self._normalise_text_list(
                    payload.get("cautions", []),
                    fallback=[self._build_guardrail(topic, supplier_suggestions)],
                ),
                suggested_next_steps=self._normalise_text_list(
                    payload.get("suggested_next_steps", []),
                    fallback=self._build_next_steps(topic, supplier_suggestions),
                ),
                actions=actions or self._build_actions(topic, supplier_suggestions),
                supplier_suggestions=supplier_suggestions,
            )
        except (TypeError, ValidationError):
            return None

    def _build_model_messages(self, request: AssistantChatRequest, topic) -> list[dict]:
        topic_hint = self._build_guidance(topic)
        action_catalog = "\n".join(
            f"- {label}: {path}"
            for path, label in sorted(self.ACTION_CATALOG.items())
        )
        system_prompt = f"""
You are Tendaflow's in-app procurement assistant.

Voice:
- Warm, supportive, concise, and lightly quirky.
- Help the user feel safe when confused.
- Be practical: tell them exactly where to click and what to review.
- Be specific. Name the Tendaflow screen, the button or section, the required permission if relevant, and the next safe user action.
- Answer the user's exact question first. Do not replace it with a broad topic summary.
- Use the topic hint only as supporting context, not as the answer.
- If the question contains record details, numbers, currencies, suppliers, roles, or workflow status, address those exact details.
- If the user asks a broad question, ask one short clarifying question after giving the most likely path.

Boundaries:
- You must not submit PRs, create or submit POs, approve, reject, create payments, complete payments, delete records, or change records.
- Always tell the user to review and take the final action inside Tendaflow.
- If approval, payment, permissions, exchange rates, audit logs, supplier portal, reports, departments, roles, suppliers, PRs, POs, or invoices are mentioned, give clear Tendaflow-specific guidance.
- Keep answers concise, but never vague. Prefer 3 to 6 concrete steps over generic advice.
- Send deep learning to /user-guide.
- Use only the route paths listed below for actions.

Important Tendaflow route shortcuts:
{action_catalog}

Current page: {request.context or "unknown"}
Supporting topic hint, only if relevant: {topic_hint}
""".strip()

        messages = [{"role": "system", "content": system_prompt}]
        for history_item in request.history[-8:]:
            messages.append(
                {
                    "role": history_item.role,
                    "content": history_item.content,
                }
            )
        messages.append({"role": "user", "content": request.message})
        return messages

    def _model_response_schema(self) -> dict:
        return {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "answer": {"type": "string"},
                "cautions": {
                    "type": "array",
                    "items": {"type": "string"},
                    "maxItems": 3,
                },
                "suggested_next_steps": {
                    "type": "array",
                    "items": {"type": "string"},
                    "maxItems": 6,
                },
                "actions": {
                    "type": "array",
                    "maxItems": 4,
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "label": {"type": "string"},
                            "path": {
                                "type": "string",
                                "enum": sorted(self.ACTION_CATALOG.keys()),
                            },
                        },
                        "required": ["label", "path"],
                    },
                },
            },
            "required": [
                "answer",
                "cautions",
                "suggested_next_steps",
                "actions",
            ],
        }

    def _normalise_model_actions(self, raw_actions) -> list[AssistantActionLink]:
        actions: list[AssistantActionLink] = []
        if not isinstance(raw_actions, list):
            return actions

        for raw_action in raw_actions:
            if not isinstance(raw_action, dict):
                continue
            path = raw_action.get("path")
            if path not in self.ACTION_CATALOG:
                continue
            label = str(raw_action.get("label") or self.ACTION_CATALOG[path]).strip()
            actions.append(AssistantActionLink(label=label[:60], path=path))

        return actions[:4]

    def _normalise_text_list(self, raw_values, fallback: list[str]) -> list[str]:
        if not isinstance(raw_values, list):
            return fallback

        values = [
            str(value).strip()
            for value in raw_values
            if str(value).strip()
        ]
        return values[:6] or fallback

    def _build_guardrail(
        self,
        topic,
        supplier_suggestions: list[AssistantSupplierSuggestion],
    ) -> str:
        if topic:
            return topic["guardrail"]

        if supplier_suggestions:
            return "Review supplier suggestions before choosing one."

        return "I can guide and suggest, but you must review and take the final action."

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
