# services/approval_workflow_service.py

import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.approval_workflows_table import ApprovalWorkflow
from app.schemas.approval_workflows_schema import ApprovalWorkflowCreate
from app.repositories.approval_workflow_repository import ApprovalWorkflowRepository


class ApprovalWorkflowService:

    def __init__(self, repo: ApprovalWorkflowRepository):
        self.repo = repo

    def create_workflow(self, db: Session, workflow_data: ApprovalWorkflowCreate, company_id):
        # check for duplicate name
        existing = self.repo.get_all(db, company_id)
        for wf in existing:
            if wf.name == workflow_data.name:
                raise HTTPException(
                    status_code=400,
                    detail="Workflow Already exists"
                )
            # create workflow
        workflow = ApprovalWorkflow(
            name=workflow_data.name,
            entity_type=workflow_data.entity_type,
            company_id=company_id, 
            is_active=True
        )

        return self.repo.create(db, workflow)

    def list_workflows(self, db: Session, company_id):
        return self.repo.get_all(db, company_id)

    def get_workflow(self, db: Session, workflow_id, company_id):
        workflow = self.repo.get_by_id(db, workflow_id, company_id)

        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found"
            )

        return workflow