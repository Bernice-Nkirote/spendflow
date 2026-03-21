import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.workflow_level import WorkflowLevel
from app.models.approval_workflows_table import ApprovalWorkflow
from app.schemas.workflow_levels_schema import WorkflowLevelCreate
from app.repositories.workflow_level_repository import WorkflowLevelRepository

class WorkflowLevelService:
    def __init__(self, repo: WorkflowLevelRepository):
        self.repo = repo
    

    def create_level(self, db: Session, level_data: WorkflowLevelCreate, company_id):
       
        # SECURITY CHECK: Ensures that the workflow belongs to user company
        workflow = db.query(ApprovalWorkflow).filter(
            ApprovalWorkflow.id == level_data.workflow_id,
            ApprovalWorkflow.company_id == company_id
        ).first()

        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized workflow"
            )       
        
        # Check whether the workflow alreay has level order
        existing_levels = self.repo.get_all(db, level_data.workflow_id)

        for lvl in existing_levels:
            if lvl.level_order == level_data.level_order:
                raise HTTPException(
                    status_code=400,
                    detail="Level Order already Exists in this workflow"
                )
        
        # proceed to create workflow level
        level = WorkflowLevel(
            workflow_id=level_data.workflow_id,
            level_order=level_data.level_order,
            name=level_data.name,
            min_amount=level_data.min_amount,
            max_amount=level_data.max_amount,
            department_id=level_data.department_id,
            condition_expression=level_data.condition_expression
        )

        return self.repo.create(db, level)

    def list_levels(self, db: Session, workflow_id, company_id):
        workflow = db.query(ApprovalWorkflow).filter(
            ApprovalWorkflow.id == workflow_id,
            ApprovalWorkflow.company_id == company_id
        ).first()

        if not workflow:
            raise HTTPException(
                status_code=403,
                detail="Unauthorized workflow"
            )
        return self.repo.get_all(db, workflow_id)

    def get_level(self, db: Session, level_id, company_id):
        level = self.repo.get_by_id(db, level_id)

        if not level:
            return None
        
        if level.workflow.company_id !=company_id:
            raise HTTPException(
                status_code=403,
                detail="Unauthorised access"
            )
        
        return level