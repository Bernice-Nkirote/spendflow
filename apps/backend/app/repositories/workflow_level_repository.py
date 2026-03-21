from sqlalchemy.orm import Session
from uuid import UUID
from app.models.workflow_level import WorkflowLevel

class WorkflowLevelRepository:
    def create(self, db: Session, level: WorkflowLevel):
        db.add(level)
        db.commit()
        db.refresh(level)
        return level
    
    def get_all(self, db: Session, workflow_id):
        return db.query(WorkflowLevel).filter(WorkflowLevel.workflow_id == workflow_id).all()
    
    def get_by_id(self, db: Session, level_id: UUID):
        return db.query(WorkflowLevel).filter(WorkflowLevel.id == level_id).first()
    