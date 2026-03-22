from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.schemas.approval_action_schema import ApprovalActionCreate, ApprovalActionRead
from app.services.approval_action_service import ApprovalActionService
from app.repositories.approval_action_repository import ApprovalActionRepository
from app.repositories.approval_instance_repository import ApprovalInstanceRepository
from app.core.database import get_db

router = APIRouter(prefix="/approval-actions", tags=["Approval Actions"])

# Dependency to inject service
def get_service(db: Session = Depends(get_db)):

    action_repo = ApprovalActionRepository()
    instance_repo = ApprovalInstanceRepository()

    return ApprovalActionService(action_repo, instance_repo)

@router.post("/", response_model=ApprovalActionRead)
def create_action(
    approval_action: ApprovalActionCreate,
    service: ApprovalActionService = Depends(get_service)
):
    try: 
        return service.create_action(db, approval_action)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{action_id}", response_model=ApprovalActionRead)
def get_action(
    action_id: UUID,
    service: ApprovalActionService = Depends(get_service)
):
    db_action = service.get_action(action_id)
    if not db_action:
        raise HTTPException(status_code=404, detail="Approval Action not found")
    return db_action

@router.get("/", response_model=List[ApprovalActionRead])
def list_actions(
    skip: int = 0,
    limit: int = 100,
    service: ApprovalActionService = Depends(get_service)
):
    return service.list_actions(skip=skip, limit=limit)

@router.get("/instance/{instance_id}", response_model=List[ApprovalActionRead])
def get_actions_by_instance(
    instance_id: UUID,
    service: ApprovalActionService = Depends(get_service)
):
    return service.get_actions_by_instance(instance_id)