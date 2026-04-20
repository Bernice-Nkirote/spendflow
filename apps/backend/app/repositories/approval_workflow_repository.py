from uuid import UUID
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.approval_workflows_table import ApprovalWorkflow
from app.models.enums import EntityTypeEnum


class ApprovalWorkflowRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, workflow: ApprovalWorkflow) -> ApprovalWorkflow:
        self.db.add(workflow)
        self.db.commit()
        self.db.refresh(workflow)
        return workflow

    def get_all(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> List[ApprovalWorkflow]:
        return (
            self.db.query(ApprovalWorkflow)
            .filter(ApprovalWorkflow.company_id == company_id)
            .order_by(ApprovalWorkflow.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_id(
        self,
        workflow_id: UUID,
        company_id: UUID,
    ) -> Optional[ApprovalWorkflow]:
        return (
            self.db.query(ApprovalWorkflow)
            .filter(
                ApprovalWorkflow.id == workflow_id,
                ApprovalWorkflow.company_id == company_id,
            )
            .first()
        )

    def get_by_name(
        self,
        name: str,
        company_id: UUID,
    ) -> Optional[ApprovalWorkflow]:
        return (
            self.db.query(ApprovalWorkflow)
            .filter(
                ApprovalWorkflow.name == name,
                ApprovalWorkflow.company_id == company_id,
            )
            .first()
        )

    def get_active_by_entity_type(
        self,
        entity_type: EntityTypeEnum,
        company_id: UUID,
    ) -> Optional[ApprovalWorkflow]:
        return (
            self.db.query(ApprovalWorkflow)
            .filter(
                ApprovalWorkflow.company_id == company_id,
                ApprovalWorkflow.entity_type == entity_type,
                ApprovalWorkflow.is_active.is_(True),
            )
            .order_by(ApprovalWorkflow.created_at.desc())
            .first()
        )

    def update(
        self,
        db_obj: ApprovalWorkflow,
        update_data: dict,
    ) -> ApprovalWorkflow:
        for key, value in update_data.items():
            setattr(db_obj, key, value)

        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, db_obj: ApprovalWorkflow) -> None:
        self.db.delete(db_obj)
        self.db.commit()