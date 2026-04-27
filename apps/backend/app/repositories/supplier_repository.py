from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.invoice import Invoice
from app.models.purchase_order import PurchaseOrder
from app.models.supplier import Supplier


class SupplierRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, supplier: Supplier) -> Supplier:
        self.db.add(supplier)
        self.db.flush()
        self.db.refresh(supplier)
        return supplier

    def get_by_id(self, supplier_id: UUID, company_id: UUID) -> Optional[Supplier]:
        return (
            self.db.query(Supplier)
            .filter(
                Supplier.id == supplier_id,
                Supplier.company_id == company_id,
            )
            .first()
        )

    def get_all(self, company_id: UUID, skip: int = 0, limit: int = 20) -> list[Supplier]:
        return (
            self.db.query(Supplier)
            .filter(Supplier.company_id == company_id)
            .order_by(Supplier.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_name(self, name: str, company_id: UUID) -> Optional[Supplier]:
        return (
            self.db.query(Supplier)
            .filter(Supplier.name == name, Supplier.company_id == company_id)
            .first()
        )

    def get_by_email(self, email: str, company_id: UUID) -> Optional[Supplier]:
        return (
            self.db.query(Supplier)
            .filter(Supplier.email == email, Supplier.company_id == company_id)
            .first()
        )

    def get_by_phone(self, phone: str, company_id: UUID) -> Optional[Supplier]:
        return (
            self.db.query(Supplier)
            .filter(Supplier.phone == phone, Supplier.company_id == company_id)
            .first()
        )

    def has_invoices(self, supplier_id: UUID, company_id: UUID) -> bool:
        return (
            self.db.query(Invoice)
            .filter(Invoice.supplier_id == supplier_id, Invoice.company_id == company_id)
            .first()
            is not None
        )

    def has_purchase_orders(self, supplier_id: UUID, company_id: UUID) -> bool:
        return (
            self.db.query(PurchaseOrder)
            .filter(
                PurchaseOrder.supplier_id == supplier_id,
                PurchaseOrder.company_id == company_id,
            )
            .first()
            is not None
        )

    def update(self, supplier: Supplier) -> Supplier:
        self.db.flush()
        self.db.refresh(supplier)
        return supplier

    def delete(self, supplier: Supplier) -> None:
        self.db.delete(supplier)
        self.db.flush()