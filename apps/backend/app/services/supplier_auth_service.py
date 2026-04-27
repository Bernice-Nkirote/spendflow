from fastapi import HTTPException, status

from app.core.security import create_access_token
from app.schemas.supplier_auth_schema import SupplierLogin


class SupplierAuthService:
    def __init__(
        self,
        supplier_user_repo,
        password_service,
    ):
        self.supplier_user_repo = supplier_user_repo
        self.password_service = password_service

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

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }