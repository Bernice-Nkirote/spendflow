import uuid
from typing import Optional

from sqlalchemy.orm import Session,joinedload

from app.models.workflow_level_roles import WorkflowLevelRole


class WorkflowLevelRoleRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, workflow_level_role: WorkflowLevelRole) -> WorkflowLevelRole:
        self.db.add(workflow_level_role)
        self.db.flush()
        self.db.refresh(workflow_level_role)
        return workflow_level_role

    def get_by_id(
        self,
        workflow_level_role_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> Optional[WorkflowLevelRole]:
        return (
            self.db.query(WorkflowLevelRole)
            .options(
                joinedload(WorkflowLevelRole.role),
                joinedload(WorkflowLevelRole.level),
            )
            .filter(
                WorkflowLevelRole.id == workflow_level_role_id,
                WorkflowLevelRole.company_id == company_id,
            )
            .first()
        )

    def get_by_level(
        self,
        level_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> list[WorkflowLevelRole]:
        return (
            self.db.query(WorkflowLevelRole)
            .options(
                joinedload(WorkflowLevelRole.role),
                joinedload(WorkflowLevelRole.level),
            )
            .filter(
                WorkflowLevelRole.level_id == level_id,
                WorkflowLevelRole.company_id == company_id,
            )
            .all()
        )

    def get_by_level_and_role(
        self,
        level_id: uuid.UUID,
        role_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> Optional[WorkflowLevelRole]:
        return (
            self.db.query(WorkflowLevelRole)
            .options(
                joinedload(WorkflowLevelRole.role),
                joinedload(WorkflowLevelRole.level),
            )
            .filter(
                WorkflowLevelRole.level_id == level_id,
                WorkflowLevelRole.role_id == role_id,
                WorkflowLevelRole.company_id == company_id,
            )
            .first()
)

    def get_all(self, company_id: uuid.UUID) -> list[WorkflowLevelRole]:
        return (
            self.db.query(WorkflowLevelRole)
            .options(
                joinedload(WorkflowLevelRole.role),
                joinedload(WorkflowLevelRole.level),
            )
            .filter(WorkflowLevelRole.company_id == company_id)
            .all()
        )

    def update(self, workflow_level_role: WorkflowLevelRole) -> WorkflowLevelRole:
        self.db.flush()
        self.db.refresh(workflow_level_role)
        return workflow_level_role

    def delete(self, workflow_level_role: WorkflowLevelRole) -> None:
        self.db.delete(workflow_level_role)
        self.db.flush()