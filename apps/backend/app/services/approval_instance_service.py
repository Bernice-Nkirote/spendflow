import uuid

from fastapi import HTTPException, status

from app.models.approval_instance import ApprovalInstance
from app.models.enums import ApprovalStatus, EntityTypeEnum
from app.repositories.approval_instance_repository import ApprovalInstanceRepository
from app.repositories.workflow_level_repository import WorkflowLevelRepository
from app.repositories.pr_repository import PurchaseRequisitionRepository
from app.schemas.approval_instance_schema import ApprovalInstanceCreate


class ApprovalInstanceService:
    def __init__(
        self,
        repo: ApprovalInstanceRepository,
        workflow_level_repo: WorkflowLevelRepository,
        pr_repo: PurchaseRequisitionRepository,
    ):
        self.repo = repo
        self.workflow_level_repo = workflow_level_repo
        self.pr_repo = pr_repo

    def _enrich_instance(self, instance: ApprovalInstance) -> ApprovalInstance:
        """
        Adds business-readable metadata to an approval instance response.
        and It only attaches response fields for frontend display.
        """
        instance.entity_reference = None
        instance.requester_name = None
        instance.total_amount = None
        instance.currency = None

        if instance.entity_type == EntityTypeEnum.PR:
            requisition = self.pr_repo.get_by_id(
                instance.entity_id,
                instance.company_id,
            )

            if requisition:
                instance.entity_reference = requisition.pr_number
                instance.requester_name = getattr(
                    requisition,
                    "requested_by_name",
                    None,
                )

                if not instance.requester_name:
                    requester = getattr(requisition, "requester", None)
                    instance.requester_name = getattr(requester, "name", None)

                instance.total_amount = (
                    float(requisition.total_amount)
                    if requisition.total_amount is not None
                    else None
                )
                instance.currency = requisition.currency

        return instance  
    
    def create_instance(
        self,
        data: ApprovalInstanceCreate,
        company_id: uuid.UUID,
    ) -> ApprovalInstance:
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

        existing_pending = self.repo.get_pending_by_entity(
            entity_id=data.entity_id,
            entity_type=data.entity_type,
            company_id=company_id,
        )
        if existing_pending:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A pending approval instance already exists for this entity",
            )

        first_level = self.workflow_level_repo.get_first_level(
            workflow_id=data.workflow_id,
            company_id=company_id,
        )
        if not first_level:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow has no levels configured or does not exist in this company",
            )

        instance = ApprovalInstance(
            company_id=company_id,
            workflow_id=data.workflow_id,
            entity_id=data.entity_id,
            entity_type=data.entity_type,
            current_level_id=first_level.id,
            status=ApprovalStatus.PENDING,
        )

        created_instance = self.repo.create(instance)
        self.repo.db.commit()
        self.repo.db.refresh(created_instance)

        return created_instance

    def get_instance(
        self,
        instance_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> ApprovalInstance:
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

        return self._enrich_instance(instance)

    def get_all_instances(
        self,
        company_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[ApprovalInstance]:
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

        instances = self.repo.get_all(company_id, skip=skip, limit=limit)

        return [self._enrich_instance(instance) for instance in instances]

    def update_instance_status(
        self,
        instance_id: uuid.UUID,
        status_value: ApprovalStatus,
        company_id: uuid.UUID,
    ) -> ApprovalInstance:
        instance = self.get_instance(instance_id, company_id)

        instance.status = status_value

        updated_instance = self.repo.update(instance)
        self.repo.db.commit()
        self.repo.db.refresh(updated_instance)

        return updated_instance