from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_admin_user
from app.core.database import get_db
from app.repositories.user_repository import UserRepository
from app.repositories.user_onboarding_token_repository import UserOnboardingTokenRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.services.audit_log_service import AuditLogService
from app.services.notifications.email_service import EmailService
from app.core.config import settings
from app.schemas.user_schema import UserCreate, UserRead, UserUpdate
from app.services.user_service import UserService


router = APIRouter(
    prefix="/users",
    tags=["Users"],
    dependencies=[Depends(get_current_admin_user)],
)


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    repo = UserRepository(db)
    onboarding_token_repo = UserOnboardingTokenRepository(db)

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
        repo=repo,
        onboarding_token_repo=onboarding_token_repo,
        audit_log_service=audit_log_service,
        email_service=email_service,
    )


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    service: UserService = Depends(get_user_service),
    current_user=Depends(get_current_admin_user),
):
    return service.create_user(
    user_data=user_data,
    company_id=current_user.company_id,
    actor_user_id=current_user.id,
)


@router.get("/", response_model=list[UserRead])
def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    service: UserService = Depends(get_user_service),
    current_user=Depends(get_current_admin_user),
):
    return service.get_all_users(
        company_id=current_user.company_id,
        skip=skip,
        limit=limit,
    )


@router.get("/{user_id}", response_model=UserRead)
def get_user(
    user_id: UUID,
    service: UserService = Depends(get_user_service),
    current_user=Depends(get_current_admin_user),
):
    return service.get_user(user_id, current_user.company_id)


@router.put("/{user_id}", response_model=UserRead)
def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    service: UserService = Depends(get_user_service),
    current_user=Depends(get_current_admin_user),
):
    return service.update_user(user_id, user_data, current_user.company_id)


@router.patch("/{user_id}/activate", response_model=UserRead)
def activate_user(
    user_id: UUID,
    service: UserService = Depends(get_user_service),
    current_user=Depends(get_current_admin_user),
):
    return service.activate_user(user_id, current_user.company_id)


@router.patch("/{user_id}/deactivate", response_model=UserRead)
def deactivate_user(
    user_id: UUID,
    service: UserService = Depends(get_user_service),
    current_user=Depends(get_current_admin_user),
):
    return service.deactivate_user(
    user_id=user_id,
    company_id=current_user.company_id,
    current_user_id=current_user.id,
)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: UUID,
    service: UserService = Depends(get_user_service),
    current_user=Depends(get_current_admin_user),
):
    service.delete_user(
        user_id=user_id,
        company_id=current_user.company_id,
        current_user_id=current_user.id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)