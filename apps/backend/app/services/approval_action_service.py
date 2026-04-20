from uuid import UUID
from fastapi import HTTPException, status

from app.models.approval_action import ApprovalAction
from app.models.enums import ActionType, ApprovalStatus
from app.repositories.approval_action_repository import ApprovalActionRepository
from app.repositories.approval_instance_repository import ApprovalInstanceRepository
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
        user_role_repo,
    ):
        self.action_repo = action_repo
        self.instance_repo = instance_repo
        self.level_role_repo = level_role_repo
        self.workflow_level_repo = workflow_level_repo
        self.user_role_repo = user_role_repo

    def create_action(
        self,
        data: ApprovalActionCreate,
        current_user,
    ) -> ApprovalAction:
        """
        Create an approval action and apply workflow progression.
        """
        company_id = current_user.company_id

        # 1. Validate input
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

        # 2. Fetch data via repository
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

        # 3. Validate ownership
        if instance.company_id != company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not allowed to act on this approval instance",
            )

        if level.company_id != company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not allowed to use this workflow level",
            )

        # 4. Apply business rules
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

        user_roles = self.user_role_repo.get_by_user(current_user.id, company_id)
        user_role_ids = {user_role.role_id for user_role in user_roles}

        if not user_role_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has no roles assigned in this company",
            )

        if not user_role_ids.intersection(allowed_role_ids):
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

        # 5. Persist action
        action = ApprovalAction(
            company_id=company_id,
            instance_id=data.instance_id,
            level_id=data.level_id,
            user_id=current_user.id,
            action=data.action,
            comment=data.comment,
        )
        created_action = self.action_repo.create(action)

        # 6. Apply workflow progression
        self._apply_workflow_logic(
            instance=instance,
            current_level=level,
            action_type=data.action,
            company_id=company_id,
        )

        return created_action

    def get_action(
        self,
        action_id: UUID,
        company_id: UUID,
    ) -> ApprovalAction:
        """
        Get one approval action in the current company.
        """
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

        if action.company_id != company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not allowed to access this approval action",
            )

        return action

    def get_all_actions(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ):
        """
        Get all approval actions in the current company.
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

        return self.action_repo.get_all(company_id=company_id, skip=skip, limit=limit)

    def get_actions_by_instance(
        self,
        instance_id: UUID,
        company_id: UUID,
    ):
        """
        Get all actions for one approval instance in the current company.
        """
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

        if instance.company_id != company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not allowed to access this approval instance",
            )

        return self.action_repo.get_by_instance(instance_id, company_id)

    def _apply_workflow_logic(
        self,
        instance,
        current_level,
        action_type: ActionType,
        company_id: UUID,
    ) -> None:
        """
        Apply workflow rules after creating an approval action.
        """
        # Rejection ends the workflow immediately
        if action_type == ActionType.REJECTED:
            self.instance_repo.update(
                instance,
                {
                    "status": ApprovalStatus.REJECTED,
                    "current_level_id": None,
                },
            )
            return

        if action_type != ActionType.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported approval action",
            )

        # Get required roles for this level
        level_roles = self.level_role_repo.get_by_level(current_level.id, company_id)
        required_role_ids = {level_role.role_id for level_role in level_roles}

        if not required_role_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No roles are assigned to this workflow level",
            )

        # Get actions already taken on this instance
        actions = self.action_repo.get_by_instance(instance.id, company_id)

        approved_role_ids = set()

        for action in actions:
            if action.level_id != current_level.id:
                continue

            if action.action != ActionType.APPROVED:
                continue

            acting_user_roles = self.user_role_repo.get_by_user(action.user_id, company_id)
            for user_role in acting_user_roles:
                if user_role.role_id in required_role_ids:
                    approved_role_ids.add(user_role.role_id)

        # Stay on current level until all required roles have approved
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
                {
                    "current_level_id": next_level.id,
                },
            )
            return

        self.instance_repo.update(
            instance,
            {
                "status": ApprovalStatus.APPROVED,
                "current_level_id": None,
            },
        )