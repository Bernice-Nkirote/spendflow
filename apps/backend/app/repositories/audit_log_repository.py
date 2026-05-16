from datetime import datetime
from uuid import UUID
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.audit_logs import AuditLog
from app.models.user import User
from app.models.supplier_user import SupplierUser

class AuditLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, log: AuditLog) -> AuditLog:
        self.db.add(log)
        self.db.flush()
        return log

    def get_by_id(
        self,
        log_id: UUID,
        company_id: UUID,
    ) -> Optional[AuditLog]:
        return (
            self.db.query(AuditLog)
            .filter(
                AuditLog.id == log_id,
                AuditLog.company_id == company_id,
            )
            .first()
        )

    def get_all(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> List[AuditLog]:
        return (
            self.db.query(AuditLog)
            .filter(AuditLog.company_id == company_id)
            .order_by(AuditLog.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_entity(
        self,
        company_id: UUID,
        entity_type: str,
        entity_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> List[AuditLog]:
        return (
            self.db.query(AuditLog)
            .filter(
                AuditLog.company_id == company_id,
                AuditLog.entity_type == entity_type,
                AuditLog.entity_id == entity_id,
            )
            .order_by(AuditLog.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_actor_user(
        self,
        company_id: UUID,
        actor_user_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> List[AuditLog]:
        return (
            self.db.query(AuditLog)
            .filter(
                AuditLog.company_id == company_id,
                AuditLog.actor_user_id == actor_user_id,
            )
            .order_by(AuditLog.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_actor_supplier_user(
        self,
        company_id: UUID,
        actor_supplier_user_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> List[AuditLog]:
        return (
            self.db.query(AuditLog)
            .filter(
                AuditLog.company_id == company_id,
                AuditLog.actor_supplier_user_id == actor_supplier_user_id,
            )
            .order_by(AuditLog.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def search(
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
    ) -> List[AuditLog]:
        query = self.db.query(AuditLog).filter(
            AuditLog.company_id == company_id
        )

        if entity_type:
            query = query.filter(AuditLog.entity_type == entity_type)

        if entity_id:
            query = query.filter(AuditLog.entity_id == entity_id)

        if action:
            query = query.filter(AuditLog.action == action)

        if actor_user_id:
            query = query.filter(AuditLog.actor_user_id == actor_user_id)

        if actor_supplier_user_id:
            query = query.filter(
                AuditLog.actor_supplier_user_id == actor_supplier_user_id
            )

        if date_from:
            query = query.filter(AuditLog.created_at >= date_from)

        if date_to:
            query = query.filter(AuditLog.created_at <= date_to)

        return (
            query.order_by(AuditLog.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_actor_user(
        self,
        actor_user_id: UUID,
        company_id: UUID,
    ) -> User | None:
        return (
            self.db.query(User)
            .filter(
                User.id == actor_user_id,
                User.company_id == company_id,
            )
            .first()
        )


    def get_actor_supplier_user(
        self,
        actor_supplier_user_id: UUID,
        company_id: UUID,
    ) -> SupplierUser | None:
        return (
            self.db.query(SupplierUser)
            .filter(
                SupplierUser.id == actor_supplier_user_id,
                SupplierUser.company_id == company_id,
            )
            .first()
        )