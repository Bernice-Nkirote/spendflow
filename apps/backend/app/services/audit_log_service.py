from datetime import datetime
from uuid import UUID
from typing import Any

from fastapi import HTTPException, status

from app.models.audit_logs import AuditLog
from app.repositories.audit_log_repository import AuditLogRepository


class AuditLogService:
    def __init__(self, repo: AuditLogRepository):
        self.repo = repo

    def log_action(
        self,
        company_id: UUID,
        entity_type: str,
        entity_id: UUID,
        action: str,
        actor_user_id: UUID | None = None,
        actor_supplier_user_id: UUID | None = None,
        description: str | None = None,
        details_json: dict[str, Any] | None = None,
        old_values_json: dict[str, Any] | None = None,
        new_values_json: dict[str, Any] | None = None,
        commit: bool = False,
        # main service e.g PO will create entity, log the action and commit once at the end.
    ) -> AuditLog:
        log = AuditLog(
            company_id=company_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            actor_user_id=actor_user_id,
            actor_supplier_user_id=actor_supplier_user_id,
            description=description,
            details_json=details_json,
            old_values_json=old_values_json,
            new_values_json=new_values_json,
        )

        created_log = self.repo.create(log)

        if commit:
            self.repo.db.commit()
            self.repo.db.refresh(created_log)

        return created_log

    def get_audit_log(
        self,
        log_id: UUID,
        company_id: UUID,
    ) -> AuditLog:
        log = self.repo.get_by_id(log_id, company_id)

        if not log:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audit log not found",
            )

        return log

    def get_audit_logs(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[AuditLog]:
        return self.repo.get_all(
            company_id=company_id,
            skip=skip,
            limit=limit,
        )

    def get_entity_logs(
        self,
        company_id: UUID,
        entity_type: str,
        entity_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[AuditLog]:
        return self.repo.get_by_entity(
            company_id=company_id,
            entity_type=entity_type,
            entity_id=entity_id,
            skip=skip,
            limit=limit,
        )
    
    def get_actor_user_logs(
        self,
        company_id: UUID,
        actor_user_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[AuditLog]:
        return self.repo.get_by_actor_user(
            company_id=company_id,
            actor_user_id=actor_user_id,
            skip=skip,
            limit=limit,
        )

    def get_actor_supplier_user_logs(
        self,
        company_id: UUID,
        actor_supplier_user_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[AuditLog]:
        return self.repo.get_by_actor_supplier_user(
            company_id=company_id,
            actor_supplier_user_id=actor_supplier_user_id,
            skip=skip,
            limit=limit,
        )
    
    def search_audit_logs(
        self,
        company_id: UUID,
        entity_type: str | None = None,
        entity_id: UUID | None = None,
        action: str | None = None,
        actor_user_id: UUID | None = None,
        actor_supplier_user_id: UUID | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[AuditLog]:
        if skip < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Skip must be zero or greater",
            )

        if limit < 1 or limit > 500:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit must be between 1 and 500",
            )

        if date_from and date_to and date_from > date_to:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="date_from cannot be after date_to",
            )

        if entity_type:
            entity_type = entity_type.strip().upper() or None

        if action:
            action = action.strip().upper() or None

        return self.repo.search(
            company_id=company_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            actor_user_id=actor_user_id,
            actor_supplier_user_id=actor_supplier_user_id,
            date_from=date_from,
            date_to=date_to,
            skip=skip,
            limit=limit,
        )