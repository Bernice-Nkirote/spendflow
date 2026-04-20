import uuid
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.workflow_level_roles import WorkflowLevelRole


class WorkflowLevelRoleRepository:
    def __init__(self, db: Session):
        # Reuse one DB session per request
        self.db = db

    def create(self, obj: WorkflowLevelRole) -> WorkflowLevelRole:
        """
        Create a new workflow level role assignment.
        """
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def get_by_id(
        self,
        obj_id: uuid.UUID,
        company_id: uuid.UUID
    ) -> Optional[WorkflowLevelRole]:
        """
        Get one workflow level role by ID, scoped to company.
        """
        return (
            self.db.query(WorkflowLevelRole)
            .filter(
                WorkflowLevelRole.id == obj_id,
                WorkflowLevelRole.company_id == company_id
            )
            .first()
        )

    def get_by_level(
        self,
        level_id: uuid.UUID,
        company_id: uuid.UUID
    ) -> List[WorkflowLevelRole]:
        """
        List all role assignments for a given workflow level within a company.
        """
        return (
            self.db.query(WorkflowLevelRole)
            .filter(
                WorkflowLevelRole.level_id == level_id,
                WorkflowLevelRole.company_id == company_id
            )
            .all()
        )

    def get_by_level_and_role(
        self,
        level_id: uuid.UUID,
        role_id: uuid.UUID,
        company_id: uuid.UUID
    ) -> Optional[WorkflowLevelRole]:
        """
        Check whether a specific role is already assigned to a workflow level.
        """
        return (
            self.db.query(WorkflowLevelRole)
            .filter(
                WorkflowLevelRole.level_id == level_id,
                WorkflowLevelRole.role_id == role_id,
                WorkflowLevelRole.company_id == company_id
            )
            .first()
        )

    def get_all(self, company_id: uuid.UUID) -> List[WorkflowLevelRole]:
        """
        Return all workflow level role assignments for a company.
        """
        return (
            self.db.query(WorkflowLevelRole)
            .filter(WorkflowLevelRole.company_id == company_id)
            .all()
        )

    def update(
        self,
        db_obj: WorkflowLevelRole,
        update_data: dict
    ) -> WorkflowLevelRole:
        """
        Update a workflow level role assignment.
        """
        for key, value in update_data.items():
            setattr(db_obj, key, value)

        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, db_obj: WorkflowLevelRole) -> None:
        """
        Delete a workflow level role assignment.
        """
        self.db.delete(db_obj)
        self.db.commit()