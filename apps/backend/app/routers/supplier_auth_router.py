from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.supplier_user_repository import SupplierUserRepository
from app.schemas.supplier_auth_schema import SupplierLogin, SupplierLoginResponse
from app.services.password_service import PasswordService
from app.services.supplier_auth_service import SupplierAuthService

router = APIRouter(prefix="/supplier-auth", tags=["Supplier Auth"])


def get_supplier_auth_service(
    db: Session = Depends(get_db),
) -> SupplierAuthService:
    supplier_user_repo = SupplierUserRepository(db)
    password_service = PasswordService()

    return SupplierAuthService(
        supplier_user_repo=supplier_user_repo,
        password_service=password_service,
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