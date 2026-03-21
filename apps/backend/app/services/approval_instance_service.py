import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.approval_instance import ApprovalInstance
from app.repositories.approval_instance_repository import ApprovalInstanceRepository
from app.schemas.approval_instance_schema import ApprovalInstanceCreate


class ApprovalInstanceService:

    def __init__(self):
        self.repo = ApprovalInstanceRepository()

    # CREATE INSTANCE (START WORKFLOW)
    def create_instance(self, db: Session, data: ApprovalInstanceCreate):

        # Prevent duplicate instance per entity
        existing = self.repo.get_by_entity(db, data.entity_id)
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Approval instance already exists for this entity"
            )

        instance = ApprovalInstance(
            id=uuid.uuid4(),
            workflow_id=data.workflow_id,
            entity_id=data.entity_id,
            entity_type=data.entity_type,
            status="PENDING"
        )

        return self.repo.create(db, instance)

    def get_instance(self, db: Session, instance_id: uuid.UUID):
        instance = self.repo.get_by_id(db, instance_id)

        if not instance:
            raise HTTPException(
                status_code=404,
                detail="Approval instance not found"
            )

        return instance

    def get_all_instances(self, db: Session):
        return self.repo.get_all(db)

    #  MOVE TO NEXT LEVEL (CORE LOGIC)
    def move_to_next_level(self, db: Session, instance_id: uuid.UUID, next_level_id: uuid.UUID):

        instance = self.repo.get_by_id(db, instance_id)

        if not instance:
            raise HTTPException(status_code=404, detail="Instance not found")

        update_data = {
            "current_level_id": next_level_id
        }

        return self.repo.update(db, instance, update_data)

    # APPROVE INSTANCE
    def approve_instance(self, db: Session, instance_id: uuid.UUID):

        instance = self.repo.get_by_id(db, instance_id)

        if not instance:
            raise HTTPException(status_code=404, detail="Instance not found")

        update_data = {
            "status": "APPROVED",
            "current_level_id": None
        }

        return self.repo.update(db, instance, update_data)

    # REJECT INSTANCE
    def reject_instance(self, db: Session, instance_id: uuid.UUID):

        instance = self.repo.get_by_id(db, instance_id)

        if not instance:
            raise HTTPException(status_code=404, detail="Instance not found")

        update_data = {
            "status": "REJECTED",
            "current_level_id": None
        }

        return self.repo.update(db, instance, update_data)

    def delete_instance(self, db: Session, instance_id: uuid.UUID):
        instance = self.repo.get_by_id(db, instance_id)

        if not instance:
            raise HTTPException(status_code=404, detail="Instance not found")

        self.repo.delete(db, instance)
        return {"message": "Deleted successfully"}