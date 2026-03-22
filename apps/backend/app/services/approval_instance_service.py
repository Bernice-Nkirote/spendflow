import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.approval_instance import ApprovalInstance
from app.repositories.approval_instance_repository import ApprovalInstanceRepository
from app.schemas.approval_instance_schema import ApprovalInstanceCreate
from app.models.enums import ApprovalStatus
from app.models.workflow_level import WorkflowLevel

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
        
        #  Here we set the first worklevel
        first_level = db.query(WorkflowLevel).filter(
            WorkflowLevel.workflow_id == data.workflow_id
        ).order_by(WorkflowLevel.level_order).first()

        if not first_level:
            raise HTTPException(
                status_code=400, 
                detail="Workflow has no levels")
        
        # Create Instance
        instance = ApprovalInstance(
            workflow_id=data.workflow_id,
            entity_id=data.entity_id,
            entity_type=data.entity_type,
            current_level_id=first_level.id,
            status=ApprovalStatus.PENDING
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

   