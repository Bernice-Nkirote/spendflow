from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.config import settings

from app.core.auth_dependancy import get_current_admin_user
from app.core.database import get_db
from app.repositories.supplier_repository import SupplierRepository
from app.repositories.supplier_user_repository import SupplierUserRepository
from app.schemas.supplier_user_schema import (
    SupplierSetPassword,
    SupplierUserCreate,
    SupplierUserRead,
    SupplierUserUpdate,
)
from app.services.password_service import PasswordService
from app.services.supplier_user_service import SupplierUserService
from app.services.notifications.email_service import EmailService


router = APIRouter(
    prefix="/supplier-users",
    tags=["Supplier Users"],
    
)


def get_supplier_user_service(
    db: Session = Depends(get_db),
) -> SupplierUserService:
    email_service = EmailService(
        smtp_host=settings.SMTP_HOST,
        smtp_port=settings.SMTP_PORT,
        smtp_username=settings.SMTP_USERNAME,
        smtp_password=settings.SMTP_PASSWORD,
        from_email=settings.FROM_EMAIL,
        use_tls=settings.SMTP_USE_TLS,
    )

    return SupplierUserService(
        supplier_user_repo=SupplierUserRepository(db),
        supplier_repo=SupplierRepository(db),
        password_service=PasswordService(),
        email_service=email_service,
    )

@router.post(
    "/set-password",
    response_model=SupplierUserRead,
    status_code=status.HTTP_200_OK,
)
def set_supplier_password(
    data: SupplierSetPassword,
    service: SupplierUserService = Depends(get_supplier_user_service),
):
    return service.set_supplier_password(data=data)

@router.post(
    "/",
    response_model=SupplierUserRead,
    status_code=status.HTTP_201_CREATED,
)
def create_supplier_user(
    user_data: SupplierUserCreate,
    service: SupplierUserService = Depends(get_supplier_user_service),
    current_user=Depends(get_current_admin_user),
):
    return service.create_supplier_user(
        user_data=user_data,
        company_id=current_user.company_id,
    )


@router.get(
    "/supplier/{supplier_id}/email/{email}",
    response_model=SupplierUserRead,
)
def get_supplier_user_by_email(
    supplier_id: UUID,
    email: str,
    service: SupplierUserService = Depends(get_supplier_user_service),
    current_user=Depends(get_current_admin_user),
):
    return service.get_supplier_user_by_email(
        email=email,
        supplier_id=supplier_id,
        company_id=current_user.company_id,
    )


@router.get(
    "/supplier/{supplier_id}",
    response_model=list[SupplierUserRead],
)
def get_all_supplier_users(
    supplier_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    service: SupplierUserService = Depends(get_supplier_user_service),
    current_user=Depends(get_current_admin_user),
):
    return service.get_all_supplier_users(
        supplier_id=supplier_id,
        company_id=current_user.company_id,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{supplier_user_id}/supplier/{supplier_id}",
    response_model=SupplierUserRead,
)
def get_supplier_user(
    supplier_user_id: UUID,
    supplier_id: UUID,
    service: SupplierUserService = Depends(get_supplier_user_service),
    current_user=Depends(get_current_admin_user),
):
    return service.get_supplier_user(
        supplier_user_id=supplier_user_id,
        supplier_id=supplier_id,
        company_id=current_user.company_id,
    )


@router.put(
    "/{supplier_user_id}/supplier/{supplier_id}",
    response_model=SupplierUserRead,
)
def update_supplier_user(
    supplier_user_id: UUID,
    supplier_id: UUID,
    user_data: SupplierUserUpdate,
    service: SupplierUserService = Depends(get_supplier_user_service),
    current_user=Depends(get_current_admin_user),
):
    return service.update_supplier_user(
        supplier_user_id=supplier_user_id,
        supplier_id=supplier_id,
        company_id=current_user.company_id,
        user_data=user_data,
    )


@router.patch(
    "/{supplier_user_id}/supplier/{supplier_id}/deactivate",
    response_model=SupplierUserRead,
)
def deactivate_supplier_user(
    supplier_user_id: UUID,
    supplier_id: UUID,
    service: SupplierUserService = Depends(get_supplier_user_service),
    current_user=Depends(get_current_admin_user),
):
    return service.deactivate_supplier_user(
        supplier_user_id=supplier_user_id,
        supplier_id=supplier_id,
        company_id=current_user.company_id,
    )


@router.patch(
    "/{supplier_user_id}/supplier/{supplier_id}/activate",
    response_model=SupplierUserRead,
)
def activate_supplier_user(
    supplier_user_id: UUID,
    supplier_id: UUID,
    service: SupplierUserService = Depends(get_supplier_user_service),
    current_user=Depends(get_current_admin_user),
):
    return service.activate_supplier_user(
        supplier_user_id=supplier_user_id,
        supplier_id=supplier_id,
        company_id=current_user.company_id,
    )


@router.post(
    "/{supplier_user_id}/supplier/{supplier_id}/resend-setup-link",
    response_model=SupplierUserRead,
    status_code=status.HTTP_200_OK,
)
def resend_supplier_setup_link(
    supplier_user_id: UUID,
    supplier_id: UUID,
    service: SupplierUserService = Depends(get_supplier_user_service),
    current_user=Depends(get_current_admin_user),
):
    return service.resend_supplier_setup_link(
        supplier_user_id=supplier_user_id,
        supplier_id=supplier_id,
        company_id=current_user.company_id,
    )

@router.delete(
    "/{supplier_user_id}/supplier/{supplier_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_supplier_user(
    supplier_user_id: UUID,
    supplier_id: UUID,
    service: SupplierUserService = Depends(get_supplier_user_service),
    current_user=Depends(get_current_admin_user),
):
    service.delete_supplier_user(
        supplier_user_id=supplier_user_id,
        supplier_id=supplier_id,
        company_id=current_user.company_id,
    )