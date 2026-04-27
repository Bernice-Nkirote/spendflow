import uuid
from typing import Optional

from sqlalchemy.orm import Session

from app.models.approval_instance import ApprovalInstance
from app.models.enums import ApprovalStatus, EntityTypeEnum


class ApprovalInstanceRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, instance: ApprovalInstance) -> ApprovalInstance:
        self.db.add(instance)
        self.db.flush()
        self.db.refresh(instance)
        return instance

    def get_by_id(
        self,
        instance_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> Optional[ApprovalInstance]:
        return (
            self.db.query(ApprovalInstance)
            .filter(
                ApprovalInstance.id == instance_id,
                ApprovalInstance.company_id == company_id,
            )
            .first()
        )

    def get_all(
        self,
        company_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[ApprovalInstance]:
        return (
            self.db.query(ApprovalInstance)
            .filter(ApprovalInstance.company_id == company_id)
            .order_by(ApprovalInstance.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_entity(
        self,
        entity_id: uuid.UUID,
        entity_type: EntityTypeEnum,
        company_id: uuid.UUID,
    ) -> Optional[ApprovalInstance]:
        return (
            self.db.query(ApprovalInstance)
            .filter(
                ApprovalInstance.entity_id == entity_id,
                ApprovalInstance.entity_type == entity_type,
                ApprovalInstance.company_id == company_id,
            )
            .first()
        )

    def get_pending_by_entity(
        self,
        entity_id: uuid.UUID,
        entity_type: EntityTypeEnum,
        company_id: uuid.UUID,
    ) -> Optional[ApprovalInstance]:
        return (
            self.db.query(ApprovalInstance)
            .filter(
                ApprovalInstance.entity_id == entity_id,
                ApprovalInstance.entity_type == entity_type,
                ApprovalInstance.company_id == company_id,
                ApprovalInstance.status == ApprovalStatus.PENDING,
            )
            .first()
        )

    def update(self, instance: ApprovalInstance) -> ApprovalInstance:
        self.db.flush()
        self.db.refresh(instance)
        return instance