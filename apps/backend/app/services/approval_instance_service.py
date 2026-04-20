import uuid
from fastapi import HTTPException, status

from app.models.approval_instance import ApprovalInstance
from app.models.enums import ApprovalStatus
from app.repositories.approval_instance_repository import ApprovalInstanceRepository
from app.repositories.workflow_level_repository import WorkflowLevelRepository
from app.schemas.approval_instance_schema import ApprovalInstanceCreate


class ApprovalInstanceService:
    def __init__(
        self,
        repo: ApprovalInstanceRepository,
        workflow_level_repo: WorkflowLevelRepository,
    ):
        self.repo = repo
        self.workflow_level_repo = workflow_level_repo

    def create_instance(
        self,
        data: ApprovalInstanceCreate,
        company_id: uuid.UUID,
    ) -> ApprovalInstance:
        """
        Start a new approval workflow instance for an entity.
        """
        if not data.workflow_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow id is required",
            )

        if not data.entity_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Entity id is required",
            )

        if not data.entity_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Entity type is required",
            )

        existing = self.repo.get_by_entity(
            entity_id=data.entity_id,
            entity_type=data.entity_type,
            company_id=company_id,
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Approval instance already exists for this entity",
            )

        first_level = self.workflow_level_repo.get_first_level(
            data.workflow_id,
            company_id,
        )
        if not first_level:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow has no levels configured or does not exist in this company",
            )

        if first_level.company_id != company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not allowed to use this workflow",
            )

        if first_level.workflow_id != data.workflow_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid workflow level configuration",
            )

        instance = ApprovalInstance(
            company_id=company_id,
            workflow_id=data.workflow_id,
            entity_id=data.entity_id,
            entity_type=data.entity_type,
            current_level_id=first_level.id,
            status=ApprovalStatus.PENDING,
        )

        return self.repo.create(instance)

    def get_instance(
        self,
        instance_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> ApprovalInstance:
        """
        Get one approval instance in the current company.
        """
        if not instance_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Approval instance id is required",
            )

        instance = self.repo.get_by_id(instance_id, company_id)
        if not instance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Approval instance not found",
            )

        if instance.company_id != company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not allowed to access this approval instance",
            )

        return instance

    def get_all_instances(
        self,
        company_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ):
        """
        Get all approval instances in the current company.
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