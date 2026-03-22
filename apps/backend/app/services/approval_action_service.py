from uuid import UUID
from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.repositories.approval_action_repository import ApprovalActionRepository
from app.repositories.approval_instance_repository import ApprovalInstanceRepository
from app.models.approval_instance import ApprovalStatus
from app.schemas.approval_action_schema import ApprovalActionCreate
from app.models.approval_action import ApprovalAction
from app.models.enums import ActionType, ApprovalStatus
from app.models.workflow_level import WorkflowLevel
from app.models.user_role import UserRole
from app.repositories.workflow_role_repository import WorkflowLevelRoleRepository
from app.core.auth_dependancy import get_current_user

class ApprovalActionService:

    def __init__(self, repo, instance_repo):
        self.repo = repo
        self.instance_repo = instance_repo
        self.level_role_repo = WorkflowLevelRoleRepository

    def create_action(self, db: Session, data: ApprovalActionCreate, current_user):
        # 1.Get Instance
        instance = self.instance_repo.get_by_id(db, data.instance_id)
        if not instance:
            raise HTTPException(404, "Approval Instance not found")
        
        #2. Ensure that user is acting on current level
        if instance.current_level_id != data.level_id:
            raise HTTPException(400, "Not current approval level")
        
        #3. Get roles allowed for this level
        level_roles = self.level_role_repo.get_by_level(db, data.level_id)
        allowed_role_ids = [lr.role_id for lr in level_roles]

        # Get user roles
        user_roles = db.query(UserRole).filter(
            UserRole.user_id == data.user_id
        ).all()

        user_role_ids = [ur.role_id for ur in user_roles]

        # Check permission the roles have
        if not any(role_id in allowed_role_ids for role_id in user_role_ids):
            raise HTTPException(403, "User not allowed")
        
        # Prevent duplicate action
        existing = self.repo.get_by_instance(db, data.instance_id)
        for act in existing:
            if act.level_id == data.level_id and act.user_id == data.user_id:
                raise HTTPException(400, "User already acted on this level")

        # Create action
        action = ApprovalAction(
            instance_id = data.instance_id,
            level_id=data.level_id,
            user_id=current_user["id"],
            action=data.action,
            comment=data.comment
        )

        self.repo.create(db, action)

        # Apply workflow logic
        self._apply_workflow_logic(db, instance, data)

        return action
    
    def _apply_workflow_logic(self, db: Session, instance, data):
        # End immediately if rejected
        if data.action == ActionType.REJECTED:
            instance.status = ApprovalStatus.REJECTED
            instance.current_level_id = None
            db.commit()
            return
        
        # Get all the actions
        actions = self.repo.get_by_instance(db, instance.id)

        # Get roles for this level
        level_roles = self.level_role_repo.get_by_level(db, instance.current_level_id)
        required_roles = {lr.role_id for lr in level_roles}

        approved_roles = {
            act.user_id for act in actions
            if act.levele_id == instance.current_level_id
            and act.action == ActionType.APPROVED
        }

        # Check if all roles approved
        if required_roles.issubset(approved_roles):

            # Get next level
            next_level = db.query(WorkflowLevel).filter(
                WorkflowLevel.workflow_id == instance.workflow_id,
                WorkflowLevel.level_order > instance.current_level.level_order
            ).order_by(WorkflowLevel.level_order).first()

            if next_level:
                instance.current_level_id = next_level.id
            else:
                instance.status = ApprovalStatus.APPROVED
                instance.current_level_id = None

        db.commit()
