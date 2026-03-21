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

router = APIRouter(prefix="/approval-instances", tags=["Approval Instances"])

service = ApprovalInstanceService()


@router.post("/", response_model=ApprovalInstanceRead)
def create_instance(
    data: ApprovalInstanceCreate,
    db: Session = Depends(get_db)
):
    return service.create_instance(db, data)


@router.get("/", response_model=List[ApprovalInstanceRead])
def get_all_instances(db: Session = Depends(get_db)):
    return service.get_all_instances(db)


@router.get("/{instance_id}", response_model=ApprovalInstanceRead)
def get_instance(
    instance_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    return service.get_instance(db, instance_id)


#  MOVE TO NEXT LEVEL
@router.put("/{instance_id}/next-level/{level_id}", response_model=ApprovalInstanceRead)
def move_to_next_level(
    instance_id: uuid.UUID,
    level_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    return service.move_to_next_level(db, instance_id, level_id)


# APPROVE
@router.put("/{instance_id}/approve", response_model=ApprovalInstanceRead)
def approve_instance(
    instance_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    return service.approve_instance(db, instance_id)


# REJECT
@router.put("/{instance_id}/reject", response_model=ApprovalInstanceRead)
def reject_instance(
    instance_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    return service.reject_instance(db, instance_id)


@router.delete("/{instance_id}")
def delete_instance(
    instance_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    return service.delete_instance(db, instance_id)