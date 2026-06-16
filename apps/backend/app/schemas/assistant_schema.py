from uuid import UUID

from pydantic import BaseModel, Field


class AssistantChatRequest(BaseModel):
    message: str = Field(..., min_length=2, max_length=2000)
    context: str | None = Field(default=None, max_length=100)
    item_names: list[str] = Field(default_factory=list, max_length=20)
    category: str | None = Field(default=None, max_length=100)


class AssistantSupplierSuggestion(BaseModel):
    supplier_id: UUID
    supplier_name: str
    category: str | None = None
    sub_category: str | None = None
    contact_person: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    recent_supplied_items: list[str]
    po_count: int
    total_order_value: float
    score: int
    reasons: list[str]


class AssistantChatResponse(BaseModel):
    answer: str
    cautions: list[str]
    suggested_next_steps: list[str]
    supplier_suggestions: list[AssistantSupplierSuggestion]


class SupplierSuggestionRequest(BaseModel):
    item_names: list[str] = Field(default_factory=list, max_length=20)
    category: str | None = Field(default=None, max_length=100)
    limit: int = Field(default=5, ge=1, le=10)
