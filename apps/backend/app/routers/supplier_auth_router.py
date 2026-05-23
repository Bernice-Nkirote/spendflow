from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.auth_dependancy import get_current_supplier

from app.models.supplier_user import SupplierUser
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.supplier_password_reset_token_repository import (
    SupplierPasswordResetTokenRepository,
)
from app.repositories.supplier_user_repository import SupplierUserRepository
from app.repositories.supplier_refresh_token_repository import SupplierRefreshTokenRepository
from app.schemas.supplier_auth_schema import (
    SupplierForgotPasswordRequest,
    SupplierLogin,
    SupplierLoginResponse,
    SupplierResetPasswordRequest,
    SupplierTokenRefreshRequest,
    SupplierMeResponse,
)
from app.services.audit_log_service import AuditLogService
from app.services.notifications.email_service import EmailService
from app.services.password_service import PasswordService
from app.services.supplier_auth_service import SupplierAuthService

router = APIRouter(prefix="/supplier-auth", tags=["Supplier Auth"])


def get_supplier_auth_service(
    db: Session = Depends(get_db),
) -> SupplierAuthService:
    supplier_user_repo = SupplierUserRepository(db)
    supplier_password_reset_token_repo = SupplierPasswordResetTokenRepository(db)
    supplier_refresh_token_repo = SupplierRefreshTokenRepository(db)
    password_service = PasswordService()

    audit_log_repo = AuditLogRepository(db)
    audit_log_service = AuditLogService(audit_log_repo)

    email_service = EmailService(
        smtp_host=settings.SMTP_HOST,
        smtp_port=settings.SMTP_PORT,
        smtp_username=settings.SMTP_USERNAME,
        smtp_password=settings.SMTP_PASSWORD,
        from_email=settings.FROM_EMAIL,
        use_tls=settings.SMTP_USE_TLS,
    )

    return SupplierAuthService(
        supplier_user_repo=supplier_user_repo,
        supplier_password_reset_token_repo=supplier_password_reset_token_repo,
        supplier_refresh_token_repo=supplier_refresh_token_repo,
        password_service=password_service,
        email_service=email_service,
        audit_log_service=audit_log_service,
    )


@router.post(
    "/login",
    response_model=SupplierLoginResponse,
    status_code=status.HTTP_200_OK,
)
def supplier_login(
    data: SupplierLogin,
    service: SupplierAuthService = Depends(get_supplier_auth_service),
):
    return service.login_supplier(login_data=data)

@router.get("/me", response_model=SupplierMeResponse)
def get_current_supplier_profile(
    current_supplier: SupplierUser = Depends(get_current_supplier),
):
    return SupplierMeResponse(
        id=current_supplier.id,
        supplier_id=current_supplier.supplier_id,
        email=current_supplier.email,
        is_active=current_supplier.is_active,
        has_completed_onboarding=current_supplier.has_completed_onboarding,
        supplier_name=current_supplier.supplier.name
        if current_supplier.supplier
        else None,
    )

@router.post("/refresh", status_code=status.HTTP_200_OK)
def supplier_refresh_token(
    data: SupplierTokenRefreshRequest,
    service: SupplierAuthService = Depends(get_supplier_auth_service),
):
    return service.refresh_supplier_access_token(data.refresh_token)

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def supplier_forgot_password(
    data: SupplierForgotPasswordRequest,
    service: SupplierAuthService = Depends(get_supplier_auth_service),
):
    service.request_password_reset(email=data.email)

    return {
        "message": "If a supplier account exists for this email, a password reset link has been sent."
    }


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def supplier_reset_password(
    data: SupplierResetPasswordRequest,
    service: SupplierAuthService = Depends(get_supplier_auth_service),
):
    service.reset_password(
        token=data.token,
        password=data.password,
    )

    return {
        "message": "Supplier password reset completed successfully."
    }