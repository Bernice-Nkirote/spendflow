from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.schemas.pr import PurchaseRequisitionCreate, PurchaseRequisitionRead, PRItemCreate
from app.repositories.pr_repository import PRRepository
from app.services.pr_service import PRService
from app.core.auth_dependancy import get_current_user

router = APIRouter(prefix="/purchase-requisitions", tags=["Purchase Requisitions"])

repo = PRRepository()
service = PRService(repo=repo)

@router.post("/", response_model=PurchaseRequisitionRead)
def create_pr(
    pr: PurchaseRequisitionCreate, 
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)):
   
    if not pr.items:
        raise HTTPException(status_code=400, detail="PR must contain at least one item")
    try:
        return service.create_pr(
            db, 
            pr, 
            user["sub"], 
            user["company_id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# List PR for company whose user is current user
@router.get("/", response_model=List[PurchaseRequisitionRead])
def list_prs(
    db: Session = Depends(get_db), 
    user: dict = Depends(get_current_user)):
    return service.list_prs(db, user["company_id"])

# Get pr from company whose user is current user

@router.get("/{pr_id}",response_model=PurchaseRequisitionRead)
def get_pr(
    pr_id: UUID, 
    db: Session = Depends(get_db), 
    user: dict = Depends(get_current_user)):
    pr = service.get_pr(db, pr_id, user["company_id"])
    if not pr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PR not found")
    return pr
    