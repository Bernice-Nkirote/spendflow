import uuid

from fastapi import HTTPException, status

from app.models.workflow_level import WorkflowLevel
from app.repositories.approval_workflow_repository import ApprovalWorkflowRepository
from app.repositories.workflow_level_repository import WorkflowLevelRepository
from app.schemas.workflow_levels_schema import (
    WorkflowLevelCreate,
    WorkflowLevelUpdate,
)


class WorkflowLevelService:
    def __init__(
        self,
        repo: WorkflowLevelRepository,
        workflow_repo: ApprovalWorkflowRepository,
    ):
        self.repo = repo
        self.workflow_repo = workflow_repo

    def create_level(
        self,
        level_data: WorkflowLevelCreate,
        company_id: uuid.UUID,
    ) -> WorkflowLevel:
        if not level_data.workflow_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow id is required",
            )

        if not level_data.name or not level_data.name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow level name is required",
            )

        if level_data.level_order is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Level order is required",
            )

        if level_data.level_order <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Level order must be greater than zero",
            )

        if (
            level_data.min_amount is not None
            and level_data.max_amount is not None
            and level_data.min_amount > level_data.max_amount
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Minimum amount cannot be greater than maximum amount",
            )

        workflow = self.workflow_repo.get_by_id(level_data.workflow_id, company_id)
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found",
            )

        existing_level = self.repo.get_by_workflow_and_level_order(
            workflow_id=level_data.workflow_id,
            level_order=level_data.level_order,
            company_id=company_id,
        )
        if existing_level:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Level order already exists in this workflow",
            )

        level = WorkflowLevel(
            workflow_id=level_data.workflow_id,
            company_id=company_id,
            level_order=level_data.level_order,
            name=level_data.name.strip(),
            min_amount=level_data.min_amount,
            max_amount=level_data.max_amount,
            department_id=level_data.department_id,
            condition_expression=level_data.condition_expression,
        )

        created_level = self.repo.create(level)
        self.repo.db.commit()
        self.repo.db.refresh(created_level)

        return created_level

    def get_level(
        self,
        level_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> WorkflowLevel:
        if not level_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow level id is required",
            )

        level = self.repo.get_by_id(level_id, company_id)
        if not level:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow level not found",
            )

        return level

    def get_all_levels(
        self,
        workflow_id: uuid.UUID,
        company_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[WorkflowLevel]:
        if not workflow_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow id is required",
            )

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

        workflow = self.workflow_repo.get_by_id(workflow_id, company_id)
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found",
            )

        return self.repo.get_all(
            workflow_id=workflow_id,
            company_id=company_id,
            skip=skip,
            limit=limit,
        )

    def update_level(
        self,
        level_id: uuid.UUID,
        level_data: WorkflowLevelUpdate,
        company_id: uuid.UUID,
    ) -> WorkflowLevel:
        level = self.get_level(level_id, company_id)

        update_data = level_data.model_dump(exclude_unset=True)

        if "name" in update_data:
            normalized_name = update_data["name"].strip()
            if not normalized_name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Workflow level name cannot be empty",
                )

            update_data["name"] = normalized_name

        if "level_order" in update_data:
            new_level_order = update_data["level_order"]

            if new_level_order <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Level order must be greater than zero",
                )

            if new_level_order != level.level_order:
                existing_level = self.repo.get_by_workflow_and_level_order(
                    workflow_id=level.workflow_id,
                    level_order=new_level_order,
                    company_id=company_id,
                )
                if existing_level:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Level order already exists in this workflow",
                    )

        min_amount = update_data.get("min_amount", level.min_amount)
        max_amount = update_data.get("max_amount", level.max_amount)

        if (
            min_amount is not None
            and max_amount is not None
            and min_amount > max_amount
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Minimum amount cannot be greater than maximum amount",
            )

        for field, value in update_data.items():
            setattr(level, field, value)

        updated_level = self.repo.update(level)
        self.repo.db.commit()
        self.repo.db.refresh(updated_level)

        return updated_level

    def delete_level(
        self,
        level_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> dict:
        level = self.get_level(level_id, company_id)

        self.repo.delete(level)
        self.repo.db.commit()

        return {"message": "Workflow level deleted successfully"}