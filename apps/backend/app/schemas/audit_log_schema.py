from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AuditLogRead(BaseModel):
    id: UUID
    company_id: UUID

    entity_type: str
    entity_id: UUID
    action: str

    actor_user_id: UUID | None = None
    actor_supplier_user_id: UUID | None = None

    description: str | None = None

    details_json: dict[str, Any] | None = None
    old_values_json: dict[str, Any] | None = None
    new_values_json: dict[str, Any] | None = None

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)