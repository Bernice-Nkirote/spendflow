import uuid
from fastapi import HTTPException, status

from app.models.approval_workflows_table import ApprovalWorkflow
from app.repositories.approval_workflow_repository import ApprovalWorkflowRepository
from app.schemas.approval_workflows_schema import (
    ApprovalWorkflowCreate,
    ApprovalWorkflowUpdate,
)


class ApprovalWorkflowService:
    def __init__(self, repo: ApprovalWorkflowRepository):
        self.repo = repo

    def create_workflow(
        self,
        workflow_data: ApprovalWorkflowCreate,
        company_id: uuid.UUID,
    ) -> ApprovalWorkflow:
        """
        Create a new workflow for the current company.
        """
        if not workflow_data.name or not workflow_data.name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow name is required",
            )

        if not workflow_data.entity_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Entity type is required",
            )

        workflow_name = workflow_data.name.strip()

        existing_workflow = self.repo.get_by_name(workflow_name, company_id)
        if existing_workflow:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow with this name already exists",
            )

        workflow = ApprovalWorkflow(
            name=workflow_name,
            entity_type=workflow_data.entity_type,
            company_id=company_id,
            is_active=True,
        )

        return self.repo.create(workflow)

    def get_workflow(
        self,
        workflow_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> ApprovalWorkflow:
        """
        Get one workflow in the current company.
        """
        if not workflow_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow id is required",
            )

        workflow = self.repo.get_by_id(workflow_id, company_id)
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found",
            )

        return workflow

    def get_all_workflows(
        self,
        company_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ):
        """
        Get all workflows in the current company.
        """
        if skip < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="skip cannot be negative",
            )

        if limit <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="limit must be greater than zero",
            )

        return self.repo.get_all(company_id, skip=skip, limit=limit)

    def update_workflow(
        self,
        workflow_id: uuid.UUID,
        workflow_data: ApprovalWorkflowUpdate,
        company_id: uuid.UUID,
    ) -> ApprovalWorkflow:
        """
        Update workflow details in the current company.
        """
        if not workflow_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow id is required",
            )

        workflow = self.repo.get_by_id(workflow_id, company_id)
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found",
            )

        update_data = workflow_data.model_dump(exclude_unset=True)

        new_name = update_data.get("name")
        if new_name is not None:
            if not new_name.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Workflow name cannot be empty",
                )

            normalized_name = new_name.strip()

            if normalized_name != workflow.name:
                existing_workflow = self.repo.get_by_name(normalized_name, company_id)
                if existing_workflow:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Workflow with this name already exists",
                    )

            update_data["name"] = normalized_name

        return self.repo.update(workflow, update_data)

    def deactivate_workflow(
        self,
        workflow_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> ApprovalWorkflow:
        """
        Deactivate a workflow in the current company.
        """
        if not workflow_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow id is required",
            )

        workflow = self.repo.get_by_id(workflow_id, company_id)
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found",
            )

        if not workflow.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow is already inactive",
            )

        return self.repo.update(workflow, {"is_active": False})

    def activate_workflow(
        self,
        workflow_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> ApprovalWorkflow:
        """
        Activate a workflow in the current company.
        """
        if not workflow_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow id is required",
            )

        workflow = self.repo.get_by_id(workflow_id, company_id)
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found",
            )

        if workflow.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow is already active",
            )

        return self.repo.update(workflow, {"is_active": True})

    def delete_workflow(
        self,
        workflow_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> dict:
        """
        Permanently delete a workflow in the current company.
        """
        if not workflow_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow id is required",
            )

        workflow = self.repo.get_by_id(workflow_id, company_id)
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found",
            )

        self.repo.delete(workflow)
        return {"message": "Workflow deleted successfully"}