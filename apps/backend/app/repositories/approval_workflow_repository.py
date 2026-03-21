from sqlalchemy.orm import Session
from app.models.approval_workflows_table import ApprovalWorkflow
from uuid import UUID

class ApprovalWorkflowRepository:
    def create(self, db: Session, workflow: ApprovalWorkflow):
        db.add(workflow)
        db.commit()
        db.refresh(workflow)
        return workflow
    
    def get_all(self, db:Session, company_id):
        return db.query(ApprovalWorkflow).filter(ApprovalWorkflow.company_id == company_id).all()
    
    def get_by_id(self, db: Session, workflow_id: UUID, company_id: UUID):
        return db.query(ApprovalWorkflow).filter(
            ApprovalWorkflow.id == workflow_id,
            ApprovalWorkflow.company_id == company_id
        ).first()