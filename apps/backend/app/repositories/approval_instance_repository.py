import uuid
from typing import Optional, List

from sqlalchemy.orm import Session

from app.models.approval_instance import ApprovalInstance
from app.models.enums import EntityTypeEnum

class ApprovalInstanceRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, obj: ApprovalInstance) -> ApprovalInstance:
        """
        Create a new approval instance.
        """
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def get_by_id(
        self,
        obj_id: uuid.UUID,
        company_id: uuid.UUID
    ) -> Optional[ApprovalInstance]:
    
        # Fetch a single approval instance by ID within a company.
        
        return (
            self.db.query(ApprovalInstance)
            .filter(
                ApprovalInstance.id == obj_id,
                ApprovalInstance.company_id == company_id
            )
            .first()
        )

    def get_all(
        self,
        company_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100
    ) -> List[ApprovalInstance]:
        """
        Return all approval instances for a company.
        Ordered by most recent first for better UX.
        """
        return (
            self.db.query(ApprovalInstance)
            .filter(ApprovalInstance.company_id == company_id)
            .order_by(ApprovalInstance.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_entity(
        self,
        entity_id: uuid.UUID,
        entity_type: EntityTypeEnum,
        company_id: uuid.UUID
    ) -> Optional[ApprovalInstance]:
        """
        Fetch approval instance tied to a specific business entity (PR, PO, etc).
        """
        return (
            self.db.query(ApprovalInstance)
            .filter(
                ApprovalInstance.entity_id == entity_id,
                ApprovalInstance.entity_type == entity_type,
                ApprovalInstance.company_id == company_id
            )
            .first()
        )

    def update(
        self,
        db_obj: ApprovalInstance,
        update_data: dict
    ) -> ApprovalInstance:
        """
        Apply updates to an approval instance.
        Used for status changes and level progression.
        """
        for key, value in update_data.items():
            setattr(db_obj, key, value)

        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj