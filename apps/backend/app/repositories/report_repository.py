from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.invoice import Invoice
from app.models.purchase_order import PurchaseOrder
from app.models.payments import Payment
from app.models.supplier import Supplier
from app.models.department import Department

class ReportRepository:
    # Supplier spend
    def supplier_spend(self, db:Session):
        return db.query(
            Supplier.name.label("supplier_name"),
            func.coalesce(func.sum(Invoice.total_amount), 0).label("total_spend"),
            func.count(Invoice.id).label("invoice_count")       
        ).join(
            Invoice, Invoice.supplier_id == Supplier.id
        ).group_by(
            Supplier.name
        ).all()
    
    # Department Spend
    def department_spend(self, db:Session):
        return db.query(
            Department.name.label("department_name"),
            func.coalesce(func.sum(PurchaseOrder.total_amount), 0).label("total_spend"),
            func.count(PurchaseOrder.id).label("po_count")
        ).join(
            PurchaseOrder, PurchaseOrder.department_id == Department.id
        ).group_by(
            Department.name
        ).all()

    # Lead Time
    def lead_time(self, db: Session):
        return db.query(
            PurchaseOrder.po_number,
            Supplier.name.label("supplier_name"),
            func.avg(
                func.extract('epoch', Payment.paid_at - PurchaseOrder.created_at) / 86400
            ).label("avg_lead_time_days")
        ).join(
            Invoice, Invoice.purchase_order_id == PurchaseOrder.id
        ).join(
            Payment, Payment.invoice_id == Invoice.id
        ).join(
            Supplier, Supplier.id == PurchaseOrder.supplier_id
        ).group_by(
            PurchaseOrder.po_number,
            Supplier.name
        ).all()