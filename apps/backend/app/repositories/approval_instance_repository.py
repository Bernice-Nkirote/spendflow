import uuid
from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.approval_instance import ApprovalInstance


class ApprovalInstanceRepository:

    def create(self, db: Session, obj: ApprovalInstance) -> ApprovalInstance:
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    def get_by_id(self, db: Session, obj_id: uuid.UUID) -> Optional[ApprovalInstance]:
        return db.query(ApprovalInstance).filter(
            ApprovalInstance.id == obj_id
        ).first()

    def get_all(self, db: Session) -> List[ApprovalInstance]:
        return db.query(ApprovalInstance).all()

    def get_by_entity(self, db: Session, entity_id: uuid.UUID) -> Optional[ApprovalInstance]:
        return db.query(ApprovalInstance).filter(
            ApprovalInstance.entity_id == entity_id
        ).first()

    def update(self, db: Session, db_obj: ApprovalInstance, update_data: dict) -> ApprovalInstance:
        for key, value in update_data.items():
            setattr(db_obj, key, value)

        db.commit()
        db.refresh(db_obj)
        return db_obj

    