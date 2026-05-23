from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.user_password_reset_token import UserPasswordResetToken


class UserPasswordResetTokenRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, token: UserPasswordResetToken) -> UserPasswordResetToken:
        self.db.add(token)
        self.db.flush()
        self.db.refresh(token)
        return token

    def get_by_token_hash(self, token_hash: str) -> Optional[UserPasswordResetToken]:
        return (
            self.db.query(UserPasswordResetToken)
            .filter(UserPasswordResetToken.token_hash == token_hash)
            .first()
        )

    def update(self, token: UserPasswordResetToken) -> UserPasswordResetToken:
        self.db.flush()
        self.db.refresh(token)
        return token
    
    def get_latest_active_by_user(
        self,
        user_id: UUID,
        company_id: UUID,
    ) -> Optional[UserPasswordResetToken]:
        return (
            self.db.query(UserPasswordResetToken)
            .filter(
                UserPasswordResetToken.user_id == user_id,
                UserPasswordResetToken.company_id == company_id,
                UserPasswordResetToken.is_used == False,
            )
            .order_by(UserPasswordResetToken.created_at.desc())
            .first()
        )