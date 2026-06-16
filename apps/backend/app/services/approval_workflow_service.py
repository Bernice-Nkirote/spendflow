import uuid

from fastapi import HTTPException, status

from app.models.approval_workflows_table import ApprovalWorkflow
from app.repositories.approval_workflow_repository import ApprovalWorkflowRepository
from app.schemas.approval_workflows_schema import (
    ApprovalWorkflowCreate,
    ApprovalWorkflowUpdate,
)


class ApprovalWorkflowService:
    PARTNER_APPROVAL_MODES = {
        "workflow_levels",
        "any_partner",
        "all_partners",
        "minimum_partners",
    }

    def __init__(self, repo: ApprovalWorkflowRepository):
        self.repo = repo

    def create_workflow(
        self,
        workflow_data: ApprovalWorkflowCreate,
        company_id: uuid.UUID,
    ) -> ApprovalWorkflow:
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
                status_code=status.HTTP_409_CONFLICT,
                detail="Workflow with this name already exists",
            )

        workflow = ApprovalWorkflow(
            name=workflow_name,
            entity_type=workflow_data.entity_type,
            company_id=company_id,
            is_active=True,
            partner_approval_mode=self._normalize_partner_mode(
                workflow_data.partner_approval_mode,
            ),
            partner_approval_min_count=workflow_data.partner_approval_min_count,
            partner_role_id=workflow_data.partner_role_id,
        )

        self._validate_partner_approval_config(workflow, company_id)

        created_workflow = self.repo.create(workflow)
        self.repo.db.commit()
        self.repo.db.refresh(created_workflow)

        return created_workflow

    def get_workflow(
        self,
        workflow_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> ApprovalWorkflow:
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
    ) -> list[ApprovalWorkflow]:
        if skip < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Skip cannot be negative",
            )

        if limit <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit must be greater than zero",
            )

        return self.repo.get_all(company_id, skip=skip, limit=limit)

    def update_workflow(
        self,
        workflow_id: uuid.UUID,
        workflow_data: ApprovalWorkflowUpdate,
        company_id: uuid.UUID,
    ) -> ApprovalWorkflow:
        workflow = self.get_workflow(workflow_id, company_id)

        update_data = workflow_data.model_dump(exclude_unset=True)

        if "name" in update_data:
            normalized_name = update_data["name"].strip()
            if not normalized_name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Workflow name cannot be empty",
                )

            existing_workflow = self.repo.get_by_name(normalized_name, company_id)
            if existing_workflow and existing_workflow.id != workflow.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Workflow with this name already exists",
                )

            update_data["name"] = normalized_name

        if "partner_approval_mode" in update_data:
            update_data["partner_approval_mode"] = self._normalize_partner_mode(
                update_data["partner_approval_mode"],
            )

        for field, value in update_data.items():
            setattr(workflow, field, value)

        self._validate_partner_approval_config(workflow, company_id)

        updated_workflow = self.repo.update(workflow)
        self.repo.db.commit()
        self.repo.db.refresh(updated_workflow)

        return updated_workflow

    def deactivate_workflow(
        self,
        workflow_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> ApprovalWorkflow:
        workflow = self.get_workflow(workflow_id, company_id)

        if not workflow.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow is already inactive",
            )

        workflow.is_active = False

        updated_workflow = self.repo.update(workflow)
        self.repo.db.commit()
        self.repo.db.refresh(updated_workflow)

        return updated_workflow

    def activate_workflow(
        self,
        workflow_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> ApprovalWorkflow:
        workflow = self.get_workflow(workflow_id, company_id)

        if workflow.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow is already active",
            )

        workflow.is_active = True

        updated_workflow = self.repo.update(workflow)
        self.repo.db.commit()
        self.repo.db.refresh(updated_workflow)

        return updated_workflow

    def delete_workflow(
        self,
        workflow_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> dict:
        workflow = self.get_workflow(workflow_id, company_id)

        self.repo.delete(workflow)
        self.repo.db.commit()

        return {"message": "Workflow deleted successfully"}

    def _normalize_partner_mode(self, mode: str | None) -> str | None:
        if mode is None:
            return None

        normalized_mode = mode.strip().lower()
        return normalized_mode or None

    def _validate_partner_approval_config(
        self,
        workflow: ApprovalWorkflow,
        company_id: uuid.UUID,
    ) -> None:
        mode = workflow.partner_approval_mode

        if mode is None:
            return

        if mode not in self.PARTNER_APPROVAL_MODES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid partnership approval mode.",
            )

        if mode == "minimum_partners" and not workflow.partner_approval_min_count:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Minimum partner approvals is required for this mode.",
            )

        if mode != "minimum_partners":
            workflow.partner_approval_min_count = None

        if workflow.partner_role_id and not self.repo.role_belongs_to_company(
            workflow.partner_role_id,
            company_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected partner role does not belong to this company.",
            )
