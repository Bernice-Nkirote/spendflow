from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.models.workflow_level import WorkflowLevel


class WorkflowLevelRepository:
    def __init__(self, db: Session):
        # Reuse one DB session across repository methods
        self.db = db

    def create(self, level: WorkflowLevel) -> WorkflowLevel:
        """
        Create a new workflow level.
        """
        self.db.add(level)
        self.db.commit()
        self.db.refresh(level)
        return level

    def get_all(
        self,
        workflow_id: UUID,
        company_id: UUID
    ) -> List[WorkflowLevel]:
        """
        Return all levels for a workflow, ordered by execution sequence.
        """
        return (
            self.db.query(WorkflowLevel)
            .filter(
                WorkflowLevel.workflow_id == workflow_id,
                WorkflowLevel.company_id == company_id
            )
            .order_by(WorkflowLevel.level_order.asc())
            .all()
        )

    def get_by_id(
        self,
        level_id: UUID,
        company_id: UUID
    ) -> Optional[WorkflowLevel]:
        """
        Fetch one workflow level by ID within the current company.
        """
        return (
            self.db.query(WorkflowLevel)
            .filter(
                WorkflowLevel.id == level_id,
                WorkflowLevel.company_id == company_id
            )
            .first()
        )

    def get_first_level(
        self,
        workflow_id: UUID,
        company_id: UUID
    ) -> Optional[WorkflowLevel]:
        """
        Return the first level in a workflow.
        Used when starting an approval instance.
        """
        return (
            self.db.query(WorkflowLevel)
            .filter(
                WorkflowLevel.workflow_id == workflow_id,
                WorkflowLevel.company_id == company_id
            )
            .order_by(WorkflowLevel.level_order.asc())
            .first()
        )

    def get_next_level(
        self,
        workflow_id: UUID,
        current_level_order: int,
        company_id: UUID
    ) -> Optional[WorkflowLevel]:
        """
        Return the next level after the current one.
        Used during approval progression.
        """
        return (
            self.db.query(WorkflowLevel)
            .filter(
                WorkflowLevel.workflow_id == workflow_id,
                WorkflowLevel.company_id == company_id,
                WorkflowLevel.level_order > current_level_order
            )
            .order_by(WorkflowLevel.level_order.asc())
            .first()
        )

    def update(
        self,
        db_obj: WorkflowLevel,
        update_data: dict
    ) -> WorkflowLevel:
        """
        Apply field updates to a workflow level.
        The service decides whether this is a rename, reorder, or threshold change.
        """
        for key, value in update_data.items():
            setattr(db_obj, key, value)

        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, db_obj: WorkflowLevel) -> None:
        """
        Permanently delete a workflow level.
        Service should first confirm the level is safe to remove.
        """
        self.db.delete(db_obj)
        self.db.commit()