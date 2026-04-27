from uuid import UUID

from sqlalchemy.orm import Session

from app.models.suplier_user import SupplierUser


class SupplierUserRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, supplier_user: SupplierUser) -> SupplierUser:
        self.db.add(supplier_user)
        self.db.flush()
        self.db.refresh(supplier_user)
        return supplier_user

    def get_by_id(
        self,
        supplier_user_id: UUID,
        supplier_id: UUID,
    ) -> SupplierUser | None:
        return (
            self.db.query(SupplierUser)
            .filter(
                SupplierUser.id == supplier_user_id,
                SupplierUser.supplier_id == supplier_id,
            )
            .first()
        )

    def get_all(
        self,
        supplier_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[SupplierUser]:
        return (
            self.db.query(SupplierUser)
            .filter(SupplierUser.supplier_id == supplier_id)
            .order_by(SupplierUser.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_email(
        self,
        email: str,
        supplier_id: UUID,
    ) -> SupplierUser | None:
        return (
            self.db.query(SupplierUser)
            .filter(
                SupplierUser.email == email,
                SupplierUser.supplier_id == supplier_id,
            )
            .first()
        )

    def get_by_email_global(
        self,
        email: str,
    ) -> SupplierUser | None:
        return (
            self.db.query(SupplierUser)
            .filter(SupplierUser.email == email)
            .first()
        )

    def update(
        self,
        supplier_user: SupplierUser,
        update_data: dict,
    ) -> SupplierUser:
        for key, value in update_data.items():
            setattr(supplier_user, key, value)

        self.db.flush()
        self.db.refresh(supplier_user)
        return supplier_user

    def delete(
        self,
        supplier_user: SupplierUser,
    ) -> None:
        self.db.delete(supplier_user)
        self.db.flush()