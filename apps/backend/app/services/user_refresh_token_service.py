import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from jose import JWTError, jwt

from app.core.config import settings
from app.core.security import (
    ALGORITHM,
    SECRET_KEY,
    create_access_token,
    create_refresh_token,
    hash_token,
)
from app.models.user import User
from app.models.user_refresh_token import UserRefreshToken
from app.repositories.user_refresh_token_repository import (
    UserRefreshTokenRepository,
)
from app.repositories.user_repository import UserRepository


class UserRefreshTokenService:
    def __init__(
        self,
        repo: UserRefreshTokenRepository,
        user_repo: UserRepository,
    ):
        self.repo = repo
        self.user_repo = user_repo

    def create_refresh_token_for_user(self, user: User) -> str:
        refresh_token = create_refresh_token(
            data={
                "sub": str(user.id),
                "company_id": str(user.company_id),
                "role_id": str(user.role_id),
                "type": "USER",
            }
        )

        token_record = UserRefreshToken(
            company_id=user.company_id,
            user_id=user.id,
            token_hash=hash_token(refresh_token),
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )

        self.repo.create(token_record)
        self.repo.db.commit()

        return refresh_token

    def refresh_access_token(self, refresh_token: str) -> dict:
        try:
            payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            )

        if payload.get("token_type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            )

        if payload.get("type") != "USER":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            )

        user_id = payload.get("sub")
        company_id = payload.get("company_id")

        if not user_id or not company_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            )

        token_record = self.repo.get_by_token_hash(hash_token(refresh_token))

        if not token_record or token_record.is_revoked:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired or was revoked.",
            )

        if token_record.expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired.",
            )

        user = self.user_repo.get_by_id(uuid.UUID(user_id), uuid.UUID(company_id))

        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is inactive or no longer exists.",
            )

        access_token = create_access_token(
            data={
                "sub": str(user.id),
                "company_id": str(user.company_id),
                "role_id": str(user.role_id),
                "type": "USER",
            }
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }

    def revoke_refresh_token(self, refresh_token: str) -> None:
        token_record = self.repo.get_by_token_hash(hash_token(refresh_token))

        if token_record and not token_record.is_revoked:
            self.repo.revoke(token_record)
            self.repo.db.commit()