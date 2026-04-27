import uuid

from fastapi import HTTPException, status

from app.models.workflow_level_roles import WorkflowLevelRole
from app.repositories.role_repository import RoleRepository
from app.repositories.workflow_level_repository import WorkflowLevelRepository
from app.repositories.workflow_role_repository import WorkflowLevelRoleRepository
from app.schemas.workflowlevel_role_schema import (
    WorkflowLevelRoleCreate,
    WorkflowLevelRoleUpdate,
)


class WorkflowLevelRoleService:
    def __init__(
        self,
        repo: WorkflowLevelRoleRepository,
        workflow_level_repo: WorkflowLevelRepository,
        role_repo: RoleRepository,
    ):
        self.repo = repo
        self.workflow_level_repo = workflow_level_repo
        self.role_repo = role_repo

    def create_workflow_level_role(
        self,
        data: WorkflowLevelRoleCreate,
        company_id: uuid.UUID,
    ) -> WorkflowLevelRole:
        if not data.level_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow level id is required",
            )

        if not data.role_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role id is required",
            )

        level = self.workflow_level_repo.get_by_id(data.level_id, company_id)
        if not level:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow level not found",
            )

        role = self.role_repo.get_by_id(data.role_id, company_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found",
            )

        existing = self.repo.get_by_level_and_role(
            level_id=data.level_id,
            role_id=data.role_id,
            company_id=company_id,
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Role already assigned to this workflow level",
            )

        workflow_level_role = WorkflowLevelRole(
            company_id=company_id,
            level_id=data.level_id,
            role_id=data.role_id,
        )

        created_assignment = self.repo.create(workflow_level_role)
        self.repo.db.commit()
        self.repo.db.refresh(created_assignment)

        return created_assignment

    def get_workflow_level_role(
        self,
        workflow_level_role_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> WorkflowLevelRole:
        if not workflow_level_role_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow level role id is required",
            )

        workflow_level_role = self.repo.get_by_id(
            workflow_level_role_id,
            company_id,
        )
        if not workflow_level_role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow level role not found",
            )

        return workflow_level_role

    def get_all_workflow_level_roles(
        self,
        company_id: uuid.UUID,
    ) -> list[WorkflowLevelRole]:
        return self.repo.get_all(company_id)

    def get_roles_by_level(
        self,
        level_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> list[WorkflowLevelRole]:
        if not level_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow level id is required",
            )

        level = self.workflow_level_repo.get_by_id(level_id, company_id)
        if not level:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow level not found",
            )

        return self.repo.get_by_level(level_id, company_id)

    def update_workflow_level_role(
        self,
        workflow_level_role_id: uuid.UUID,
        data: WorkflowLevelRoleUpdate,
        company_id: uuid.UUID,
    ) -> WorkflowLevelRole:
        workflow_level_role = self.get_workflow_level_role(
            workflow_level_role_id,
            company_id,
        )

        update_data = data.model_dump(exclude_unset=True)

        if "role_id" in update_data:
            new_role_id = update_data["role_id"]

            role = self.role_repo.get_by_id(new_role_id, company_id)
            if not role:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Role not found",
                )

            if new_role_id != workflow_level_role.role_id:
                existing = self.repo.get_by_level_and_role(
                    level_id=workflow_level_role.level_id,
                    role_id=new_role_id,
                    company_id=company_id,
                )
                if existing:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Role already assigned to this workflow level",
                    )

        for field, value in update_data.items():
            setattr(workflow_level_role, field, value)

        updated_assignment = self.repo.update(workflow_level_role)
        self.repo.db.commit()
        self.repo.db.refresh(updated_assignment)

        return updated_assignment

    def delete_workflow_level_role(
        self,
        workflow_level_role_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> dict:
        workflow_level_role = self.get_workflow_level_role(
            workflow_level_role_id,
            company_id,
        )

        self.repo.delete(workflow_level_role)
        self.repo.db.commit()

        return {"message": "Workflow level role deleted successfully"}