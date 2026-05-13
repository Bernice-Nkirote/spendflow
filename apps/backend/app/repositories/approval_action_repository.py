from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.models.approval_action import ApprovalAction


class ApprovalActionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, action: ApprovalAction) -> ApprovalAction:
        self.db.add(action)
        self.db.flush()
        self.db.refresh(action)
        return action

    def get_by_id(
        self,
        action_id: UUID,
        company_id: UUID,
    ) -> Optional[ApprovalAction]:
        return (
            self.db.query(ApprovalAction)
            .options(joinedload(ApprovalAction.user))
            .filter(
                ApprovalAction.id == action_id,
                ApprovalAction.company_id == company_id,
            )
            .first()
        )

    def get_all(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[ApprovalAction]:
        return (
            self.db.query(ApprovalAction)
            .options(joinedload(ApprovalAction.user))
            .filter(ApprovalAction.company_id == company_id)
            .order_by(ApprovalAction.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_instance(
        self,
        instance_id: UUID,
        company_id: UUID,
    ) -> list[ApprovalAction]:
        return (
            self.db.query(ApprovalAction)
            .options(joinedload(ApprovalAction.user))
            .filter(
                ApprovalAction.instance_id == instance_id,
                ApprovalAction.company_id == company_id,
            )
            .order_by(ApprovalAction.created_at.asc())
            .all()
        )

    def get_by_instance_and_level_and_user(
        self,
        instance_id: UUID,
        level_id: UUID,
        user_id: UUID,
        company_id: UUID,
    ) -> Optional[ApprovalAction]:
        return (
            self.db.query(ApprovalAction)
            .filter(
                ApprovalAction.instance_id == instance_id,
                ApprovalAction.level_id == level_id,
                ApprovalAction.user_id == user_id,
                ApprovalAction.company_id == company_id,
            )
            .first()
        )

    def get_by_instance_and_user(
        self,
        instance_id: UUID,
        user_id: UUID,
        company_id: UUID,
    ) -> Optional[ApprovalAction]:
        return (
            self.db.query(ApprovalAction)
            .filter(
                ApprovalAction.instance_id == instance_id,
                ApprovalAction.user_id == user_id,
                ApprovalAction.company_id == company_id,
            )
            .first()
        )

    def get_latest_by_instance(
        self,
        instance_id: UUID,
        company_id: UUID,
    ) -> Optional[ApprovalAction]:
        return (
            self.db.query(ApprovalAction)
            .filter(
                ApprovalAction.instance_id == instance_id,
                ApprovalAction.company_id == company_id,
            )
            .order_by(ApprovalAction.created_at.desc())
            .first()
        )

    def update(self, action: ApprovalAction) -> ApprovalAction:
        self.db.flush()
        self.db.refresh(action)
        return action