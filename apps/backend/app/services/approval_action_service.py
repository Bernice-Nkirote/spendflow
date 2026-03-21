from uuid import UUID
from typing import List
from app.repositories.approval_action_repository import ApprovalActionRepository
from app.repositories.approval_instance_repository import ApprovalInstanceRepository
from app.models.approval_instance import ApprovalStatus
from app.schemas.approval_action_schema import ApprovalActionCreate
from app.models.approval_action import ApprovalAction

class ApprovalActionService:
    def __init__(self, repo: ApprovalActionRepository, instance_repo: ApprovalInstanceRepository):
        self.repo = repo
        self.instance_repo = instance_repo

    def create_action(self, approval_action_create: ApprovalActionCreate) -> ApprovalAction:
         # Basic validation
        if approval_action_create.action.lower() not in ["approved", "rejected"]:
            raise ValueError("Action must be 'approved' or 'rejected'")

        # Prevent duplicate approvals at same level by same user
        existing_actions = self.repo.get_by_instance(approval_action_create.instance_id)

        for act in existing_actions:
            if (
                act.level_id == approval_action_create.level_id
                and act.users_id == approval_action_create.users_id
            ):
                raise ValueError("User has already acted on this level")

        #  Create Action
        action = self.repo.create(approval_action_create)

        # Update instance status automatically
        self._update_instance_status(approval_action_create.instance_id)

        return action
    
    def _update_instance_status(self, instance_id, UUID):
        instance = self.instance_repo.get_by_id(instance_id)
        if not instance:
            raise ValueError("Approval Instance not found")
        
        actions = instance.actions

        # if any action is rejected
        if any(act.action.upper() == "REJECTED" for act in actions):
            instance.status = ApprovalStatus.REJECTED

        # If all levels have at least one APPROVED action 
        elif instance.workflow.levels:
            # check whether workflow has atleast one approved action
            level_ids = [level.id for level in instance.workflow.levels]
            approved_level_ids = {act.level_id for act in actions if act.action.upper() == "APPROVED"}

            if set(level_ids).issubset(approved_level_ids):
                instance.status = ApprovalStatus.APPROVED
            else:
                instance.status = ApprovalStatus.PENDING
        else:
            instance.status = ApprovalStatus.PENDING

        #Save changes
        self.instance_repo.update(db_obj=instance, update_data={"status": instance.status}) 
        

    def get_action(self, action_id: UUID) -> ApprovalAction:
        return self.repo.get_by_id(action_id)

    def list_actions(self, skip: int = 0, limit: int = 100) -> List[ApprovalAction]:
        return self.repo.list(skip=skip, limit=limit)

    