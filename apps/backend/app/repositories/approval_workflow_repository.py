from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.approval_workflows_table import ApprovalWorkflow
from app.models.enums import EntityTypeEnum


class ApprovalWorkflowRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, workflow: ApprovalWorkflow) -> ApprovalWorkflow:
        self.db.add(workflow)
        self.db.flush()
        self.db.refresh(workflow)
        return workflow

    def get_all(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[ApprovalWorkflow]:
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

    def update(self, workflow: ApprovalWorkflow) -> ApprovalWorkflow:
        self.db.flush()
        self.db.refresh(workflow)
        return workflow

    def delete(self, workflow: ApprovalWorkflow) -> None:
        self.db.delete(workflow)
        self.db.flush()