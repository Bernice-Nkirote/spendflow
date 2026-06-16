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
        message = request.message.strip()
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
            score, reasons = self._score_supplier(candidate, recent_items, search_terms, category)

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
        lower_message = message.lower()

        if "approve" in lower_message or "approval" in lower_message:
            return (
                "For approvals, review the record, confirm the budget and supplier details, "
                "then use the existing approval action yourself. I can explain what to check, "
                "but the approval decision must stay with the authorised user."
            )

        if "invoice" in lower_message:
            return (
                "For invoices, match the invoice to the PO, verify quantities, totals, currency, "
                "and payment status, then save or submit through the normal invoice screen."
            )

        if "po" in lower_message or "purchase order" in lower_message:
            return (
                "For purchase orders, start from an approved PR where possible, choose a supplier, "
                "confirm item quantities and pricing, then submit the PO through the normal workflow."
            )

        if "pr" in lower_message or "requisition" in lower_message:
            return (
                "For purchase requisitions, list the needed items, quantities, estimated unit prices, "
                "department, and business reason before submitting for approval."
            )

        return (
            "I can help draft procurement records, explain workflows, and recommend suppliers "
            "using Tendaflow data. I will keep actions as suggestions until a user reviews them."
        )

    def _build_next_steps(
        self,
        message: str,
        supplier_suggestions: list[AssistantSupplierSuggestion],
    ) -> list[str]:
        steps = [
            "Review the suggested details before creating or updating any record.",
            "Use the normal Tendaflow screen to save, submit, approve, or pay.",
        ]

        if supplier_suggestions:
            steps.insert(0, "Compare the suggested suppliers by category, contact details, and recent supplied items.")

        if "supplier" in message.lower() and not supplier_suggestions:
            steps.insert(0, "Add supplier category and supply history data to improve future recommendations.")

        return steps
