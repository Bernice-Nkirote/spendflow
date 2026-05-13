from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.models.user_onboarding_token import UserOnboardingToken


class UserOnboardingTokenRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, token: UserOnboardingToken) -> UserOnboardingToken:
        self.db.add(token)
        self.db.flush()
        self.db.refresh(token)
        return token

    def get_by_token_hash(self, token_hash: str) -> Optional[UserOnboardingToken]:
        return (
            self.db.query(UserOnboardingToken)
            .filter(UserOnboardingToken.token_hash == token_hash)
            .first()
        )

    def get_active_by_user(
        self,
        user_id: UUID,
        company_id: UUID,
    ) -> Optional[UserOnboardingToken]:
        return (
            self.db.query(UserOnboardingToken)
            .filter(
                UserOnboardingToken.user_id == user_id,
                UserOnboardingToken.company_id == company_id,
                UserOnboardingToken.is_used == False,
            )
            .order_by(UserOnboardingToken.created_at.desc())
            .first()
        )

    def update(self, token: UserOnboardingToken) -> UserOnboardingToken:
        self.db.flush()
        self.db.refresh(token)
        return token