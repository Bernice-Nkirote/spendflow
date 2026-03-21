# app/services/workflow_level_role_service.py

import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.workflow_level_roles import WorkflowLevelRole
from app.repositories.workflow_role_repository import WorkflowLevelRoleRepository
from app.schemas.workflowlevel_role_schema import (
    WorkflowLevelRoleCreate,
    WorkflowLevelRoleUpdate
)


class WorkflowLevelRoleService:

    def __init__(self):
        self.repo = WorkflowLevelRoleRepository()

    def create_workflow_level_role(
        self, db: Session, data: WorkflowLevelRoleCreate
    ) -> WorkflowLevelRole:

        obj = WorkflowLevelRole(
            id=uuid.uuid4(),
            level_id=data.level_id,
            role_id=data.role_id
        )

        return self.repo.create(db, obj)

    def get_workflow_level_role(self, db: Session, obj_id: uuid.UUID):
        obj = self.repo.get_by_id(db, obj_id)

        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="WorkflowLevelRole not found"
            )
        return obj

    def get_all_workflow_level_roles(self, db: Session):
        return self.repo.get_all(db)

    def get_roles_by_level(self, db: Session, level_id: uuid.UUID):
        return self.repo.get_by_level(db, level_id)

    def update_workflow_level_role(
        self,
        db: Session,
        obj_id: uuid.UUID,
        data: WorkflowLevelRoleUpdate
    ):
        obj = self.repo.get_by_id(db, obj_id)

        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="WorkflowLevelRole not found"
            )

        update_data = data.model_dump(exclude_unset=True)

        return self.repo.update(db, obj, update_data)

    def delete_workflow_level_role(self, db: Session, obj_id: uuid.UUID):
        obj = self.repo.get_by_id(db, obj_id)

        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="WorkflowLevelRole not found"
            )

        self.repo.delete(db, obj)
        return {"message": "Deleted successfully"}