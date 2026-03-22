import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.services.approval_instance_service import ApprovalInstanceService
from app.schemas.approval_instance_schema import (
    ApprovalInstanceCreate,
    ApprovalInstanceRead
)
from app.core.auth_dependancy import get_current_user

router = APIRouter(prefix="/approval-instances", tags=["Approval Instances"])

service = ApprovalInstanceService()


@router.post("/", response_model=ApprovalInstanceRead)
def create_instance(
    data: ApprovalInstanceCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)

):
    return service.create_instance(
        db, 
        data,
        user["company_id"])


@router.get("/", response_model=List[ApprovalInstanceRead])
def get_all_instances(db: Session = Depends(get_db)):
    return service.get_all_instances(db)


@router.get("/{instance_id}", response_model=ApprovalInstanceRead)
def get_instance(
    instance_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    return service.get_instance(db, instance_id)

