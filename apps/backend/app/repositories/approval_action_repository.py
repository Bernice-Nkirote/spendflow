from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.approval_action import ApprovalAction


class ApprovalActionRepository:
    def __init__(self, db: Session):
        # Reuse one DB session per request
        self.db = db

    def create(self, obj: ApprovalAction) -> ApprovalAction:
        
        # Create a new approval action record.
    
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def get_by_id(
        self,
        action_id: UUID,
        company_id: UUID
    ) -> Optional[ApprovalAction]:
        """
        Get one approval action by ID within the current company.
        """
        return (
            self.db.query(ApprovalAction)
            .filter(
                ApprovalAction.id == action_id,
                ApprovalAction.company_id == company_id
            )
            .first()
        )

    def get_all(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> List[ApprovalAction]:
        """
        List approval actions for the current company.
        """
        return (
            self.db.query(ApprovalAction)
            .filter(ApprovalAction.company_id == company_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_instance(
        self,
        instance_id: UUID,
        company_id: UUID
    ) -> List[ApprovalAction]:
        """
        Get all approval actions for a specific approval instance,
        from oldest to newest for audit/history display.
        """
        return (
            self.db.query(ApprovalAction)
            .filter(
                ApprovalAction.instance_id == instance_id,
                ApprovalAction.company_id == company_id
            )
            .order_by(ApprovalAction.created_at.asc())
            .all()
        )

    def get_by_instance_and_level_and_user(
        self,
        instance_id: UUID,
        level_id: UUID,
        user_id: UUID,
        company_id: UUID
    ) -> Optional[ApprovalAction]:
        """
        Check whether a specific user has already acted on a given
        approval instance at a given workflow level.
        """
        return (
            self.db.query(ApprovalAction)
            .filter(
                ApprovalAction.instance_id == instance_id,
                ApprovalAction.level_id == level_id,
                ApprovalAction.user_id == user_id,
                ApprovalAction.company_id == company_id
            )
            .first()
        )

    def get_latest_by_instance(
        self,
        instance_id: UUID,
        company_id: UUID
    ) -> Optional[ApprovalAction]:
        """
        Return the most recent approval action for an approval instance.
        Useful for workflow progression.
        """
        return (
            self.db.query(ApprovalAction)
            .filter(
                ApprovalAction.instance_id == instance_id,
                ApprovalAction.company_id == company_id
            )
            .order_by(ApprovalAction.created_at.desc())
            .first()
        )

    def update(
        self,
        db_obj: ApprovalAction,
        update_data: dict
    ) -> ApprovalAction:
        """
        Update an approval action record if needed.
        """
        for key, value in update_data.items():
            setattr(db_obj, key, value)

        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj