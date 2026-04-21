from uuid import UUID

from fastapi import HTTPException, status

from app.models.approval_action import ApprovalAction
from app.models.enums import (
    ActionType,
    ApprovalStatus,
    EntityTypeEnum,
    POStatusEnum,
    PRStatusEnum,
)
from app.repositories.approval_action_repository import ApprovalActionRepository
from app.repositories.approval_instance_repository import ApprovalInstanceRepository
from app.repositories.po_repository import PurchaseOrderRepository
from app.repositories.pr_repository import PurchaseRequisitionRepository
from app.repositories.workflow_level_repository import WorkflowLevelRepository
from app.repositories.workflow_role_repository import WorkflowLevelRoleRepository
from app.schemas.approval_action_schema import ApprovalActionCreate


class ApprovalActionService:
    def __init__(
        self,
        action_repo: ApprovalActionRepository,
        instance_repo: ApprovalInstanceRepository,
        level_role_repo: WorkflowLevelRoleRepository,
        workflow_level_repo: WorkflowLevelRepository,
        pr_repo: PurchaseRequisitionRepository,
        po_repo: PurchaseOrderRepository,
    ):
        self.action_repo = action_repo
        self.instance_repo = instance_repo
        self.level_role_repo = level_role_repo
        self.workflow_level_repo = workflow_level_repo
        self.pr_repo = pr_repo
        self.po_repo = po_repo

    def create_action(
        self,
        data: ApprovalActionCreate,
        current_user,
    ) -> ApprovalAction:
        company_id = current_user.company_id

        if not data.instance_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Approval instance id is required",
            )

        if not data.level_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow level id is required",
            )

        if data.action == ActionType.REJECTED and not data.comment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Comment is required when rejecting",
            )

        instance = self.instance_repo.get_by_id(data.instance_id, company_id)
        if not instance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Approval instance not found",
            )

        level = self.workflow_level_repo.get_by_id(data.level_id, company_id)
        if not level:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow level not found",
            )

        if instance.status != ApprovalStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This approval instance is no longer pending",
            )

        if instance.current_level_id != data.level_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This is not the current approval level",
            )

        if level.workflow_id != instance.workflow_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow level does not belong to this approval instance",
            )

        level_roles = self.level_role_repo.get_by_level(data.level_id, company_id)
        allowed_role_ids = {level_role.role_id for level_role in level_roles}

        if not allowed_role_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No roles are assigned to this workflow level",
            )

        if current_user.role_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has no role assigned",
            )

        if current_user.role_id not in allowed_role_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not allowed to act on this workflow level",
            )

        existing_action = self.action_repo.get_by_instance_and_level_and_user(
            instance_id=data.instance_id,
            level_id=data.level_id,
            user_id=current_user.id,
            company_id=company_id,
        )
        if existing_action:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User has already acted on this workflow level",
            )

        action = ApprovalAction(
            company_id=company_id,
            instance_id=data.instance_id,
            level_id=data.level_id,
            user_id=current_user.id,
            action=data.action,
            comment=data.comment,
        )

        created_action = self.action_repo.create(action)

        self._apply_workflow_progression(
            instance=instance,
            current_level=level,
            company_id=company_id,
        )

        return created_action

    def get_action(
        self,
        action_id: UUID,
        company_id: UUID,
    ) -> ApprovalAction:
        if not action_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Approval action id is required",
            )

        action = self.action_repo.get_by_id(action_id, company_id)
        if not action:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Approval action not found",
            )

        return action

    def get_all_actions(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ):
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

        return self.action_repo.get_all(
            company_id=company_id,
            skip=skip,
            limit=limit,
        )

    def get_actions_by_instance(
        self,
        instance_id: UUID,
        company_id: UUID,
    ):
        if not instance_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Approval instance id is required",
            )

        instance = self.instance_repo.get_by_id(instance_id, company_id)
        if not instance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Approval instance not found",
            )

        return self.action_repo.get_by_instance(instance_id, company_id)

    def _apply_workflow_progression(
        self,
        instance,
        current_level,
        company_id: UUID,
    ) -> None:
        actions = self.action_repo.get_by_instance(instance.id, company_id)
        current_level_actions = [
            action for action in actions if action.level_id == current_level.id
        ]

        if any(action.action == ActionType.REJECTED for action in current_level_actions):
            self.instance_repo.update(
                instance,
                {
                    "status": ApprovalStatus.REJECTED,
                    "current_level_id": None,
                },
            )
            self._sync_entity_status(
                instance=instance,
                company_id=company_id,
                approved=False,
            )
            return

        required_role_ids = {
            level_role.role_id
            for level_role in self.level_role_repo.get_by_level(current_level.id, company_id)
        }

        approved_role_ids = set()
        for action in current_level_actions:
            if action.action != ActionType.APPROVED:
                continue

            action_user_role_id = getattr(action.user, "role_id", None)
            if action_user_role_id in required_role_ids:
                approved_role_ids.add(action_user_role_id)

        if not required_role_ids.issubset(approved_role_ids):
            return

        next_level = self.workflow_level_repo.get_next_level(
            workflow_id=instance.workflow_id,
            current_level_order=current_level.level_order,
            company_id=company_id,
        )

        if next_level:
            self.instance_repo.update(
                instance,
                {"current_level_id": next_level.id},
            )
            return

        self.instance_repo.update(
            instance,
            {
                "status": ApprovalStatus.APPROVED,
                "current_level_id": None,
            },
        )
        self._sync_entity_status(
            instance=instance,
            company_id=company_id,
            approved=True,
        )

    def _sync_entity_status(
        self,
        instance,
        company_id: UUID,
        approved: bool,
    ) -> None:
        if instance.entity_type == EntityTypeEnum.PR:
            requisition = self.pr_repo.get_by_id(instance.entity_id, company_id)
            if not requisition:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Purchase requisition not found for approval sync",
                )

            self.pr_repo.update(
                requisition,
                {
                    "status": PRStatusEnum.APPROVED if approved else PRStatusEnum.REJECTED,
                },
            )
            return

        if instance.entity_type == EntityTypeEnum.PO:
            po = self.po_repo.get_by_id(instance.entity_id, company_id)
            if not po:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Purchase order not found for approval sync",
                )

            self.po_repo.update(
                po,
                {
                    "status": POStatusEnum.APPROVED if approved else POStatusEnum.REJECTED,
                },
            )
            return

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported entity type for approval status sync",
        )