import uuid
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.models.approval_instance import ApprovalInstance
from app.models.workflow_level_roles import WorkflowLevelRole
from app.models.approval_action import ApprovalAction
from app.models.workflow_level import WorkflowLevel
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
            .options(
                joinedload(ApprovalInstance.workflow),
                joinedload(ApprovalInstance.current_level),
                joinedload(ApprovalInstance.actions).joinedload(ApprovalAction.user),
            )
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
            .options(
                joinedload(ApprovalInstance.workflow),
                joinedload(ApprovalInstance.current_level),
                joinedload(ApprovalInstance.actions).joinedload(ApprovalAction.user),
            )
            .filter(ApprovalInstance.company_id == company_id)
            .order_by(ApprovalInstance.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_all(
        self,
        company_id: uuid.UUID,
        status: Optional[ApprovalStatus] = None,
        exclude_status: Optional[ApprovalStatus] = None,
    ) -> int:
        query = self.db.query(ApprovalInstance).filter(
            ApprovalInstance.company_id == company_id
        )

        if status:
            query = query.filter(ApprovalInstance.status == status)

        if exclude_status:
            query = query.filter(ApprovalInstance.status != exclude_status)

        return query.count()
    
    def get_paginated(
        self,
        company_id: uuid.UUID,
        skip: int = 0,
        limit: int = 10,
        status: Optional[ApprovalStatus] = None,
        exclude_status: Optional[ApprovalStatus] = None,
    ) -> list[ApprovalInstance]:
        query = (
            self.db.query(ApprovalInstance)
            .options(
                joinedload(ApprovalInstance.workflow),
                joinedload(ApprovalInstance.current_level),
                joinedload(ApprovalInstance.actions).joinedload(ApprovalAction.user),
            )
            .filter(ApprovalInstance.company_id == company_id)
        )

        if status:
            query = query.filter(ApprovalInstance.status == status)

        if exclude_status:
            query = query.filter(ApprovalInstance.status != exclude_status)

        return (
            query.order_by(ApprovalInstance.created_at.desc())
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

    def get_my_pending_queue(
        self,
        company_id: uuid.UUID,
        role_id: uuid.UUID,
        department_id: uuid.UUID | None,
        skip: int = 0,
        limit: int = 10,
    ) -> list[ApprovalInstance]:
        if department_id is None:
            return []

        return (
            self.db.query(ApprovalInstance)
            .join(
                WorkflowLevelRole,
                WorkflowLevelRole.level_id == ApprovalInstance.current_level_id,
            )
            .join(
                WorkflowLevel,
                WorkflowLevel.id == ApprovalInstance.current_level_id,
            )
            .options(
                joinedload(ApprovalInstance.workflow),
                joinedload(ApprovalInstance.current_level),
                joinedload(ApprovalInstance.actions),
            )
            .filter(
                ApprovalInstance.company_id == company_id,
                ApprovalInstance.status == ApprovalStatus.PENDING,
                WorkflowLevelRole.company_id == company_id,
                WorkflowLevelRole.role_id == role_id,
                WorkflowLevel.company_id == company_id,
                WorkflowLevel.department_id == department_id,
            )
            .order_by(ApprovalInstance.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_my_pending_queue(
        self,
        company_id: uuid.UUID,
        role_id: uuid.UUID,
        department_id: uuid.UUID | None,
    ) -> int:
        if department_id is None:
            return 0

        return (
            self.db.query(ApprovalInstance)
            .join(
                WorkflowLevelRole,
                WorkflowLevelRole.level_id == ApprovalInstance.current_level_id,
            )
            .join(
                WorkflowLevel,
                WorkflowLevel.id == ApprovalInstance.current_level_id,
            )
            .filter(
                ApprovalInstance.company_id == company_id,
                ApprovalInstance.status == ApprovalStatus.PENDING,
                WorkflowLevelRole.company_id == company_id,
                WorkflowLevelRole.role_id == role_id,
                WorkflowLevel.company_id == company_id,
                WorkflowLevel.department_id == department_id,
            )
            .count()
        )
    def update(self, instance: ApprovalInstance) -> ApprovalInstance:
        self.db.flush()
        self.db.refresh(instance)
        return instance
