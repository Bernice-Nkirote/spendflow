import uuid
from fastapi import HTTPException, status

from app.models.workflow_level_roles import WorkflowLevelRole
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
    ):
        self.repo = repo
        self.workflow_level_repo = workflow_level_repo

    def create_workflow_level_role(
        self,
        data: WorkflowLevelRoleCreate,
        company_id: uuid.UUID,
    ) -> WorkflowLevelRole:
        """
        Assign a role to a workflow level in the current company.
        """
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

        existing = self.repo.get_by_level_and_role(
            data.level_id,
            data.role_id,
            company_id,
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role already assigned to this workflow level",
            )

        workflow_level_role = WorkflowLevelRole(
            company_id=company_id,
            level_id=data.level_id,
            role_id=data.role_id,
        )

        return self.repo.create(workflow_level_role)

    def get_workflow_level_role(
        self,
        workflow_level_role_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> WorkflowLevelRole:
        """
        Get one workflow level role assignment in the current company.
        """
        if not workflow_level_role_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow level role id is required",
            )

        workflow_level_role = self.repo.get_by_id(workflow_level_role_id, company_id)
        if not workflow_level_role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow level role not found",
            )

        return workflow_level_role

    def get_all_workflow_level_roles(
        self,
        company_id: uuid.UUID,
    ):
        """
        Get all workflow level role assignments in the current company.
        """
        return self.repo.get_all(company_id)

    def get_roles_by_level(
        self,
        level_id: uuid.UUID,
        company_id: uuid.UUID,
    ):
        """
        Get all role assignments for one workflow level in the current company.
        """
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
        """
        Update a workflow level role assignment in the current company.
        """
        if not workflow_level_role_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow level role id is required",
            )

        workflow_level_role = self.repo.get_by_id(workflow_level_role_id, company_id)
        if not workflow_level_role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow level role not found",
            )

        update_data = data.model_dump(exclude_unset=True)

        new_role_id = update_data.get("role_id")
        if new_role_id is not None and new_role_id != workflow_level_role.role_id:
            existing = self.repo.get_by_level_and_role(
                workflow_level_role.level_id,
                new_role_id,
                company_id,
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Role already assigned to this workflow level",
                )

        return self.repo.update(workflow_level_role, update_data)

    def delete_workflow_level_role(
        self,
        workflow_level_role_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> dict:
        """
        Delete a workflow level role assignment in the current company.
        """
        if not workflow_level_role_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow level role id is required",
            )

        workflow_level_role = self.repo.get_by_id(workflow_level_role_id, company_id)
        if not workflow_level_role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow level role not found",
            )

        self.repo.delete(workflow_level_role)
        return {"message": "Workflow level role deleted successfully"}