from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from uuid import UUID

from app.models.audit_log import AuditLog


class AuditLogService:

    @staticmethod
    def log(
        db: Session,
        *,
        entity: str,
        entity_id: UUID,
        action: str,
        user_id: Optional[UUID] = None,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
    ):
        audit = AuditLog(
            entity=entity,
            entity_id=entity_id,
            action=action,
            user_id=user_id,
            old_values=old_values,
            new_values=new_values
        )

        db.add(audit)