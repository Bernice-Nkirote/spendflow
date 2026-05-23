from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.supplier_password_reset_token import SupplierPasswordResetToken


class SupplierPasswordResetTokenRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        token: SupplierPasswordResetToken,
    ) -> SupplierPasswordResetToken:
        self.db.add(token)
        self.db.flush()
        self.db.refresh(token)
        return token

    def get_by_token_hash(
        self,
        token_hash: str,
    ) -> Optional[SupplierPasswordResetToken]:
        return (
            self.db.query(SupplierPasswordResetToken)
            .filter(SupplierPasswordResetToken.token_hash == token_hash)
            .first()
        )

    def get_latest_active_by_supplier_user(
        self,
        supplier_user_id: UUID,
        supplier_id: UUID,
        company_id: UUID,
    ) -> Optional[SupplierPasswordResetToken]:
        return (
            self.db.query(SupplierPasswordResetToken)
            .filter(
                SupplierPasswordResetToken.supplier_user_id == supplier_user_id,
                SupplierPasswordResetToken.supplier_id == supplier_id,
                SupplierPasswordResetToken.company_id == company_id,
                SupplierPasswordResetToken.is_used == False,
            )
            .order_by(SupplierPasswordResetToken.created_at.desc())
            .first()
        )

    def update(
        self,
        token: SupplierPasswordResetToken,
    ) -> SupplierPasswordResetToken:
        self.db.flush()
        self.db.refresh(token)
        return token