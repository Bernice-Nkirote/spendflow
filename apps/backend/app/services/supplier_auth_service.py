import uuid
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt

from fastapi import HTTPException, status

from app.core.security import (
    ALGORITHM,
    SECRET_KEY,
    create_access_token,
    create_refresh_token,
    generate_secure_token,
    hash_token,
)
from app.core.config import settings

from app.models.supplier_refresh_token import SupplierRefreshToken
from app.models.supplier_password_reset_token import SupplierPasswordResetToken
from app.schemas.supplier_auth_schema import SupplierLogin


class SupplierAuthService:
    def __init__(
        self,
        supplier_user_repo,
        supplier_password_reset_token_repo,
        supplier_refresh_token_repo,
        password_service,
        email_service,
        audit_log_service,
    ):
        self.supplier_user_repo = supplier_user_repo
        self.supplier_password_reset_token_repo = supplier_password_reset_token_repo
        self.supplier_refresh_token_repo = supplier_refresh_token_repo
        self.password_service = password_service
        self.email_service = email_service
        self.audit_log_service = audit_log_service

    def login_supplier(
        self,
        login_data: SupplierLogin,
    ):
        email = login_data.email.strip().lower()
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is required",
            )

        password = login_data.password.strip()
        if not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is required",
            )

        supplier_user = self.supplier_user_repo.get_by_email_global(email)
        if not supplier_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        if not supplier_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Supplier account is inactive",
            )

        if not supplier_user.hashed_password or not supplier_user.has_completed_onboarding:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please set your password before logging in",
            )

        if not self.password_service.verify_password(
            password,
            supplier_user.hashed_password,
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        access_token = create_access_token(
            data={
                "sub": str(supplier_user.id),
                "type": "SUPPLIER",
                "supplier_id": str(supplier_user.supplier_id),
            }
        )

        refresh_token = create_refresh_token(
            data={
                "sub": str(supplier_user.id),
                "type": "SUPPLIER",
                "supplier_id": str(supplier_user.supplier_id),
            }
        )

        refresh_token_record = SupplierRefreshToken(
            supplier_id=supplier_user.supplier_id,
            supplier_user_id=supplier_user.id,
            token_hash=hash_token(refresh_token),
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )

        self.supplier_refresh_token_repo.create(refresh_token_record)
        self.supplier_user_repo.db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    def request_password_reset(
        self,
        email: str,
    ) -> None:
        normalized_email = email.strip().lower()

        if not normalized_email:
            return None

        supplier_user = self.supplier_user_repo.get_by_email_global(normalized_email)

        if not supplier_user:
            return None

        if not supplier_user.is_active:
            return None

        if not supplier_user.supplier or not supplier_user.supplier.is_active:
            return None

        company_id = supplier_user.supplier.company_id

        existing_active_token = (
            self.supplier_password_reset_token_repo.get_latest_active_by_supplier_user(
                supplier_user_id=supplier_user.id,
                supplier_id=supplier_user.supplier_id,
                company_id=company_id,
            )
        )

        now = datetime.now(timezone.utc)

        if existing_active_token and existing_active_token.expires_at > now:
            return None

        raw_reset_token = generate_secure_token()
        token_hash_value = hash_token(raw_reset_token)

        reset_token = SupplierPasswordResetToken(
            id=uuid.uuid4(),
            company_id=company_id,
            supplier_id=supplier_user.supplier_id,
            supplier_user_id=supplier_user.id,
            token_hash=token_hash_value,
            expires_at=now + timedelta(minutes=10),
            is_used=False,
        )

        self.supplier_password_reset_token_repo.create(reset_token)

        reset_link = (
            f"{settings.FRONTEND_BASE_URL}/supplier-reset-password"
            f"?token={raw_reset_token}"
        )

        self.email_service.send_supplier_password_reset_email(
            to_email=supplier_user.email,
            supplier_name=supplier_user.supplier.name,
            reset_link=reset_link,
        )

        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="SUPPLIER_USER",
            entity_id=supplier_user.id,
            action="SUPPLIER_PASSWORD_RESET_REQUESTED",
            actor_supplier_user_id=supplier_user.id,
            description=f"Supplier password reset requested for {supplier_user.email}",
            details_json={
                "entity_reference": supplier_user.email,
                "supplier_name": supplier_user.supplier.name,
                "email": supplier_user.email,
            },
        )

        self.supplier_user_repo.db.commit()

        return None

    def reset_password(
        self,
        token: str,
        password: str,
    ) -> None:
        raw_token = token.strip()
        if not raw_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token is required.",
            )

        new_password = password.strip()
        if len(new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long.",
            )

        token_hash_value = hash_token(raw_token)
        reset_token = self.supplier_password_reset_token_repo.get_by_token_hash(
            token_hash_value
        )

        if not reset_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token.",
            )

        if reset_token.is_used:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has already been used.",
            )

        now = datetime.now(timezone.utc)

        if reset_token.expires_at < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired.",
            )

        supplier_user = self.supplier_user_repo.get_by_id(
            supplier_user_id=reset_token.supplier_user_id,
            supplier_id=reset_token.supplier_id,
        )

        if not supplier_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier user not found.",
            )

        if not supplier_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supplier account is inactive.",
            )

        hashed_password = self.password_service.hash_password(new_password)

        self.supplier_user_repo.update(
            supplier_user,
            {
                "hashed_password": hashed_password,
                "has_completed_onboarding": True,
            },
        )

        reset_token.is_used = True
        reset_token.used_at = now

        self.supplier_password_reset_token_repo.update(reset_token)

        self.audit_log_service.log_action(
            company_id=reset_token.company_id,
            entity_type="SUPPLIER_USER",
            entity_id=supplier_user.id,
            action="SUPPLIER_PASSWORD_RESET_COMPLETED",
            actor_supplier_user_id=supplier_user.id,
            description=f"Supplier password reset completed for {supplier_user.email}",
            details_json={
                "entity_reference": supplier_user.email,
                "email": supplier_user.email,
                "supplier_name": supplier_user.supplier.name
                if supplier_user.supplier
                else None,
            },
        )

        self.supplier_user_repo.db.commit()

        return None
    
    def refresh_supplier_access_token(self, refresh_token: str):
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

        if payload.get("type") != "SUPPLIER":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            )

        supplier_user_id = payload.get("sub")
        supplier_id = payload.get("supplier_id")

        if not supplier_user_id or not supplier_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            )

        token_record = self.supplier_refresh_token_repo.get_by_token_hash(
            hash_token(refresh_token)
        )

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

        supplier_user = self.supplier_user_repo.get_by_id(
            supplier_user_id=uuid.UUID(supplier_user_id),
            supplier_id=uuid.UUID(supplier_id),
        )

        if not supplier_user or not supplier_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Supplier account is inactive or no longer exists.",
            )

        if supplier_user.supplier and not supplier_user.supplier.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Supplier is inactive.",
            )

        access_token = create_access_token(
            data={
                "sub": str(supplier_user.id),
                "type": "SUPPLIER",
                "supplier_id": str(supplier_user.supplier_id),
            }
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }