from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID
from app.core.database import get_db
from app.models.purchase_requisition import PurchaseRequisition
from app.models.purchase_requisition_item import PurchaseRequisitionItem
from app.schemas.pr import PurchaseRequisitionCreate, PurchaseRequisitionRead, PRItemCreate

router = APIRouter(prefix="/purchase-requisitions", tags=["Purchase Requisitions"])

# Placeholder for auth
def get_current_user():
    return {
        "id": UUID("9a1b2c3d-7e8f-4a11-b222-123456789abc"),
        "company_id": UUID("c3b6f0c4-8f9d-4e62-9c51-5a4f7a5b3f90")
    }
@router.post("/", response_model=PurchaseRequisitionRead)
def create_pr(pr: PurchaseRequisitionCreate, db: Session = Depends(get_db),user: dict = Depends(get_current_user)):
   
    if not pr.items:
        raise HTTPException(status_code=400, detail="PR must contain at least one item")
    try:
        # Calculate total
        total_amount = Decimal("0.00")

        for item in pr.items:
            line_total = (
                item.quantity * item.unit_price
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            total_amount += line_total
        total_amount = total_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    
        
    # Create PR
        db_pr = PurchaseRequisition(
            company_id=user["company_id"],
            requested_by=user["id"],
            department_id=pr.department_id,
            title=pr.title,
            description=pr.description,
            total_amount=total_amount,
            currency=pr.currency
    )
        db.add(db_pr)
        db.flush()
   

    # Create PR Items
        for item in pr.items:
            line_total = (
                item.quantity * item.unit_price
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            db_item = PurchaseRequisitionItem(
                requisition_id=db_pr.id,
                description= item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                line_total=line_total
        )
            db.add(db_item)

        db.commit()
        db.refresh(db_pr)

        return db_pr
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[PurchaseRequisitionRead])
def list_prs(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    prs = db.query(PurchaseRequisition).filter_by(company_id=user["company_id"]).all()
    return prs

@router.get("/{pr_id}",response_model=PurchaseRequisitionRead)
def get_pr(pr_id: UUID, db: Session = Depends(get_db), user:dict=Depends(get_current_user)):
    pr = db.query(PurchaseRequisition).filter_by(id=pr_id, company_id=user["company_id"]).first()
    if not pr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PR not found")
    return pr
    