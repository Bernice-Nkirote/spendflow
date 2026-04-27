from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.workflow_level import WorkflowLevel


class WorkflowLevelRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, level: WorkflowLevel) -> WorkflowLevel:
        self.db.add(level)
        self.db.flush()
        self.db.refresh(level)
        return level

    def get_all(
        self,
        workflow_id: UUID,
        company_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[WorkflowLevel]:
        return (
            self.db.query(WorkflowLevel)
            .filter(
                WorkflowLevel.workflow_id == workflow_id,
                WorkflowLevel.company_id == company_id,
            )
            .order_by(WorkflowLevel.level_order.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_id(
        self,
        level_id: UUID,
        company_id: UUID,
    ) -> Optional[WorkflowLevel]:
        return (
            self.db.query(WorkflowLevel)
            .filter(
                WorkflowLevel.id == level_id,
                WorkflowLevel.company_id == company_id,
            )
            .first()
        )

    def get_by_workflow_and_level_order(
        self,
        workflow_id: UUID,
        level_order: int,
        company_id: UUID,
    ) -> Optional[WorkflowLevel]:
        return (
            self.db.query(WorkflowLevel)
            .filter(
                WorkflowLevel.workflow_id == workflow_id,
                WorkflowLevel.level_order == level_order,
                WorkflowLevel.company_id == company_id,
            )
            .first()
        )

    def get_first_level(
        self,
        workflow_id: UUID,
        company_id: UUID,
    ) -> Optional[WorkflowLevel]:
        return (
            self.db.query(WorkflowLevel)
            .filter(
                WorkflowLevel.workflow_id == workflow_id,
                WorkflowLevel.company_id == company_id,
            )
            .order_by(WorkflowLevel.level_order.asc())
            .first()
        )

    def get_next_level(
        self,
        workflow_id: UUID,
        current_level_order: int,
        company_id: UUID,
    ) -> Optional[WorkflowLevel]:
        return (
            self.db.query(WorkflowLevel)
            .filter(
                WorkflowLevel.workflow_id == workflow_id,
                WorkflowLevel.company_id == company_id,
                WorkflowLevel.level_order > current_level_order,
            )
            .order_by(WorkflowLevel.level_order.asc())
            .first()
        )

    def update(self, level: WorkflowLevel) -> WorkflowLevel:
        self.db.flush()
        self.db.refresh(level)
        return level

    def delete(self, level: WorkflowLevel) -> None:
        self.db.delete(level)
        self.db.flush()