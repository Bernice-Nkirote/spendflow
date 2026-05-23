import uuid
from typing import Optional

from sqlalchemy.orm import Session

from app.models.user_refresh_token import UserRefreshToken


class UserRefreshTokenRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, refresh_token: UserRefreshToken) -> UserRefreshToken:
        self.db.add(refresh_token)
        self.db.flush()
        self.db.refresh(refresh_token)
        return refresh_token

    def get_by_token_hash(self, token_hash: str) -> Optional[UserRefreshToken]:
        return (
            self.db.query(UserRefreshToken)
            .filter(UserRefreshToken.token_hash == token_hash)
            .first()
        )

    def revoke(self, refresh_token: UserRefreshToken) -> UserRefreshToken:
        refresh_token.is_revoked = True
        self.db.flush()
        self.db.refresh(refresh_token)
        return refresh_token

    def revoke_all_for_user(
        self,
        user_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> None:
        (
            self.db.query(UserRefreshToken)
            .filter(
                UserRefreshToken.user_id == user_id,
                UserRefreshToken.company_id == company_id,
                UserRefreshToken.is_revoked.is_(False),
            )
            .update({"is_revoked": True}, synchronize_session=False)
        )
        self.db.flush()