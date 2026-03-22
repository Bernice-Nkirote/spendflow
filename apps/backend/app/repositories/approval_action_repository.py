# app/repositories/approval_action_repo.py
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.models.approval_action import ApprovalAction
from app.schemas.approval_action_schema import ApprovalActionCreate

class ApprovalActionRepository:

    def create(self, db: Session, obj: ApprovalAction) -> ApprovalAction:
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj
            
    def get_by_id(self, action_id: UUID) -> ApprovalAction:
        return self.db.query(ApprovalAction).filter(ApprovalAction.id == action_id).first()

    def list(self, skip: int = 0, limit: int = 100) -> List[ApprovalAction]:
        return self.db.query(ApprovalAction).offset(skip).limit(limit).all()

    def get_by_instance(self, instance_id: UUID) -> List[ApprovalAction]:
        return (
            self.db.query(ApprovalAction)
            .filter(ApprovalAction.instance_id == instance_id)
            .order_by(ApprovalAction.created_at.asc())
            .all()
        )