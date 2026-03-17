from sqlalchemy.orm import Session
from decimal import Decimal, ROUND_HALF_UP
from app.models.purchase_requisition import PurchaseRequisition
from app.models.purchase_requisition_item import PurchaseRequisitionItem
from uuid import UUID

class PRRepository:
    def create(self, db: Session, pr_data, user_id: UUID, company_id: UUID):
        # Calculate total
        total_amount = Decimal("0.00")
        for item in pr_data.items:
            total_amount += (item.quantity * item.unit_price).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_amount = total_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
       
        # Create PR
        db_pr = PurchaseRequisition(
            company_id=company_id,
            requested_by=user_id,
            department_id=pr_data.department_id,
            title=pr_data.title,
            description=pr_data.description,
            total_amount=total_amount,
            currency=pr_data.currency
        )

        db.add(db_pr)
        db.flush()

        # Create PR Items
        for item in pr_data.items:
            db_item = PurchaseRequisitionItem(
                requisition_id=db_pr.id,
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
               line_total=(item.quantity * item.unit_price).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            )
            db.add(db_item)

        db.commit()
        db.refresh(db_pr)
        return db_pr
    
    def list_by_company(self, db:Session, company_id:UUID):
        return db.query(PurchaseRequisition).filter_by(company_id=company_id).all()
    
    def get_by_id(self, db: Session, pr_id: UUID, company_id: UUID):
        return db.query(PurchaseRequisition).filter_by(id=pr_id, company_id=company_id).first()