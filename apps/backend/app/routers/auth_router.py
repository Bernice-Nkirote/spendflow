from app.core.config import settings
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, create_refresh_token, verify_password
from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.core.auth_dependancy import get_current_user

from app.models.user import User
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.company_repository import CompanyRepository
from app.repositories.user_onboarding_token_repository import UserOnboardingTokenRepository
from app.repositories.user_password_reset_token_repository import UserPasswordResetTokenRepository
from app.repositories.user_repository import UserRepository
from app.repositories.user_refresh_token_repository import UserRefreshTokenRepository
from app.repositories.role_permission_repository import RolePermissionRepository

from app.schemas.auth_schema import AuthMeResponse, TokenRefreshRequest
from app.schemas.user_schema import(
    ForgotPasswordRequest,
    ResetPasswordRequest,
     UserLogin, 
     UserPasswordSetup,

)
from app.schemas.auth_schema import AuthMeResponse

from app.services.user_refresh_token_service import UserRefreshTokenService
from app.services.audit_log_service import AuditLogService
from app.services.notifications.email_service import EmailService
from app.services.user_service import UserService



router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_user_service(db: Session = Depends(get_db)) -> UserService:
    user_repo = UserRepository(db)
    onboarding_token_repo = UserOnboardingTokenRepository(db)
    password_reset_token_repo = UserPasswordResetTokenRepository(db)
    company_repo = CompanyRepository(db)

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

    return UserService(
        repo=user_repo,
        onboarding_token_repo=onboarding_token_repo,
        password_reset_token_repo=password_reset_token_repo,
        company_repo=company_repo,
        audit_log_service=audit_log_service,
        email_service=email_service,
    )

def get_refresh_token_service(
    db: Session = Depends(get_db),
) -> UserRefreshTokenService:
    return UserRefreshTokenService(
        repo=UserRefreshTokenRepository(db),
        user_repo=UserRepository(db),
    )

@router.post("/login")
def login(
    login_data: UserLogin,
    db: Session = Depends(get_db),
):
    company_repo = CompanyRepository(db)
    user_repo = UserRepository(db)

    company_name = login_data.company_name.strip()
    email = login_data.email.strip().lower()
    password = login_data.password.strip()

    if not company_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company name is required.",
        )

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required.",
        )

    if not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required.",
        )

    company = company_repo.get_by_name(company_name)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
        )

    if not company.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Company is inactive.",
        )

    db_user = user_repo.get_by_email(email, company.id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
        )

    if not verify_password(password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
        )

    if not db_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    access_token = create_access_token(
        data={
            "sub": str(db_user.id),
            "company_id": str(db_user.company_id),
            "role_id": str(db_user.role_id),
            "type": "USER",
        }
    )

    refresh_service = UserRefreshTokenService(
        repo=UserRefreshTokenRepository(db),
        user_repo=user_repo,
    )

    refresh_token = refresh_service.create_refresh_token_for_user(db_user)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }

    
@router.post("/setup-password")
def setup_password(
    payload: UserPasswordSetup,
    service: UserService = Depends(get_user_service),
):
    service.setup_password(
        token=payload.token,
        password=payload.password,
    )

    return {
        "message": "Password setup completed successfully."
    }

@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    service: UserService = Depends(get_user_service),
):
    service.request_password_reset(
        company_name=payload.company_name,
        email=payload.email,
    )

    return {
        "message": "If an account exists for these details, a password reset link has been sent."
    }


@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    service: UserService = Depends(get_user_service),
):
    service.reset_password(
        token=payload.token,
        password=payload.password,
    )

    return {
        "message": "Password reset completed successfully."
    }

@router.get("/me", response_model=AuthMeResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    permissions: list[str] = []

    if current_user.role_id:
        role_permission_repo = RolePermissionRepository(db)
        permissions = role_permission_repo.get_permission_names_by_role(
            role_id=current_user.role_id,
            company_id=current_user.company_id,
        )

    return AuthMeResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        role_name=current_user.role.name if current_user.role else None,
        company_name=current_user.company.name if current_user.company else None,
        is_company_owner=current_user.is_company_owner,
        permissions=permissions,
    )

@router.post("/refresh")
def refresh_token(
    payload: TokenRefreshRequest,
    service: UserRefreshTokenService = Depends(get_refresh_token_service),
):
    return service.refresh_access_token(payload.refresh_token)